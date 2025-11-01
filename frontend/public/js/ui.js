class UI {
    constructor(auth, api) {
        this.auth = auth;
        this.api = api;
        this.currentView = 'landing';
        this.init();
    }

    init() {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            this.auth.getCurrentUser()
                .then(() => this.showDashboard())
                .catch(() => this.showLanding());
        } else {
            this.showLanding();
        }
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${icons[type] || icons.info}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showLanding() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 text-center fade-in">
                <h1 class="text-3xl font-bold text-blue-500 mb-4">SocialSphere</h1>
                <p class="text-gray-600 mb-6">Connect with friends and the world around you</p>
                <button onclick="ui.showAuth()" class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
                    Get Started
                </button>
            </div>
        `;
        this.currentView = 'landing';
    }

    showAuth() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 fade-in">
                <h2 class="text-2xl font-bold text-center mb-6">Welcome to SocialSphere</h2>
                
                <div class="flex mb-6 border-b">
                    <button id="login-tab" class="flex-1 py-2 font-medium text-center active-tab">Login</button>
                    <button id="register-tab" class="flex-1 py-2 font-medium text-center text-gray-500">Register</button>
                </div>
                
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-gray-700 mb-2">Username or Email</label>
                        <input type="text" id="login-username" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Password</label>
                        <input type="password" id="login-password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">Login</button>
                </form>
                
                <form id="register-form" class="space-y-4 hidden">
                    <div>
                        <label class="block text-gray-700 mb-2">Full Name</label>
                        <input type="text" id="register-name" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Username</label>
                        <input type="text" id="register-username" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Email</label>
                        <input type="email" id="register-email" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Password</label>
                        <input type="password" id="register-password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Bio</label>
                        <textarea id="register-bio" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
                    </div>
                    <button type="submit" class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">Register</button>
                </form>
            </div>
        `;

        this.attachAuthEventListeners();
        this.currentView = 'auth';
    }

    attachAuthEventListeners() {
        // Tab switching
        document.getElementById('login-tab').addEventListener('click', () => {
            this.switchAuthTab('login');
        });

        document.getElementById('register-tab').addEventListener('click', () => {
            this.switchAuthTab('register');
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }

    switchAuthTab(tab) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');

        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            loginTab.classList.add('active-tab');
            loginTab.classList.remove('text-gray-500');
            registerTab.classList.remove('active-tab');
            registerTab.classList.add('text-gray-500');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            registerTab.classList.add('active-tab');
            registerTab.classList.remove('text-gray-500');
            loginTab.classList.remove('active-tab');
            loginTab.classList.add('text-gray-500');
        }
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            await this.auth.login({ username, password });
            this.showNotification('Login successful!', 'success');
            this.showDashboard();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const bio = document.getElementById('register-bio').value;

        try {
            await this.auth.register({ name, username, email, password, bio });
            this.showNotification('Registration successful!', 'success');
            this.showDashboard();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showDashboard() {
        const user = this.auth.getCurrentUserData();
        const mainContent = document.getElementById('main-content');
        
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div class="flex items-center space-x-4">
                        <div class="relative">
                            <img src="${user.avatar}" alt="${user.name}" class="w-20 h-20 rounded-full object-cover" id="profile-avatar">
                            <label for="avatar-input" class="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer hover:bg-blue-600 transition">
                                <i class="fas fa-camera text-xs"></i>
                            </label>
                            <input type="file" id="avatar-input" accept="image/*" class="hidden">
                        </div>
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold">${user.name}</h2>
                            <p class="text-gray-500">@${user.username}</p>
                            <p class="text-gray-600 mt-2">${user.bio || 'No bio yet'}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <h3 class="text-xl font-bold mb-4">Quick Stats</h3>
                        <div class="space-y-2 text-gray-600">
                            <p>📝 Posts: 0</p>
                            <p>👥 Followers: ${user.followers ? user.followers.length : 0}</p>
                            <p>🔍 Following: ${user.following ? user.following.length : 0}</p>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-md p-6">
                        <h3 class="text-xl font-bold mb-4">Actions</h3>
                        <div class="space-y-2">
                            <button class="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">Edit Profile</button>
                            <button class="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">Find Friends</button>
                            <button class="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">Settings</button>
                        </div>
                    </div>
                </div>

                <div class="mt-6 text-center">
                    <button onclick="ui.auth.logout(); ui.showLanding();" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition">
                        Logout
                    </button>
                </div>
            </div>
        `;

        // Add avatar upload functionality
        document.getElementById('avatar-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const result = await this.api.uploadProfilePicture(file);
                    document.getElementById('profile-avatar').src = result.avatar;
                    this.showNotification('Profile picture updated!', 'success');
                } catch (error) {
                    this.showNotification('Failed to upload image: ' + error.message, 'error');
                }
            }
        });

        this.currentView = 'dashboard';
    }
}