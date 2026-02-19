import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cartFetch } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

export default function ProfilePage() {
  usePageTitle('My Profile');
  const { user, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' });
    }
  }, [isAuthenticated, navigate, user]);

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
        body: JSON.stringify({ name: form.name.trim() }),
      });
      // Update token and user state so navbar reflects new name
      if (data.token) localStorage.setItem('lupora_token', data.token);
      setUser(data.user);
      setProfileMsg({ text: 'Profile updated successfully', type: 'success' });
    } catch {
      setProfileMsg({ text: 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

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
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPass,
        }),
      });
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPasswordMsg({ text: 'Password changed successfully', type: 'success' });
    } catch (err) {
      setPasswordMsg({
        text: err.message.includes('401') ? 'Current password is incorrect' : 'Failed to change password',
        type: 'error',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const inputClass =
    'w-full bg-transparent border border-white/10 text-white text-sm px-4 py-3 focus:border-[#C5A059] focus:outline-none transition-colors placeholder:text-gray-600';
  const labelClass = 'text-gray-500 text-[9px] tracking-[0.3em] uppercase mb-2 block';

  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-black pt-24">
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-xl mx-auto">
          {/* Title */}
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-16 h-16 mx-auto mb-6 border border-[#C5A059]/30 rounded-full flex items-center justify-center"
            >
              <User size={28} className="text-[#C5A059]" strokeWidth={1.5} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-3xl md:text-4xl font-serif italic"
            >
              My Profile
            </motion.h1>
          </div>

          {/* Profile Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleProfileUpdate}
            className="border border-white/10 p-6 md:p-8 mb-8"
          >
            <h2 className="text-white text-[10px] tracking-[0.3em] uppercase mb-6">Account Details</h2>

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
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className={`${inputClass} opacity-50 cursor-not-allowed`}
                />
                <p className="text-gray-600 text-[10px] mt-1">Email cannot be changed</p>
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
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-[#C5A059] text-black text-[9px] tracking-[0.5em] uppercase font-medium hover:bg-[#d4af6a] transition-all duration-500 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </motion.form>

          {/* Change Password */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handlePasswordChange}
            className="border border-white/10 p-6 md:p-8"
          >
            <h2 className="text-white text-[10px] tracking-[0.3em] uppercase mb-6">Change Password</h2>

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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
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
              className="mt-6 w-full py-3 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all duration-700 disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
