// Initialize the application
const api = new API();
const auth = new Auth(api);
const ui = new UI(auth, api);

// Make available globally for debugging
window.api = api;
window.auth = auth;
window.ui = ui;

console.log('🚀 SocialSphere Frontend Loaded');