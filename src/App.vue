<template>
    <router-view />
</template>

<script>
import { setPageLocale } from "./util-frontend";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

// Particle generator
function createParticles() {
    setTimeout(() => {
        const container = document.getElementById('particles-container');
        if (container) {
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.style.position = 'absolute';
                particle.style.width = '4px';
                particle.style.height = '4px';
                particle.style.background = 'rgba(0, 255, 65, 0.3)';
                particle.style.borderRadius = '50%';
                particle.style.animation = `hetops-float ${15 + Math.random() * 10}s infinite`;
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 20 + 's';
                container.appendChild(particle);
            }
        }
    }, 1000);
}

// Add the CSS animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes hetops-float {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100vh) translateX(100px); opacity: 0; }
}
`;
document.head.appendChild(style);

export default {
    created() {
        setPageLocale();
    },
    mounted() {
        createParticles();
    }
};
polyfillCountryFlagEmojis();
</script>
