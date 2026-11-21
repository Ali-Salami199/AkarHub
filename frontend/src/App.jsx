import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Messenger from './Messenger';
import Navbar from './Navbar';
import { API_BASE } from './apiConfig';

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '');
  const [unreadCount, setUnreadCount] = useState(0);

  const [properties, setProperties] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  // حالة للتحكم في الصفحة الحالية ('dashboard' أو 'profile' أو 'messenger')
  const [currentView, setCurrentView] = useState('dashboard');

  // بيانات الطرف الآخر المحدد للمحادثة عند الضغط على "تواصل" من كرت العقار
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/messages/unread-count/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data?.unread_count ?? 0);
    } catch (err) {
      console.error('خطأ في جلب عدد الرسائل غير المقروءة:', err.response?.data || err);
    }
  }, [token]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('firstName');
    localStorage.removeItem('profileImage');
    setToken('');
    setUsername('');
    setFirstName('');
    setProfileImage('');
    setUnreadCount(0);
    setProperties([]);
    setSelectedChatUser(null);
    setCurrentView('dashboard');
  }, []);

  // جلب بيانات المستخدم الشخصية (الاسم الأول والصورة) والعقارات عند توفر التوكن
  const fetchUserDataAndProperties = useCallback(
    async (authToken) => {
      try {
        // 1. جلب بيانات الملف الشخصي
        const profileRes = await axios.get(`${API_BASE}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        const fName = profileRes.data.first_name || '';
        const pImage = profileRes.data.profile_image || '';

        setFirstName(fName);
        setProfileImage(pImage);
        localStorage.setItem('firstName', fName);
        if (pImage) localStorage.setItem('profileImage', pImage);

        // 2. جلب العقارات
        const propRes = await axios.get(`${API_BASE}/api/properties/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setProperties(propRes.data);
      } catch (err) {
        console.error('حدث خطأ أثناء جلب البيانات:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          handleLogout();
        }
      }
    },
    [handleLogout]
  );

  useEffect(() => {
    if (token) {
      fetchUserDataAndProperties(token);
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [token, fetchUserDataAndProperties, fetchUnreadCount]);

  // الانتقال المباشر إلى واجهة المحادثة مع مالك العقار
  const handleContactOwner = (ownerInfo) => {
    setSelectedChatUser(ownerInfo);
    setCurrentView('messenger');
  };

  return (
    <div
      className={`${
        darkMode
          ? 'dark bg-slate-950 text-white'
          : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-slate-800'
      } min-h-screen font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white transition-colors duration-300`}
      dir="ltr"
    >
      {token && (
        <Navbar
          username={username}
          firstName={firstName}
          profileImage={profileImage}
          unreadCount={unreadCount}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setCurrentView={setCurrentView}
          currentView={currentView}
          token={token}
        />
      )}

      {/* المحتوى الرئيسي للمنصة */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 my-auto py-8 flex-1 flex flex-col justify-center">
        {!token ? (
          <div className="w-full" dir="rtl">
            <div className="flex flex-col items-center gap-2 mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg text-2xl">
                🏠
              </div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                عقارهب <span className="text-xl font-mono opacity-80">(AjarHub)</span>
              </h1>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                منصة العقارات الذكية والشاملة
              </p>
            </div>

            {isLoginView ? (
              <Login
                onLoginSuccess={(accessToken, userObj) => {
                  setToken(accessToken);
                  const loggedUser = userObj?.username || 'User';
                  setUsername(loggedUser);
                  localStorage.setItem('username', loggedUser);
                }}
                darkMode={darkMode}
                switchToRegister={() => setIsLoginView(false)}
              />
            ) : (
              <Register
                darkMode={darkMode}
                switchToLogin={() => setIsLoginView(true)}
              />
            )}
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard
                properties={properties}
                darkMode={darkMode}
                token={token}
                onContactOwner={handleContactOwner}
              />
            )}

            {currentView === 'profile' && (
              <Profile
                darkMode={darkMode}
                token={token}
                username={username}
                onUpdateProfileSuccess={(updatedData) => {
                  if (updatedData.first_name) {
                    setFirstName(updatedData.first_name);
                    localStorage.setItem('firstName', updatedData.first_name);
                  }
                  if (updatedData.profile_image) {
                    setProfileImage(updatedData.profile_image);
                    localStorage.setItem('profileImage', updatedData.profile_image);
                  }
                }}
              />
            )}

            {currentView === 'messenger' && (
              <Messenger
                token={token}
                darkMode={darkMode}
                setCurrentView={setCurrentView}
                initialRecipient={selectedChatUser}
                onMessagesRead={fetchUnreadCount}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;