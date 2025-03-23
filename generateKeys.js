//Node module imports
const crypto = require("crypto");
const forge = require("node-forge");

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
function generateKeyPair(req) {
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
    req.session.publicKey = publicKey;
    req.session.privateKey = privateKey;
    timeLog("Keys saved");
    timeLog("--Generate public & private key pair END--");
}

//Test keys to ensure they are compatable
function testKeys(req) {
    timeLog("--Test Keys--");
    if (!req.session.publicKey || !req.session.privateKey) {
        return false;
    }
    const publicKeyForge = forge.pki.publicKeyFromPem(req.session.publicKey)
    const privateKeyForge = forge.pki.privateKeyFromPem(req.session.privateKey)
    const publicModulus = publicKeyForge.n.toString(16);
    const privateModulus = privateKeyForge.n.toString(16);
    timeLog("Keys match: " + (publicModulus === privateModulus));
    timeLog("--Test Keys END--");
    return publicModulus === privateModulus;
}

//Generate a key for the json web tokens
function generateJWTKey(req) {
    timeLog("--Generate JWT key--")
    const randomKey = crypto.randomBytes(64).toString("hex");
    timeLog("Random JWT key generated")
    req.session.JWTkey = randomKey;
    timeLog("Random JWT key saved")
    timeLog("--Generate JWT key END--")
}

async function generateSessionKeys(req) {
    do {
        generateKeyPair(req);
    } while (!testKeys(req));
    generateJWTKey(req);
}
//Export functions
module.exports = {generateSessionKeys};