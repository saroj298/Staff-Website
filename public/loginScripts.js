//Function to toggle the display of password
function showPassword() {
    var passwordField = document.getElementById("password");
    if (passwordField.type === "password") {
        passwordField.type = "text";
    }
    else {
        passwordField.type = "password"
    }
}
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

//Function to validate login 
async function validateLogin(event){
    event.preventDefault();
    const email = document.getElementById("email").value
    var errorDisplay = document.getElementById("errorDisplay");

    //Ensure no blank fields
    if (!email || !document.getElementById("password").value) {
        errorDisplay.innerText = "One or more fields have been left blank.";
        return;
    }

    //Ensure correct email formating
    else if(!(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(email)) {
        errorDisplay.innerText = "Invalid email format. Please enter a valid email";
        return;
    }

    else {
        try {
            //Encrypt password and send to server for verification
            const encryptedPasswordBase64 = await encryptString(document.getElementById("password").value);
            const encryptedEmailBase64 = await encryptString(email);
            const response = await fetch ("/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({encryptedEmailBase64, encryptedPasswordBase64})
            });

            //Do action based on response from server
            if (!response.ok) {
                throw new Error(response.status === 401 ? "Invalid email or password." : null);
            }
            const data = await response.json();
            if (data.success) {
                window.location.href = "admin-panel.html";
            }
            else {
                throw new Error(data.message);
            }
        }

        //Any errors
        catch (error){
            errorDisplay.innerText = error.message || "An unexpected error occured. Please try again.";
            console.error("Error during login: " + error)
        }

        //After function complete clear password field of any data
        finally {
            document.getElementById("password").value = "";
        }
    }
}