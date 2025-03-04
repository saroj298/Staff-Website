document.addEventListener("DOMContentLoaded", async () => {
    try {
        //Check token validity
        const response = await fetch ("/validate-token", {
            method: "GET",
            credentials: "include"
        });

        //Check for invalid/expired token
        if(!response.ok) {
            window.location.href = "index.html";
            return;
        }
    }
    
    //Any unexpected errors
    catch (error) {
        console.error("Error validating token: " + error);
        window.location.href = "index.html";
    }
})