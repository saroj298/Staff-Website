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
        <p>${event.releventSubjects.join(", ")}</p>
        <p>${formatTime(event.startTime)}</p>
        <p>${formatTime(event.endTime)}</p>
        <div class="event-buttons">
          <button class="view-btn" onclick="viewEvent(${event.eventID})">View</button>
          <button class="edit-btn" onclick="editEvent(${event.eventID})">Edit</button>
          <button class="remove-btn" onclick="removeEvent(${event.eventID})">Remove</button>
        </div>
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
async function removeEvent(eventID) {
    try {
        const response = await fetch("/removeEvent", {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({eventID: eventID})
        });
        const data = await response.json();
        if (!response.ok) {
            console.error("Server failed to remove event.");
            return;
        }
        await loadEvents();
    }
    catch (error) {
        console.error("Error removing event: " + error);
    }
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