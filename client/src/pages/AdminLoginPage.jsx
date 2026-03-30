import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/sessionApi';
import { useAdmin } from '../context/AdminContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminToken, adminLogin, isAdminLoggedIn } = useAdmin();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const otpIntervalRef = useRef(null);

  useEffect(() => {
    if (isAdminLoggedIn) navigate('/admin/dashboard', { replace: true });
  }, [isAdminLoggedIn, navigate]);

  const clearTimer = () => {
    if (otpIntervalRef.current) {
      clearInterval(otpIntervalRef.current);
      otpIntervalRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
      alert('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setSendBusy(true);
    try {
      await api.sendOTP(phoneNumber.trim());
      setOtpVisible(true);
    } catch (e) {
      alert(e.message || 'Failed to send OTP');
    } finally {
      setSendBusy(false);
    }
  };

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      alert('Enter the 6-digit OTP from the server terminal');
      return;
    }
    setVerifyBusy(true);
    try {
      const result = await api.verifyOTP(phoneNumber.trim(), otp.trim());
      if (!result.success) {
        alert(result.error || 'Verification failed');
        return;
      }
      if (result.userType !== 'admin') {
        alert('This number is not registered as an admin. Use the Donate page to sign in as a donor.');
        return;
      }
      adminLogin(result.token);
      navigate('/admin/dashboard', { replace: true });
    } catch (e) {
      alert(e.message || 'Verification failed');
    } finally {
      setVerifyBusy(false);
    }
  };

  if (adminToken) return null;

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <img src="/logo-mark.svg" alt="" className="admin-login-logo" width={72} height={72} />
        <h1>Admin sign-in</h1>
        <p className="admin-login-hint">
          Use an admin phone number. OTP is printed in the <strong>server terminal</strong> (no SMS required for testing).
        </p>
        <label htmlFor="adminPhone">Phone number</label>
        <input
          id="adminPhone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10-digit mobile"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
        />
        {!otpVisible ? (
          <button type="button" className="btn-primary" disabled={sendBusy} onClick={handleSendOtp}>
            {sendBusy ? 'Sending…' : 'Send OTP'}
          </button>
        ) : (
          <>
            <label htmlFor="adminOtp">OTP</label>
            <input
              id="adminOtp"
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button type="button" className="btn-primary" disabled={verifyBusy} onClick={handleVerify}>
              {verifyBusy ? 'Verifying…' : 'Verify & continue'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
