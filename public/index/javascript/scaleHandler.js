function scaleContainer(){
    const mode = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    const scaleFactor = mode === "landscape" ? Math.min(window.innerWidth/1920, window.innerHeight/1080): Math.min(window.innerWidth/1080, window.innerHeight/1920);
    if (mode === "landscape") {
        const container = document.getElementById("scaleContainer");
        container.style.transform = "scale("+scaleFactor+")";
        container.style.top = 133*scaleFactor+ "px";
        document.getElementById("university").style.transform = "scaleX("+scaleFactor+")";
        document.getElementById("developers").style.transform = "scaleX("+scaleFactor+")";
        document.getElementById("topbar").style.transform = "scaleY("+scaleFactor+")";
        const backgroundImage = document.getElementById("backgroundImage");
        backgroundImage.style.width = (1920*scaleFactor) +"px";
        backgroundImage.style.height = (1080*scaleFactor) +"px";
        console.log(backgroundImage.offsetWidth);
        console.log(window.innerWidth);
        console.log("end");
        if (backgroundImage.offsetWidth < window.innerWidth) {
            console.log("test1");
            backgroundImage.style.width = (1920*(scaleFactor*(window.innerWidth/backgroundImage.offsetWidth))) +"px";
            backgroundImage.style.height = (1080*(scaleFactor*(window.innerWidth/backgroundImage.offsetWidth))) +"px";
        }
        else if (backgroundImage.offsetHeight < window.innerHeight) {
            console.log("test2");
            backgroundImage.style.width = (1920*(scaleFactor*(window.innerHeight/backgroundImage.offsetHeight))) +"px";
            backgroundImage.style.height = (1080*(scaleFactor*(window.innerHeight/backgroundImage.offsetHeight))) +"px";
        }

    }
}

document.addEventListener("DOMContentLoaded", scaleContainer);
window.addEventListener("resize", scaleContainer);