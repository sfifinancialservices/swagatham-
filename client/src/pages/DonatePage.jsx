import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/sessionApi';
import { useSession } from '../context/SessionContext';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay load failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

function parseAmountFromButton(text) {
  const n = parseInt(String(text).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export default function DonatePage() {
  const { isLoggedIn, login, fetchUserProfile, recordPayment } = useSession();
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_qKbcwAmDW48jVS';
  const razorpayLogo =
    typeof window !== 'undefined' ? `${window.location.origin}/logo-mark.svg` : '/logo-mark.svg';

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [monthlyMode, setMonthlyMode] = useState(false);
  const pendingMonthlyRef = useRef(false);

  const [otpOpen, setOtpOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [otpSeconds, setOtpSeconds] = useState(0);
  const otpIntervalRef = useRef(null);

  const [donationOpen, setDonationOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Make a Donation');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [donationType, setDonationType] = useState('one-time');
  const [amount, setAmount] = useState('');
  const [taxExemption, setTaxExemption] = useState(false);
  const [payBusy, setPayBusy] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successHtml, setSuccessHtml] = useState('');

  const clearOtpTimer = () => {
    if (otpIntervalRef.current) {
      clearInterval(otpIntervalRef.current);
      otpIntervalRef.current = null;
    }
  };

  useEffect(() => () => clearOtpTimer(), []);

  const startOtpTimer = (seconds) => {
    clearOtpTimer();
    setOtpSeconds(seconds);
    otpIntervalRef.current = setInterval(() => {
      setOtpSeconds((s) => {
        if (s <= 1) {
          clearOtpTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const openDonationForm = useCallback(
    async (verifiedPhone, user) => {
      const isMonthly = pendingMonthlyRef.current;
      setModalTitle(isMonthly ? 'Start Monthly Giving' : 'Make a Donation');
      setDonationType(isMonthly ? 'monthly' : 'one-time');

      if (user) {
        setFullName(user.name || localStorage.getItem('userName') || '');
        setEmail(user.email || localStorage.getItem('userEmail') || '');
        setPhone(user.phone || verifiedPhone || '');
      } else if (verifiedPhone) {
        setPhone(verifiedPhone);
      } else if (localStorage.getItem('userPhone')) {
        setPhone(localStorage.getItem('userPhone'));
      }

      setAmount(String(selectedAmount || ''));
      setOtpOpen(false);
      setDonationOpen(true);
    },
    [selectedAmount]
  );

  const handleDonateNow = async (isMonthly) => {
    pendingMonthlyRef.current = isMonthly;
    setMonthlyMode(isMonthly);
    if (selectedAmount <= 0) {
      alert('Please select or enter an amount');
      return;
    }
    if (isLoggedIn) {
      try {
        const user = await fetchUserProfile();
        await openDonationForm(user?.phone, user);
      } catch {
        await openDonationForm(null, null);
      }
    } else {
      setOtpVisible(false);
      setOtp('');
      setPhoneNumber('');
      setOtpOpen(true);
    }
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
      alert('Please enter a valid 10-digit Indian phone number');
      return;
    }
    setSendBusy(true);
    try {
      await api.sendOTP(phoneNumber.trim());
      setOtpVisible(true);
      startOtpTimer(120);
    } catch (e) {
      alert(e.message || 'Failed to send OTP');
    } finally {
      setSendBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      alert('Please enter the 6-digit OTP');
      return;
    }
    setVerifyBusy(true);
    try {
      const result = await api.verifyOTP(phoneNumber.trim(), otp.trim());
      if (result.success) {
        login(result.token, !!result.profileComplete);
        localStorage.setItem('userPhone', phoneNumber.trim());
        const user = await fetchUserProfile();
        await openDonationForm(phoneNumber.trim(), user);
        setOtp('');
        setOtpVisible(false);
        clearOtpTimer();
      } else {
        alert(result.error || 'OTP verification failed');
      }
    } catch (e) {
      alert(e.message || 'OTP verification failed');
    } finally {
      setVerifyBusy(false);
    }
  };

  const handlePay = async () => {
    if (!fullName || !email || !phone || !amount) {
      alert('Please fill all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }
    if (!isLoggedIn) {
      alert('Please login first');
      return;
    }

    setPayBusy(true);
    try {
      await loadRazorpayScript();
      const options = {
        key: razorpayKey,
        amount: amt * 100,
        currency: 'INR',
        name: 'Swagatham Foundation',
        description: donationType === 'monthly' ? 'Monthly Donation' : 'One-Time Donation',
        image: razorpayLogo,
        handler: async (response) => {
          try {
            await recordPayment({
              amount: amt,
              razorpay_payment_id: response.razorpay_payment_id,
              tax_exemption: taxExemption,
            });
            setSuccessHtml(
              `Thank you for your donation of ₹${amt}!<br/><br/><strong>Payment ID:</strong> ${response.razorpay_payment_id}<br/><strong>Status:</strong> Recorded successfully`
            );
          } catch (err) {
            setSuccessHtml(
              `Payment processed but recording failed.<br/><br/><strong>Payment ID:</strong> ${response.razorpay_payment_id}<br/><strong>Error:</strong> ${err.message || 'Please contact support'}`
            );
          }
          setDonationOpen(false);
          setSuccessOpen(true);
          setPayBusy(false);
        },
        prefill: { name: fullName, email, contact: phone },
        theme: { color: '#3399cc' },
      };
      const rzp = new window.Razorpay(options);
      if (typeof rzp.on === 'function') {
        rzp.on('payment.failed', () => setPayBusy(false));
        rzp.on('modal.dismiss', () => setPayBusy(false));
      }
      rzp.open();
    } catch (e) {
      alert(`Payment system error: ${e.message || 'Please try again later'}`);
      setPayBusy(false);
    }
  };

  const otpMin = Math.floor(otpSeconds / 60);
  const otpSec = otpSeconds % 60;

  return (
    <main className="donate-main editorial-page">
      <section className="donate-hero">
        <h1>Support Our Elders</h1>
        <p>Your donation makes a difference in the lives of our senior citizens</p>
      </section>

      <section className="donation-options">
        <div className="container">
          <div className="donation-cards">
            <div className="donation-card">
              <div className="donation-icon">
                <i className="fas fa-hand-holding-heart" />
              </div>
              <h2>One-Time Donation</h2>
              <p>Make a single contribution to support our ongoing operations and care for our residents.</p>
              <AmountPicker
                monthly={false}
                onAmountChange={setSelectedAmount}
                onSelectPreset={() => setMonthlyMode(false)}
              />
              <button type="button" className="btn-primary donate-now-btn" onClick={() => handleDonateNow(false)}>
                Donate Now
              </button>
            </div>

            <div className="donation-card highlighted">
              <div className="donation-icon">
                <i className="fas fa-calendar-check" />
              </div>
              <h2>Monthly Pledge</h2>
              <p>Become a monthly donor and provide consistent support for our elders&apos; needs.</p>
              <AmountPicker
                monthly
                onAmountChange={setSelectedAmount}
                onSelectPreset={() => setMonthlyMode(true)}
              />
              <button type="button" className="btn-primary donate-now-btn" onClick={() => handleDonateNow(true)}>
                Start Monthly Giving
              </button>
            </div>

            <div className="donation-card">
              <div className="donation-icon">
                <i className="fas fa-gift" />
              </div>
              <h2>Other Ways to Give</h2>
              <p>Explore alternative donation methods that suit your preferences.</p>
              <ul className="other-options">
                <li>
                  <i className="fas fa-utensils" /> Sponsor meals for a month
                </li>
                <li>
                  <i className="fas fa-pills" /> Donate medical supplies
                </li>
                <li>
                  <i className="fas fa-bed" /> Sponsor a resident&apos;s care
                </li>
                <li>
                  <i className="fas fa-handshake" /> Corporate partnerships
                </li>
              </ul>
              <button type="button" className="btn-secondary" onClick={() => alert('Please contact us for more information.')}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="donation-impact">
        <div className="container">
          <h2 className="section-title">Your Donation&apos;s Impact</h2>
          <div className="impact-grid">
            <div className="impact-item">
              <div className="impact-icon">
                <i className="fas fa-utensils" />
              </div>
              <h3>₹500</h3>
              <p>Provides one resident&apos;s meals for a week</p>
            </div>
            <div className="impact-item">
              <div className="impact-icon">
                <i className="fas fa-pills" />
              </div>
              <h3>₹1,500</h3>
              <p>Covers monthly medications for one resident</p>
            </div>
            <div className="impact-item">
              <div className="impact-icon">
                <i className="fas fa-home" />
              </div>
              <h3>₹5,000</h3>
              <p>Supports facility maintenance for a month</p>
            </div>
            <div className="impact-item">
              <div className="impact-icon">
                <i className="fas fa-user-md" />
              </div>
              <h3>₹10,000</h3>
              <p>Funds medical checkups for all residents</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bank-details">
        <div className="container">
          <h2 className="section-title">Bank Transfer Details</h2>
          <div className="details-card">
            <div className="bank-info">
              <p>
                <strong>Account Name:</strong> Swagatham Foundation
              </p>
              <p>
                <strong>Account Number:</strong> 113109000167331
              </p>
              <p>
                <strong>Bank Name:</strong> City Union Bank
              </p>
              <p>
                <strong>Branch:</strong> Chennai Annanagar
              </p>
              <p>
                <strong>Account Type:</strong> Current Account
              </p>
              <p>
                <strong>IFSC Code:</strong> CIUB0000113
              </p>
              <p>
                <strong>UPI ID:</strong> swagatham.foundation@upi
              </p>
            </div>
            <div className="tax-benefits">
              <h3>
                <i className="fas fa-file-invoice-dollar" /> Tax Benefits
              </h3>
              <p>
                Donations to Swagatham Foundation are eligible for 50% tax exemption under Section 80G of the
                Income Tax Act.
              </p>
              <p>We will provide a receipt for all donations which can be used for tax exemption purposes.</p>
            </div>
          </div>
        </div>
      </section>

      {otpOpen && (
        <div
          className="modal-overlay split-auth-overlay"
          style={{ display: 'flex' }}
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setOtpOpen(false)}
        >
          <div
            className="split-auth-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="split-otp-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="split-auth-visual">
              <p className="split-auth-eyebrow">Secure access</p>
              <h2 id="split-otp-title">Verify your mobile</h2>
              <p className="split-auth-lede">
                We use a one-time password so you can donate safely and keep a single donor profile.
              </p>
              <ul className="split-auth-bullets">
                <li>10-digit Indian mobile</li>
                <li>OTP valid for a few minutes</li>
                <li>No password to remember</li>
              </ul>
            </div>
            <div className="split-auth-formcol">
              <button type="button" className="close-modal split-auth-close" onClick={() => setOtpOpen(false)} aria-label="Close">
                &times;
              </button>
              <h2 className="split-auth-form-title">Continue</h2>
              <p className="split-auth-form-hint">Enter your number, then the code we send.</p>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="10-digit mobile"
                  autoComplete="tel"
                />
              </div>
              {otpVisible && (
                <div className="form-group" id="otpFieldGroup">
                  <label htmlFor="otp">One-time password</label>
                  <input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" inputMode="numeric" />
                  <p className="otp-timer" id="otpTimer">
                    {otpSeconds > 0
                      ? `Expires in ${otpMin}:${otpSec < 10 ? `0${otpSec}` : otpSec}`
                      : ''}
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    id="resendOtpBtn"
                    disabled={otpSeconds > 0}
                    onClick={async () => {
                      try {
                        await api.sendOTP(phoneNumber.trim());
                        startOtpTimer(120);
                      } catch (err) {
                        alert(err.message || 'Resend failed');
                      }
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              )}
              {!otpVisible ? (
                <button type="button" id="sendOtpBtn" className="btn-primary" disabled={sendBusy} onClick={handleSendOtp}>
                  {sendBusy ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              ) : (
                <button type="button" id="verifyOtpBtn" className="btn-primary" disabled={verifyBusy} onClick={handleVerifyOtp}>
                  {verifyBusy ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Verifying...
                    </>
                  ) : (
                    'Verify & continue'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {donationOpen && (
        <div
          className="modal-overlay split-auth-overlay"
          style={{ display: 'flex' }}
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setDonationOpen(false)}
        >
          <div
            className="split-auth-card split-auth-card--wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="split-auth-visual split-auth-visual--payment">
              <p className="split-auth-eyebrow">Checkout</p>
              <h2 id="modalTitle">{modalTitle}</h2>
              <p className="split-auth-lede">
                Your details are pre-filled where possible. You will complete payment securely with Razorpay.
              </p>
              <div className="split-auth-stat">
                <span className="split-auth-stat-label">Amount</span>
                <span className="split-auth-stat-value">₹{amount || '—'}</span>
              </div>
            </div>
            <div className="split-auth-formcol">
              <button type="button" className="close-modal split-auth-close" onClick={() => setDonationOpen(false)} aria-label="Close">
                &times;
              </button>
              <h2 className="split-auth-form-title">Your details</h2>
              <form
                id="donationForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePay();
                }}
              >
                <div className="form-group">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" type="tel" value={phone} required readOnly />
                </div>
                <div className="form-group">
                  <label htmlFor="donationType">Type</label>
                  <select id="donationType" value={donationType} disabled>
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Amount (₹)</label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group checkbox-group">
                  <input
                    id="taxExemption"
                    type="checkbox"
                    checked={taxExemption}
                    onChange={(e) => setTaxExemption(e.target.checked)}
                  />
                  <label htmlFor="taxExemption">I want an 80G tax exemption certificate</label>
                </div>
                <button type="submit" id="rzp-button" className="btn-primary pay-now-btn" disabled={payBusy}>
                  {payBusy ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Opening Razorpay…
                    </>
                  ) : (
                    'Pay with Razorpay'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {successOpen && (
        <div className="success-modal" id="successModal" style={{ display: 'flex' }}>
          <div className="success-modal-content">
            <div className="success-icon">
              <i className="fas fa-check-circle" />
            </div>
            <h2>Payment Successful!</h2>
            <p id="successMessage" dangerouslySetInnerHTML={{ __html: successHtml }} />
            <div className="action-buttons">
              <button type="button" className="btn-primary" onClick={() => setSuccessOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AmountPicker({ monthly, onAmountChange, onSelectPreset }) {
  const [custom, setCustom] = useState('');
  const presets = monthly
    ? ['₹500/month', '₹1,000/month', '₹2,500/month']
    : ['₹500', '₹1,000', '₹2,500', '₹5,000'];

  return (
    <div className="amount-options">
      {presets.map((label) => (
        <button
          key={label}
          type="button"
          className="amount-btn"
          onClick={() => {
            onSelectPreset();
            onAmountChange(parseAmountFromButton(label));
            setCustom('');
          }}
        >
          {label}
        </button>
      ))}
      <input
        type="number"
        placeholder="Other amount"
        className="custom-amount"
        value={custom}
        onChange={(e) => {
          const v = e.target.value;
          setCustom(v);
          onSelectPreset();
          onAmountChange(parseInt(v, 10) || 0);
        }}
      />
    </div>
  );
}
