// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navbar = document.querySelector('.navbar');

// Set initial icon based on current theme
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

// Toggle menu
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        // Close mobile menu if open
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');

        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    themeIcon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    localStorage.setItem('theme', newTheme);
});

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Add zoom functionality
document.addEventListener('DOMContentLoaded', () => {
    // Create zoom container
    const zoomContainer = document.createElement('div');
    zoomContainer.className = 'zoom-container';
    document.body.appendChild(zoomContainer);

    // Add click handlers to gallery items
    const galleryItems = document.querySelectorAll('.gallery-item img');
    galleryItems.forEach(img => {
        img.addEventListener('click', () => {
            zoomContainer.style.display = 'flex';
            const zoomedImg = document.createElement('img');
            zoomedImg.src = img.src;
            zoomedImg.className = 'zoomed-image';
            zoomContainer.innerHTML = '';
            zoomContainer.appendChild(zoomedImg);
            
            // Add animation class after a brief delay
            setTimeout(() => {
                zoomedImg.classList.add('active');
            }, 50);
        });
    });

    // Close zoom view when clicking outside
    zoomContainer.addEventListener('click', (e) => {
        if (e.target === zoomContainer) {
            const zoomedImg = zoomContainer.querySelector('.zoomed-image');
            zoomedImg.classList.remove('active');
            setTimeout(() => {
                zoomContainer.style.display = 'none';
            }, 300);
        }
    });

    // Close zoom view with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && zoomContainer.style.display === 'flex') {
            const zoomedImg = zoomContainer.querySelector('.zoomed-image');
            zoomedImg.classList.remove('active');
            setTimeout(() => {
                zoomContainer.style.display = 'none';
            }, 300);
        }
    });
});