const events = {};
async function fetchEvents() {
    try {
        const response = await fetch("/events");
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Error fetching events: " + error);
        return [];
    }
}

function populateEvents(eventsData) {
    let eventsContainer = document.getElementById("events");
    eventsContainer.innerHTML = "";
    eventsData.forEach(event => {
        events[event.eventID] = event;
        const eventDiv = document.createElement("div");
        eventDiv.innerHTML = `
        <h3>${event.eventName}</h3>
        <p>${event.detailsShort}</p>
        <p>${event.detailsLong}</p>
        <p>${event.staffAssigned.join(", ")}</p>
        <p>${event.numberStudentsSignedUp}</p>
        <p>${event.totalSpaces}</p>
        <p>${event.releventSubjects}</p>
        <button onclick = "viewEvent(`+event.eventID+`)">View</button>
        <button onclick = "editEvent(`+event.eventID+`)">Edit</button>
        `;
        eventsContainer.appendChild(eventDiv);
    });
}

//Temp functions for now will change them to redirect to another page for the event info
function viewEvent(eventID) {
    const event = events[eventID];
    //Redirect to event.html page with eventID and view passed as paramaters
    console.log("View event clicked: " + event.eventID);
}
function editEvent(eventID) {
    const event = events[eventID];
    //Redirect to event.html page with eventID and edit passed as paramaters
    console.log("Edit event clicked: " + event.eventID);
}

async function loadEvents() {
    const eventData = await fetchEvents();
    populateEvents(eventData);
}

//Load events on page load and then reload every 30s
document.addEventListener("DOMContentLoaded", loadEvents);
setInterval(loadEvents, 30000);