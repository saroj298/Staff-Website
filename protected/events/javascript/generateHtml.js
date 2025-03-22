function updateSwitchButtons() {
    //If viewing event provide options to add event & edit event
    if (sessionStorage.getItem("eventMode") === "view") {
        document.getElementById("switchButtons").innerHTML = `
            <button onclick = "switchEditEvent()">Switch to Edit</button>
            <button onclick = "switchAddEvent()">Add new Event</button>
        `;
    }
    //If editing event provide options to add event & view event
    else if (sessionStorage.getItem("eventMode") === "edit") {
        document.getElementById("switchButtons").innerHTML = `
            <button onclick = "switchViewEvent()">Switch to View</button>
            <button onclick = "switchAddEvent()">Add new Event</button>
        `;
    }
    //If adding event or invalid "eventMode" show no buttons
    else {
        document.getElementById("switchButtons").innerHTML = ``;
    }
}

function switchEditEvent() {
    sessionStorage.setItem("eventMode", "edit");
    loadEvent();
}
function switchViewEvent() {
    sessionStorage.setItem("eventMode", "view");
    loadEvent();
}
function switchAddEvent() {
    sessionStorage.setItem("eventMode", "add");
    sessionStorage.removeItem("eventID");
    loadEvent();
}

async function loadEvent(){
    updateSwitchButtons();
    const mode = sessionStorage.getItem("eventMode");
    const eventID = sessionStorage.getItem("eventID");


    //ADD THESE TO DATABASE INTERACTIONS
    //tmp values for now should fetch staff and subjects from db
    const availableSubjects = ["MATH", "CS", "ART"];
    const avaliableStaff = ["teacher1@example.com", "teacher2@example.com"];


    const eventSection = document.getElementById("event");
    eventData = {
        eventID: "",
        eventName: "",
        location: "",
        detailsShort: "",
        detailsLong: "",
        staffAssigned: [],
        studentsSignedUp: "",
        totalSpaces: "",
        releventSubjects: [],
        startTime: Date.now(),
        endTime: ""
    };
    eventData.endTime = eventData.startTime;
    //If view or edit get event data.
    if(mode === "view" || mode === "edit") {
        try {
        const response = await fetch("/getEvent?eventID="+encodeURIComponent(eventID), {credentials: "include"});
        if (!response.ok) {
            console.error("Error fetching event data: " + error);
            return;
        }
        eventData = await response.json();
        }
        catch(error) {
            console.error("Error fetching event data: " + error);
            return;
        }
    }
    const disabledField = mode === "view" ? "disabled" : "";
    document.getElementById("event").innerHTML = `
        <div id = "eventIDContainer">
            <label for = "eventID">Event ID:</label>
            <input type = "number" id = "eventID" name = "eventID" value = "${eventData.eventID}" disabled>
        </div>
        <div>
            <label for = "eventName">Event Name:</label>
            <input type = "text" id = "eventName" name = "eventName" value = "${eventData.eventName}" ${disabledField}>
        </div>
        <div>
            <label for = "eventLocation">Event Location:</label>
            <input type = "text" id = "eventLocation" name = "eventLocation" value = "${eventData.location}" ${disabledField}>
        </div>
        <div>
            <label for = "detailsShort">Short Details:</label>
            <input type = "text" id = "detailsShort" name = "detailsShort" value = "${eventData.detailsShort}" ${disabledField}>
        </div>
        <div>
            <label for = "detailsLong">Long Details:</label>
            <textarea id="detailsLong" name="detailsLong" ${disabledField}>${eventData.detailsLong}</textarea>
        </div>
        <div>
            <label for = "staffAssigned">Staff Assigned:</label>
            <select id = "staffAssigned" name = "staffAssigned" multiple ${disabledField}>
                ${avaliableStaff.map(staff => {
                    const selected = (Array.isArray(eventData.staffAssigned) && eventData.staffAssigned.includes(staff)) ? "selected" : "";
                    return `<option value = "${staff}" ${selected}>${staff}</option>`;
                }).join("")}
            </select>
        </div>
        <div id = "studentsSignedUpContainer">
            <label for = "studentsSignedUp">Students Signed Up:</label>
            <input type = "number" id = "studentsSignedUp" name = "studentsSignedUp" value = "${eventData.numberStudentsSignedUp}" disabled> 
        </div>
        <div>
            <label for = "totalSpaces">Total Spaces:</label>
            <input type = "number" id = "totalSpaces" name = "totalSpaces" value = "${eventData.totalSpaces}" ${disabledField}> 
        </div>
        <div>
            <label for = "releventSubjects">Relevent Subjects:</label>
            <select id = "releventSubjects" name = "releventSubjects" multiple ${disabledField}>
                ${availableSubjects.map(subject => {
                    const selected = (Array.isArray(eventData.releventSubjects) && eventData.releventSubjects.includes(subject)) ? "selected" : "";
                    return `<option value = "${subject}" ${selected}>${subject}</option>`;
                }).join("")}
            </select>
        </div>
        <div>
            <label for = "startTime">Start Time:</label>
            <input type = "datetime-local" id = "startTime" name = "startTime" value = "${formatTime(eventData.startTime)}" ${disabledField}> 
        </div>
        <div>
            <label for = "endTime">End Time:</label>
            <input type = "datetime-local" id = "endTime" name = "endTime" value = "${formatTime(eventData.endTime)}" ${disabledField}> 
        </div>
        <button id = "submitEvent" type = "button" onclick = "submitForm()">${mode === "add" ? "Create Event" : "Update Event"}</button>
    `;
    if (mode === "add"){
        document.getElementById("eventIDContainer").remove();
        document.getElementById("studentsSignedUpContainer").remove();
    }
    if (mode === "view") {
        document.getElementById("submitEvent").remove();
    }
}

function submitForm(){
    //Do submision stuff
    console.log("Mode: " + sessionStorage.eventMode);
    const mode = sessionStorage.eventMode;
    var eventID = 0;
    var studnetsSignedUp = 0;
    if(mode === "add") {
        eventID = 0 //Call function in db to get next avaliable id
        studnetsSignedUp = 0;
    }
    else {
        eventID = document.getElementById("eventID").value;
        studnetsSignedUp = document.getElementById("studentsSignedUp").value;
    }
    const eventName = document.getElementById("eventName").value;
    const location = document.getElementById("eventLocation").value;
    const detailsShort = document.getElementById("detailsShort").value;
    const detailsLong = document.getElementById("detailsLong").value;
    const staffAssigend = document.getElementById("staffAssigned").value;
    const totalSpaces = document.getElementById("totalSpaces").value;
    const releventSubjects = document.getElementById("releventSubjects").value;
    const startTime = parseCustomDate(document.getElementById("startTime").value);
    const endTime = parseCustomDate(document.getElementById("endTime").value);



    //Temp prints to show updating working
    console.log("EventID: " + eventID);
    console.log("Event Name: " + eventName);
    console.log("Event Location: " + location);
    console.log("Details Short: " + detailsShort);
    console.log("Details Long: " + detailsLong);
    console.log("Staff Assigned: " + staffAssigend);
    console.log("Students Signed Up: " + studnetsSignedUp);
    console.log("Total Spaces: " + totalSpaces);
    console.log("Relevant Subjects: " + releventSubjects);
    console.log("Start Time: " + formatTime(startTime));
    console.log("End Time: " + formatTime(endTime));
}
function formatTime(ms) {
    const date = new Date(ms);
    
    function pad(num, size) {
        let s = num.toString();
        while (s.length < size) {
            s = "0" + s;
        }
        return s;
    }
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1, 2);
    const day = pad(date.getDate(), 2);
    const hours = pad(date.getHours(), 2);
    const minutes = pad(date.getMinutes(), 2);
    // Format required for datetime-local is "yyyy-MM-ddThh:mm"
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseCustomDate(dateString) {
    // Expected format: "yyyy-MM-ddThh:mm"
    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    // Create a Date object
    const dateObj = new Date(year, month - 1, day, hours, minutes);
    return dateObj.getTime();
}

if (document.readyState !== "loading") {
    loadEvent();
}
else {
    document.addEventListener("DOMContentLoaded", loadEvent);
}
