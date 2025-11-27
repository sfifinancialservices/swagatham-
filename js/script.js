document.addEventListener('DOMContentLoaded', function() {
    // Initialize session manager
    const sessionManager = new SessionManager();
    
    // Profile functionality elements
    const profileBtn = document.getElementById('profileBtn');
    const contactBtn = document.querySelector('.contact-button');
    const profileModal = document.getElementById('profileModal');
    const editProfileModal = document.getElementById('editProfileModal');
    const profileContent = document.getElementById('profileContent');
    const profileActions = document.getElementById('profileActions');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const profileForm = document.getElementById('profileForm');
    const addFamilyMemberBtn = document.getElementById('addFamilyMember');
    const familyMembersContainer = document.getElementById('familyMembersContainer');
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    
    // Update UI based on login status
    function updateUI() {
        const isLoggedIn = sessionManager.isLoggedIn();
        const header = document.querySelector('.main-header');
        
        if (isLoggedIn) {
            if (header) header.classList.add('logged-in');
            if (profileBtn) {
                profileBtn.style.display = 'flex';
                profileBtn.style.visibility = 'visible';
            }
            if (contactBtn) {
                contactBtn.style.display = 'none';
                contactBtn.style.visibility = 'hidden';
            }
            
            // For mobile
            if (profileBtn) profileBtn.classList.add('mobile-visible');
        } else {
            if (header) header.classList.remove('logged-in');
            if (profileBtn) {
                profileBtn.style.display = 'none';
                profileBtn.style.visibility = 'hidden';
            }
            if (contactBtn) {
                contactBtn.style.display = 'block';
                contactBtn.style.visibility = 'visible';
            }
            
            // For mobile
            if (profileBtn) profileBtn.classList.remove('mobile-visible');
        }
        
        // Force reflow to prevent rendering issues
        if (header) void header.offsetWidth;
    }

    // Fix header buttons positioning
    function fixHeaderButtons() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        if (profileBtn && contactBtn) {
            // Ensure only one button is visible at a time
            if (sessionManager.isLoggedIn()) {
                profileBtn.style.display = 'flex';
                contactBtn.style.display = 'none';
            } else {
                profileBtn.style.display = 'none';
                contactBtn.style.display = 'block';
            }
            
            // Add small delay to ensure proper rendering
            setTimeout(() => {
                profileBtn.style.visibility = profileBtn.style.display === 'flex' ? 'visible' : 'hidden';
                contactBtn.style.visibility = contactBtn.style.display === 'block' ? 'visible' : 'hidden';
            }, 50);
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
                        <input type="file" id="kycDocument" name="kycDocument" accept=".pdf,.jpg,.jpeg,.png">
                    </div>
                    <button type="submit" class="btn-primary">Submit KYC</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(kycModal);
        kycModal.style.display = 'flex';
        
        // Close modal handler
        kycModal.querySelector('.close-modal').addEventListener('click', () => {
            kycModal.style.display = 'none';
            setTimeout(() => kycModal.remove(), 300);
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
                
                try {
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
                    }
                } catch (error) {
                    alert('Error submitting KYC: ' + error.message);
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
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            const mainNav = document.querySelector('.main-nav');
            if (mainNav) mainNav.classList.toggle('active');
        });
    }

    // Hero image rotation for all pages
    function initHeroRotation(heroClass, bgClass) {
        const hero = document.querySelector(`.${heroClass}`);
        if (!hero) return;

        const backgrounds = hero.querySelectorAll(`.${bgClass}`);
        if (backgrounds.length === 0) return;

        let current = 0;
        
        // Set first image as active
        backgrounds[current].classList.add('active');
        
        // Rotate images every 5 seconds
        setInterval(() => {
            backgrounds[current].classList.remove('active');
            current = (current + 1) % backgrounds.length;
            backgrounds[current].classList.add('active');
        }, 6000);
    }

    // Initialize hero rotation for all pages
    initHeroRotation('hero', 'hero-bg');
    initHeroRotation('about-hero', 'about-hero-bg');
    initHeroRotation('facilities-hero', 'facilities-hero-bg');
    initHeroRotation('gallery-hero', 'gallery-hero-bg');
    initHeroRotation('donate-hero', 'donate-hero-bg');
    initHeroRotation('contact-hero', 'contact-hero-bg');

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Sticky header
    const header = document.querySelector('.main-header');
    if (header) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll <= 0) {
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                return;
            }
            
            if (currentScroll > lastScroll) {
                // Scrolling down
                header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                header.style.transform = 'translateY(0)';
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            }
            
            lastScroll = currentScroll;
        });
    }
    
    // Animated counter for stats
    const statNumbers = document.querySelectorAll('.stat-number');
    
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // Intersection Observer for stats animation
    if (statNumbers.length > 0) {
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        statNumbers.forEach(stat => {
                            const target = parseInt(stat.getAttribute('data-count'));
                            animateValue(stat, 0, target, 2000);
                        });
                        observer.disconnect();
                    }
                });
            }, {threshold: 0.5});
            
            observer.observe(statsContainer);
        }
    }
    
    // Gallery filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterButtons.length > 0 && galleryItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                
                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.classList.contains(filterValue)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // Donation amount buttons
    const amountButtons = document.querySelectorAll('.amount-btn');
    
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons in this group
            const parent = this.parentElement;
            if (parent) {
                parent.querySelectorAll('.amount-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
            }
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
    
    // Form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const name = this.elements['name']?.value.trim() || '';
            const email = this.elements['email']?.value.trim() || '';
            const message = this.elements['message']?.value.trim() || '';
            
            if (!name || !email || !message) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Here you would typically send the form data to a server
            // For this example, we'll just show a success message
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }
    
    // Set active navigation item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-list li a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Initialize UI
    updateUI();
    fixHeaderButtons();
});