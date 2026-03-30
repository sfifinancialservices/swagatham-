import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import twilio from 'twilio';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { sendDonationReceiptEmail } from './receiptEmail.js';

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
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
  return jwt.sign({ phone, typ: 'user' }, JWT_SECRET, { expiresIn: '24h' });
}

function generateAdminToken(phone) {
  return jwt.sign({ phone, typ: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.typ === 'admin') {
      return res.status(403).json({ success: false, error: 'Use a user session token' });
    }
    if (!decoded.phone) {
      return res.status(401).json({ success: false, error: 'Token is invalid' });
    }
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
    if (decoded.typ !== 'admin' || !decoded.phone) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    req.adminPhone = decoded.phone;
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

// Send OTP — always logs OTP to server console (dev/testing). Optional Twilio SMS when configured.
app.post('/api/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian phone number (10 digits starting with 6-9)',
      });
    }

    const otp = generateOTP();
    otpStore.set(phoneNumber, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log(
      `\n┌─────────────────────────────────────────────\n│ [OTP] ${phoneNumber}  →  ${otp}  (valid 5 min)\n└─────────────────────────────────────────────\n`
    );

    let smsSent = false;
    const client = getTwilio();
    const fromNum = process.env.TWILIO_PHONE_NUMBER;
    if (client && fromNum) {
      try {
        await client.messages.create({
          body: `Your OTP for Swagatham Foundation is: ${otp}`,
          from: fromNum,
          to: `+91${phoneNumber}`,
        });
        smsSent = true;
      } catch (twilioErr) {
        console.warn('[OTP] Twilio SMS failed (SMS optional):', twilioErr.message || twilioErr);
      }
    }

    const out = {
      success: true,
      message: smsSent
        ? 'OTP sent via SMS'
        : 'OTP generated — check the server terminal for the code (SMS not sent)',
    };
    if (!isProd) out.devOtpHint = otp;
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
      const [adminRows] = await conn.execute(
        'SELECT id FROM admin_phones WHERE phone = ?',
        [phoneNumber]
      );

      if (adminRows.length > 0) {
        const adminToken = generateAdminToken(phoneNumber);
        return res.json({
          success: true,
          message: 'Admin OTP verified',
          token: adminToken,
          userType: 'admin',
          profileComplete: true,
        });
      }

      const [users] = await conn.execute(
        'SELECT id, COALESCE(otp_verified, FALSE) as otp_verified, COALESCE(profile_complete, FALSE) as profile_complete FROM users WHERE phone = ?',
        [phoneNumber]
      );

      let profileComplete = false;
      let otpVerified = false;

      if (users.length === 0) {
        await conn.execute('INSERT INTO users (phone, otp_verified) VALUES (?, TRUE)', [phoneNumber]);
        otpVerified = true;
      } else {
        profileComplete = !!users[0].profile_complete;
        otpVerified = !!users[0].otp_verified;
        if (!otpVerified) {
          await conn.execute('UPDATE users SET otp_verified = TRUE WHERE phone = ?', [phoneNumber]);
        }
      }

      const token = generateToken(phoneNumber);
      res.json({
        success: true,
        message: 'OTP verified successfully',
        token,
        userType: 'user',
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
        'SELECT amount, razorpay_payment_id, status, payment_date, tax_exemption, invoice_number FROM payments WHERE user_id = ? ORDER BY payment_date DESC',
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

// Record payment endpoint — syncs donor name/email to profile, assigns invoice no., emails receipt when SMTP is set
app.post('/api/payment', authenticateToken, async (req, res) => {
  try {
    const phone = req.user;
    const { amount, razorpay_payment_id, tax_exemption = false, name, email } = req.body;

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

    const donorName = typeof name === 'string' ? name.trim() : '';
    const donorEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
    }

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [user] = await conn.execute('SELECT id, name, email FROM users WHERE phone = ?', [phone]);

      if (user.length === 0) {
        await conn.rollback();
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const userId = user[0].id;

      const [existing] = await conn.execute(
        'SELECT id, invoice_number FROM payments WHERE razorpay_payment_id = ? LIMIT 1',
        [rid]
      );
      if (existing.length > 0) {
        await conn.commit();
        return res.json({
          success: true,
          message: 'Payment already recorded',
          paymentId: rid,
          duplicate: true,
          invoiceNo: existing[0].invoice_number || null,
        });
      }

      const [insertResult] = await conn.execute(
        `INSERT INTO payments
         (user_id, amount, razorpay_payment_id, status, tax_exemption, currency)
         VALUES (?, ?, ?, 'success', ?, 'INR')`,
        [userId, amt, rid, Boolean(tax_exemption)]
      );

      const paymentRowId = insertResult.insertId;
      const year = new Date().getFullYear();
      const invoiceNo = `SWG-${year}-${String(paymentRowId).padStart(6, '0')}`;

      try {
        await conn.execute('UPDATE payments SET invoice_number = ? WHERE id = ?', [invoiceNo, paymentRowId]);
      } catch (invErr) {
        if (invErr.code === 'ER_BAD_FIELD_ERROR') {
          console.warn(
            '[Payment] invoice_number column missing — run database/migrations/003_payment_invoice_number.sql'
          );
        } else {
          throw invErr;
        }
      }

      await conn.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [
        donorName || user[0].name || null,
        donorEmail || user[0].email || null,
        userId,
      ]);

      try {
        await conn.execute(
          `INSERT INTO audit_log
         (user_id, action, description)
         VALUES (?, 'payment', ?)`,
          [userId, `Payment of ₹${amt} recorded with ID: ${rid} (${invoiceNo})`]
        );
      } catch (auditErr) {
        console.warn('audit_log insert skipped:', auditErr.message);
      }

      await conn.commit();

      let receiptEmailSent = false;
      const receiptTo = donorEmail || user[0].email;
      if (receiptTo && invoiceNo) {
        const mailResult = await sendDonationReceiptEmail({
          to: receiptTo,
          donorName: donorName || user[0].name || 'Donor',
          amount: amt,
          currency: 'INR',
          razorpayPaymentId: rid,
          invoiceNo,
          taxExemption: Boolean(tax_exemption),
          paymentDate: new Date(),
        });
        receiptEmailSent = mailResult.sent;
      } else if (!receiptTo) {
        console.log('[Receipt] No email on file — skipped (add donor email in payment form).');
      }

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        paymentId: rid,
        invoiceNo,
        receiptEmailSent,
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

// Legacy password login — disabled; admins use the same OTP flow as users (admin_phones).
app.post('/api/admin/login', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Use phone OTP. Open /admin and sign in with an admin-registered number.',
  });
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

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const conn = await db.getConnection();
    try {
      const [rows] = await conn.execute(`
        SELECT u.id, u.phone, u.name, u.email, u.dob, u.gender, u.address,
          COALESCE(u.profile_complete, 0) AS profile_complete,
          u.created_at,
          (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'success') AS payment_count,
          (SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.user_id = u.id AND p.status = 'success') AS total_paid
        FROM users u
        ORDER BY u.created_at DESC
      `);
      const complete = rows.filter((r) => r.profile_complete);
      const incomplete = rows.filter((r) => !r.profile_complete);
      res.json({ success: true, users: rows, complete, incomplete });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

app.get('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid user id' });
  }
  try {
    const conn = await db.getConnection();
    try {
      const [userData] = await conn.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (userData.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      const user = userData[0];
      const [family] = await conn.execute(
        'SELECT name, relation, gender, dob FROM family_members WHERE user_id = ?',
        [id]
      );
      const [payments] = await conn.execute(
        'SELECT amount, razorpay_payment_id, status, payment_date, tax_exemption, invoice_number FROM payments WHERE user_id = ? ORDER BY payment_date DESC',
        [id]
      );
      const [kyc] = await conn.execute(
        'SELECT pan_number, aadhaar_number, kyc_doc_path FROM kyc_documents WHERE user_id = ?',
        [id]
      );
      res.json({
        success: true,
        user: {
          ...user,
          profile_complete: Boolean(user.profile_complete),
          familyMembers: family,
          payments,
          kycDocuments: kyc.length > 0 ? kyc[0] : null,
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to load user' });
  }
});

app.post('/api/admin/notifications', authenticateAdmin, async (req, res) => {
  try {
    const { userId, message } = req.body;
    const uid = parseInt(userId, 10);
    if (!Number.isFinite(uid) || uid <= 0 || !message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'userId and message are required' });
    }
    const conn = await db.getConnection();
    try {
      const [u] = await conn.execute('SELECT id FROM users WHERE id = ?', [uid]);
      if (u.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      const [r] = await conn.execute(
        'INSERT INTO user_notifications (user_id, message) VALUES (?, ?)',
        [uid, String(message).trim()]
      );
      res.json({ success: true, id: r.insertId, message: 'Notification sent' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Admin notification error:', err);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

app.get('/api/user/notifications', authenticateToken, async (req, res) => {
  try {
    const phone = req.user;
    const conn = await db.getConnection();
    try {
      const [userRows] = await conn.execute('SELECT id FROM users WHERE phone = ?', [phone]);
      if (userRows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      const userId = userRows[0].id;
      const [rows] = await conn.execute(
        'SELECT id, message, read_at, created_at FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      res.json({ success: true, notifications: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('User notifications error:', err);
    res.status(500).json({ success: false, error: 'Failed to load notifications' });
  }
});

app.put('/api/user/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const phone = req.user;
    const nid = parseInt(req.params.id, 10);
    if (!Number.isFinite(nid) || nid <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
    const conn = await db.getConnection();
    try {
      const [userRows] = await conn.execute('SELECT id FROM users WHERE phone = ?', [phone]);
      if (userRows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      const userId = userRows[0].id;
      const [r] = await conn.execute(
        'UPDATE user_notifications SET read_at = NOW() WHERE id = ? AND user_id = ?',
        [nid, userId]
      );
      res.json({ success: true, updated: r.affectedRows > 0 });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ success: false, error: 'Failed to update' });
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