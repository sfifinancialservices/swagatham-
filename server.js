require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

// Initialize Express
const app = express();

// Middleware
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000', 'https://your-production-domain.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (prevent OTP spam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: 'Too many OTP requests from this IP, please try again later'
});
app.use('/api/send-otp', limiter);

// Twilio Client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OTP Storage (in-memory, use Redis in production)
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP Endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid Indian phone number (10 digits starting with 6-9)'
      });
    }

    // Generate and store OTP (expires in 5 minutes)
    const otp = generateOTP();
    otpStore.set(phoneNumber, {
      otp,
      expiresAt: Date.now() + 300000 // 5 minutes
    });

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP for Swagatham Foundation is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phoneNumber}`
    });

    res.json({ 
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP. Please try again.'
    });
  }
});

// Verify OTP Endpoint
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;

  // Check if OTP exists
  const storedOtp = otpStore.get(phoneNumber);
  if (!storedOtp) {
    return res.status(400).json({
      success: false,
      error: 'OTP expired or not requested'
    });
  }

  // Check expiration
  if (Date.now() > storedOtp.expiresAt) {
    otpStore.delete(phoneNumber);
    return res.status(400).json({
      success: false,
      error: 'OTP expired'
    });
  }

  // Verify OTP
  if (storedOtp.otp === otp) {
    otpStore.delete(phoneNumber);
    return res.json({
      success: true,
      message: 'OTP verified successfully',
      phoneNumber: phoneNumber
    });
  }

  res.status(400).json({
    success: false,
    error: 'Invalid OTP'
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
});