function scaleContainer(){
    const mode = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    const scaleFactor = mode === "landscape" ? Math.min(window.innerWidth/1920, window.innerHeight/1080): Math.min(window.innerWidth/1080, window.innerHeight/1920);
    if (mode === "landscape") {
        document.documentElement.style.setProperty("--scale", scaleFactor);
    }
}
document.addEventListener("DOMContentLoaded", scaleContainer);
window.addEventListener("resize", scaleContainer);