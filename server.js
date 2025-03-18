//Node module imports
const express = require("express");
const path = require("path");
const fsPromise = require("fs/promises");
const fs = require ("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser");
const argon2 = require("argon2");

//Import functions from generateKeys.js
const {generateKeyPair, testKeys, generateJWTKey} = require("./generateKeys.js")

//Create express application
const app = express();

//Add middleware to parse JSON request bodies
app.use(express.json());

//Add middleware to handle cookies
app.use(cookieParser());

//Set port
const PORT = 3000;

//Function to print log by appending time and message
function timeLog (str) {
    const now = new Date();

    function pad(num, size) {
        let s = num.toString();
        while (s.length < size) {
            s = "0" + s;
        }
        return s;
    }
    const day = pad(now.getDate(), 2);
    const month = pad(now.getMonth() +1,2);
    const year = now.getFullYear();
    const hours = pad(now.getHours(), 2);
    const minutes = pad(now.getMinutes(), 2);
    const seconds = pad(now.getSeconds(), 2);
    const milliseconds = pad(now.getMilliseconds(), 3);
    const time = day +"/"+month+"/"+year+" "+hours+":"+minutes+":"+seconds+"."+milliseconds;
    console.log("[" + time + "] " + str);
}

//Function to encrypt string using RSAES-OAEP/SHA-256
async function encryptStr(str) {
    const publicKey = await fetchPublicKey();
    const encryptedStr = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
    }, Buffer.from(str, "utf8"));
    return encryptedStr.toString("base64");
}

//Function to fetch public
async function fetchPublicKey(){return await fsPromise.readFile("public/public.pem", "utf8");}

//Function to decrypt string using RSAES-OAEP/SHA-256
async function decryptStr(encryptedStrBase64) {
    timeLog("--Starting Decryption--");
    const privateKey = await fetchPrivateKey();
    timeLog("Private key fetched");
    timeLog("EncrpytedStrBase64: " + encryptedStrBase64);
    const encryptedStr = Buffer.from(encryptedStrBase64, "base64");
    timeLog("Converted back from base64");
    const decryptedStr = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
    }, encryptedStr).toString("utf8");
    timeLog("Decrypted string");
    timeLog("--Decryption END--");
    return decryptedStr;
}

//Function to fetch private key
async function fetchPrivateKey(){return await fsPromise.readFile("private.pem", "utf8");}

//Function to check if user is authorised for admin-panel.html
async function authenticateToken(req, res, next) {
    timeLog("--Authenticate token start--");
    const encryptedToken = req.cookies.token;
    timeLog("Recived encrypted token: " + encryptedToken);
    if (!encryptedToken) {
        timeLog("No token found");
        timeLog("--Authenticate token END Fail--");
        return res.status(401).json({success: false, message: "Access denied no token provided"});
    }
    try {
        const token = await decryptStr(encryptedToken);
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                timeLog("Invalid or expired token found");
                timeLog("--Authenticate token END Fail--");
                return res.status(403).json({success: false, message: "Access denied invalid or expired token."});
            }
            timeLog("Valid token found");
            req.user = user;
            timeLog("--Authenticate token END Success--");
            next();
        });
    }
    catch (error) {
        console.error("Token decryption error: " + error);
        return res.status(403).json({success: false, message: "Invalid or expired token."});
    }
}

//Function to create a token and add it to cookies
async function createToken(email, res) {
    timeLog("--Create Token Start--");
    timeLog("env file exists contianing JWT key: " + !!process.env.JWT_SECRET);
    const token = jwt.sign(
        {email},
        process.env.JWT_SECRET,
        {expiresIn: "10m"}
    );
    timeLog("User token created");
    const encryptedToken = await encryptStr(token);
    timeLog("Token encrypted: " + encryptedToken);
    res.cookie("token", encryptedToken, {
        httpOnly: true,
        secure: false, //change to true for https
        sameSite: "Strict",
        maxAge: 600000 //10m in millisecconds
    });
    timeLog("Token added to cookie");
    timeLog("--Create Token END--");
}

//Serve admin-panel to only authorised users
app.get("/admin-panel.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "adminPanel/html/admin-panel.html"));
})

//Request to check if token is valid
app.get("/validate-token", authenticateToken, (req, res) => {
    res.json({success: true, message: "Token is valid"});
});

//Serve public key to client
app.get("/publicKey", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "public.pem"));
})

//Serve files
app.use(express.static('public'));

//Serve index at page visit
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index/html/index.html"));
});

//Function will be in different JS file for database interactions
async function validateCredentialsStaff(email, password) {
    //Search database for record with email if none exists return null here
    if (!email) { //Example search database if email is not present in data base return null
        return null;
    }
    //If a record for email does exist fetch password from record
    //Ignore this im hashing the stored password example in the same way passwords would be stored in database
    storedPassword = await argon2.hash("password123", {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, //64MB
        timeCost: 4, //No. Iterations
        parallelism: 2 //No. Threads
    });
    //Check password against storedPassword
    if (await argon2.verify(storedPassword, password)) {
        //If password is correct
        return "admin"; //return access level (fetch access level from data base "admin", "staff", "headstaff" etc)
    }
    //If password is false return null
    return null;

    /*
    So TLDR: "SELECT * FROM staffTbl WHERE email == " + email;
           : if returns null return null else continute in function
           : "SELECT password FROM staffTbl WHERE email == " + email;
           : use password to check against user input if valid return true
           : return null 
    */
}

app.post("/login", async (req, res) => {
    timeLog("---Dealing with login request---");
    try {
        const {encryptedEmailBase64, encryptedPasswordBase64} = req.body;
        timeLog("Begining email decrypt");
        const email = await decryptStr(encryptedEmailBase64);
        timeLog("Email decrypted");
        timeLog("Validating credentials");
        const accessLevel = await validateCredentialsStaff(email.toLowerCase(), await decryptStr(encryptedPasswordBase64));
        if (accessLevel) {
            timeLog("Valid credentals presented login success");
            await createToken(email, res);
            res.json({success: true, message: "Login successful!"});
        }
        else {
            timeLog("Invalid credentals presented login failed");
            res.status(401).json({success: false, message: "Invalid email or password."});
        }
    } catch (error) {
        timeLog("An unexpected error occured.");
        console.error("Error: " + error.message);
        res.status(500).json({ success: false, message: "An unexpected server error occurred." });
    }
    timeLog("---Login request END---")
});

async function generateAccountCreationToken() {
    var token;
    do {
        token = crypto.randomBytes(8).toString("hex").match(/.{1,4}/g).join("-").toUpperCase();
    } while (!await isTokenValid(token)); //This line for now is referancing a funciton always returning true until database interactions is created
                                          //this line is !await isTokenValid(token) remove the ! when db functions added.
    return token;
}

//Another temp function to be in db interactions to store a token
function storeToken(token, createdAt){
    return;
}

app.get("/generateAccountCreationToken", async (req, res) => {
    timeLog("---Generating Account Creation Token---");
    const token = await generateAccountCreationToken();
    timeLog("Token Generated")
    const createdAt = new Date().toISOString();
    storeToken(token, createdAt);
    timeLog("Token Stored");
    res.json({token});
    timeLog("---Generate Account Creation Token END");
});

//Another temp function to be in database interactions js which will check the table containing staff account creation
//tokens to check if the one provided is valid. This is done 2 ways tokens will have a 24hr lifetime so needs to check
//not only that token is present in db but that it is still alive aswell. (would be nice if this function deleted out of 
//lifetime tokens too)
async function isTokenValid(token) {
    //Temp return true
    return true;
}

//Another temp function to be in database interactions js which will check the staff accounts table to see
//if the email entered is already in use
async function emailExists(email) {
    //temp return false
    return false;
}

//Another temp function to save the account to the database
async function saveAccount(email, hashedPassword, accessLevel = "staff") {
    //temp return
    return;
}

app.post("/createAccount", async (req, res) => {
    timeLog("---Dealing with account creation request---");
    try {
        const {encryptedTokenBase64, encryptedEmailBase64, encryptedPasswordBase64} = req.body;
        timeLog("Decrypting details");
        const token = await decryptStr(encryptedTokenBase64);
        const email = await decryptStr(encryptedEmailBase64).toLowerCase;
        const hashedPassword = await argon2.hash(await decryptStr(encryptedPasswordBase64), {
            type: argon2.argon2id,
            memoryCost: 2 ** 16, //64MB
            timeCost: 4, //No. Iterations
            parallelism: 2 //No. Threads
        });
        timeLog("Details decrypted");
        timeLog("Check for valid token");
        if (!isTokenValid(token)) {
            timeLog("Token invalid");
            res.status(401).json({success: false, message: "Token is invalid."});
            timeLog("---Account creation request END---");
            return;
        }
        timeLog("Token valid");
        timeLog("Check email is new");
        if (!emailExists(email)) {
            timeLog("Email already exists");
            res.status(409).json({success: false, message: "Email is already in use."});
            timeLog("---Account creation request END---");
            return;
        }
        timeLog("Email new");
        timeLog("Saving account to db");
        saveAccount(email, hashedPassword);
        res.json({success: true, message: "Account creation successful."});
    }
    catch (error) {
        timeLog("An unexpected error occured.");
        console.error("Error: " + error.message);
        res.status(500).json({success: false, message: "Server error during account creation."});
    }
    timeLog("---Account creation request END---");
})

//Function to check if user has a currently valid token and if they do refresh it
app.post("/refresh-token", authenticateToken, async (req, res) => {
    try {
        await createToken(req.user.email, res);
        return res.json({success: true, message: "Token refreshed successfully"});
    }
    catch (error){
        console.error("Error refreshing token: " + error);
        res.status(500).json({success: false, message: "Unable to refresh token"});
    }
})

//Start the server
app.listen(PORT, async () => {
    //TODO remove key generation from server start and add to each session at some point.
    
    timeLog("---Begining key generation---");
    generateKeyPair();
    while (!testKeys()) {
        timeLog("Public & Private key generation failed trying again.");
        generateKeyPair();
    }
    if (!fs.existsSync(".env")) {
        await generateJWTKey();
    }
    else {
        timeLog(".env file already exists. Skipping key generation.");
    }
    dotenv.config()
    timeLog ("Key generation success.");
    timeLog("---Key generation END---");

    timeLog("Server is running on: http://localhost:" + PORT);
});