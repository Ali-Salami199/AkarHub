import React, { useState } from 'react';
import axios from 'axios';

const AddProperty = ({ token, onPropertyAdded, darkMode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [listingType, setListingType] = useState('sale');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // استخدام FormData لأن الطلب يحتوي على ملف (صورة) وبيانات نصية
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('listing_type', listingType);
    if (image) {
      formData.append('image', image);
    }

    try {
      // إرسال الطلب مع تمرير التوكن في الـ Headers
      const response = await axios.post('http://127.0.0.1:8000/api/properties/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`, // <-- هذا هو السطر الأهم لمنع خطأ 401
        },
      });

      // إشعار لوحة التحكم بنجاح الإضافة وإضافة العقار للقائمة مباشرة
      if (onPropertyAdded) {
        onPropertyAdded(response.data);
      }

      // تصفية الحقول بعد النجاح
      setTitle('');
      setDescription('');
      setPrice('');
      setImage(null);
    } catch (err) {
      console.error('Error adding property:', err.response?.data || err.message);
      setError('فشل إضافة العقار. تأكد من إدخال جميع البيانات بشكل صحيح.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-3xl border shadow-lg ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
      <h3 className="text-lg font-black mb-4">إضافة عقار جديد لسوق عقارهب 🏠</h3>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold mb-1 opacity-80">عنوان العقار</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required
            placeholder="مثال: شقة فاخرة للإيجار في وسط المدينة"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-600'}`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1 opacity-80">السعر (ر.س)</label>
          <input 
            type="number" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            required
            placeholder="مثال: 500000"
            className={`w-full px-4 py.5 rounded-xl border text-sm outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-600'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold mb-1 opacity-80">نوع العرض</label>
          <select 
            value={listingType} 
            onChange={(e) => setListingType(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-600'}`}
          >
            <option value="sale">للبيع</option>
            <option value="rent">للإيجار</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1 opacity-80">صورة العقار</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className={`w-full px-3 py-2 rounded-xl border text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold ${darkMode ? 'bg-slate-800 border-slate-700 file:bg-slate-700 file:text-white' : 'bg-slate-50 border-slate-200 file:bg-blue-50 file:text-blue-600'}`}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold mb-1 opacity-80">وصف العقار</label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows="3"
          placeholder="اكتب تفاصيل إضافية عن العقار..."
          className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-600'}`}
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {loading ? 'جاري النشر...' : 'نشر العقار في المنصة'}
      </button>
    </form>
  );
};

export default AddProperty;