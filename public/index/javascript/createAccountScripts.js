//Function to encrypt and return any given string using RSAES-OAEP/SHA-256
async function encryptString(str){
    const publicKey = await fetchPublicKey();
    const encryptedStr = publicKey.encrypt(str, "RSA-OAEP", {
        md: forge.md.sha256.create()
    });
    return forge.util.encode64(encryptedStr);
}

//Function to fetch and return the public key from server.
async function fetchPublicKey(){return forge.pki.publicKeyFromPem(await (await fetch("/publicKey")).text());}

//Function to verify details and if valid send an account creation request to server for verification of token and account creation
async function createAccount(event) {
    event.preventDefault();
    const token = document.getElementById("creationToken").value;
    const email = document.getElementById("email").value;

    //Ensure no blank fields
    if (!token || !email || !document.getElementById("password") || !document.getElementById("confirmPassword")) {
        errorDisplay.innerText = "One or more fields have been left blank.";
        return;
    }

    //Ensure correct email format
    else if(!(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(email)) {
        errorDisplay.innerText = "Invalid email format. Please enter a valid email";
        return;
    }

    //Ensure passwords match
    else if (!(document.getElementById("password").value === document.getElementById("confirmPassword").value)) {
        errorDisplay.innerText = "Passwords do not match";
        return;
    }

    //Ensure password strenght
    var errorMessage = "";
    var errorCount = 0;

    //Check length
    if(document.getElementById("password").value.length < 10) {
        errorMessage += "Password must be at least 10 characters long.";
        errorCount++;
    }

    //Check for uppercase
    if(!/[A-Z]/.test(document.getElementById("password").value)) {
        if (errorCount < 1) {
            errorMessage += "Password must contain at least 1 uppercase character.";
        }
        else {
            errorMessage += "\nPassword must contain at least 1 uppercase character.";
        }
        errorCount++;
    }

    //Check for lowercase
    if(!/[a-z]/.test(document.getElementById("password").value)) {
        if (errorCount < 1) {
            errorMessage += "Password must contain at least 1 lowercase character.";
        }
        else {
            errorMessage += "\nPassword must contain at least 1 lowercase character.";
        }
        errorCount++;
    }

    //Check for special character
    if(!/[!@#$%^&*(),.?":{}|<>]/.test(document.getElementById("password").value)) {
        if (errorCount < 1) {
            errorMessage += "Password must contain at least 1 special character.";
        }
        else {
            errorMessage += "\nPassword must contain at least 1 special character.";
        }
        errorCount++;
    }
    
    //If any errors output and return
    if(errorCount > 0) {
        errorDisplay.innerText = errorMessage;
        return;
    }

    //Pass create account request to server
    const encryptedEmailBase64 = encryptString(email);
    const encryptedPasswordBase64 = encryptString(document.getElementById("password").innerText);
    const encryptedTokenBase64 = encryptString(token);
    const response = await fetch("/createAccount", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            encryptedTokenBase64,
            encryptedEmailBase64,
            encryptedPasswordBase64
        })
    });

    //Do stuff based on response when server side code is complete i.e say account created or failed or token invalid.
}