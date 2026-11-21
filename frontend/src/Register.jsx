import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

const Register = ({ darkMode, switchToLogin }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: ''
  });
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
      await axios.post(`${API_BASE}/api/users/register/`, formData);
      setMessage('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
      setTimeout(() => {
        switchToLogin();
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage('حدث خطأ أثناء إنشاء الحساب. تأكد من صحة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`max-w-md mx-auto backdrop-blur-xl p-6 sm:p-7 rounded-3xl shadow-xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
      <div className="text-center mb-4">
        <h2 className={`text-xl sm:text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          انضم إلينا الآن 🚀
        </h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          أنشئ حسابك الشخصي وابدأ البيع والشراء بكل ثقة
        </p>
      </div>

      {message && (
        <div className={`p-2.5 mb-3 rounded-xl text-xs text-center font-medium ${message.includes('نجاح') ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-rose-900/40 text-rose-300 border border-rose-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* الاسم الأول واسم العائلة في صف واحد */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider">الاسم الأول</label>
            <input 
              type="text" 
              name="first_name" 
              placeholder="first_name"
              value={formData.first_name} 
              onChange={handleChange} 
              required 
              className={`w-full px-3.5 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider">الاسم الأخير</label>
            <input 
              type="text" 
              name="last_name" 
              placeholder="last_name"
              value={formData.last_name} 
              onChange={handleChange} 
              required 
              className={`w-full px-3.5 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1 uppercase tracking-wider">رقم الهاتف</label>
          <input 
            type="tel" 
            name="phone_number" 
            placeholder="phone_number"
            value={formData.phone_number} 
            onChange={handleChange} 
            required 
            className={`w-full px-3.5 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
          />
        </div>

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
          {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>
      </form>

      <div className="text-center mt-4">
        <button 
          onClick={switchToLogin} 
          className={`text-xs font-semibold ${darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}
        >
          لديك حساب بالفعل؟ <span className="text-blue-500 underline">سجل دخولك</span>
        </button>
      </div>
    </main>
  );
};

export default Register;