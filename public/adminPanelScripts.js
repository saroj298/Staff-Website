document.addEventListener("DOMContentLoaded", async () => {
    try {
        const token = localStorage.getItem("token");
        //Check for no token
        if (!token) {
            window.location.href = "index.html";
            return;
        }

        //Check token validity
        const response = await fetch ("/validate-token", {
            method: "GET",
            headers: { "Authorization": "Bearer "+token }
        });

        //Check for invalid/expired token
        if(!response.ok) {
            window.location.href = "index.html";
        }
    }

    //Any unexpected errors
    catch (error) {
        console.error("Error validating token: " + error);
        window.location.href = "index.html";
    }
})