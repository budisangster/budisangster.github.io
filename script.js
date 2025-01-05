// Use strict mode for better performance and error catching
'use strict';

// Cache DOM queries
const elements = {
    themeToggle: document.querySelector('.theme-toggle'),
    themeIcon: document.querySelector('.theme-toggle i'),
    navToggle: document.querySelector('.nav-toggle'),
    navLinks: document.querySelector('.nav-links'),
    navbar: document.querySelector('.navbar'),
    anchors: document.querySelectorAll('a[href^="#"]'),
};

// Debounce function for scroll events
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Theme management
const themeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    },
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        elements.themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    },
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }
};

// Navigation management
const navManager = {
    init() {
        elements.navToggle.addEventListener('click', () => this.toggleMenu());
        this.initSmoothScroll();
        this.initScrollEffect();
    },
    
    toggleMenu() {
        elements.navToggle.classList.toggle('active');
        elements.navLinks.classList.toggle('active');
    },
    
    closeMenu() {
        elements.navToggle.classList.remove('active');
        elements.navLinks.classList.remove('active');
    },
    
    initSmoothScroll() {
        elements.anchors.forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    },
    
    initScrollEffect() {
        window.addEventListener('scroll', debounce(() => {
            elements.navbar.classList.toggle('scrolled', window.scrollY > 50);
        }, 10));
    }
};

// Image zoom functionality
const zoomManager = {
    init() {
        this.setupZoomContainer();
        this.initGalleryZoom();
    },
    
    setupZoomContainer() {
        this.zoomContainer = document.createElement('div');
        this.zoomContainer.className = 'zoom-container';
        document.body.appendChild(this.zoomContainer);
        
        this.zoomContainer.addEventListener('click', (e) => {
            if (e.target === this.zoomContainer) {
                this.closeZoom();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.zoomContainer.style.display === 'flex') {
                this.closeZoom();
            }
        });
    },
    
    initGalleryZoom() {
        const galleryItems = document.querySelectorAll('.gallery-item img');
        galleryItems.forEach(img => {
            img.addEventListener('click', () => this.openZoom(img));
        });
    },
    
    openZoom(img) {
        this.zoomContainer.style.display = 'flex';
        const zoomedImg = document.createElement('img');
        zoomedImg.src = img.src;
        zoomedImg.className = 'zoomed-image';
        this.zoomContainer.innerHTML = '';
        this.zoomContainer.appendChild(zoomedImg);
        requestAnimationFrame(() => zoomedImg.classList.add('active'));
    },
    
    closeZoom() {
        const zoomedImg = this.zoomContainer.querySelector('.zoomed-image');
        if (zoomedImg) {
            zoomedImg.classList.remove('active');
            setTimeout(() => {
                this.zoomContainer.style.display = 'none';
            }, 300);
        }
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
    navManager.init();
    zoomManager.init();
});