function signOut() {
    fetch("/signOut", {
        method: "GET",
        credentials: "include"
    }).then(response => {
        window.location.href = "/";
    }).catch(error => {
        console.error("Error signing out: " + error);
        window.location.href = "/";
    });
}