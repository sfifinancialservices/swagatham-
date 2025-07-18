class SessionManager {
    constructor() {
        this.USER_SESSION_KEY = 'swagatham_user_session';
        this.API_BASE_URL = 'http://localhost:4000/api'; 
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return this.getToken() !== null;
    }
    
    // Get current user token
    getToken() {
        return sessionStorage.getItem(this.USER_SESSION_KEY);
    }
    
    // Login user and save token to session
    login(token, profileComplete = false) {
        sessionStorage.setItem(this.USER_SESSION_KEY, token);
        localStorage.setItem('profileComplete', profileComplete.toString());
    }
    
    // Logout user and clear session
    logout() {
        sessionStorage.removeItem(this.USER_SESSION_KEY);
        localStorage.removeItem('profileComplete');
    }
    
    // Check if profile is complete
    isProfileComplete() {
        return localStorage.getItem('profileComplete') === 'true';
    }
    
    // Make authenticated API request
    async makeAuthenticatedRequest(url, method = 'GET', body = null) {
        const token = this.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token
        };
        
        const options = {
            method,
            headers
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${this.API_BASE_URL}${url}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        
        return await response.json();
    }
    
    // Fetch user profile
    async fetchUserProfile() {
        try {
            const response = await this.makeAuthenticatedRequest('/user/profile');
            return response.user;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }
    
    // Update user profile
    async updateUserProfile(profileData) {
        try {
            const response = await this.makeAuthenticatedRequest(
                '/user/profile', 
                'PUT', 
                profileData
            );
            return response.success;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    }

    // Submit KYC documents
    async submitKYC(kycData) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/kyc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getToken()
                },
                body: JSON.stringify(kycData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'KYC submission failed');
            }

            return await response.json();
        } catch (error) {
            console.error('KYC submission error:', error);
            throw error;
        }
    }

    // Record donation
    async recordPayment(paymentData) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getToken()
                },
                body: JSON.stringify({
                    amount: paymentData.amount,
                    razorpay_payment_id: paymentData.paymentId
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Payment recording failed');
            }
    
            return await response.json();
        } catch (error) {
            console.error('Payment recording error:', error);
            throw error;
        }
    }
}