import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';

let memberId = 0;
function nextMemberId() {
  memberId += 1;
  return memberId;
}

function amountValue(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amountValue(n));
}

export default function ProfileModals({ open, onClose }) {
  const {
    fetchUserProfile,
    updateUserProfile,
    submitKYC,
    logout,
  } = useSession();

  const [user, setUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [familyRows, setFamilyRows] = useState([]);

  const [kycPan, setKycPan] = useState('');
  const [kycAadhaar, setKycAadhaar] = useState('');
  const [kycDob, setKycDob] = useState('');
  const [kycFileName, setKycFileName] = useState('');

  const load = useCallback(async () => {
    const u = await fetchUserProfile();
    setUser(u);
  }, [fetchUserProfile]);

  useEffect(() => {
    if (!open) {
      setEditOpen(false);
      setKycOpen(false);
      setUser(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const showEditProfile = Boolean(user) && !Boolean(user.profileComplete);
  const payments = Array.isArray(user?.payments) ? user.payments : [];
  const paymentSummary = payments.reduce(
    (acc, p) => {
      const status = String(p.status || 'success').toLowerCase();
      const amt = amountValue(p.amount);
      acc.totalAmount += amt;
      acc.totalCount += 1;
      if (status === 'success') {
        acc.successAmount += amt;
        acc.successCount += 1;
      } else if (status === 'failed') {
        acc.failedCount += 1;
      } else {
        acc.pendingCount += 1;
      }
      if (p.tax_exemption) {
        acc.taxExemptCount += 1;
      } else {
        acc.standardCount += 1;
      }
      return acc;
    },
    {
      totalAmount: 0,
      totalCount: 0,
      successAmount: 0,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      taxExemptCount: 0,
      standardCount: 0,
    }
  );
  const groupedPayments = payments.reduce((acc, p) => {
    const status = String(p.status || 'success').toLowerCase();
    const key = status === 'success' || status === 'failed' || status === 'pending' ? status : 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const paymentGroups = [
    ['success', 'Successful Payments'],
    ['pending', 'Pending Payments'],
    ['failed', 'Failed Payments'],
    ['other', 'Other Payments'],
  ].filter(([k]) => (groupedPayments[k] || []).length > 0);

  const openEdit = () => {
    if (!user) return;
    setEditName(user.name || localStorage.getItem('userName') || '');
    setEditEmail(user.email || localStorage.getItem('userEmail') || '');
    setEditDob(user.dob || localStorage.getItem('userDob') || '');
    setEditGender(user.gender || localStorage.getItem('userGender') || '');
    setEditAddress(user.address || localStorage.getItem('userAddress') || '');
    const fm = user.familyMembers?.length
      ? user.familyMembers.map((m) => ({
          id: nextMemberId(),
          name: m.name || '',
          gender: m.gender || '',
          relation: m.relation || '',
          dob: m.dob || '',
        }))
      : [{ id: nextMemberId(), name: '', gender: '', relation: '', dob: '' }];
    setFamilyRows(fm);
    setEditOpen(true);
  };

  const addFamilyRow = () => {
    setFamilyRows((r) => [...r, { id: nextMemberId(), name: '', gender: '', relation: '', dob: '' }]);
  };

  const removeFamilyRow = (id) => {
    setFamilyRows((r) => (r.length <= 1 ? r : r.filter((x) => x.id !== id)));
  };

  const updateRow = (id, field, value) => {
    setFamilyRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const familyMembers = familyRows
      .filter((m) => m.name && m.gender && m.relation)
      .map((m) => ({
        name: m.name,
        gender: m.gender,
        relation: m.relation,
        dob: m.dob,
      }));
    if (familyMembers.length === 0) {
      alert('Please add at least one family member');
      return;
    }
    const ok = await updateUserProfile({
      name: editName,
      email: editEmail,
      dob: editDob,
      gender: editGender,
      address: editAddress,
      familyMembers,
    });
    if (ok) {
      localStorage.setItem('userName', editName);
      localStorage.setItem('userEmail', editEmail);
      localStorage.setItem('userDob', editDob);
      localStorage.setItem('userGender', editGender);
      localStorage.setItem('userAddress', editAddress);
      setEditOpen(false);
      await load();
    } else {
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitKYC({
        pan_number: kycPan,
        aadhaar_number: kycAadhaar,
        dob: kycDob,
        kyc_doc_path: kycFileName || null,
      });
      alert('KYC submitted successfully!');
      setKycOpen(false);
      await load();
    } catch (err) {
      alert(err.message || 'KYC failed');
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="modal-overlay"
        style={{ display: editOpen || kycOpen ? 'none' : 'flex' }}
        role="presentation"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal-container profile-view" role="dialog" aria-modal="true">
          <button type="button" className="close-modal" onClick={onClose}>
            &times;
          </button>
          <h2>Your Profile</h2>
          <div className="profile-content" id="profileContent">
            {!user && <p className="profile-loading">Loading profile…</p>}
            {user && (
              <>
                <div className="profile-details">
                  <div className="profile-detail">
                    <label>Name</label>
                    <span>{user.name || localStorage.getItem('userName') || 'Not provided'}</span>
                  </div>
                  <div className="profile-detail">
                    <label>Email</label>
                    <span>{user.email || localStorage.getItem('userEmail') || 'Not provided'}</span>
                  </div>
                  <div className="profile-detail">
                    <label>Phone</label>
                    <span>{user.phone || localStorage.getItem('userPhone') || 'Not provided'}</span>
                  </div>
                  <div className="profile-detail">
                    <label>Date of Birth</label>
                    <span>{user.dob || localStorage.getItem('userDob') || 'Not provided'}</span>
                  </div>
                  <div className="profile-detail">
                    <label>Gender</label>
                    <span>
                      {user.gender
                        ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
                        : localStorage.getItem('userGender')
                          ? localStorage.getItem('userGender').charAt(0).toUpperCase() +
                            localStorage.getItem('userGender').slice(1)
                          : 'Not provided'}
                    </span>
                  </div>
                  <div className="profile-detail">
                    <label>Address</label>
                    <span>{user.address || localStorage.getItem('userAddress') || 'Not provided'}</span>
                  </div>
                </div>

                {user.familyMembers?.length > 0 && (
                  <div className="family-members-list">
                    <h3>Family Members</h3>
                    {user.familyMembers.map((m) => (
                      <div key={`${m.name}-${m.relation}`} className="family-member-item">
                        <strong>{m.name}</strong> ({m.relation}) —{' '}
                        {m.gender ? m.gender.charAt(0).toUpperCase() + m.gender.slice(1) : ''}{' '}
                        {m.dob ? `- Born: ${m.dob}` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {payments.length > 0 && (
                  <div className="donation-history">
                    <h3>Donation History</h3>
                    <div className="payment-summary-grid">
                      <div className="payment-summary-card">
                        <span className="payment-summary-label">Total Contributions</span>
                        <strong>{formatCurrency(paymentSummary.totalAmount)}</strong>
                        <small>{paymentSummary.totalCount} transactions</small>
                      </div>
                      <div className="payment-summary-card">
                        <span className="payment-summary-label">Successful</span>
                        <strong>{formatCurrency(paymentSummary.successAmount)}</strong>
                        <small>{paymentSummary.successCount} completed</small>
                      </div>
                      <div className="payment-summary-card">
                        <span className="payment-summary-label">Tax Categories</span>
                        <strong>{paymentSummary.taxExemptCount} 80G</strong>
                        <small>{paymentSummary.standardCount} standard</small>
                      </div>
                    </div>
                    {paymentGroups.map(([key, title]) => (
                      <div key={key} className="payment-category">
                        <h4>{title}</h4>
                        {groupedPayments[key].map((p) => (
                          <div key={p.razorpay_payment_id} className="donation-item">
                            <div className="donation-item-top">
                              <strong>{formatCurrency(p.amount)}</strong>
                              <span className={`payment-status payment-status--${key}`}>
                                {(p.status || key).toString().toUpperCase()}
                              </span>
                            </div>
                            <div className="payment-id">Payment ID: {p.razorpay_payment_id}</div>
                            <div className="payment-meta">
                              {p.invoice_number ? (
                                <>
                                  Invoice: {p.invoice_number}
                                  <br />
                                </>
                              ) : null}
                              Date: {new Date(p.payment_date).toLocaleDateString()} |{' '}
                              {p.tax_exemption ? '80G requested' : 'Standard donation'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div className="kyc-section">
                  <h3>KYC Documents</h3>
                  {user.kycDocuments ? (
                    <div className="kyc-details">
                      {user.kycDocuments.pan_number && (
                        <p>
                          <strong>PAN:</strong> {user.kycDocuments.pan_number}
                        </p>
                      )}
                      {user.kycDocuments.aadhaar_number && (
                        <p>
                          <strong>Aadhaar:</strong> {user.kycDocuments.aadhaar_number}
                        </p>
                      )}
                      {user.kycDocuments.kyc_doc_path && <p>Document on file</p>}
                    </div>
                  ) : (
                    <>
                      <p>No KYC documents submitted yet</p>
                      <button type="button" className="btn-primary" onClick={() => setKycOpen(true)}>
                        Submit KYC
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="profile-actions" id="profileActions">
            {showEditProfile && (
              <button type="button" className="btn-secondary" id="editProfileBtn" onClick={openEdit}>
                Edit Profile
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              id="logoutBtn"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {editOpen && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}
        >
          <div className="modal-container landscape-form">
            <button type="button" className="close-modal" onClick={() => setEditOpen(false)}>
              &times;
            </button>
            <h2>Update Profile</h2>
            <form id="profileForm" onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editName">Full Name</label>
                  <input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editEmail">Email</label>
                  <input
                    id="editEmail"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editDob">Date of Birth</label>
                  <input
                    id="editDob"
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editGender">Gender</label>
                  <select
                    id="editGender"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="editAddress">Full Address</label>
                <textarea
                  id="editAddress"
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  required
                />
              </div>
              <h3 className="family-heading">Family Member Details (At least one)</h3>
              <div className="family-members" id="familyMembersContainer">
                {familyRows.map((row, idx) => (
                  <div key={row.id} className="family-member-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`mn-${row.id}`}>Name</label>
                        <input
                          id={`mn-${row.id}`}
                          value={row.name}
                          onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`mg-${row.id}`}>Gender</label>
                        <select
                          id={`mg-${row.id}`}
                          value={row.gender}
                          onChange={(e) => updateRow(row.id, 'gender', e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor={`md-${row.id}`}>Date of Birth</label>
                        <input
                          id={`md-${row.id}`}
                          type="date"
                          value={row.dob}
                          onChange={(e) => updateRow(row.id, 'dob', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`mr-${row.id}`}>Relation</label>
                        <input
                          id={`mr-${row.id}`}
                          value={row.relation}
                          onChange={(e) => updateRow(row.id, 'relation', e.target.value)}
                          required
                          placeholder="e.g., Spouse, Son, Daughter"
                        />
                      </div>
                    </div>
                    {idx > 0 && (
                      <button
                        type="button"
                        className="remove-family-member"
                        onClick={() => removeFamilyRow(row.id)}
                      >
                        <i className="fas fa-times" /> Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn-secondary" id="addFamilyMember" onClick={addFamilyRow}>
                + Add Another Family Member
              </button>
              <div className="form-actions">
                <button type="button" className="btn-tertiary" id="cancelEdit" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {kycOpen && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setKycOpen(false)}
        >
          <div className="modal-container">
            <button type="button" className="close-modal" onClick={() => setKycOpen(false)}>
              &times;
            </button>
            <h2>KYC Document Submission</h2>
            <form id="kycForm" onSubmit={handleKycSubmit}>
              <div className="form-group">
                <label htmlFor="panNumber">PAN Number</label>
                <input id="panNumber" value={kycPan} onChange={(e) => setKycPan(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="aadhaarNumber">Aadhaar Number</label>
                <input
                  id="aadhaarNumber"
                  value={kycAadhaar}
                  onChange={(e) => setKycAadhaar(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="kycDob">Date of Birth</label>
                <input
                  id="kycDob"
                  type="date"
                  value={kycDob}
                  onChange={(e) => setKycDob(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="kycDocument">Upload Document (PDF/Image)</label>
                <input
                  id="kycDocument"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setKycFileName(e.target.files?.[0]?.name || '')}
                />
              </div>
              <button type="submit" className="btn-primary">
                Submit KYC
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
