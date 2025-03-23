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
const session = require("express-session");

//Import functions from generateKeys.js
const {generateSessionKeys} = require("./generateKeys.js")

//Import functions from databaseInteractions.js
const {getEvents, saveAccount, isTokenValid, emailExists, storeToken, validateCredentialsStaff, getSubjects, getEvent, saveEvent, getStaff, removeToken, removeEvent} = require("./databaseInteractions.js");

//Create express application
const app = express();

//Add middleware to parse JSON request bodies
app.use(express.json());

//Add middleware to handle cookies
app.use(cookieParser());

//Add middleware to handle sessions
app.use(session({
    secret: "cb7546c9ec9b9c43eb762bc81753dc6bc6f5b376b2ab180ce8373053ebf17714dd7d89da9659c1a0d6a95efd787d165e7d03e2f3d4c117ccb3aecb772f4d14bd",
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false} //set to true for HTTPS
}));

//Add middleware to generate session keys
app.use(async (req, res, next) => {
    if (!req.session.publicKey || !req.session.privateKey || !req.session.JWTkey) {
        await generateSessionKeys(req);
    }
    next();
});

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
async function encryptStr(str, req) {
    const publicKey = fetchPublicKey(req);
    const encryptedStr = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
    }, Buffer.from(str, "utf8"));
    return encryptedStr.toString("base64");
}

//Function to fetch public
function fetchPublicKey(req){return req.session.publicKey;}

//Function to decrypt string using RSAES-OAEP/SHA-256
async function decryptStr(encryptedStrBase64, req) {
    timeLog("--Starting Decryption--");
    const privateKey = fetchPrivateKey(req);
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
function fetchPrivateKey(req){return req.session.privateKey;}

//Function to check if user is authorised for admin-panel.html
async function authenticateToken(req, res, next) {
    timeLog("--Authenticate token start--");
    const encryptedToken = req.cookies.token;
    timeLog("Recived encrypted token: " + encryptedToken);
    if (!encryptedToken) {
        timeLog("No token found");
        timeLog("--Authenticate token END Fail--");
        return res.status(404).send("Not Found");
    }
    try {
        const token = await decryptStr(encryptedToken, req);
        jwt.verify(token, req.session.JWTkey, (err, user) => {
            if (err) {
                timeLog("Invalid or expired token found");
                timeLog("--Authenticate token END Fail--");
                return res.status(404).send("Not Found");
            }
            timeLog("Valid token found");
            req.user = user;
            timeLog("--Authenticate token END Success--");
            next();
        });
    }
    catch (error) {
        console.error("Token decryption error: " + error);
        return res.status(404).send("Not Found");
    }
}

//Function to create a token and add it to cookies
async function createToken(email, req, res) {
    timeLog("--Create Token Start--");
    const token = jwt.sign(
        {email},
        req.session.JWTkey,
        {expiresIn: "5m"}
    );
    timeLog("User token created");
    const encryptedToken = await encryptStr(token, req);
    timeLog("Token encrypted: " + encryptedToken);
    res.cookie("token", encryptedToken, {
        httpOnly: true,
        secure: false, //change to true for https
        sameSite: "Strict",
        maxAge: 300000 //5m in millisecconds
    });
    timeLog("Token added to cookie");
    timeLog("--Create Token END--");
}

//Request to check if token is valid
app.get("/validate-token", authenticateToken, (req, res) => {
    res.json({success: true, message: "Token is valid"});
});

//Serve public key to client
app.get("/publicKey", (req, res) => {
    if (!req.session.publicKey) {
        res.status(500).send("Public key not available.");
    }
    else {
        res.send(req.session.publicKey);
    }
});

//Serve protected files when JWT present
app.use("/protected", authenticateToken, express.static(path.join(__dirname, "protected")));

//Serve public files
app.use(express.static(path.join(__dirname, "public")));

//Serve index at page visit
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index/html/index.html"));
});

//Handle login request
app.post("/login", async (req, res) => {
    timeLog("---Dealing with login request---");
    try {
        const {encryptedEmailBase64, encryptedPasswordBase64} = req.body;
        timeLog("Begining email decrypt");
        const email = await decryptStr(encryptedEmailBase64, req);
        timeLog("Email decrypted");
        timeLog("Validating credentials");
        const accessLevel = await validateCredentialsStaff(email.toLowerCase(), await decryptStr(encryptedPasswordBase64, req));
        if (accessLevel) {
            req.session.accessLevel = accessLevel;
            timeLog("Valid credentals presented login success");
            await createToken(email, req, res);
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
    } while (await isTokenValid(token));
    return token;
}

app.get("/generateAccountCreationToken", async (req, res) => {
    timeLog("---Generating Account Creation Token---");
    const token = await generateAccountCreationToken();
    timeLog("Token Generated")
    const createdAt = Date.now();
    storeToken(token, createdAt);
    timeLog("Token Stored");
    res.json({token});
    timeLog("---Generate Account Creation Token END");
});

app.post("/createAccount", async (req, res) => {
    timeLog("---Dealing with account creation request---");
    try {
        const {encryptedTokenBase64, encryptedEmailBase64, encryptedPasswordBase64} = req.body;
        timeLog("Decrypting details");
        const token = await decryptStr(encryptedTokenBase64, req);
        const email = (await decryptStr(encryptedEmailBase64, req)).toLowerCase();
        const hashedPassword = await argon2.hash(await decryptStr(encryptedPasswordBase64, req), {
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
        await saveAccount(email, hashedPassword);
        await removeToken(token);
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
        await createToken(req.user.email, req, res);
        return res.json({success: true, message: "Token refreshed successfully"});
    }
    catch (error){
        console.error("Error refreshing token: " + error);
        res.status(500).json({success: false, message: "Unable to refresh token"});
    }
})

app.get("/events", async (req, res) => {
    timeLog("Fetching events");
    try {
        const events = await getEvents();
        res.json(events);
        timeLog("Events fetched");
    }
    catch (error) {
        console.error("Error fetching events: " + error);
        res.status(500).json({success: false, message: "Server error retrieving events."});
        timeLog("Event fetch failed: " + error);
    }
});

app.get("/signOut", (req, res) => {
    timeLog("Logout request recived");
    res.clearCookie("token", {
        httpOnly: true,
        secure: false, //change to true for HTTPS
        sameSite: "strict",
    });
    req.session.destroy(() => {
        res.redirect("/");
    });
    timeLog("Logout successfull");
});

app.get("/getEvent", authenticateToken, async(req, res) => {
    const eventID = req.query.eventID;
    if(!eventID) {
        return res.status(400).json({success: false, message: "No eventID provided"});
    }
    const event = await getEvent(eventID);
    if (event == null) {
        return res.status(400).json({success: false, message: "No data with eventID in database."});
    }
    res.json(event);
});

app.post("/createEvent", async (req, res) => {
    timeLog("--Create event start--");
    try {
        const newEvent = req.body;
        const savedEvent = await saveEvent(newEvent);
        res.json({success: true, message: "Event created successfully", event: savedEvent});
    }
    catch (error) {
        timeLog("Failed.");
        console.error("Error creating event: " + error);
        res.status(500).json({success: false, message: "Server error creating event"});
    }
    timeLog("--Create event END--");
});

app.post("/updateEvent", async (req, res) => {
    timeLog("--Update event start--");
    try {
        const updatedEvent = req.body;
        const savedEvent = await saveEvent(updatedEvent);
        res.json({success: true, message: "Event updated successfully", event: savedEvent});
    }
    catch (error) {
        timeLog("Failed.");
        console.error("Error updating event: " + error);
        res.status(500).json({success: false, message: "Server error updating event"});
    }
    timeLog("--Update event END--");
});

app.get("/getSubjects", async (req, res) => {
    timeLog("--Getting Subjects--");
    try {
        const subjects = await getSubjects();
        res.json(subjects);
    }
    catch(error) {
        timeLog("Failed.");
        console.error("Error retrieving subjects: " + error);
        res.status(500).json({success: false, message: "Server error retriving subjects."});
    }
    timeLog("--Getting Subjects END--");
});

app.get("/getStaff", async (req, res) => {
    timeLog("--Getting Staff--");
    try {
        const staff = await getStaff();
        res.json(staff);
    }
    catch(error) {
        timeLog("Failed.");
        console.error("Error retrieving staff: " + error);
        res.status(500).json({success: false, message: "Server error retriving staff."});
    }
    timeLog("--Getting Staff END--");
});

app.delete("/removeEvent", async (req, res) => {
    try {
        const {eventID} = req.body;
        await removeEvent(eventID);
        res.json({success: true, message: "Event removed successfully"});
    }
    catch (error) {
        console.error("Error removing event: " + error);
        res.status(500).json({success: false, message: "Server error removing event"});
    }
});

//Start the server
app.listen(PORT, async () => {
    timeLog("Server is running on: http://localhost:" + PORT);
});