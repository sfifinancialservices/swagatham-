import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import twilio from 'twilio';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

const JWT_SECRET =
  process.env.SECRET_KEY || (!isProd ? 'swagatham-dev-secret-change-in-production' : null);
if (!JWT_SECRET) {
  console.error('FATAL: Set SECRET_KEY in .env for production.');
  process.exit(1);
}
if (!isProd && !process.env.SECRET_KEY) {
  console.warn('⚠️  Using default JWT secret (dev only). Set SECRET_KEY in .env for production.');
}

const STATIC_CORS_ORIGINS = [
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (STATIC_CORS_ORIGINS.includes(origin)) return cb(null, true);
    if (process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).includes(origin)) {
      return cb(null, true);
    }
    if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    if (!isProd && /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    console.warn('CORS blocked origin:', origin);
    cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (prevent OTP spam)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: 'Too many OTP requests from this IP, please try again later'
});

// MySQL pool
let db;
try {
  db = await mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'swagatham_foundation',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  const testConn = await db.getConnection();
  testConn.release();
  console.log('✅ MySQL pool ready:', process.env.MYSQL_DB || 'swagatham_foundation');
} catch (err) {
  console.error('❌ MySQL connection failed:', err.message);
  console.error('   Check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB in .env');
  process.exit(1);
}

let twilioClient = null;
function getTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!twilioClient) twilioClient = twilio(sid, token);
  return twilioClient;
}

// OTP store (in-memory, use Redis in production)
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(phone) {
  return jwt.sign({ phone }, JWT_SECRET, { expiresIn: '24h' });
}

function generateAdminToken(adminId, username) {
  return jwt.sign({ adminId, username }, JWT_SECRET, { expiresIn: '1h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.phone;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token is invalid' });
  }
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Admin token is missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Admin token is invalid' });
  }
}

app.get('/health', async (req, res) => {
  try {
    const c = await db.getConnection();
    await c.ping();
    c.release();
    res.status(200).json({ status: 'OK', database: true, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({
      status: 'error',
      database: false,
      message: e.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Send OTP endpoint
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Indian phone number (10 digits starting with 6-9)' 
      });
    }
    
    const otp = generateOTP();
    otpStore.set(phoneNumber, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const client = getTwilio();
    const fromNum = process.env.TWILIO_PHONE_NUMBER;
    let smsSent = false;

    if (client && fromNum) {
      try {
        await client.messages.create({
          body: `Your OTP for Swagatham Foundation is: ${otp}`,
          from: fromNum,
          to: `+91${phoneNumber}`,
        });
        smsSent = true;
      } catch (twilioErr) {
        console.warn('[OTP] Twilio SMS failed:', twilioErr.message || twilioErr);
        console.warn(
          `[OTP] Use this OTP for +91${phoneNumber}: ${otp} (fix TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER if you need real SMS)`
        );
      }
    } else {
      console.warn(
        `[OTP] Twilio not configured — OTP for ${phoneNumber}: ${otp} (set TWILIO_* in .env to send SMS)`
      );
    }

    const out = {
      success: true,
      message: smsSent
        ? 'OTP sent successfully'
        : 'OTP generated (check server logs if SMS was not delivered)',
    };
    if (!isProd && !smsSent) out.devOtpHint = otp;
    res.json(out);
  } catch (err) {
    console.error('OTP sending failed:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    // Validate input
    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and OTP are required' 
      });
    }

    const record = otpStore.get(phoneNumber);
    if (!record || Date.now() > record.expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ 
        success: false, 
        error: 'OTP expired or not requested' 
      });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP' 
      });
    }

    otpStore.delete(phoneNumber);
    const conn = await db.getConnection();
    
    try {
      const [users] = await conn.execute(
        'SELECT id, COALESCE(otp_verified, FALSE) as otp_verified, COALESCE(profile_complete, FALSE) as profile_complete FROM users WHERE phone = ?', 
        [phoneNumber]
      );
      
      let profileComplete = false;
      let otpVerified = false;
      
      if (users.length === 0) {
        await conn.execute(
          'INSERT INTO users (phone, otp_verified) VALUES (?, TRUE)', 
          [phoneNumber]
        );
        otpVerified = true;
      } else {
        profileComplete = !!users[0].profile_complete;
        otpVerified = !!users[0].otp_verified;
        if (!otpVerified) {
          await conn.execute(
            'UPDATE users SET otp_verified = TRUE WHERE phone = ?', 
            [phoneNumber]
          );
        }
      }
      
      const token = generateToken(phoneNumber);
      res.json({
        success: true,
        message: 'OTP verified successfully',
        token,
        profileComplete: Boolean(profileComplete),
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get user profile endpoint
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const phone = req.user;
    const conn = await db.getConnection();
    
    try {
      const [userData] = await conn.execute(
        'SELECT * FROM users WHERE phone = ?', 
        [phone]
      );
      
      if (userData.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      const user = userData[0];
      const [family] = await conn.execute(
        'SELECT name, relation, gender, dob FROM family_members WHERE user_id = ?', 
        [user.id]
      );
      
      const [payments] = await conn.execute(
        'SELECT amount, razorpay_payment_id, status, payment_date, tax_exemption FROM payments WHERE user_id = ? ORDER BY payment_date DESC', 
        [user.id]
      );
      
      const [kyc] = await conn.execute(
        'SELECT pan_number, aadhaar_number, kyc_doc_path FROM kyc_documents WHERE user_id = ?', 
        [user.id]
      );

      res.json({
        success: true,
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          dob: user.dob,
          gender: user.gender,
          address: user.address,
          familyMembers: family,
          payments,
          kycDocuments: kyc.length > 0 ? kyc[0] : null,
          profileComplete: Boolean(user.profile_complete),
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Profile retrieval error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error retrieving profile',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update profile endpoint
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const phone = req.user;
    const data = req.body;
    const requiredFields = ['name', 'email', 'dob', 'gender', 'address', 'familyMembers'];
    
    if (requiredFields.some(field => !(field in data))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    if (!Array.isArray(data.familyMembers) || data.familyMembers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one family member is required' 
      });
    }

    const conn = await db.getConnection();
    
    try {
      await conn.beginTransaction();
      
      const [userRows] = await conn.execute(
        'SELECT id FROM users WHERE phone = ?', 
        [phone]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      const userId = userRows[0].id;
      await conn.execute(
        'UPDATE users SET name = ?, email = ?, dob = ?, gender = ?, address = ?, profile_complete = TRUE WHERE id = ?', 
        [data.name, data.email, data.dob, data.gender, data.address, userId]
      );
      
      // Update family members
      await conn.execute(
        'DELETE FROM family_members WHERE user_id = ?', 
        [userId]
      );
      
      for (const member of data.familyMembers) {
        await conn.execute(
          'INSERT INTO family_members (user_id, name, relation, gender, dob) VALUES (?, ?, ?, ?, ?)', 
          [userId, member.name, member.relation, member.gender, member.dob]
        );
      }
      
      await conn.commit();
      res.json({ 
        success: true, 
        message: 'Profile updated successfully' 
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error updating profile',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Record payment endpoint
app.post('/api/payment', authenticateToken, async (req, res) => {
  try {
    const phone = req.user;
    const { amount, razorpay_payment_id, tax_exemption = false } = req.body;

    const rid =
      typeof razorpay_payment_id === 'string' ? razorpay_payment_id.trim() : String(razorpay_payment_id || '');
    if (!rid) {
      return res.status(400).json({
        success: false,
        error: 'razorpay_payment_id is required',
      });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount (greater than 0) is required',
      });
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [user] = await conn.execute('SELECT id FROM users WHERE phone = ?', [phone]);

      if (user.length === 0) {
        await conn.rollback();
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const userId = user[0].id;

      const [existing] = await conn.execute(
        'SELECT id FROM payments WHERE razorpay_payment_id = ? LIMIT 1',
        [rid]
      );
      if (existing.length > 0) {
        await conn.commit();
        return res.json({
          success: true,
          message: 'Payment already recorded',
          paymentId: rid,
          duplicate: true,
        });
      }

      await conn.execute(
        `INSERT INTO payments
         (user_id, amount, razorpay_payment_id, status, tax_exemption, currency)
         VALUES (?, ?, ?, 'success', ?, 'INR')`,
        [userId, amt, rid, Boolean(tax_exemption)]
      );

      try {
        await conn.execute(
          `INSERT INTO audit_log
         (user_id, action, description)
         VALUES (?, 'payment', ?)`,
          [userId, `Payment of ₹${amt} recorded with ID: ${rid}`]
        );
      } catch (auditErr) {
        console.warn('audit_log insert skipped:', auditErr.message);
      }

      await conn.commit();
      res.json({
        success: true,
        message: 'Payment recorded successfully',
        paymentId: rid,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Payment recording error:', err);
    res.status(500).json({
      success: false,
      error: 'Database error recording payment',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// KYC submission endpoint
app.post('/api/kyc', authenticateToken, async (req, res) => {
  try {
    const phone = req.user;
    const { pan_number, aadhaar_number, dob, kyc_doc_path } = req.body;

    if (!pan_number || !aadhaar_number || !dob) {
      return res.status(400).json({ 
        success: false, 
        error: 'PAN, Aadhaar numbers and Date of Birth are required' 
      });
    }

    const conn = await db.getConnection();
    
    try {
      // Get user ID
      const [user] = await conn.execute(
        'SELECT id FROM users WHERE phone = ?', 
        [phone]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      // Upsert KYC documents with dob
      await conn.execute(
        `INSERT INTO kyc_documents 
         (user_id, pan_number, aadhaar_number, date_of_birth, kyc_doc_path) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         pan_number = VALUES(pan_number),
         aadhaar_number = VALUES(aadhaar_number),
         date_of_birth = VALUES(date_of_birth),
         kyc_doc_path = VALUES(kyc_doc_path)`,
        [user[0].id, pan_number, aadhaar_number, dob, kyc_doc_path || null]
      );

      res.json({ 
        success: true, 
        message: 'KYC documents saved successfully'
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('KYC submission error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error saving KYC documents',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }

    const conn = await db.getConnection();
    
    try {
      const [admin] = await conn.execute(
        'SELECT id, password_hash FROM admins WHERE username = ?', 
        [username]
      );
      
      if (admin.length === 0) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      // In a real application, use bcrypt to compare hashed passwords
      // This is just a placeholder for demonstration
      if (admin[0].password_hash !== password) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      const token = generateAdminToken(admin[0].id, username);

      res.json({ 
        success: true, 
        message: 'Login successful',
        token
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error during login',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Admin dashboard stats endpoint
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const conn = await db.getConnection();
    
    try {
      const [userCount] = await conn.execute('SELECT COUNT(*) as count FROM users');
      const [paymentStats] = await conn.execute('SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE status = "success"');
      const [recentPayments] = await conn.execute(`
        SELECT p.amount, p.payment_date, u.name, u.phone 
        FROM payments p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.status = 'success' 
        ORDER BY p.payment_date DESC 
        LIMIT 10
      `);

      res.json({
        success: true,
        stats: {
          totalUsers: userCount[0].count,
          totalPayments: paymentStats[0].count,
          totalAmount: paymentStats[0].total || 0,
          recentPayments
        }
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error retrieving admin statistics',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(
    `📱 CORS allowlist: ${STATIC_CORS_ORIGINS.join(', ')}${
      process.env.CORS_ORIGINS ? ` + ${process.env.CORS_ORIGINS}` : ''
    } (dynamic origins in dev)`
  );
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});