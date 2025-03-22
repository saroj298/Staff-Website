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
    let eventsContainer = document.getElementById("events");
    eventsContainer.innerHTML = "";
    eventsData.forEach(event => {
        events[event.eventID] = event;
        const eventDiv = document.createElement("div");
        eventDiv.innerHTML = `
        <h3>${event.eventName}</h3>
        <p>${event.location}</p>
        <p>${event.detailsShort}</p>
        <p>${event.detailsLong}</p>
        <p>${event.staffAssigned.join(", ")}</p>
        <p>${event.numberStudentsSignedUp}</p>
        <p>${event.totalSpaces}</p>
        <p>${event.releventSubjects}</p>
        <p>${formatTime(event.startTime)}</p>
        <p>${formatTime(event.endTime)}</p>
        <button onclick = "viewEvent(`+event.eventID+`)">View</button>
        <button onclick = "editEvent(`+event.eventID+`)">Edit</button>
        `;
        eventsContainer.appendChild(eventDiv);
    });
}

function viewEvent(eventID) {
    sessionStorage.setItem("eventMode", "view");
    sessionStorage.setItem("eventID", eventID);
    window.location.href = "/protected/events/html/event.html";
}
function editEvent(eventID) {
    sessionStorage.setItem("eventMode", "edit");
    sessionStorage.setItem("eventID", eventID);
    window.location.href = "/protected/events/html/event.html";
}
function addEvent() {
    sessionStorage.setItem("eventMode", "add");
    sessionStorage.removeItem("eventID");
    window.location.href = "/protected/events/html/event.html";
}

async function loadEvents() {
    const eventData = await fetchEvents();
    populateEvents(eventData);
}

//Load events on page load and then reload every 30s
document.addEventListener("DOMContentLoaded", loadEvents);
setInterval(loadEvents, 30000);