const backgroundImages = [
    "/images/indexBackground1.jpg",
    "/images/indexBackground2.jpg",
    "/images/indexBackground3.jpg"
];
let backgroundIndex = 0;

function cycleBackgroundImage(){
    const backgroundContainer = document.getElementById("backgroundImage");
    backgroundIndex = (backgroundIndex+1)%backgroundImages.length;
    const newBackground = document.createElement("div");
    newBackground.classList.add("backgroundTransition");
    newBackground.style.backgroundImage = "url(" + backgroundImages[backgroundIndex] + ")";
    backgroundContainer.appendChild(newBackground);
    window.getComputedStyle(newBackground).opacity;
    newBackground.style.opacity = 1;
    setTimeout(() => {
        while (backgroundContainer.children.length > 1) {
            backgroundContainer.removeChild(backgroundContainer.firstChild);
        }
    }, 1500);
} 
setInterval(cycleBackgroundImage, 30000);