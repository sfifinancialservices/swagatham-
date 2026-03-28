const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function sendOTP(phoneNumber) {
  const res = await fetch(`${API_BASE}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Failed to send OTP');
  return data;
}

export async function verifyOTP(phoneNumber, otp) {
  const res = await fetch(`${API_BASE}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, otp }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'OTP verification failed');
  return data;
}

export async function fetchUserProfile(token) {
  const res = await fetch(`${API_BASE}/user/profile`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const err = new Error(data.error || 'Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Failed to load profile');
  return data.user;
}

export async function updateUserProfile(token, profileData) {
  const res = await fetch(`${API_BASE}/user/profile`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(profileData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

export async function submitKYC(token, kyc) {
  const res = await fetch(`${API_BASE}/kyc`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(kyc),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'KYC submission failed');
  return data;
}

export async function recordPayment(token, { amount, razorpay_payment_id, tax_exemption }) {
  const res = await fetch(`${API_BASE}/payment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amount, razorpay_payment_id, tax_exemption: !!tax_exemption }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Payment recording failed');
  return data;
}
