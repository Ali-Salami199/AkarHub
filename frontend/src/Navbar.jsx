import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';
const Navbar = ({
  username,
  firstName,
  profileImage,
  unreadCount: externalUnreadCount,
  onLogout,
  darkMode,
  setDarkMode,
  setCurrentView,
  token
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const menuRef = useRef(null);

  const unreadCount =
    typeof externalUnreadCount === 'number' ? externalUnreadCount : localUnreadCount;

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جلب عدد الرسائل غير المقروءة إذا لم يُمرَّر من App.jsx
  useEffect(() => {
    if (!token || typeof externalUnreadCount === 'number') return;

    const fetchUnreadCount = async () => {
      try {
          const res = await axios.get(`${API_BASE}/api/messages/unread-count/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        setLocalUnreadCount(res.data?.unread_count ?? 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [token, externalUnreadCount]);

  // إغلاق القائمة تلقائياً إذا تم تسجيل الخروج أو اختفى التوكن
  useEffect(() => {
    if (!token) {
      setIsOpen(false);
    }
  }, [token]);

  const displayName = firstName || username || 'User';

  return (
    <nav
      className={`w-full border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
        darkMode
          ? 'bg-slate-900/80 border-slate-800 text-white'
          : 'bg-white/80 border-slate-200 text-slate-800'
      }`}
      dir="ltr"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 1. Left side: Menu (only when authenticated), Theme Toggle, Messenger Icon, and User Profile Shortcut */}
        <div className="flex items-center gap-3">
          {/* القائمة المنسدلة تظهر فقط للمستخدم المسجل */}
          {token && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Open Menu"
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div
                  className={`absolute left-0 mt-2 w-52 rounded-2xl shadow-xl border py-2 z-50 animate-fadeIn ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800 text-white'
                      : 'bg-white border-slate-100 text-slate-800'
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Welcome,</span>
                    <span className="text-xs font-black truncate block text-blue-600 dark:text-blue-400">
                      {displayName}
                    </span>
                  </div>

                  {/* My Profile Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (setCurrentView) setCurrentView('profile');
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 transition-all ${
                      darkMode
                        ? 'hover:bg-slate-800 text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      ></path>
                    </svg>
                    <span>My Profile</span>
                  </button>

                  {/* My Properties */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      alert('My Properties page is under development');
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 transition-all ${
                      darkMode
                        ? 'hover:bg-slate-800 text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H9m4 0V5"
                      ></path>
                    </svg>
                    <span>My Properties</span>
                  </button>

                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      alert('Settings page is under development');
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 transition-all ${
                      darkMode
                        ? 'hover:bg-slate-800 text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <svg
                      className="w-4 h-4 text-rose-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      ></path>
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl border transition-all ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Toggle Theme"
          >
            {darkMode ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                ></path>
              </svg>
            )}
          </button>

          {/* Messenger Icon Button */}
          {token && (
            <button
              type="button"
              onClick={() => {
                if (setCurrentView) setCurrentView('messenger');
              }}
              className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Open Messenger"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Quick Access */}
          {token && username && (
            <div
              onClick={() => {
                if (setCurrentView) setCurrentView('profile');
              }}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border cursor-pointer transition-all ${
                darkMode
                  ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
              title="Go to Profile"
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-xs font-bold max-w-[100px] truncate">{displayName}</span>
            </div>
          )}
        </div>

        {/* 2. Right side: Logo & Platform Name */}
        <div
          onClick={() => {
            if (token && setCurrentView) setCurrentView('dashboard');
          }}
          className={`flex items-center gap-2.5 ${token ? 'cursor-pointer' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
            AkarHub <span className="text-xs font-mono opacity-80">(عقارهب)</span>
          </h1>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;