//Node module imports
const express = require("express");
const path = require("path");
const fsPromise = require("fs/promises");
const fs = require ("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser");

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
    res.sendFile(path.join(__dirname, "public", "admin-panel.html"));
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

//Handle login
app.post("/login", async (req, res) => {
    timeLog("---Dealing with login request---");
    try {
        const {encryptedEmailBase64, encryptedPasswordBase64} = req.body;
        timeLog("Begining password decrypt");
        const password = await decryptStr(encryptedPasswordBase64);
        timeLog("Password decrypted");
        timeLog("Begining email decrypt");
        const email = await decryptStr(encryptedEmailBase64);
        timeLog("Email decrypted");
        //Dummy values replace with database lookup.
        //Search database for email and find relevent password field and test if password matchs if so return valid entry
        const validEmail = "email@gmail.com";
        const validPassword = "password123";
        if (email === validEmail && password === validPassword) {
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