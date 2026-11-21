import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const withCacheBuster = (url, cacheKey) => {
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${cacheKey}`;
};

const Profile = ({ darkMode, token, username, onUpdateProfileSuccess, onUpdateSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageVersion, setImageVersion] = useState(Date.now());

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const notifyParentUpdate = onUpdateProfileSuccess || onUpdateSuccess;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setFirstName(response.data.first_name || '');
        setLastName(response.data.last_name || '');
        setEmail(response.data.email || '');
        setPhoneNumber(response.data.phone_number || '');
        setProfileImage(resolveMediaUrl(response.data.profile_image) || null);
        setImageVersion(Date.now());
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setFetching(false);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      formData.append('phone_number', phoneNumber);

      if (selectedFile) {
        formData.append('profile_image', selectedFile);
      }

      const response = await axios.put(`${API_BASE}/api/users/profile/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const resolvedImage = resolveMediaUrl(response.data.profile_image) || profileImage;
      const nowKey = Date.now();

      if (resolvedImage) {
        setProfileImage(resolvedImage);
      }
      setImageVersion(nowKey);

      if (typeof notifyParentUpdate === 'function') {
        notifyParentUpdate({
          first_name: response.data.first_name ?? firstName,
          profile_image: resolvedImage
        });
      }

      setMessage('Profile updated successfully! ✨');
      setSelectedFile(null);
      setPreviewImage(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('An error occurred while saving. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-sm">Loading profile data...</p>
      </div>
    );
  }

  const displayedAvatarSrc = previewImage || withCacheBuster(profileImage, imageVersion);

  return (
    <div className="max-w-2xl mx-auto w-full py-6 animate-fadeIn" dir="ltr">
      {/* Page Header */}
      <div className="mb-8 text-left">
        <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Profile 👤
        </h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Manage your personal account information and contact details on AjarHub
        </p>
      </div>

      {/* Account Info Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
        }`}
      >
        {/* User Avatar / Profile Image Header */}
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-blue-500/30 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-2xl font-black">
            {displayedAvatarSrc ? (
              <img
                src={displayedAvatarSrc}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {firstName
                  ? firstName.charAt(0).toUpperCase()
                  : username
                    ? username.charAt(0).toUpperCase()
                    : '👤'}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {firstName && lastName ? `${firstName} ${lastName}` : username || 'AjarHub User'}
            </h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Registered Member</span>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-3 rounded-xl text-xs font-bold text-center ${
              message.includes('successfully')
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            }`}
          >
            {message}
          </div>
        )}

        {/* ----------------- View Mode ----------------- */}
        {!isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="text-xs text-slate-400 block mb-1">First Name</span>
                <span className="text-sm font-bold">{firstName || 'Not provided'}</span>
              </div>
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="text-xs text-slate-400 block mb-1">Last Name</span>
                <span className="text-sm font-bold">{lastName || 'Not provided'}</span>
              </div>
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="text-xs text-slate-400 block mb-1">Email Address</span>
                <span className="text-sm font-bold">{email || 'Not provided'}</span>
              </div>
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="text-xs text-slate-400 block mb-1">Phone Number</span>
                <span className="text-sm font-bold" dir="ltr">
                  {phoneNumber || 'Not provided'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMessage('');
                  setIsEditing(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2"
              >
                <span>✏️ Edit Profile</span>
              </button>
            </div>
          </div>
        ) : (
          /* ----------------- Edit Mode ----------------- */
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Profile Image Upload Field */}
            <div>
              <label
                className={`block text-xs font-bold mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-xs font-bold mb-2 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-bold mb-2 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-xs font-bold mb-2 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-bold mb-2 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+963..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedFile(null);
                  setPreviewImage(null);
                }}
                className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${
                  darkMode
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;