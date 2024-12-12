// Shared observer options
const observerOptions = {
    threshold: 0.2
};

// Navigation functionality
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const modal = document.querySelector('.detail-modal');
const galleryItems = document.querySelectorAll('.gallery-item');
const closeModal = document.querySelector('.close-modal');
const mainImage = document.querySelector('.main-image');
const thumbnails = document.querySelectorAll('.thumbnail');
const sizeBtns = document.querySelectorAll('.size-btn');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle.querySelector('i');

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe gallery items
document.querySelectorAll('.gallery-item').forEach(item => {
    observer.observe(item);
});

// Toggle mobile menu
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
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

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        const navHeight = navbar.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        
        window.scrollTo({
            top: targetPosition - navHeight,
            behavior: 'smooth'
        });
    });
});

// Modal functionality
galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const imgSrc = item.querySelector('img').src;
        mainImage.src = imgSrc;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
});

// Close modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Thumbnail functionality
thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImage.src = thumb.src;
    });
});

// Size selection
sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Optional: Add dynamic cursor
const cursor = document.createElement('div');
cursor.classList.add('cursor');
document.body.appendChild(cursor);

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// Animate elements when they come into view
document.querySelectorAll('.about-content, .contact-content, .expertise-item').forEach(item => {
    observer.observe(item);
});

// Theme toggle functionality
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
const zoomContainer = document.querySelector('.zoom-container');
const zoomedImage = document.querySelector('.zoomed-image');

if (mainImage && zoomContainer && zoomedImage) {
    mainImage.addEventListener('click', () => {
        zoomedImage.src = mainImage.src;
        zoomContainer.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            zoomedImage.classList.add('active');
        }, 50);
    });

    zoomContainer.addEventListener('click', () => {
        zoomedImage.classList.remove('active');
        setTimeout(() => {
            zoomContainer.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    });

    // Add escape key support for zoom
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && zoomContainer.style.display === 'flex') {
            zoomedImage.classList.remove('active');
            setTimeout(() => {
                zoomContainer.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    });
} 