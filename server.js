//Node module imports
const express = require("express");
const path = require("path");
const fsPromise = require("fs/promises");
const fs = require ("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');

//Import functions from generateKeys.js
const {generateKeyPair, testKeys, generateJWTKey} = require("./generateKeys.js")

//Create express application
const app = express();

//Add middleware to parse JSON request bodies
app.use(express.json());

//Set port
const PORT = 3000;

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
    console.log("\n--Starting Decryption--\n");
    const privateKey = await fetchPrivateKey();
    console.log("Private key fetched");
    console.log("EncrpytedStrBase64: " + encryptedStrBase64);
    const encryptedStr = Buffer.from(encryptedStrBase64, "base64");
    console.log("Converted back from base64");
    const decryptedStr = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
    }, encryptedStr).toString("utf8");
    console.log("Decrypted string");
    console.log("\n--Decryption END--\n");
    return decryptedStr;
}

//Function to fetch private key
async function fetchPrivateKey(){return await fsPromise.readFile("private.pem", "utf8");}

//Function to check if user is authorised for admin-panel.html
async function authenticateToken(req, res, next) {
    console.log("\n--Authenticate token start--\n");
    const authHeader = req.headers["authorization"];
    console.log("Recived authorization header: " + authHeader);
    const encryptedToken = authHeader && authHeader.split(" ")[1];
    if (!encryptedToken) {
        console.log("No token found");
        console.log("\n--Authenticate token END Fail--\n");
        return res.status(401).json({success: false, message: "Access denied no token provided"});
    }
    try {
        const token = await decryptStr(encryptedToken);
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log("Invalid or expired token found");
                console.log("\n--Authenticate token END Fail--\n");
                return res.status(403).json({success: false, message: "Access denied invalid or expired token."});
            }
            console.log("Valid token found");
            req.user = user;
            console.log("\n--Authenticate token END Success--\n");
            next();
        });
    }
    catch (error) {
        console.error("Token decryption error: " + error);
        return res.status(403).json({success: false, message: "Invalid or expired token."});
    }
}

//Serve admin-panel to only authorised users
app.get("/admin-panel.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin-panel.html"));
})

app.get("/validate-token", authenticateToken, (req, res) => {
    res.json({success: true, message: "Token is valid"});
});

//Serve public key to client
app.get("/publicKey", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "public.pem"));
})

//Serve files
app.use(express.static('public'));

//Handle login
app.post("/login", async (req, res) => {
    console.log("\n---Dealing with login request---\n");
    try {
        const {encryptedEmailBase64, encryptedPasswordBase64} = req.body;
        console.log("Begining password decrypt");
        const password = await decryptStr(encryptedPasswordBase64);
        console.log("Password decrypted");
        console.log("Begining email decrypt");
        const email = await decryptStr(encryptedEmailBase64);
        console.log("Email decrypted");
        //Dummy values replace with database lookup.
        //Search database for email and find relevent password field and test if password matchs if so return valid entry
        const validEmail = "email@gmail.com";
        const validPassword = "password123";
        if (email === validEmail && password === validPassword) {
            console.log("Valid credentals presented login success");
            console.log("env file exists contianing JWT key: " + !!process.env.JWT_SECRET);
            const token = jwt.sign(
                {email},
                process.env.JWT_SECRET,
                {expiresIn: "1h"}
            );
            const encryptedToken = await encryptStr(token);
            console.log("User token created");
            console.log("Token: " + encryptedToken);
            res.json({success: true, message: "Login successful!", encryptedToken});
        }
        else {
            console.log("Invalid credentals presented login failed");
            res.status(401).json({success: false, message: "Invalid email or password."});
        }
    } catch (error) {
        console.log("An unexpected error occured.");
        console.error("Error: " + error.message);
        res.status(500).json({ success: false, message: "An unexpected server error occurred." });
    }
    console.log("\n---Login request END---\n")
});

//Start the server
app.listen(PORT, async () => {
    //TODO remove key generation from server start and add to each session at some point.
    
    console.log("\n---Begining key generation---\n")
    generateKeyPair();
    while (!testKeys()) {
        console.log("Public & Private key generation failed trying again.");
        generateKeyPair();
    }
    if (!fs.existsSync(".env")) {
        await generateJWTKey();
    }
    else {
        console.log(".env file already exists. Skipping key generation.");
    }
    dotenv.config()
    console.log ("Key generation success.");
    console.log("\n---Key generation END---\n")

    console.log("\n\nServer is running on: http://localhost:" + PORT +"\n\n");
});