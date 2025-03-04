//Node module imports
const crypto = require("crypto");
const fs = require('fs');
const forge = require("node-forge");
const fsPromise = require("fs/promises");

//Generate public and private keys
function generateKeyPair() {
    console.log("--Generate public & private key pair--");
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
    console.log("Keys generated");
    fs.writeFileSync("public/public.pem", publicKey);
    fs.writeFileSync("private.pem", privateKey);
    console.log("Keys saved");
    console.log("--Generate public & private key pair END--");
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
    console.log("\n--Generate JWT key--\n")
    const randomKey = crypto.randomBytes(64).toString("hex");
    console.log("Random JWT key generated")
    const envContent = "JWT_SECRET="+randomKey+"\n";
    try {
        await fsPromise.writeFile(".env", envContent, "utf8");
        console.log("Random JWT key saved")
    }
    catch (error) {
        console.error("Failed to write to .env file: " + error.message);
    }
    console.log("\n--Generate JWT key END--\n")
}
//Export functions
module.exports = {generateKeyPair, testKeys, generateJWTKey};