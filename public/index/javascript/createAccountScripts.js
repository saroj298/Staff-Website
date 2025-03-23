//Function to encrypt and return any given string using RSAES-OAEP/SHA-256
async function encryptString(str){
    const publicKey = await fetchPublicKey();
    const encryptedStr = publicKey.encrypt(str, "RSA-OAEP", {
        md: forge.md.sha256.create()
    });
    return forge.util.encode64(encryptedStr);
}

//Function to fetch and return the public key from server.
async function fetchPublicKey(){
    const response = await fetch("/publicKey");
    const publicKeyPem = await response.text();
    return forge.pki.publicKeyFromPem(publicKeyPem);
}

//Function to verify details and if valid send an account creation request to server for verification of token and account creation
async function createAccount(event) {
    event.preventDefault();
    const token = document.getElementById("creationToken").value;
    const email = document.getElementById("email").value;
    var errorDisplay = document.getElementById("errorDisplay");

    //Ensure no blank fields
    if (!token || !email || !document.getElementById("password") || !document.getElementById("confirmPassword")) {
        errorDisplay.innerText = "One or more fields have been left blank.";
        return;
    }

    //Ensure correct email format
    else if(!(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(email)) {
        errorDisplay.innerText = "Invalid email format. Please enter a valid email";
        document.getElementById("password").value = "";
        document.getElementById("confirmPassword").value = "";
        return;
    }

    //Ensure passwords match
    else if (!(document.getElementById("password").value === document.getElementById("confirmPassword").value)) {
        errorDisplay.innerText = "Passwords do not match";
        document.getElementById("password").value = "";
        document.getElementById("confirmPassword").value = "";
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
        document.getElementById("password").value = "";
        document.getElementById("confirmPassword").value = "";
        return;
    }
    //Pass create account request to server
    try {
        const encryptedEmailBase64 = await encryptString(email);
        const encryptedPasswordBase64 = await encryptString(document.getElementById("password").value);
        const encryptedTokenBase64 = await encryptString(token);
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
        const data = await response.json();
        errorDisplay.innerText = data.errorMessage || data.message;
    }
    catch (error) {
        errorDisplay.innerText = error.message || "An unexpected error occured.";
        console.error("Error during account creation: " + error.message);
    }
    finally {
        document.getElementById("password").value = "";
        document.getElementById("confirmPassword").value = "";
    }
}