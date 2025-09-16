// Theme switching functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const themeButtons = document.querySelectorAll('.theme-btn[data-theme]');
  
  // Check for saved theme preference or use preferred color scheme
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
  
  // Set initial theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // Toggle menu on click
  themeToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!themeToggle.contains(e.target)) {
      themeToggle.classList.remove('active');
    }
  });
  
  // Theme button event listeners
  themeButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const theme = this.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      themeToggle.classList.remove('active');
    });
  });
  
  // Add scroll animation to elements
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.benefit-card, .feature-item, .stat-item');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.3;
      
      if (elementPosition < screenPosition) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
    });
  };
  
  // Initialize animation styles
  const initAnimations = function() {
    const elements = document.querySelectorAll('.benefit-card, .feature-item, .stat-item');
    
    elements.forEach(element => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Animate logo on load
    const logo = document.querySelector('.logo-icon');
    if (logo) {
      logo.style.transform = 'scale(0)';
      logo.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      setTimeout(() => {
        logo.style.transform = 'scale(1)';
      }, 300);
    }
    
    window.addEventListener('scroll', animateOnScroll);
    // Trigger once on load
    setTimeout(animateOnScroll, 500);
  };
  
  // Initialize animations
  initAnimations();
  
  // Add hover effect to CTA button
  const ctaButton = document.querySelector('.cta-button');
  if (ctaButton) {
    ctaButton.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.05)';
    });
    
    ctaButton.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  }
});
