//node module imports
const argon2 = require("argon2");

//Function will be in different JS file for database interactions
async function validateCredentialsStaff(email, password) {
    //Search database for record with email if none exists return null here
    if (!email) { //Example search database if email is not present in data base return null
        return null;
    }
    //If a record for email does exist fetch password from record
    //Ignore this im hashing the stored password example in the same way passwords would be stored in database
    storedPassword = await argon2.hash("password123", {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, //64MB
        timeCost: 4, //No. Iterations
        parallelism: 2 //No. Threads
    });
    //Check password against storedPassword
    if (await argon2.verify(storedPassword, password)) {
        //If password is correct
        return "admin"; //return access level (fetch access level from data base "admin", "staff", "headstaff" etc)
    }
    //If password is false return null
    return null;

    /*
    So TLDR: "SELECT * FROM staffTbl WHERE email == " + email;
           : if returns null return null else continute in function
           : "SELECT password FROM staffTbl WHERE email == " + email;
           : use password to check against user input if valid return true
           : return null 
    */
}

//Another temp function to be in db interactions to store a token
function storeToken(token, createdAt){
    removeOutOfDateTokens();
    return;
}

//Another temp function to be in database interactions js which will check the table containing staff account creation
//tokens to check if the one provided is valid. This is done 2 ways tokens will have a 24hr lifetime so needs to check
//not only that token is present in db but that it is still alive aswell. (would be nice if this function deleted out of 
//lifetime tokens too)
async function isTokenValid(token) {
    //Temp return true
    removeOutOfDateTokens();
    return true;
}

//Another temp function to be in database interactions js which will check the staff accounts table to see
//if the email entered is already in use
async function emailExists(email) {
    //temp return false
    return false;
}

//Another temp function to save the account to the database
async function saveAccount(email, hashedPassword, accessLevel = "staff") {
    //temp return
    return;
}

//Another temp function that will be in db interactions
async function getEvents() {
    const events = [
        {
            eventID: 0,
            eventName: "Computer Demo",
            detailsShort: "A demonstration of how the uni computers work",
            detailsLong: "A in-depth demonstration of using the university computers, accessing software, and what to do when issues arise",
            staffAssigned: ["Computer science teacher 1"],
            numberStudentsSignedUp: 35,
            totalSpaces: 56,
            releventSubjects: "CS, ART, MATH, HISTORY"
        },
        {
            eventID: 1,
            eventName: "Computer Demo",
            detailsShort: "A demonstration of how the uni computers work",
            detailsLong: "A in-depth demonstration of using the university computers, accessing software, and what to do when issues arise",
            staffAssigned: ["Computer science teacher 1"],
            numberStudentsSignedUp: 35,
            totalSpaces: 56,
            releventSubjects: "CS, ART, MATH, HISTORY"
        },
        {
            eventID: 2,
            eventName: "Computer Demo",
            detailsShort: "A demonstration of how the uni computers work",
            detailsLong: "A in-depth demonstration of using the university computers, accessing software, and what to do when issues arise",
            staffAssigned: ["Computer science teacher 1"],
            numberStudentsSignedUp: 35,
            totalSpaces: 56,
            releventSubjects: "CS, ART, MATH, HISTORY"
        }
    ];
    return events;
}

//Temp function which will remove the token from the db
function removeToken(token) {
    return;
}

//Temp function will remove all out of date tokens from the db
function removeOutOfDateTokens(token) {
    return;
}

// Export the functions so they can be imported in your server.js.
module.exports = {
    getEvents,
    saveAccount,
    isTokenValid,
    emailExists,
    storeToken,
    validateCredentialsStaff,
    removeToken
};
