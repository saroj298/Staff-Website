//global variable should be updated to true whenever the user does anything on the site and false every time there actvity is checked
let userActive = true;

//Check token every 4 minutes and attempt to refresh token
function startTokenRefreshChecker() {
    async function checkActivity() {
        //Refresh token automatically if user has activity in last 4min
        console.log("User activity check");
        if(userActive) {
            console.log("User active");
            await refreshToken();
            userActive = false;
            return;
        }
    
        //If user has no activity give them a popup warning them they will be signed out
        //if they dont click otherwise
        else {
            console.log("User inactive");
            const stillHere = await promptUserForRefreshWithCountdown();
            if (stillHere) {
                await refreshToken();
                userActive = false;
                return;
            }
            else {
                signOut();
            }
        }
    }
    checkActivity();
    const checkInterval = 240000 //4mins in milliseconds
    setInterval(checkActivity, checkInterval);
}
//Function to display and handle a popup warning the user they will be logged out
async function promptUserForRefreshWithCountdown(){
    const timeout = 60000; //1min in milliseconds
    return new Promise((resolve) => {

        //html items for popup
        const popup = document.getElementById("signoutCountdownPopup");
        popup.innerHTML = `
            <div class = "popupContent">
                <p>Your session is about to expire. Are you still there?</p>
                <p id = "countdownTimer"></p>
                <button id = "stayLoggedInBtn">Yes, keep me logged in</button>
            </div>
        `;
        const countdownElem = document.getElementById("countdownTimer");
        const stayBtn = document.getElementById("stayLoggedInBtn");

        //Show popup
        popup.style.display = "flex"; 

        let remaining = Math.floor(timeout/1000);
        countdownElem.innerText = remaining + "s";

        //Countdown displaying time remaining till logout & logout if it reachs 0
        const intervalId = setInterval (() => {
            remaining--;
            countdownElem.innerText = remaining + "s";
            if (remaining <= 0) {
                clearInterval(intervalId);
                popup.style.display = "none";
                popup.innerHTML = ``;
                resolve(false);
            }
        }, 1000);

        //If button to stay is clicked stop countdown and return that the user is still present
        stayBtn.onclick = () => {
            clearInterval(intervalId);
            popup.style.display = "none";
            popup.innerHTML = ``;
            resolve(true);
        };
    });
}

//Function to create event listeners for user activity
function setupActivityListeners(){
    const events = ["click", "mousemove", "keydown", "scroll"];
    events.forEach(event => {
        window.addEventListener(event, () => {
            userActive = true;
        })
    })
}

//Function to send a refresh token request
async function refreshToken() {
    try {
        const response = await fetch("/refresh-token", {
            method: "POST",
            credentials: "include"
        });
        if (!response.ok) {
            window.location.href = "/";
            return;
        }
    }
    catch (error) {
        console.error("Error refreshing token: " + error);
        window.location.href = "/";
    }
}

//Event listener to run on page launch
document.addEventListener("DOMContentLoaded", async () => {
    try {
        //Check token validity
        const response = await fetch ("/validate-token", {
            method: "GET",
            credentials: "include"
        });

        //Check for invalid/expired token
        if(!response.ok) {
            window.location.href = "/";
            return;
        }
    }
    
    //Any unexpected errors
    catch (error) {
        console.error("Error validating token: " + error);
        window.location.href = "/";
    }

    setupActivityListeners();
    startTokenRefreshChecker();
});