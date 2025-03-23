/*
Temporary Contents I need the database to be setup to interactive with it
this file origionally had a bunch of functions returning fixed values
and was then changed to use 3 JSON files like temp database tables.
*/

//node module imports
const argon2 = require("argon2");
const path = require("path");
const fsPromise = require("fs/promises");

//File paths for JSON database files.
const STAFF_DB_PATH = path.join(__dirname, "JSON-dbs/staff.json");
const TOKENS_DB_PATH = path.join(__dirname, "JSON-dbs/accountCreationTokens.json");
const EVENTS_DB_PATH = path.join(__dirname, "JSON-dbs/events.json");
const SUBJECTS_DB_PATH = path.join(__dirname, "JSON-dbs/subjects.json");

//Helper function to read JSON form file.
async function readJSON(filePath) {
    try {
        const data = await fsPromise.readFile(filePath, "utf8");
        return data ? JSON.parse(data) : [];
    }
    catch (error) {
        console.log("Error reading from JSON file: " + error);
        return[];
    }
}
//Helper function to write JSON to a file.
async function writeJSON(filePath, data) {
    await fsPromise.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

/* --- EVENTS FUNTIONS --- */

//Get all events data
async function getEvents() {
    return await readJSON(EVENTS_DB_PATH);
}

//Get a event given ID
async function getEvent(eventID) {
    const events = await getEvents();
    return events.find(e => e.eventID == eventID) || null;
}

//Get next valid eventID
async function getNextID() {
    const events = await getEvents();
    return events.length > 0 ? Math.max(...events.map(e => e.eventID)) + 1 : 1;
}

//Save or update an event record.
async function saveEvent(eventData) {
    const events = await getEvents();
    if (!eventData.eventID) {
        eventData.eventID = await getNextID();
        events.push(eventData);
    }
    else {
        const index = events.findIndex(e => e.eventID == eventData.eventID);
        if (index !== -1) {
            events[index] = eventData;
        }
        else {
            events.push(eventData);
        }
    }
    await writeJSON(EVENTS_DB_PATH, events);
    return eventData;
}

//Remove an event record.
async function removeEvent(eventID) {
    var events = await getEvents();
    events = events.filter(e => e.eventID != eventID);
    await writeJSON(EVENTS_DB_PATH, events);
}

/* --- STAFF FUNTIONS --- */

//Get staff records
async function getStaff() {
    return await readJSON(STAFF_DB_PATH);
}

//Check if account with given email exists
async function emailExists(email) {
    const staff = await getStaff();
    return staff.some(s => s.email.toLowerCase() === email.toLowerCase());
}

//Validate staff login credentals
async function validateCredentialsStaff(email, password) {
    if (!await emailExists(email)) return null;
    const staff = await getStaff();
    const account = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (!account) return null;
    if (await argon2.verify(account.hashedPassword, password)) {
        return account.accessLevel;
    }
    return null;
}

//Create new staff account
async function saveAccount(email, hashedPassword, accessLevel = "staff") {
    const staff = await getStaff();
    if (await emailExists(email)) {
        return null;
    }
    const newAccount = {email, hashedPassword, accessLevel};
    staff.push(newAccount);
    await writeJSON(STAFF_DB_PATH, staff);
    return newAccount;
}

/* --- ACCOUNT CREATION TOKEN FUNTIONS --- */

//Retreive all account creation token records
async function getAccountCreationTokens() {
    return await readJSON(TOKENS_DB_PATH);
}

//Store token and time it was created.
async function storeToken(token, createdAt) {
    const tokens = await getAccountCreationTokens();
    tokens.push({token, createdAt});
    await writeJSON(TOKENS_DB_PATH, tokens);
    await removeOutOfDateTokens();
    return true;
}

//Check if token is valid. In db and in 24hrs of created at
async function isTokenValid(token) {
    const tokens = await getAccountCreationTokens();
    const tokenRecord = tokens.find(t => t.token === token);
    if (!tokenRecord) {
        return false;
    }
    const tokenAge = Date.now() - tokenRecord.createdAt;
    await removeOutOfDateTokens();
    if (tokenAge > 86400000) {
        return false;
    }
    return true;
}

//Remove out of date tokens
async function removeOutOfDateTokens() {
    const tokens = await getAccountCreationTokens();
    const validTokens = tokens.filter(t => (Date.now() - t.createdAt) <= 86400000);
    await writeJSON(TOKENS_DB_PATH, validTokens);
}

//Remove token from db
async function removeToken(token) {
    var tokens = await getAccountCreationTokens();
    tokens = tokens.filter(t => t.token != token);
    await writeJSON(TOKENS_DB_PATH, tokens);
}

/* --- SUBJECTS FUNTIONS --- */

//Get all subjects from db.
async function getSubjects() {
    return await readJSON(SUBJECTS_DB_PATH)
}

// Export the functions so they can be imported in your server.js.
module.exports = {
    getEvents,
    saveAccount,
    isTokenValid,
    emailExists,
    storeToken,
    validateCredentialsStaff,
    getEvent,
    removeEvent,
    saveEvent,
    getSubjects,
    getStaff,
    removeToken
};
