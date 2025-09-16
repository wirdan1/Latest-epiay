// Theme switching functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const themeButtons = document.querySelectorAll('.theme-btn[data-theme]');
  const currentTheme = localStorage.getItem('theme') || 'light';
  
  // Set initial theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // Theme button event listeners
  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const theme = button.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  });
  
  // Add subtle animation to elements
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.benefit-card, .feature-item, .content-box');
    
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
    const elements = document.querySelectorAll('.benefit-card, .feature-item');
    
    elements.forEach(element => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', animateOnScroll);
    // Trigger once on load
    animateOnScroll();
  };
  
  // Initialize animations
  initAnimations();
});
