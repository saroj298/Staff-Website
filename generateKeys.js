//Node module imports
const crypto = require("crypto");
const fs = require('fs');
const forge = require("node-forge");
const fsPromise = require("fs/promises");

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

//Generate public and private keys
function generateKeyPair() {
    timeLog("--Generate public & private key pair--");
    const {publicKey, privateKey} = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "spki",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
        },
    });
    timeLog("Keys generated");
    fs.writeFileSync("public/public.pem", publicKey);
    fs.writeFileSync("private.pem", privateKey);
    timeLog("Keys saved");
    timeLog("--Generate public & private key pair END--");
}

//Test keys to ensure they are compatable
function testKeys() {
    const publicKeyPem = fs.readFileSync("public/public.pem", "utf8");
    const privateKeyPem = fs.readFileSync("private.pem", "utf8");
    const publicKeyForge = forge.pki.publicKeyFromPem(publicKeyPem)
    const privateKeyForge = forge.pki.privateKeyFromPem(privateKeyPem)
    const publicModulus = publicKeyForge.n.toString(16);
    const privateModulus = privateKeyForge.n.toString(16);
    if (publicModulus === privateModulus) return true;
    else return false;
}

//Generate a key for the json web tokens
async function generateJWTKey() {
    timeLog("--Generate JWT key--")
    const randomKey = crypto.randomBytes(64).toString("hex");
    timeLog("Random JWT key generated")
    const envContent = "JWT_SECRET="+randomKey+"\n";
    try {
        await fsPromise.writeFile(".env", envContent, "utf8");
        timeLog("Random JWT key saved")
    }
    catch (error) {
        console.error("Failed to write to .env file: " + error.message);
    }
    timeLog("--Generate JWT key END--")
}
//Export functions
module.exports = {generateKeyPair, testKeys, generateJWTKey};