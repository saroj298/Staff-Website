async function generateAccountCreationToken() {
    const response = await fetch("/generateAccountCreationToken");
    const data = await response.json();
    const token = data.token;
    await displayPopup(token);
}

async function displayPopup(token){
    const timeout = 60000; //1min in milliseconds
    return new Promise((resolve) => {

        //html items for popup
        const popup = document.getElementById("createAccountTokenPopup");
        popup.innerHTML = `
            <div class = "popupContent">
                <p>Account Creation Token Created:</p>
                <p>${token}</p>
                <p>This token will expire in 24 hours.</p>
                <p id = "countdownTimer">This popup will close in: 60s</p>
                <button id = "closeButton">Close</button>
            </div>
        `;
        const countdownElem = document.getElementById("countdownTimer");
        const closeButton = document.getElementById("closeButton");

        //Show popup
        popup.style.display = "flex"; 

        let remaining = Math.floor(timeout/1000);
        countdownElem.innerText = "This popup will close in: " + remaining + "s";

        //Countdown displaying time remaining till logout & logout if it reachs 0
        const intervalId = setInterval (() => {
            remaining--;
            countdownElem.innerText = "This popup will close in: " + remaining + "s";
            if (remaining <= 0) {
                clearInterval(intervalId);
                popup.style.display = "none";
                popup.innerHTML = ``;
                resolve(false);
            }
        }, 1000);

        //If button to stay is clicked stop countdown and return that the user is still present
        closeButton.onclick = () => {
            clearInterval(intervalId);
            popup.style.display = "none";
            popup.innerHTML = ``;
            resolve(true);
        };
    });
}