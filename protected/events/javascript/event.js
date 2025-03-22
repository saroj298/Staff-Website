function returnToAdminPanel() {
    sessionStorage.removeItem("eventMode");
    sessionStorage.removeItem("eventID");
    window.location.href = "/protected/adminPanel/html/admin-panel.html";
}
