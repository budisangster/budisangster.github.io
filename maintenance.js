// Initialize countdown when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCountdown();
});

// Countdown functionality
function initializeCountdown() {
    const countDownDate = new Date("2025-03-01T00:00:00").getTime();
    const countdownElements = {
        days: document.getElementById("days"),
        hours: document.getElementById("hours"),
        minutes: document.getElementById("minutes"),
        seconds: document.getElementById("seconds")
    };

    // Check if countdown elements exist
    if (!Object.values(countdownElements).every(element => element)) {
        console.log("Countdown elements not found");
        return;
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElements.days.textContent = String(days).padStart(2, '0');
        countdownElements.hours.textContent = String(hours).padStart(2, '0');
        countdownElements.minutes.textContent = String(minutes).padStart(2, '0');
        countdownElements.seconds.textContent = String(seconds).padStart(2, '0');

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.querySelector(".countdown").innerHTML = "WEBSITE IS LIVE!";
        }
    }

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
} 