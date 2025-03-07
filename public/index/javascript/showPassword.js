document.addEventListener("DOMContentLoaded", () => {
    //html elements
    const passwordInput = document.getElementById("password");
    const toggleBtn = document.getElementById("passwordToggleBtn");
    const toggleIcon = document.getElementById("passwordToggleIcon");

    //show password images
    const passwordVisable = "../../index/images/passwordVisable.png";
    const passwordNonVisable = "../../index/images/passwordNonVisable.png";

    //inital password not visable
    toggleIcon.src = passwordNonVisable;

    //Compatability for mouse clicks
    toggleBtn.addEventListener("mousedown", () => {
        passwordInput.type = "text";
        toggleIcon.src = passwordVisable;
    });

    toggleBtn.addEventListener("mouseup", () => {
        passwordInput.type = "password";
        toggleIcon.src = passwordNonVisable;
    });
    toggleBtn.addEventListener("mouseleave", () => {
        passwordInput.type = "password";
        toggleIcon.src = passwordNonVisable;
    });

    //Compatability for touch screen
    toggleBtn.addEventListener("touchstart", () => {
        passwordInput.type = "text";
        toggleIcon.src = passwordVisable;
    });

    toggleBtn.addEventListener("touchend", () => {
        passwordInput.type = "password";
        toggleIcon.src = passwordNonVisable;
    });
});