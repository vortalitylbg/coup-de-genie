document.addEventListener('DOMContentLoaded', () => {
    const particlesContainer = document.getElementById('particles');
    const currentYearElement = document.getElementById('currentYear');

    if (particlesContainer) {
        initParticles(particlesContainer, 40);
    }

    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});

function initParticles(container, count = 30) {
    for (let i = 0; i < count; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 3 + 2;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 10;

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    container.appendChild(particle);

    particle.addEventListener('animationiteration', () => {
        particle.style.left = `${Math.random() * 100}%`;
    });
}