class Auth {
    constructor(api) {
        this.api = api;
        this.currentUser = null;
    }

    async login(credentials) {
        const userData = await this.api.login(credentials);
        this.api.setToken(userData.token);
        this.currentUser = userData;
        return userData;
    }

    async register(userData) {
        const newUser = await this.api.register(userData);
        this.api.setToken(newUser.token);
        this.currentUser = newUser;
        return newUser;
    }

    async getCurrentUser() {
        try {
            if (!this.api.token) {
                throw new Error('No token found');
            }
            const userData = await this.api.getCurrentUser();
            this.currentUser = userData;
            return userData;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    logout() {
        this.currentUser = null;
        this.api.setToken(null);
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUserData() {
        return this.currentUser;
    }
}