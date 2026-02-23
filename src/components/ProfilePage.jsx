import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save, Eye, EyeOff, Plus, Trash2, MapPin, Star, AlertTriangle, Camera, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cartFetch } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

const emptyAddress = { label: 'Home', fullName: '', address: '', city: '', state: '', pincode: '' };

export default function ProfilePage() {
  usePageTitle('My Profile');
  const { user, isAuthenticated, setUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [profilePicture, setProfilePicture] = useState('');
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(null); // null = hidden, object = editing/adding
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressMsg, setAddressMsg] = useState({ text: '', type: '' });
  const [addressSaving, setAddressSaving] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Avatar upload
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
      setProfilePicture(user.profilePicture || '');
      setAddresses(user.addresses || []);
    }
  }, [isAuthenticated, navigate, user]);

  // ── Profile Update ──
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    if (!form.name.trim()) {
      setProfileMsg({ text: 'Name is required', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const data = await cartFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), profilePicture }),
      });
      if (data.token) localStorage.setItem('lupora_token', data.token);
      setUser(data.user);
      setProfileMsg({ text: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarMsg('Only JPEG, PNG, or WebP images');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg('Image must be under 2MB');
      return;
    }
    setUploading(true);
    setAvatarMsg('');
    try {
      const token = localStorage.getItem('lupora_token');
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/upload-avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setProfilePicture(data.profilePicture);
      setUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
    } catch (err) {
      setAvatarMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarMsg('');
    try {
      const data = await cartFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: form.name || user.name, profilePicture: '' }),
      });
      if (data.token) localStorage.setItem('lupora_token', data.token);
      setProfilePicture('');
      setUser(data.user);
    } catch {
      setAvatarMsg('Failed to remove picture');
    }
  };

  // ── Password Change ──
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      setPasswordMsg({ text: 'All password fields are required', type: 'error' });
      return;
    }
    if (passwords.newPass.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters', type: 'error' });
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setPasswordMsg({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    setChangingPassword(true);
    try {
      await cartFetch('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPasswordMsg({ text: 'Password changed successfully', type: 'success' });
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Failed to change password', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Addresses ──
  const openAddressForm = (addr = null) => {
    if (addr) {
      setEditingAddressId(addr._id);
      setAddressForm({ label: addr.label, fullName: addr.fullName, address: addr.address, city: addr.city, state: addr.state, pincode: addr.pincode });
    } else {
      setEditingAddressId(null);
      setAddressForm({ ...emptyAddress });
    }
    setAddressMsg({ text: '', type: '' });
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    setAddressMsg({ text: '', type: '' });
    const { fullName, address, city, state, pincode } = addressForm;
    if (!fullName || !address || !city || !state || !pincode) {
      setAddressMsg({ text: 'All fields are required', type: 'error' });
      return;
    }
    setAddressSaving(true);
    try {
      const url = editingAddressId ? `/api/auth/addresses/${editingAddressId}` : '/api/auth/addresses';
      const method = editingAddressId ? 'PUT' : 'POST';
      const data = await cartFetch(url, {
        method,
        body: JSON.stringify({ ...addressForm, isDefault: addresses.length === 0 }),
      });
      setAddresses(data.addresses);
      setUser(prev => ({ ...prev, addresses: data.addresses }));
      setAddressForm(null);
      setEditingAddressId(null);
    } catch (err) {
      setAddressMsg({ text: err.message || 'Failed to save address', type: 'error' });
    } finally {
      setAddressSaving(false);
    }
  };

  const handleAddressDelete = async (addressId) => {
    try {
      const data = await cartFetch(`/api/auth/addresses/${addressId}`, { method: 'DELETE' });
      setAddresses(data.addresses);
      setUser(prev => ({ ...prev, addresses: data.addresses }));
    } catch (err) {
      setAddressMsg({ text: err.message || 'Failed to delete address', type: 'error' });
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteMsg('Password is required');
      return;
    }
    setDeleting(true);
    setDeleteMsg('');
    try {
      await cartFetch('/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword }),
      });
      logout();
      navigate('/');
    } catch (err) {
      setDeleteMsg(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    'w-full bg-transparent border border-foreground/10 text-foreground text-sm px-4 py-3 focus:border-accent focus:outline-none transition-colors placeholder:text-faint';
  const labelClass = 'text-subtle text-[9px] tracking-[0.3em] uppercase mb-2 block';

  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-surface pt-24">
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-xl mx-auto">
          {/* Title + Avatar */}
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-24 h-24 mx-auto mb-6"
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-accent/30" />
              ) : (
                <div className="w-24 h-24 border-2 border-accent/30 rounded-full flex items-center justify-center">
                  <User size={36} className="text-accent" strokeWidth={1.5} />
                </div>
              )}
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50"
                title="Upload photo"
              >
                {uploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} className="text-black" />
                )}
              </button>
              {/* Remove button */}
              {profilePicture && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-dim border border-foreground/10 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                  title="Remove photo"
                >
                  <X size={11} className="text-muted" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </motion.div>

            {/* Upload hint / error */}
            {avatarMsg ? (
              <p className="text-red-400 text-[10px] mb-4">{avatarMsg}</p>
            ) : (
              <p className="text-faint text-[10px] mb-4">JPEG, PNG, or WebP &middot; Max 2MB</p>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-foreground text-3xl md:text-4xl font-serif italic"
            >
              My Profile
            </motion.h1>
          </div>

          {/* ── Account Details Form ── */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleProfileUpdate}
            className="border border-foreground/10 p-6 md:p-8 mb-8"
          >
            <h2 className="text-foreground text-[10px] tracking-[0.3em] uppercase mb-6">Account Details</h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                <p className="text-faint text-[10px] mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="Your phone number"
                  maxLength={15}
                />
              </div>
            </div>

            {profileMsg.text && (
              <p className={`text-sm mt-4 ${profileMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {profileMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-accent text-black text-[9px] tracking-[0.5em] uppercase font-medium hover:bg-accent-hover transition-all duration-500 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </motion.form>

          {/* ── Saved Addresses ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="border border-foreground/10 p-6 md:p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-foreground text-[10px] tracking-[0.3em] uppercase">Saved Addresses</h2>
              {!addressForm && (
                <button
                  onClick={() => openAddressForm()}
                  className="flex items-center gap-1.5 text-accent text-[9px] tracking-[0.3em] uppercase hover:text-accent-hover transition-colors"
                >
                  <Plus size={13} />
                  Add
                </button>
              )}
            </div>

            {/* Address List */}
            {addresses.length === 0 && !addressForm && (
              <p className="text-faint text-xs">No saved addresses yet.</p>
            )}

            <div className="space-y-4">
              {addresses.map(addr => (
                <div key={addr._id} className="border border-foreground/5 p-4 relative group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={14} className="text-accent mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-foreground text-xs font-medium">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-accent text-[8px] tracking-[0.3em] uppercase flex items-center gap-1">
                              <Star size={9} className="fill-accent" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-muted text-xs leading-relaxed">
                          {addr.fullName}<br />
                          {addr.address}<br />
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openAddressForm(addr)}
                        className="text-subtle text-[9px] tracking-widest uppercase hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleAddressDelete(addr._id)}
                        className="text-subtle hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Address Form */}
            <AnimatePresence>
              {addressForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddressSave}
                  className="mt-4 border border-accent/20 p-4 space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Label</label>
                      <select
                        value={addressForm.label}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                        className={`${inputClass} bg-surface`}
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>Full Name</label>
                      <input
                        type="text" value={addressForm.fullName}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className={inputClass} placeholder="Full name" required maxLength={100}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Address</label>
                    <input
                      type="text" value={addressForm.address}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                      className={inputClass} placeholder="Street address" required maxLength={500}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>City</label>
                      <input
                        type="text" value={addressForm.city}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                        className={inputClass} placeholder="City" required maxLength={50}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <input
                        type="text" value={addressForm.state}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                        className={inputClass} placeholder="State" required maxLength={50}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Pincode</label>
                      <input
                        type="text" value={addressForm.pincode}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                        className={inputClass} placeholder="Pincode" required maxLength={10}
                      />
                    </div>
                  </div>

                  {addressMsg.text && (
                    <p className={`text-xs ${addressMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {addressMsg.text}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="px-6 py-2.5 bg-accent text-black text-[9px] tracking-[0.3em] uppercase font-medium hover:bg-accent-hover transition-all disabled:opacity-50"
                    >
                      {addressSaving ? 'Saving...' : editingAddressId ? 'Update' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddressForm(null); setEditingAddressId(null); }}
                      className="px-6 py-2.5 border border-foreground/10 text-muted text-[9px] tracking-[0.3em] uppercase hover:text-foreground hover:border-foreground/30 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Change Password ── */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handlePasswordChange}
            className="border border-foreground/10 p-6 md:p-8 mb-8"
          >
            <h2 className="text-foreground text-[10px] tracking-[0.3em] uppercase mb-6">Change Password</h2>
            <div className="space-y-5">
              {[
                { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
                { key: 'newPass', label: 'New Password', placeholder: 'Enter new password' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: 'Confirm new password' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={passwords[key]}
                      onChange={(e) => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                      className={`${inputClass} pr-10`}
                      placeholder={placeholder}
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground-2 transition-colors"
                    >
                      {showPasswords[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {passwordMsg.text && (
              <p className={`text-sm mt-4 ${passwordMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {passwordMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="mt-6 w-full py-3 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase hover:bg-foreground hover:text-black transition-all duration-700 disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </motion.form>

          {/* ── Delete Account ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="border border-red-500/10 p-6 md:p-8"
          >
            <h2 className="text-red-400 text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
              <AlertTriangle size={14} />
              Danger Zone
            </h2>
            <p className="text-subtle text-xs leading-relaxed mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 border border-red-500/30 text-red-400 text-[9px] tracking-[0.3em] uppercase hover:bg-red-500/10 transition-all"
              >
                Delete My Account
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 overflow-hidden"
              >
                <p className="text-red-400 text-xs font-medium">
                  Enter your password to confirm account deletion:
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={`${inputClass} border-red-500/20 focus:border-red-500`}
                  placeholder="Your password"
                />
                {deleteMsg && <p className="text-red-400 text-xs">{deleteMsg}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-6 py-2.5 bg-red-500 text-white text-[9px] tracking-[0.3em] uppercase font-medium hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteMsg(''); }}
                    className="px-6 py-2.5 border border-foreground/10 text-muted text-[9px] tracking-[0.3em] uppercase hover:text-foreground transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
