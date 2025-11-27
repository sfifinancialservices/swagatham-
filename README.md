# 🏡 Swagatham Foundation – Senior Care Website

A comprehensive **React-based web application** built for **Swagatham Foundation**, a charitable trust providing care and shelter for senior citizens in Chennai, India.

---

## 🌟 Features

### 🏠 Core Functionality
- **Home Page** – Hero banner, statistics, mission highlights  
- **About Us** – History, trustees, and achievements  
- **Facilities** – Amenities and admission criteria  
- **Photo Gallery** – Filterable gallery showcasing life at the foundation  
- **Contact Information** – Location, phone numbers, and visiting hours  

---

### 💰 Donation System
- **One-time & Monthly Donations**  
- **Secure Payments via Razorpay**  
- **80G Tax Exemption Support** – Auto-generated receipts  
- **Bank Transfer Details** included for alternate giving  

---

### 👤 User Management
- **OTP Authentication using Phone Number**  
- **User Profiles** – Personal & family details  
- **KYC Uploads** – PAN & Aadhaar for tax benefits  
- **Donation History** – Track contributions  

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v14 or higher)  
- npm or yarn  
- Razorpay Account  

---

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/swagatham-foundation.git
cd swagatham-foundation
2. Install Dependencies
bash
Copy code
npm install
3. Environment Setup
Create a .env file in the project root:

env
Copy code
REACT_APP_API_URL=http://localhost:4000
REACT_APP_RAZORPAY_KEY=your_razorpay_test_key
REACT_APP_ENVIRONMENT=development
4. Run Development Server
bash
Copy code
npm start
The application will open at: http://localhost:3000

🏗️ Project Structure
text
Copy code
src/
├── components/
│   ├── Modal.js
│   ├── Header.js
│   ├── Footer.js
│   ├── ProfileModal.js
│   └── EditProfileModal.js
├── pages/
│   ├── Home.js
│   ├── About.js
│   ├── Facilities.js
│   ├── Gallery.js
│   ├── Donate.js
│   └── Contact.js
├── styles/
│   ├── App.css
│   ├── HeaderFooter.css
│   ├── Home.css
│   └── ...
└── services/
    └── sessionManager.js
🎨 Design System
Color Palette
Primary Blue: #00BFFF

Secondary Blue: #1E3A8A

Accent: #FFA07A

Background: #F8F9FA

Typography
Modern system fonts

Responsive text scaling

Accessibility-focused contrast

🔧 Backend API (Required)
The backend must run at http://localhost:4000 with APIs:

Endpoint	Purpose
/api/send-otp	Send OTP to phone
/api/verify-otp	Verify OTP
/api/user	Fetch/update profile
/api/payment	Record payment
/api/kyc	Upload PAN/Aadhaar

📱 Responsive Design
Mobile-first layouts

Flexible grids

Touch-friendly UI

Optimized images

🛠️ Available Scripts
bash
Copy code
npm start          # Run development server
npm run build      # Production build
npm test           # Run tests
npm run eject      # Eject CRA config
🔒 Security Features
OTP-based authentication

Razorpay secure payment gateway

Encrypted local storage

Input validation & sanitization

🌐 Browser Support
Chrome (latest)

Firefox (latest)

Safari (latest)

Edge (latest)

📞 Contact & Support
Swagatham Foundation
📍 City Office:
6, Kamadhenu 3rd St, Mogappair East, Chennai – 600037

📍 Facility:
Amudurmedu Village, Poonamallee – Pattabiram Road, Chennai – 600072

📞 +91 96771 34399
📧 swagathamfoundation.oldagehome@gmail.com

🤝 Contributing
Fork the project

Create a feature branch:

bash
Copy code
git checkout -b feature/YourFeature
Commit your changes:

bash
Copy code
git commit -m "Add feature"
Push the branch:

bash
Copy code
git push origin feature/YourFeature
Open a Pull Request

📄 License
This project is licensed under the MIT License.
