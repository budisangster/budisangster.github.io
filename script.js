document.addEventListener('DOMContentLoaded', function() {
    // Navigation handling
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active nav link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show the corresponding section
            const targetId = this.getAttribute('href').substring(1);
            
            sections.forEach(section => {
                section.classList.remove('active-section');
                section.classList.add('hidden-section');
            });
            
            if (targetId === '') {
                // Home link (no hash)
                document.getElementById('home').classList.remove('hidden-section');
                document.getElementById('home').classList.add('active-section');
            } else {
                // Other sections
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.remove('hidden-section');
                    targetSection.classList.add('active-section');
                }
            }
        });
    });
    
    // Handle contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real application, you would handle the form submission to a server here
            // For now, we'll just show an alert
            alert('Thanks for your message! I\'ll get back to you soon.');
            contactForm.reset();
        });
    }
    
    // Add some animation to the welcome bubble
    const welcomeBubble = document.querySelector('.welcome-bubble');
    if (welcomeBubble) {
        // Simple pulse animation
        setInterval(() => {
            welcomeBubble.style.transform = 'scale(1.05)';
            setTimeout(() => {
                welcomeBubble.style.transform = 'scale(1)';
            }, 500);
        }, 3000);
    }
}); 