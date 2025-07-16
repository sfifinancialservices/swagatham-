document.addEventListener('DOMContentLoaded', function() {
    // Initialize session manager
    const sessionManager = new SessionManager();
    
    // Get DOM elements
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
    
    // Update the UI function
    function updateUI() {
        const isLoggedIn = sessionManager.isLoggedIn();
        const header = document.querySelector('.main-header');
        
        if (isLoggedIn) {
            header.classList.add('logged-in');
            document.getElementById('profileBtn').style.display = 'flex';
            document.getElementById('contactBtn').style.display = 'none';
            
            document.getElementById('profileBtn').classList.add('mobile-visible');
        } else {
            header.classList.remove('logged-in');
            document.getElementById('profileBtn').style.display = 'none';
            document.getElementById('contactBtn').style.display = 'block';
            
            document.getElementById('profileBtn').classList.remove('mobile-visible');
        }
        
        document.querySelector('.mobile-menu-toggle').addEventListener('click', function() {
            document.querySelector('.main-nav').classList.toggle('active');
        });
    }
    
    // Load profile data into view modal
    async function loadProfileData() {
        const user = await sessionManager.fetchUserProfile();
        if (!user) return;
        
        let html = `
            <div class="profile-details">
                <div class="profile-detail">
                    <label>Name</label>
                    <span>${user.name || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Email</label>
                    <span>${user.email || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Phone</label>
                    <span>${user.phone || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Date of Birth</label>
                    <span>${user.dob || 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Gender</label>
                    <span>${user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not provided'}</span>
                </div>
                <div class="profile-detail">
                    <label>Address</label>
                    <span>${user.address || 'Not provided'}</span>
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
        
        if (user.donations && user.donations.length > 0) {
            html += `
                <div class="donation-history">
                    <h3>Donation History</h3>
                    ${user.donations.map(donation => `
                        <div class="donation-item">
                            <strong>₹${donation.amount}</strong> - ${donation.type === 'monthly' ? 'Monthly' : 'One-Time'} - 
                            ${new Date(donation.date).toLocaleDateString()}
                            ${donation.tax_exemption ? '(Tax Exempt)' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        profileContent.innerHTML = html;
        
        profileActions.innerHTML = '';
        if (!sessionManager.isProfileComplete()) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-secondary';
            editBtn.id = 'editProfileBtn';
            editBtn.innerHTML = 'Edit Profile';
            profileActions.appendChild(editBtn);
            
            editBtn.addEventListener('click', function() {
                loadEditProfileForm(user);
                profileModal.style.display = 'none';
                editProfileModal.style.display = 'flex';
            });
        }
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn-primary';
        logoutBtn.id = 'logoutBtn';
        logoutBtn.innerHTML = 'Logout';
        profileActions.appendChild(logoutBtn);
        
        logoutBtn.addEventListener('click', function() {
            sessionManager.logout();
            profileModal.style.display = 'none';
            updateUI();
        });
    }
    
    // Load profile data into edit form
    function loadEditProfileForm(user) {
        if (!user) return;
        
        document.getElementById('editName').value = user.name || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editDob').value = user.dob || '';
        document.getElementById('editGender').value = user.gender || '';
        document.getElementById('editAddress').value = user.address || '';
        
        familyMembersContainer.innerHTML = '';
        
        if (user.familyMembers && user.familyMembers.length > 0) {
            user.familyMembers.forEach((member, index) => {
                addFamilyMember(member.name, member.gender, member.relation, member.dob, index === 0);
            });
        } else {
            addFamilyMember('', '', '', '', true);
        }
    }
    
    // Add family member to edit form
    function addFamilyMember(name = '', gender = '', relation = '', dob = '', isFirst = false) {
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
            document.querySelector(`.remove-family-member[data-id="${memberId}"]`).addEventListener('click', function() {
                this.closest('.family-member-form').remove();
            });
        }
    }
    
    // Event listeners for profile management
    profileBtn.addEventListener('click', function() {
        loadProfileData();
        profileModal.style.display = 'flex';
    });
    
    cancelEditBtn.addEventListener('click', function() {
        editProfileModal.style.display = 'none';
        profileModal.style.display = 'flex';
    });
    
    addFamilyMemberBtn.addEventListener('click', function() {
        addFamilyMember();
    });
    
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const profileData = {
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            dob: document.getElementById('editDob').value,
            gender: document.getElementById('editGender').value,
            address: document.getElementById('editAddress').value,
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
            editProfileModal.style.display = 'none';
            loadProfileData();
            profileModal.style.display = 'flex';
        } else {
            alert('Failed to update profile. Please try again.');
        }
    });
    
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function() {
            document.getElementById('successModal').style.display = 'none';
            loadProfileData();
            profileModal.style.display = 'flex';
        });
    }
    
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal-overlay').style.display = 'none';
        });
    });
    
    document.querySelectorAll('.modal-container').forEach(modal => {
        modal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    updateUI();
    
    // Donation and OTP Handling
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

    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedAmount = parseInt(this.textContent.replace(/[^0-9]/g, ''));
            amountInput.value = selectedAmount;
        });
    });
    
    customAmountInputs.forEach(input => {
        input.addEventListener('input', function() {
            amountButtons.forEach(btn => btn.classList.remove('active'));
            selectedAmount = parseInt(this.value) || 0;
            amountInput.value = selectedAmount;
        });
    });
    
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
    
    function openOtpVerification() {
        otpModal.style.display = 'flex';
        otpFieldGroup.style.display = 'none';
        verifyOtpBtn.style.display = 'none';
        sendOtpBtn.style.display = 'block';
        phoneNumberInput.value = '';
        otpInput.value = '';
    }
    
    function openDonationForm(verifiedPhone, user = null) {
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
            document.getElementById('fullName').value = user.name || '';
            document.getElementById('email').value = user.email || '';
            phoneInput.value = user.phone || verifiedPhone || '';
        } else if (verifiedPhone) {
            phoneInput.value = verifiedPhone;
        }
        
        // Allow amount editing
        amountInput.readOnly = false;
        amountInput.addEventListener('input', function() {
            selectedAmount = parseInt(this.value) || 0;
        });
        
        otpModal.style.display = 'none';
        donationModal.style.display = 'flex';
    }
    
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
    
    sendOtpBtn.addEventListener('click', async function() {
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
                otpFieldGroup.style.display = 'block';
                verifyOtpBtn.style.display = 'block';
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
    
    verifyOtpBtn.addEventListener('click', async function() {
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
    
    resendOtpBtn.addEventListener('click', async function() {
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
    
    function startOtpTimer(seconds) {
        otpCountdown = seconds;
        updateOtpTimerDisplay();
        
        otpTimerInterval = setInterval(() => {
            otpCountdown--;
            updateOtpTimerDisplay();
            
            if (otpCountdown <= 0) {
                clearInterval(otpTimerInterval);
                resendOtpBtn.disabled = false;
            }
        }, 1000);
    }
    
    function updateOtpTimerDisplay() {
        const minutes = Math.floor(otpCountdown / 60);
        const seconds = otpCountdown % 60;
        otpTimer.textContent = `OTP expires in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    function resetOtpVerification() {
        clearInterval(otpTimerInterval);
        otpCountdown = 0;
        otpInput.value = '';
        otpFieldGroup.style.display = 'none';
        verifyOtpBtn.style.display = 'none';
        sendOtpBtn.style.display = 'block';
        resendOtpBtn.disabled = true;
    }
    
    rzpButton.addEventListener('click', async function() {
        const name = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const amount = document.getElementById('amount').value;
        const donationType = document.getElementById('donationType').value;
        const taxExemption = document.getElementById('taxExemption').checked;
        
        if (!name || !email || !phone || !amount) {
            alert('Please fill all required fields');
            return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        const options = {
            "key": "rzp_test_qKbcwAmDW48jVS",
            "amount": amount * 100,
            "currency": "INR",
            "name": "Swagatham Foundation",
            "description": donationType === 'monthly' ? "Monthly Donation" : "One-Time Donation",
            "image": "images/logo.png",
            "handler": async function(response) {
                try {
                    const donationData = {
                        amount: amount,
                        paymentId: response.razorpay_payment_id,
                        donationType: donationType,
                        taxExemption: taxExemption
                    };
                    
                    const success = await sessionManager.recordDonation(donationData);
                    
                    if (success) {
                        successMessage.innerHTML = `
                            Thank you for your donation of ₹${amount}!<br><br>
                            <strong>Payment ID:</strong> ${response.razorpay_payment_id}
                        `;
                        
                        donationModal.style.display = 'none';
                        successModal.style.display = 'flex';
                    } else {
                        alert('Payment successful but there was an error saving your donation details.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Payment successful but there was an error saving your donation details.');
                }
            },
            "prefill": {
                "name": name,
                "email": email,
                "contact": phone
            },
            "notes": {
                "donation_type": donationType,
                "tax_exemption": taxExemption ? "Yes" : "No"
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
    });
    
    window.closeSuccessModal = function() {
        successModal.style.display = 'none';
    };
});

