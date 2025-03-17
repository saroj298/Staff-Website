function createAccountPage() {
    document.getElementById("loginBox").innerHTML = `
    <h2>Sign Up</h2>
    <h3>Already have an account? Log in <a href = "#" onclick = "loginPage(); return false;">here</a></h3>
    <form id="signUpForm" action autocomplete="off">
    <div class="formGroup">
        <label for="creationToken">Token</label>
        <input placeholder="Enter Token:" type="text" id="creationToken">
    </div>
    <div class="formGroup">
        <label for="email">Email</label>
        <input placeholder="Enter Email:" type="text" id="email">
    </div>
    <div class="formGroup">
        <label for="password">Password</label>
        <input placeholder="Enter Password:" type="password" id="password">
    </div>
    <div class="formGroup">
        <label for="confirmPassword">Confirm Password</label>
        <input placeholder="Re-enter Password:" type="password" id="confirmPassword">
    </div>
    <p class="errorDisplay" id="errorDisplay"></p>
    <button class="submit" type="button" onclick="createAccount(event)">Sign Up</button>
    </form>`;
}

function loginPage() {
    document.getElementById("loginBox").innerHTML = `
    <h2>Log In</h2>
    <h3>Don't have an account? Create one <a href = "#" onclick = "createAccountPage(); return false;">here</a></h3>
    <form id="loginForm" action autocomplete="off">
    <div class="formGroup">
        <label for="email">Email</label>
        <input placeholder="Enter Email:" type="text" id="email">
    </div>
    <div class="formGroup">
        <label for="password">Password</label>
        <input placeholder="Enter Password:" type="password" id="password">
        <button id="passwordToggleBtn" class="togglePassword" type="button">
        <img src="../../index/images/passwordNonVisable.png" alt="Show Password" id="passwordToggleIcon">
        </button>
    </div>
    <p class="errorDisplay" id="errorDisplay"></p>
    <button class="submit" type="button" onclick="validateLogin(event)">Sign In</button>
    </form>`;
}