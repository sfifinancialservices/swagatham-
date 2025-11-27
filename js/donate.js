document.addEventListener('DOMContentLoaded', function() {
    // Initialize session manager
    const sessionManager = new SessionManager();
    
    // Get DOM elements with null checks
    const profileBtn = document.getElementById('profileBtn');
    const contactBtn = document.getElementById('contactBtn');
    const profileModal = document.getElementById('profileModal');
    const editProfileModal = document.getElementById('editProfileModal');
    const profileContent = document.getElementById('profileContent');
    const profileActions = document.getElementById('profileActions');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const profileForm = document.getElementById('profileForm');
    const addFamilyMemberBtn = document.getElementById('addFamilyMember');
    const familyMembersContainer = document.getElementById('familyMembersContainer');
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    
    // Donation and OTP Handling elements
    const donateButtons = document.querySelectorAll('.donate-now-btn');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInputs = document.querySelectorAll('.custom-amount');
    const otpModal = document.getElementById('otpModal');
    const donationModal = document.getElementById('donationModal');
    const modalTitle = document.getElementById('modalTitle');
    const donationType = document.getElementById('donationType');
    const amountInput = document.getElementById('amount');
    const phoneInput = document.getElementById('phone');
    const rzpButton = document.getElementById('rzp-button');
    const successModal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');
    
    const otpForm = document.getElementById('otpForm');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const otpFieldGroup = document.getElementById('otpFieldGroup');
    const otpInput = document.getElementById('otp');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const otpTimer = document.getElementById('otpTimer');
    
    let selectedAmount = 0;
    let isMonthlyDonation = false;
    let otpCountdown = 0;
    let otpTimerInterval;

    // Update the UI function
    function updateUI() {
        const isLoggedIn = sessionManager.isLoggedIn();
        const header = document.querySelector('.main-header');
        
        if (!header) return;
        
        if (isLoggedIn) {
            header.classList.add('logged-in');
            if (profileBtn) profileBtn.style.display = 'flex';
            if (contactBtn) contactBtn.style.display = 'none';
            if (profileBtn) profileBtn.classList.add('mobile-visible');
        } else {
            header.classList.remove('logged-in');
            if (profileBtn) profileBtn.style.display = 'none';
            if (contactBtn) contactBtn.style.display = 'block';
            if (profileBtn) profileBtn.classList.remove('mobile-visible');
        }
        
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', function() {
                const mainNav = document.querySelector('.main-nav');
                if (mainNav) mainNav.classList.toggle('active');
            });
        }
    }
    
    // Load profile data into view modal
    async function loadProfileData() {
        const user = await sessionManager.fetchUserProfile();
        if (!user) return;
        
        // Store basic user info in localStorage for future logins
        if (user.name) localStorage.setItem('userName', user.name);
        if (user.email) localStorage.setItem('userEmail', user.email);
        if (user.phone) localStorage.setItem('userPhone', user.phone);
        if (user.dob) localStorage.setItem('userDob', user.dob);
        if (user.gender) localStorage.setItem('userGender', user.gender);
        if (user.address) localStorage.setItem('userAddress', user.address);
        
        let html = `
            <div class="profile-details">
                <div class="profile-detail">
                    <label>Name</label>
                    <span>${user.name || localStorage.getItem('userName') || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Email</label>
                    <span>${user.email || localStorage.getItem('userEmail') || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Phone</label>
                    <span>${user.phone || localStorage.getItem('userPhone') || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Date of Birth</label>
                    <span>${user.dob || localStorage.getItem('userDob') || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Gender</label>
                    <span>${user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 
                        (localStorage.getItem('userGender') ? 
                         localStorage.getItem('userGender').charAt(0).toUpperCase() + localStorage.getItem('userGender').slice(1) : 
                         'Not provided')}</span>
                </div>
                <div class="profile-detail">
                    <label>Address</label>
                    <span>${user.address || localStorage.getItem('userAddress') || 'Not provided'}</span>
                </div>
            </div>
        `;
        
        if (user.familyMembers && user.familyMembers.length > 0) {
            html += `
                <div class="family-members-list">
                    <h3>Family Members</h3>
                    ${user.familyMembers.map(member => `
                        <div class="family-member-item">
                            <strong>${member.name}</strong> (${member.relation}) - 
                            ${member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : ''}
                            ${member.dob ? `- Born: ${member.dob}` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (user.payments && user.payments.length > 0) {
            html += `
                <div class="donation-history">
                    <h3>Donation History</h3>
                    ${user.payments.map(payment => `
                        <div class="donation-item">
                            <strong>₹${payment.amount}</strong> - 
                            ${new Date(payment.payment_date).toLocaleDateString()}
                            <div class="payment-id">Payment ID: ${payment.razorpay_payment_id}</div>
                            <div class="payment-status">Status: ${payment.status || 'completed'}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Add KYC section
        if (user.kycDocuments) {
            html += `
                <div class="kyc-section">
                    <h3>KYC Documents</h3>
                    <div class="kyc-details">
                        ${user.kycDocuments.pan_number ? `<p><strong>PAN:</strong> ${user.kycDocuments.pan_number}</p>` : ''}
                        ${user.kycDocuments.aadhaar_number ? `<p><strong>Aadhaar:</strong> ${user.kycDocuments.aadhaar_number}</p>` : ''}
                        ${user.kycDocuments.dob ? `<p><strong>Date of Birth:</strong> ${user.kycDocuments.dob}</p>` : ''}
                        ${user.kycDocuments.kyc_doc_path ? `<p><strong>Document Uploaded:</strong> Yes</p>` : '<p><strong>Document Uploaded:</strong> No</p>'}
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="kyc-section">
                    <h3>KYC Documents</h3>
                    <p>No KYC documents submitted yet</p>
                    <button id="submitKycBtn" class="btn-primary">Submit KYC</button>
                </div>
            `;
        }

        if (profileContent) {
            profileContent.innerHTML = html;
            
            // Add KYC button event listener if needed
            const submitKycBtn = document.getElementById('submitKycBtn');
            if (submitKycBtn) {
                submitKycBtn.addEventListener('click', openKycForm);
            }
        }
        
        if (profileActions) {
            profileActions.innerHTML = '';
            if (!sessionManager.isProfileComplete()) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-secondary';
                editBtn.id = 'editProfileBtn';
                editBtn.innerHTML = 'Edit Profile';
                profileActions.appendChild(editBtn);
                
                editBtn.addEventListener('click', function() {
                    loadEditProfileForm(user);
                    if (profileModal) profileModal.style.display = 'none';
                    if (editProfileModal) editProfileModal.style.display = 'flex';
                });
            }
            
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn-primary';
            logoutBtn.id = 'logoutBtn';
            logoutBtn.innerHTML = 'Logout';
            profileActions.appendChild(logoutBtn);
            
            logoutBtn.addEventListener('click', function() {
                sessionManager.logout();
                if (profileModal) profileModal.style.display = 'none';
                updateUI();
            });
        }
    }
    
    function openKycForm() {
        // Create and show KYC form modal
        const kycModal = document.createElement('div');
        kycModal.className = 'modal-overlay';
        kycModal.id = 'kycModal';
        kycModal.innerHTML = `
            <div class="modal-container">
                <button class="close-modal">&times;</button>
                <h2>KYC Document Submission</h2>
                <form id="kycForm">
                    <div class="form-group">
                        <label for="panNumber">PAN Number</label>
                        <input type="text" id="panNumber" name="panNumber" required>
                    </div>
                    <div class="form-group">
                        <label for="aadhaarNumber">Aadhaar Number</label>
                        <input type="text" id="aadhaarNumber" name="aadhaarNumber" required>
                    </div>
                    <div class="form-group">
                        <label for="kycDob">Date of Birth</label>
                        <input type="date" id="kycDob" name="kycDob" required>
                    </div>
                    <div class="form-group">
                        <label for="kycDocument">Upload Document (PDF/Image)</label>
                        <input type="file" id="kycDocument" name="kycDocument" accept=".pdf,.jpg,.jpeg,.png" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Submit KYC</button>
                        <button type="button" class="btn-secondary" id="cancelKycBtn">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(kycModal);
        kycModal.style.display = 'flex';
        
        // Close modal handlers
        const closeModal = kycModal.querySelector('.close-modal');
        const cancelKycBtn = kycModal.querySelector('#cancelKycBtn');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                kycModal.style.display = 'none';
                setTimeout(() => kycModal.remove(), 300);
            });
        }
        
        if (cancelKycBtn) {
            cancelKycBtn.addEventListener('click', () => {
                kycModal.style.display = 'none';
                setTimeout(() => kycModal.remove(), 300);
            });
        }
        
        // Close when clicking outside
        kycModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                setTimeout(() => this.remove(), 300);
            }
        });
        
        // Form submission
        const kycForm = document.getElementById('kycForm');
        if (kycForm) {
            kycForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const panNumber = document.getElementById('panNumber').value;
                const aadhaarNumber = document.getElementById('aadhaarNumber').value;
                const kycDob = document.getElementById('kycDob').value;
                const kycDocument = document.getElementById('kycDocument').files[0];
                
                if (!panNumber || !aadhaarNumber || !kycDob || !kycDocument) {
                    alert('Please fill all required fields and upload a document');
                    return;
                }
                
                try {
                    // Show loading state
                    const submitBtn = kycForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
                    
                    // In a real app, you would upload the document to a server first
                    // For this example, we'll just use the file name
                    const kycDocPath = kycDocument ? kycDocument.name : null;
                    
                    const result = await sessionManager.submitKYC({
                        pan_number: panNumber,
                        aadhaar_number: aadhaarNumber,
                        dob: kycDob,
                        kyc_doc_path: kycDocPath
                    });
                    
                    if (result.success) {
                        alert('KYC submitted successfully!');
                        kycModal.style.display = 'none';
                        setTimeout(() => kycModal.remove(), 300);
                        loadProfileData(); // Refresh profile view
                    } else {
                        alert(result.error || 'Failed to submit KYC');
                    }
                } catch (error) {
                    console.error('KYC submission error:', error);
                    alert('Error submitting KYC: ' + error.message);
                } finally {
                    const submitBtn = kycForm.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Submit KYC';
                    }
                }
            });
        }
    }
    
    // Load profile data into edit form
    function loadEditProfileForm(user) {
        if (!user) return;
        
        const editName = document.getElementById('editName');
        const editEmail = document.getElementById('editEmail');
        const editDob = document.getElementById('editDob');
        const editGender = document.getElementById('editGender');
        const editAddress = document.getElementById('editAddress');
        
        if (editName) editName.value = user.name || localStorage.getItem('userName') || '';
        if (editEmail) editEmail.value = user.email || localStorage.getItem('userEmail') || '';
        if (editDob) editDob.value = user.dob || localStorage.getItem('userDob') || '';
        if (editGender) editGender.value = user.gender || localStorage.getItem('userGender') || '';
        if (editAddress) editAddress.value = user.address || localStorage.getItem('userAddress') || '';
        
        if (familyMembersContainer) {
            familyMembersContainer.innerHTML = '';
            
            if (user.familyMembers && user.familyMembers.length > 0) {
                user.familyMembers.forEach((member, index) => {
                    addFamilyMember(member.name, member.gender, member.relation, member.dob, index === 0);
                });
            } else {
                addFamilyMember('', '', '', '', true);
            }
        }
    }
    
    // Add family member to edit form
    function addFamilyMember(name = '', gender = '', relation = '', dob = '', isFirst = false) {
        if (!familyMembersContainer) return;
        
        const memberId = Date.now();
        const memberHtml = `
            <div class="family-member-form" data-id="${memberId}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="memberName${memberId}">Name</label>
                        <input type="text" id="memberName${memberId}" name="memberName[]" value="${name}" required>
                    </div>
                    <div class="form-group">
                        <label for="memberGender${memberId}">Gender</label>
                        <select id="memberGender${memberId}" name="memberGender[]" required>
                            <option value="">Select</option>
                            <option value="male" ${gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="memberDob${memberId}">Date of Birth</label>
                        <input type="date" id="memberDob${memberId}" name="memberDob[]" value="${dob}">
                    </div>
                    <div class="form-group">
                        <label for="memberRelation${memberId}">Relation</label>
                        <input type="text" id="memberRelation${memberId}" name="memberRelation[]" value="${relation}" required placeholder="e.g., Spouse, Son, Daughter">
                    </div>
                </div>
                ${!isFirst ? `<button type="button" class="remove-family-member" data-id="${memberId}">
                    <i class="fas fa-times"></i> Remove
                </button>` : ''}
            </div>
        `;
        
        familyMembersContainer.insertAdjacentHTML('beforeend', memberHtml);
        
        if (!isFirst) {
            const removeBtn = document.querySelector(`.remove-family-member[data-id="${memberId}"]`);
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    const memberForm = this.closest('.family-member-form');
                    if (memberForm) memberForm.remove();
                });
            }
        }
    }
    
    // Event listeners for profile management
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            loadProfileData();
            if (profileModal) profileModal.style.display = 'flex';
        });
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            if (editProfileModal) editProfileModal.style.display = 'none';
            if (profileModal) profileModal.style.display = 'flex';
        });
    }
    
    if (addFamilyMemberBtn) {
        addFamilyMemberBtn.addEventListener('click', function() {
            addFamilyMember();
        });
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect form data
            const profileData = {
                name: document.getElementById('editName')?.value || '',
                email: document.getElementById('editEmail')?.value || '',
                dob: document.getElementById('editDob')?.value || '',
                gender: document.getElementById('editGender')?.value || '',
                address: document.getElementById('editAddress')?.value || '',
                familyMembers: []
            };
            
            // Collect family member data
            const memberNames = document.querySelectorAll('input[name="memberName[]"]');
            const memberGenders = document.querySelectorAll('select[name="memberGender[]"]');
            const memberRelations = document.querySelectorAll('input[name="memberRelation[]"]');
            const memberDobs = document.querySelectorAll('input[name="memberDob[]"]');
            
            for (let i = 0; i < memberNames.length; i++) {
                if (memberNames[i].value && memberGenders[i].value && memberRelations[i].value) {
                    profileData.familyMembers.push({
                        name: memberNames[i].value,
                        gender: memberGenders[i].value,
                        relation: memberRelations[i].value,
                        dob: memberDobs[i].value
                    });
                }
            }
            
            // Validate at least one family member
            if (profileData.familyMembers.length === 0) {
                alert('Please add at least one family member');
                return;
            }
            
            // Update profile via API
            const success = await sessionManager.updateUserProfile(profileData);
            
            if (success) {
                localStorage.setItem('profileComplete', 'true');
                // Store basic info in localStorage
                localStorage.setItem('userName', profileData.name);
                localStorage.setItem('userEmail', profileData.email);
                localStorage.setItem('userDob', profileData.dob);
                localStorage.setItem('userGender', profileData.gender);
                localStorage.setItem('userAddress', profileData.address);
                
                if (editProfileModal) editProfileModal.style.display = 'none';
                loadProfileData();
                if (profileModal) profileModal.style.display = 'flex';
            } else {
                alert('Failed to update profile. Please try again.');
            }
        });
    }
    
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function() {
            const successModal = document.getElementById('successModal');
            if (successModal) successModal.style.display = 'none';
            loadProfileData();
            if (profileModal) profileModal.style.display = 'flex';
        });
    }
    
    // Close modal functionality
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modalOverlay = this.closest('.modal-overlay');
            if (modalOverlay) modalOverlay.style.display = 'none';
        });
    });
    
    document.querySelectorAll('.modal-container').forEach(modal => {
        modal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    updateUI();
    
    // Donation amount selection
    if (amountButtons.length > 0) {
        amountButtons.forEach(button => {
            button.addEventListener('click', function() {
                amountButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                selectedAmount = parseInt(this.textContent.replace(/[^0-9]/g, ''));
                if (amountInput) amountInput.value = selectedAmount;
            });
        });
    }
    
    if (customAmountInputs.length > 0) {
        customAmountInputs.forEach(input => {
            input.addEventListener('input', function() {
                amountButtons.forEach(btn => btn.classList.remove('active'));
                selectedAmount = parseInt(this.value) || 0;
                if (amountInput) amountInput.value = selectedAmount;
            });
        });
    }
    
    // Donate button click handler
    if (donateButtons.length > 0) {
        donateButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (selectedAmount <= 0) {
                    alert('Please select or enter an amount');
                    return;
                }
                
                if (sessionManager.isLoggedIn()) {
                    // User is already logged in, skip OTP and go directly to payment form
                    sessionManager.fetchUserProfile().then(user => {
                        openDonationForm(user.phone, user);
                    }).catch(error => {
                        console.error('Error fetching user profile:', error);
                        openDonationForm();
                    });
                } else {
                    openOtpVerification();
                }
            });
        });
    }
    
    function openOtpVerification() {
        if (!otpModal) return;
        
        otpModal.style.display = 'flex';
        if (otpFieldGroup) otpFieldGroup.style.display = 'none';
        if (verifyOtpBtn) verifyOtpBtn.style.display = 'none';
        if (sendOtpBtn) sendOtpBtn.style.display = 'block';
        if (phoneNumberInput) phoneNumberInput.value = '';
        if (otpInput) otpInput.value = '';
    }
    
    function openDonationForm(verifiedPhone, user = null) {
        if (!donationModal || !modalTitle || !donationType) return;
        
        const card = document.querySelector('.donation-card.highlighted');
        if (card) {
            modalTitle.textContent = 'Start Monthly Giving';
            donationType.value = 'monthly';
            isMonthlyDonation = true;
        } else {
            modalTitle.textContent = 'Make a Donation';
            donationType.value = 'one-time';
            isMonthlyDonation = false;
        }
        
        // Pre-fill user details if available
        if (user) {
            const fullName = document.getElementById('fullName');
            const email = document.getElementById('email');
            if (fullName) fullName.value = user.name || localStorage.getItem('userName') || '';
            if (email) email.value = user.email || localStorage.getItem('userEmail') || '';
            if (phoneInput) phoneInput.value = user.phone || verifiedPhone || '';
        } else if (verifiedPhone && phoneInput) {
            phoneInput.value = verifiedPhone;
        } else if (localStorage.getItem('userPhone') && phoneInput) {
            phoneInput.value = localStorage.getItem('userPhone');
        }
        
        // Allow amount editing
        if (amountInput) {
            amountInput.readOnly = false;
            amountInput.addEventListener('input', function() {
                selectedAmount = parseInt(this.value) || 0;
            });
        }
        
        if (otpModal) otpModal.style.display = 'none';
        donationModal.style.display = 'flex';
    }
    
    // OTP handling functions
    async function sendOtp(phoneNumber) {
        try {
            const response = await fetch('http://localhost:4000/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber }),
            });
        
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw error;
        }
    }
    
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async function() {
            if (!phoneNumberInput) return;
            
            const phoneNumber = phoneNumberInput.value.trim();
            
            if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
                alert('Please enter a valid 10-digit Indian phone number');
                return;
            }
            
            sendOtpBtn.disabled = true;
            sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            try {
                const result = await sendOtp(phoneNumber);
                
                if (result.success) {
                    if (otpFieldGroup) otpFieldGroup.style.display = 'block';
                    if (verifyOtpBtn) verifyOtpBtn.style.display = 'block';
                    sendOtpBtn.style.display = 'none';
                    startOtpTimer(120);
                } else {
                    alert(result.error || 'Failed to send OTP');
                }
            } catch (error) {
                alert('Failed to send OTP. Please try again.');
            } finally {
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerHTML = 'Send OTP';
            }
        });
    }
    
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async function() {
            if (!otpInput || !phoneNumberInput) return;
            
            const enteredOtp = otpInput.value.trim();
            const phoneNumber = phoneNumberInput.value.trim();
            
            if (enteredOtp.length !== 6) {
                alert('Please enter the 6-digit OTP');
                return;
            }
            
            verifyOtpBtn.disabled = true;
            verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            
            try {
                const response = await fetch('http://localhost:4000/api/verify-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phoneNumber: phoneNumber,
                        otp: enteredOtp
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    sessionManager.login(result.token, result.profileComplete);
                    // Store phone number in localStorage
                    localStorage.setItem('userPhone', phoneNumber);
                    updateUI();
                    
                    // After successful verification, fetch user profile to pre-fill details
                    const user = await sessionManager.fetchUserProfile();
                    openDonationForm(phoneNumber, user);
                    resetOtpVerification();
                } else {
                    alert(result.error || 'OTP verification failed');
                }
            } catch (error) {
                console.error('Verification error:', error);
                alert('Error verifying OTP. Please try again.');
            } finally {
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.innerHTML = 'Verify OTP';
            }
        });
    }
    
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', async function() {
            if (!phoneNumberInput) return;
            
            const phoneNumber = phoneNumberInput.value.trim();
            
            resendOtpBtn.disabled = true;
            resendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resending...';
            
            try {
                const result = await sendOtp(phoneNumber);
                
                if (result.success) {
                    clearInterval(otpTimerInterval);
                    startOtpTimer(120);
                } else {
                    alert(result.error || 'Failed to resend OTP');
                }
            } catch (error) {
                alert('Failed to resend OTP. Please try again.');
            } finally {
                resendOtpBtn.disabled = false;
                resendOtpBtn.innerHTML = 'Resend OTP';
            }
        });
    }
    
    function startOtpTimer(seconds) {
        if (!otpTimer) return;
        
        otpCountdown = seconds;
        updateOtpTimerDisplay();
        
        otpTimerInterval = setInterval(() => {
            otpCountdown--;
            updateOtpTimerDisplay();
            
            if (otpCountdown <= 0) {
                clearInterval(otpTimerInterval);
                if (resendOtpBtn) resendOtpBtn.disabled = false;
            }
        }, 1000);
    }
    
    function updateOtpTimerDisplay() {
        if (!otpTimer) return;
        
        const minutes = Math.floor(otpCountdown / 60);
        const seconds = otpCountdown % 60;
        otpTimer.textContent = `OTP expires in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    function resetOtpVerification() {
        clearInterval(otpTimerInterval);
        otpCountdown = 0;
        if (otpInput) otpInput.value = '';
        if (otpFieldGroup) otpFieldGroup.style.display = 'none';
        if (verifyOtpBtn) verifyOtpBtn.style.display = 'none';
        if (sendOtpBtn) sendOtpBtn.style.display = 'block';
        if (resendOtpBtn) resendOtpBtn.disabled = true;
    }
    
    // Razorpay payment handling
    function loadRazorpayScript() {
        return new Promise((resolve, reject) => {
            if (window.Razorpay) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
                console.log('Razorpay script loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load Razorpay script');
                reject(new Error('Failed to load Razorpay payment gateway'));
            };
            document.body.appendChild(script);
        });
    }
    
    if (rzpButton) {
        rzpButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('fullName')?.value;
            const email = document.getElementById('email')?.value;
            const phone = document.getElementById('phone')?.value;
            const amount = document.getElementById('amount')?.value;
            const donationType = document.getElementById('donationType')?.value;
            const taxExemption = document.getElementById('taxExemption')?.checked;
                
            if (!name || !email || !phone || !amount) {
                alert('Please fill all required fields');
                return;
            }
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            if (amount <= 0) {
                alert('Please enter a valid donation amount');
                return;
            }
            
            try {
                // Show loading state
                rzpButton.disabled = true;
                rzpButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                // Ensure Razorpay is loaded
                await loadRazorpayScript();
                
                const options = {
                    "key": "rzp_test_qKbcwAmDW48jVS", // Test key - replace with your actual key in production
                    "amount": amount * 100, // Razorpay expects amount in paise
                    "currency": "INR",
                    "name": "Swagatham Foundation",
                    "description": donationType === 'monthly' ? "Monthly Donation" : "One-Time Donation",
                    "image": "images/logo.png",
                    "handler": async function(response) {
                        try {
                            const paymentData = {
                                amount: amount,
                                paymentId: response.razorpay_payment_id,
                                taxExemption: taxExemption
                            };
                            
                            const result = await sessionManager.recordPayment(paymentData);
                            
                            if (result.success) {
                                if (successMessage) {
                                    successMessage.innerHTML = `
                                        Thank you for your donation of ₹${amount}!<br><br>
                                        <strong>Payment ID:</strong> ${response.razorpay_payment_id}<br>
                                        <strong>Status:</strong> Recorded successfully
                                    `;
                                }
                                if (donationModal) donationModal.style.display = 'none';
                                if (successModal) successModal.style.display = 'flex';
                            } else {
                                throw new Error('Payment recording failed');
                            }
                        } catch (error) {
                            console.error('Payment recording error:', error);
                            if (successMessage) {
                                successMessage.innerHTML = `
                                    Payment processed but recording failed.<br><br>
                                    <strong>Payment ID:</strong> ${response.razorpay_payment_id}<br>
                                    <strong>Error:</strong> ${error.message || 'Please contact support'}
                                `;
                            }
                            if (donationModal) donationModal.style.display = 'none';
                            if (successModal) successModal.style.display = 'flex';
                        } finally {
                            rzpButton.disabled = false;
                            rzpButton.innerHTML = 'Pay with Razorpay';
                        }
                    },
                    "prefill": {
                        "name": name,
                        "email": email,
                        "contact": phone
                    },
                    "theme": {
                        "color": "#3399cc"
                    }
                };
                
                const rzp = new Razorpay(options);
                rzp.open();
                
            } catch (error) {
                console.error('Payment initialization failed:', error);
                alert('Payment system error: ' + (error.message || 'Please try again later'));
                rzpButton.disabled = false;
                rzpButton.innerHTML = 'Pay with Razorpay';
            }
        });
    }
    
    window.closeSuccessModal = function() {
        if (successModal) successModal.style.display = 'none';
    };
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            const mainNav = document.querySelector('.main-nav');
            if (mainNav) mainNav.classList.toggle('active');
        });
    }
});