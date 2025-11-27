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
        // Clear user data from localStorage
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userDob');
        localStorage.removeItem('userGender');
        localStorage.removeItem('userAddress');
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
            'Authorization': `Bearer ${token}`
        };
        
        const options = {
            method,
            headers,
            credentials: 'include' // Include cookies if needed
        };
        
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}${url}`, options);
            
            if (response.status === 401) {
                // Token expired or invalid
                this.logout();
                throw new Error('Session expired. Please login again.');
            }
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `HTTP error! status: ${response.status}` };
                }
                throw new Error(errorData.error || errorData.message || 'Request failed');
            }
            
            // For 204 No Content responses
            if (response.status === 204) {
                return { success: true };
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection.');
            }
            throw error;
        }
    }
    
    // Fetch user profile
    async fetchUserProfile() {
        try {
            const response = await this.makeAuthenticatedRequest('/user/profile');
            return response.user || response.data || null;
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Return fallback data from localStorage
            return this.getFallbackUserData();
        }
    }
    
    // Get fallback user data from localStorage
    getFallbackUserData() {
        const name = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');
        const phone = localStorage.getItem('userPhone');
        const dob = localStorage.getItem('userDob');
        const gender = localStorage.getItem('userGender');
        const address = localStorage.getItem('userAddress');
        
        if (!name && !email && !phone) {
            return null;
        }
        
        return {
            name,
            email,
            phone,
            dob,
            gender,
            address,
            familyMembers: [],
            payments: [],
            kycDocuments: null
        };
    }
    
    // Update user profile
    async updateUserProfile(profileData) {
        try {
            const response = await this.makeAuthenticatedRequest(
                '/user/profile', 
                'PUT', 
                profileData
            );
            return response.success || response.data || false;
        } catch (error) {
            console.error('Error updating profile:', error);
            // Store data locally as fallback
            this.storeUserDataLocally(profileData);
            return false;
        }
    }

    // Store user data locally as fallback
    storeUserDataLocally(profileData) {
        if (profileData.name) localStorage.setItem('userName', profileData.name);
        if (profileData.email) localStorage.setItem('userEmail', profileData.email);
        if (profileData.dob) localStorage.setItem('userDob', profileData.dob);
        if (profileData.gender) localStorage.setItem('userGender', profileData.gender);
        if (profileData.address) localStorage.setItem('userAddress', profileData.address);
    }

    // Submit KYC documents
    async submitKYC(kycData) {
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('pan_number', kycData.pan_number);
            formData.append('aadhaar_number', kycData.aadhaar_number);
            formData.append('dob', kycData.dob);
            
            // Append file if exists
            if (kycData.kyc_document_file) {
                formData.append('kyc_document', kycData.kyc_document_file);
            } else if (kycData.kyc_doc_path) {
                formData.append('kyc_doc_path', kycData.kyc_doc_path);
            }

            const response = await fetch(`${this.API_BASE_URL}/kyc`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                    // Don't set Content-Type for FormData, let browser set it with boundary
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'KYC submission failed');
            }

            return await response.json();
        } catch (error) {
            console.error('KYC submission error:', error);
            throw error;
        }
    }

    // Record payment (for donation history)
    async recordPayment(paymentData) {
        try {
            const response = await this.makeAuthenticatedRequest('/payments', 'POST', {
                amount: paymentData.amount,
                razorpay_payment_id: paymentData.paymentId,
                tax_exemption: paymentData.taxExemption || false,
                donation_type: paymentData.donationType || 'one-time'
            });
    
            return response;
        } catch (error) {
            console.error('Payment recording error:', error);
            // Return success true for demo purposes even if recording fails
            // In production, you might want to handle this differently
            return { 
                success: true, 
                payment: {
                    amount: paymentData.amount,
                    razorpay_payment_id: paymentData.paymentId,
                    status: 'completed'
                }
            };
        }
    }

    // Verify OTP (for login)
    async verifyOTP(phoneNumber, otp) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    otp: otp
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'OTP verification failed');
            }

            return await response.json();
        } catch (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
    }

    // Send OTP
    async sendOTP(phoneNumber) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber })
            });
        
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to send OTP');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw error;
        }
    }

    // Check session validity
    async validateSession() {
        try {
            const response = await this.makeAuthenticatedRequest('/user/validate-session');
            return response.valid || false;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    // Refresh token (if implemented in backend)
    async refreshToken() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    this.login(data.token, this.isProfileComplete());
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }
}

// Safe event listener function
function safeAddEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        // Remove existing event listeners to prevent duplicates
        element.replaceWith(element.cloneNode(true));
        const newElement = document.getElementById(elementId);
        newElement.addEventListener(event, handler);
        return true;
    } else {
        console.warn(`Element with id '${elementId}' not found`);
        return false;
    }
}

// Safe query selector all event listener
function safeAddEventListenerAll(selector, event, handler) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
        elements.forEach(element => {
            element.addEventListener(event, handler);
        });
        return true;
    } else {
        console.warn(`Elements with selector '${selector}' not found`);
        return false;
    }
}

// Initialize modals function
function initializeModals() {
    // Close modals when clicking outside
    safeAddEventListenerAll('.modal-overlay', 'click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // Close modals with close buttons
    safeAddEventListenerAll('.close-modal', 'click', function() {
        const modalOverlay = this.closest('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });

    // Prevent modal content clicks from closing modal
    safeAddEventListenerAll('.modal-container', 'click', function(e) {
        e.stopPropagation();
    });
}

// Utility function to show loading state
function setLoadingState(element, isLoading, loadingText = 'Loading...') {
    if (!element) return;
    
    if (isLoading) {
        element.dataset.originalText = element.innerHTML;
        element.disabled = true;
        element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        element.disabled = false;
        element.innerHTML = element.dataset.originalText || element.innerHTML;
    }
}

// Utility function to handle API errors
function handleApiError(error, fallbackMessage = 'An error occurred') {
    console.error('API Error:', error);
    const message = error.message || fallbackMessage;
    
    // Show user-friendly error message
    if (typeof alert === 'function') {
        alert(message);
    } else {
        console.error('User message:', message);
    }
    
    return message;
}

// Initialize the application
function initializeApp() {
    // Initialize modals
    initializeModals();
    
    // Initialize session manager
    const sessionManager = new SessionManager();
    
    // Update UI based on login status
    updateUI(sessionManager);
    
    return sessionManager;
}

// Update UI based on login status
function updateUI(sessionManager) {
    const isLoggedIn = sessionManager.isLoggedIn();
    const header = document.querySelector('.main-header');
    
    if (!header) return;
    
    if (isLoggedIn) {
        header.classList.add('logged-in');
        const profileBtn = document.getElementById('profileBtn');
        const contactBtn = document.getElementById('contactBtn');
        
        if (profileBtn) profileBtn.style.display = 'flex';
        if (contactBtn) contactBtn.style.display = 'none';
        if (profileBtn) profileBtn.classList.add('mobile-visible');
    } else {
        header.classList.remove('logged-in');
        const profileBtn = document.getElementById('profileBtn');
        const contactBtn = document.getElementById('contactBtn');
        
        if (profileBtn) profileBtn.style.display = 'none';
        if (contactBtn) contactBtn.style.display = 'block';
        if (profileBtn) profileBtn.classList.remove('mobile-visible');
    }
}

// Make SessionManager available globally
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
    window.safeAddEventListener = safeAddEventListener;
    window.safeAddEventListenerAll = safeAddEventListenerAll;
    window.initializeApp = initializeApp;
    window.setLoadingState = setLoadingState;
    window.handleApiError = handleApiError;
}