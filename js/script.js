document.addEventListener('DOMContentLoaded', function() {
    // Initialize session manager
    const sessionManager = new SessionManager();
    
    // Profile functionality elements
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const editProfileModal = document.getElementById('editProfileModal');
    const profileContent = document.getElementById('profileContent');
    const profileActions = document.getElementById('profileActions');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const profileForm = document.getElementById('profileForm');
    const addFamilyMemberBtn = document.getElementById('addFamilyMember');
    const familyMembersContainer = document.getElementById('familyMembersContainer');
    
    // Update UI based on login status
    function updateUI() {
        const isLoggedIn = sessionManager.isLoggedIn();
        const header = document.querySelector('.main-header');
        
        if (isLoggedIn) {
            header.classList.add('logged-in');
            if (profileBtn) profileBtn.style.display = 'flex';
            if (document.getElementById('contactBtn')) document.getElementById('contactBtn').style.display = 'none';
            
            // For mobile
            if (profileBtn) profileBtn.classList.add('mobile-visible');
        } else {
            header.classList.remove('logged-in');
            if (profileBtn) profileBtn.style.display = 'none';
            if (document.getElementById('contactBtn')) document.getElementById('contactBtn').style.display = 'block';
            
            // For mobile
            if (profileBtn) profileBtn.classList.remove('mobile-visible');
        }
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
                            ${donation.taxExemption ? '(Tax Exempt)' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (profileContent) profileContent.innerHTML = html;
        
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
    
    // Load profile data into edit form
    function loadEditProfileForm(user) {
        if (!user) return;
        
        document.getElementById('editName').value = user.name || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editDob').value = user.dob || '';
        document.getElementById('editGender').value = user.gender || '';
        document.getElementById('editAddress').value = user.address || '';
        
        if (familyMembersContainer) familyMembersContainer.innerHTML = '';
        
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
                    this.closest('.family-member-form').remove();
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
                if (editProfileModal) editProfileModal.style.display = 'none';
                loadProfileData();
                if (profileModal) profileModal.style.display = 'flex';
            } else {
                alert('Failed to update profile. Please try again.');
            }
        });
    }
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal-overlay').style.display = 'none';
        });
    });
    
    // Prevent modal from closing when clicking inside
    document.querySelectorAll('.modal-container').forEach(modal => {
        modal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Initialize UI
    updateUI();

    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.style.display = mainNav.style.display === 'block' ? 'none' : 'block';
            
            if (mainNav.style.display === 'block') {
                mainNav.style.animation = 'slideDown 0.5s ease forwards';
            } else {
                mainNav.style.animation = 'slideUp 0.3s ease forwards';
            }
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
        }, 4000);
    }

    // Initialize hero rotation for all pages
    initHeroRotation('hero', 'hero-bg');
    initHeroRotation('about-hero', 'about-hero-bg');
    initHeroRotation('facilities-hero', 'facilities-hero-bg');
    initHeroRotation('gallery-hero', 'gallery-hero-bg');
    initHeroRotation('donate-hero', 'donate-hero-bg');
    initHeroRotation('contact-hero', 'contact-hero-bg');

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        
        @media (max-width: 768px) {
            .main-nav {
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background-color: white;
                box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                display: none;
            }
            
            .nav-list {
                flex-direction: column;
                gap: 15px !important;
            }
        }
    `;
    document.head.appendChild(style);
    
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
        
        observer.observe(document.querySelector('.stats-container'));
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
            this.parentElement.querySelectorAll('.amount-btn').forEach(btn => {
                btn.classList.remove('active');
            });
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
            const name = this.elements['name'].value.trim();
            const email = this.elements['email'].value.trim();
            const message = this.elements['message'].value.trim();
            
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
});

