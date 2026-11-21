import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

const Login = ({ onLoginSuccess, darkMode, switchToRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/users/login/`, {
        email: formData.email,
        password: formData.password
      });
      const accessToken = res.data.access;
      localStorage.setItem('token', accessToken);
      onLoginSuccess(accessToken);
    } catch (err) {
      console.error(err);
      setMessage('فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`max-w-md mx-auto backdrop-blur-xl p-6 sm:p-7 rounded-3xl shadow-xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
      <div className="text-center mb-4">
        <h2 className={`text-xl sm:text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          مرحباً بك مجدداً 👋
        </h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          سجل دخولك لإدارة وتصفح العقارات في السوق
        </p>
      </div>

      {message && (
        <div className="p-2.5 mb-3 rounded-xl text-xs text-center font-medium bg-rose-900/40 text-rose-300 border border-rose-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-bold mb-1 uppercase tracking-wider">البريد الإلكتروني</label>
          <input 
            type="email" 
            name="email" 
            placeholder="name@example.com"
            value={formData.email} 
            onChange={handleChange} 
            required 
            className={`w-full px-3.5 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1 uppercase tracking-wider">كلمة المرور</label>
          <input 
            type="password" 
            name="password" 
            placeholder="••••••••"
            value={formData.password} 
            onChange={handleChange} 
            required 
            className={`w-full px-3.5 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold rounded-xl shadow-lg text-sm mt-2"
        >
          {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>

      <div className="text-center mt-4">
        <button 
          onClick={switchToRegister} 
          className={`text-xs font-semibold ${darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}
        >
          ليس لديك حساب؟ <span className="text-blue-500 underline">سجل الآن</span>
        </button>
      </div>
    </main>
  );
};

export default Login;