import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const Dashboard = ({ properties = [], darkMode, token, onContactOwner }) => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedGovernorate, setSelectedGovernorate] = useState('ALL');

  // تتبع حالة اللايكات والتعليقات لكل عقار محلياً + مزامنتها مع الـ API
  const [localLikes, setLocalLikes] = useState({});
  const [localComments, setLocalComments] = useState({});
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingCommentId, setSubmittingCommentId] = useState(null);
  const [likingId, setLikingId] = useState(null);

  const safeProperties = Array.isArray(properties) ? properties : [];

  // استخراج أنواع العقارات والمحافظات المتاحة للفلترة
  const propertyTypes = useMemo(() => {
    const set = new Set();
    safeProperties.forEach((p) => {
      const t = p.property_type || p.type || p.category;
      if (t) set.add(String(t).trim());
    });
    return Array.from(set);
  }, [safeProperties]);

  const governorates = useMemo(() => {
    const set = new Set();
    safeProperties.forEach((p) => {
      const gov = p.governorate || p.province || p.state;
      if (gov) set.add(String(gov).trim());
    });
    return Array.from(set);
  }, [safeProperties]);

  // تطبيق الفلترة حسب النوع والمحافظة
  const filteredProperties = useMemo(() => {
    return safeProperties.filter((prop) => {
      const propType = String(prop.property_type || prop.type || prop.category || '').trim();
      const propGov = String(prop.governorate || prop.province || prop.state || '').trim();

      const matchesType = selectedType === 'ALL' || propType === selectedType;
      const matchesGov = selectedGovernorate === 'ALL' || propGov === selectedGovernorate;
      return matchesType && matchesGov;
    });
  }, [safeProperties, selectedType, selectedGovernorate]);

  const getLikeState = (prop) => {
    if (localLikes[prop.id]) {
      return localLikes[prop.id];
    }
    return {
      count: Number(prop.likes_count ?? prop.likes?.length ?? 0),
      liked: Boolean(prop.is_liked ?? false)
    };
  };

  const getCommentsList = (prop) => {
    if (Array.isArray(localComments[prop.id])) {
      return localComments[prop.id];
    }
    return Array.isArray(prop.comments) ? prop.comments : [];
  };

  const handleToggleLike = async (prop) => {
    if (!prop?.id || likingId === prop.id) return;
    const current = getLikeState(prop);
    const optimisticLiked = !current.liked;
    const optimisticCount = Math.max(0, current.count + (optimisticLiked ? 1 : -1));

    setLikingId(prop.id);
    setLocalLikes((prev) => ({
      ...prev,
      [prop.id]: { count: optimisticCount, liked: optimisticLiked }
    }));

    try {
      const res = await axios.post(
        `${API_BASE}/api/properties/${prop.id}/like/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocalLikes((prev) => ({
        ...prev,
        [prop.id]: {
          count: Number(res.data?.likes_count ?? optimisticCount),
          liked: Boolean(res.data?.is_liked ?? optimisticLiked)
        }
      }));
    } catch (err) {
      console.error('تعذر تحديث الإعجاب من السيرفر:', err.response?.data || err);
    } finally {
      setLikingId(null);
    }
  };

  const handleToggleComments = async (prop) => {
    const nextId = openCommentsId === prop.id ? null : prop.id;
    setOpenCommentsId(nextId);

    if (nextId && !localComments[prop.id]) {
      try {
        const res = await axios.get(`${API_BASE}/api/properties/${prop.id}/comments/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : getCommentsList(prop);
        setLocalComments((prev) => ({ ...prev, [prop.id]: list }));
      } catch {
        setLocalComments((prev) => ({ ...prev, [prop.id]: getCommentsList(prop) }));
      }
    }
  };

  const handleAddComment = async (e, prop) => {
    e.preventDefault();
    const text = (commentInputs[prop.id] || '').trim();
    if (!text || submittingCommentId === prop.id) return;

    setSubmittingCommentId(prop.id);
    const existing = getCommentsList(prop);

    try {
      const res = await axios.post(
        `${API_BASE}/api/properties/${prop.id}/comments/`,
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const createdComment = res.data || {
        id: Date.now(),
        author_name: 'أنت',
        content: text,
        created_at: new Date().toISOString()
      };
      setLocalComments((prev) => ({
        ...prev,
        [prop.id]: [...existing, createdComment]
      }));
      setCommentInputs((prev) => ({ ...prev, [prop.id]: '' }));
    } catch (err) {
      console.error('تعذر حفظ التعليق في السيرفر:', err.response?.data || err);
      const fallbackComment = {
        id: Date.now(),
        author_name: 'أنت',
        content: text,
        created_at: new Date().toISOString()
      };
      setLocalComments((prev) => ({
        ...prev,
        [prop.id]: [...existing, fallbackComment]
      }));
      setCommentInputs((prev) => ({ ...prev, [prop.id]: '' }));
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const buildOwnerPayload = (prop) => {
    const ownerObj = typeof prop.owner === 'object' && prop.owner !== null ? prop.owner : null;
    const id = ownerObj?.id ?? prop.owner_id ?? prop.user_id ?? prop.owner;
    const firstName = ownerObj?.first_name ?? prop.owner_first_name ?? '';
    const lastName = ownerObj?.last_name ?? prop.owner_last_name ?? '';
    const fullName =
      ownerObj?.full_name ||
      prop.owner_full_name ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      prop.owner_name ||
      ownerObj?.username ||
      'مالك العقار';

    return {
      id,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName
    };
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6" dir="rtl">
      {/* شريط الفلترة حسب النوع والمحافظة */}
      <div
        className={`p-4 rounded-3xl border shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              نوع العقار
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border outline-none ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">جميع الأنواع</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              المحافظة
            </label>
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border outline-none ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">جميع المحافظات</option>
              {governorates.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedType !== 'ALL' || selectedGovernorate !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedType('ALL');
              setSelectedGovernorate('ALL');
            }}
            className="sm:self-end px-4 py-2.5 rounded-2xl text-xs font-bold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-all"
          >
            إعادة تعيين
          </button>
        )}
      </div>

      {/* قائمة المنشورات العقارية */}
      {filteredProperties.length === 0 ? (
        <div
          className={`p-10 rounded-3xl border text-center ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <p className="text-sm font-bold">لا توجد عقارات مطابقة للفلاتر المحددة حالياً.</p>
        </div>
      ) : (
        filteredProperties.map((prop, index) => {
          const ownerInfo = buildOwnerPayload(prop);
          const propType = prop.property_type || prop.type || prop.category || 'عقار';
          const governorate = prop.governorate || prop.province || '';
          const city = prop.city || '';
          const locationText = [governorate, city].filter(Boolean).join(' - ') || 'غير محدد';
          const imageUrl = resolveMediaUrl(prop.image || prop.main_image || prop.property_image);

          const likeState = getLikeState(prop);
          const commentsList = getCommentsList(prop);
          const isCommentsOpen = openCommentsId === prop.id;

          return (
            <article
              key={prop.id || index}
              className={`rounded-3xl border shadow-md overflow-hidden transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* رأس المنشور: المالك + شارات النوع والموقع */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shrink-0">
                    {ownerInfo.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black truncate">{ownerInfo.full_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 font-bold">
                        {propType}
                      </span>
                      <span>📍 {locationText}</span>
                    </div>
                  </div>
                </div>

                {prop.price !== undefined && prop.price !== null && (
                  <div className="text-left shrink-0">
                    <span className="text-sm font-black text-emerald-500">
                      {Number(prop.price).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* محتوى المنشور: العنوان والوصف */}
              <div className="px-4 pb-3 space-y-1.5">
                {prop.title && <h4 className="text-base font-extrabold">{prop.title}</h4>}
                {prop.description && (
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {prop.description}
                  </p>
                )}
              </div>

              {/* صورة العقار */}
              {imageUrl && (
                <div className="w-full max-h-[420px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={imageUrl}
                    alt={prop.title || propType}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* شريط عداد اللايكات والتعليقات */}
              <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <span>👍 {likeState.count} إعجاب</span>
                <button
                  type="button"
                  onClick={() => handleToggleComments(prop)}
                  className="hover:underline font-semibold"
                >
                  {commentsList.length} تعليق
                </button>
              </div>

              {/* أزرار التفاعل السفلية: لايك + تعليقات + تراسل */}
              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                <button
                  type="button"
                  disabled={likingId === prop.id}
                  onClick={() => handleToggleLike(prop)}
                  className={`py-3 flex items-center justify-center gap-2 transition-colors ${
                    likeState.liked
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/5'
                      : darkMode
                        ? 'text-slate-300 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{likeState.liked ? '👍' : '🤍'}</span>
                  <span>إعجاب ({likeState.count})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleComments(prop)}
                  className={`py-3 flex items-center justify-center gap-2 transition-colors ${
                    darkMode
                      ? 'text-slate-300 hover:bg-slate-800/60'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>💬</span>
                  <span>تعليقات</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof onContactOwner === 'function') {
                      onContactOwner(ownerInfo);
                    }
                  }}
                  className={`py-3 flex items-center justify-center gap-2 transition-colors ${
                    darkMode
                      ? 'text-indigo-400 hover:bg-slate-800/60'
                      : 'text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <span>✉️</span>
                  <span>تواصل</span>
                </button>
              </div>

              {/* قسم التعليقات العامة أسفل المنشور */}
              {isCommentsOpen && (
                <div
                  className={`p-4 border-t space-y-3 ${
                    darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {commentsList.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">
                        لا توجد تعليقات بعد. كن أول من يعلّق!
                      </p>
                    ) : (
                      commentsList.map((c, cIdx) => {
                        const authorLabel =
                          c.author_name ||
                          c.user_name ||
                          c.username ||
                          (typeof c.author === 'object' ? c.author?.username : null) ||
                          'مستخدم';
                        return (
                          <div
                            key={c.id || cIdx}
                            className={`p-2.5 rounded-2xl text-xs border ${
                              darkMode
                                ? 'bg-slate-900 border-slate-800 text-slate-200'
                                : 'bg-white border-slate-200/80 text-slate-700'
                            }`}
                          >
                            <span className="font-black text-blue-500 block mb-0.5">
                              {authorLabel}
                            </span>
                            <p className="leading-relaxed">{c.content || c.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={(e) => handleAddComment(e, prop)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اكتب تعليقاً عاماً يراه الجميع..."
                      value={commentInputs[prop.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [prop.id]: e.target.value }))
                      }
                      className={`flex-1 px-3.5 py-2 rounded-2xl text-xs border outline-none ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={submittingCommentId === prop.id || !(commentInputs[prop.id] || '').trim()}
                      className="px-4 py-2 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all"
                    >
                      {submittingCommentId === prop.id ? '...' : 'نشر'}
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
};

export default Dashboard;