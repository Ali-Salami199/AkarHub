import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from './apiConfig';

const looksLikeEmail = (value) => typeof value === 'string' && value.includes('@');

const buildFullName = (...parts) => {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .trim();
};

const pickBestName = (candidates, fallback = 'مستخدم') => {
  for (const cand of candidates) {
    if (typeof cand === 'string') {
      const cleaned = cand.trim();
      if (cleaned && !looksLikeEmail(cleaned)) {
        return cleaned;
      }
    }
  }
  for (const cand of candidates) {
    if (typeof cand === 'string' && cand.trim()) {
      return cand.trim();
    }
  }
  return fallback;
};

const DeliveryTicks = ({ msg }) => {
  const isRead = Boolean(msg.is_read);
  const isDelivered = isRead || Boolean(msg.is_delivered) || Boolean(msg.id);

  if (!isDelivered) {
    return (
      <span
        className="inline-flex items-center text-[11px] text-blue-200/80 select-none"
        title="تم الإرسال"
      >
        ✓
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold tracking-tighter select-none ${
        isRead ? 'text-sky-300' : 'text-blue-100/80'
      }`}
      title={isRead ? 'تمت القراءة' : 'تم الاستلام'}
    >
      ✓✓
    </span>
  );
};

const Messenger = ({ token, darkMode, setCurrentView, initialRecipient, onMessagesRead }) => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [activeChatName, setActiveChatName] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');

  const messagesEndRef = useRef(null);

  // جلب هوية المستخدم الحالي الحقيقية (ID و username) من الـ API
  useEffect(() => {
    if (!token) {
      setCurrentUserId(null);
      return;
    }

    axios
      .get(`${API_BASE}/api/users/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const rawId = res.data?.id ?? res.data?.user_id ?? res.data?.pk ?? res.data?.user?.id;
        if (rawId !== undefined && rawId !== null && !Number.isNaN(Number(rawId))) {
          setCurrentUserId(Number(rawId));
        }
        const rawUsername = res.data?.username ?? res.data?.user?.username;
        if (rawUsername) {
          setCurrentUsername(String(rawUsername));
          localStorage.setItem('username', String(rawUsername));
        }
      })
      .catch((err) => {
        console.error('خطأ في جلب بيانات المستخدم الحالي:', err.response?.data || err);
      });
  }, [token]);

  // تعبئة بيانات المالك تلقائياً عند الانتقال من كرت العقار
  useEffect(() => {
    if (initialRecipient) {
      if (initialRecipient.id !== undefined && initialRecipient.id !== null) {
        setRecipientId(String(initialRecipient.id));
      }
      const recipientFullName = pickBestName(
        [
          initialRecipient.full_name,
          initialRecipient.fullName,
          buildFullName(initialRecipient.first_name, initialRecipient.last_name),
          initialRecipient.name
        ],
        ''
      );
      setActiveChatName(recipientFullName);
      setSendError('');
    }
  }, [initialRecipient]);

  // التمرير التلقائي لأسفل المحادثة عند وصول رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isSenderMe = useCallback(
    (msg) => {
      const msgSenderId = msg.sender ?? msg.sender_id;
      const numericSenderId =
        msgSenderId !== undefined && msgSenderId !== null ? Number(msgSenderId) : null;
      const numericRecipientId = recipientId ? Number(recipientId) : null;

      if (currentUserId !== null && numericSenderId !== null && !Number.isNaN(numericSenderId)) {
        return numericSenderId === Number(currentUserId);
      }

      if (
        numericRecipientId &&
        numericSenderId !== null &&
        !Number.isNaN(numericSenderId)
      ) {
        return numericSenderId !== numericRecipientId;
      }

      const senderLabel = msg.sender_name || msg.sender_username || '';
      return Boolean(currentUsername) && senderLabel === currentUsername;
    },
    [currentUserId, currentUsername, recipientId]
  );

  const getOtherPartyName = useCallback(
    (msg) => {
      const iAmSender = isSenderMe(msg);
      if (iAmSender) {
        return pickBestName(
          [
            msg.receiver_full_name,
            buildFullName(msg.receiver_first_name, msg.receiver_last_name),
            msg.receiver_name,
            msg.receiver_username
          ],
          'مستخدم'
        );
      }
      return pickBestName(
        [
          msg.sender_full_name,
          buildFullName(msg.sender_first_name, msg.sender_last_name),
          msg.sender_name,
          msg.sender_username
        ],
        'مستخدم'
      );
    },
    [isSenderMe]
  );

  // جلب قائمة المحادثات السابقة للمستخدم الحالي
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/api/messages/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allMsgs = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

      const convMap = new Map();
      for (const msg of allMsgs) {
        const iAmSender = isSenderMe(msg);
        const rawReceiverId = msg.receiver ?? msg.receiver_id;
        const rawSenderId = msg.sender ?? msg.sender_id;
        const otherId = iAmSender ? rawReceiverId : rawSenderId;
        const otherName = getOtherPartyName(msg);

        const numericOtherId = Number(otherId);
        if (!numericOtherId) continue;
        if (currentUserId !== null && numericOtherId === Number(currentUserId)) continue;

        if (!convMap.has(numericOtherId)) {
          convMap.set(numericOtherId, {
            id: numericOtherId,
            name: otherName,
            lastMessage: msg.content || ''
          });
        } else if (looksLikeEmail(convMap.get(numericOtherId).name) && !looksLikeEmail(otherName)) {
          convMap.get(numericOtherId).name = otherName;
        }
      }

      setConversations(Array.from(convMap.values()));
    } catch (err) {
      console.error('خطأ في جلب قائمة المحادثات:', err.response?.data || err);
    }
  }, [token, currentUserId, isSenderMe, getOtherPartyName]);

  // جلب رسائل المحادثة المحددة
  const fetchMessages = useCallback(async () => {
    const receiverNum = Number(recipientId);
    if (!receiverNum || !token) return;

    try {
      const res = await axios.get(`${API_BASE}/api/messages/?user_id=${receiverNum}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

      setMessages(list);

      if (list.length > 0 && (!activeChatName || looksLikeEmail(activeChatName))) {
        const resolved = getOtherPartyName(list[0]);
        if (resolved) setActiveChatName(resolved);
      }
    } catch (err) {
      console.error('خطأ في جلب الرسائل:', err.response?.data || err);
    }
  }, [recipientId, token, activeChatName, getOtherPartyName]);

  // تحديث عداد الإشعارات بعد فتح المحادثة وقراءة الرسائل
  useEffect(() => {
    if (recipientId && messages.length > 0 && typeof onMessagesRead === 'function') {
      onMessagesRead();
    }
  }, [recipientId, messages.length, onMessagesRead]);

  useEffect(() => {
    if (!token) {
      setConversations([]);
      return;
    }
    fetchConversations();
    const convInterval = setInterval(fetchConversations, 5000);
    return () => clearInterval(convInterval);
  }, [token, fetchConversations]);

  useEffect(() => {
    const receiverNum = Number(recipientId);
    if (!receiverNum || !token) {
      setMessages([]);
      return;
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [recipientId, token, fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const receiverNum = Number(recipientId);
    const trimmedContent = newMessage.trim();

    if (!trimmedContent || !token) return;

    if (!receiverNum || Number.isNaN(receiverNum)) {
      setSendError('يرجى اختيار محادثة أو الضغط على "تواصل" من أحد العقارات أولاً.');
      return;
    }

    try {
      setSendError('');
      setIsSending(true);

      await axios.post(
        `${API_BASE}/api/messages/`,
        {
          receiver: receiverNum,
          content: trimmedContent
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNewMessage('');
      await Promise.all([fetchMessages(), fetchConversations()]);
    } catch (err) {
      const serverData = err.response?.data;
      console.error('خطأ في إرسال الرسالة:', serverData || err);

      if (typeof serverData === 'string') {
        setSendError(serverData);
      } else if (serverData && typeof serverData === 'object') {
        setSendError(serverData.detail || JSON.stringify(serverData));
      } else {
        setSendError('تعذر إرسال الرسالة، تحقق من البيانات أو اتصال السيرفر.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const safeMessages = Array.isArray(messages) ? messages : [];
  const displayChatName = pickBestName([activeChatName], 'مستخدم');

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6 h-[calc(100vh-90px)] flex flex-col" dir="rtl">
      {/* شريط علوي مصغر للصفحة */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          المحادثات المباشرة 💬
        </h2>
        <button
          type="button"
          onClick={() => setCurrentView('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>العودة للرئيسية</span>
          <span>←</span>
        </button>
      </div>

      {/* حاوية المسنجر الرئيسية */}
      <div
        className={`flex-1 rounded-3xl border shadow-xl overflow-hidden flex flex-col md:flex-row ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* العمود الأيمن: المحادثات السابقة */}
        <div
          className={`w-full md:w-80 border-b md:border-b-0 md:border-l p-4 flex flex-col gap-3 ${
            darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/70 border-slate-200'
          }`}
        >
          <p className="text-xs font-bold text-slate-400">المحادثات</p>

          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center text-xs text-slate-400 mt-6 p-4 border border-dashed rounded-2xl border-slate-300 dark:border-slate-700">
                لا توجد محادثات سابقة بعد. اضغط &quot;تواصل&quot; على أي عقار لبدء محادثة جديدة.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = String(conv.id) === String(recipientId);
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setRecipientId(String(conv.id));
                      setActiveChatName(conv.name);
                      setSendError('');
                    }}
                    className={`w-full text-right p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? darkMode
                          ? 'bg-blue-900/30 border-blue-600/60 text-white'
                          : 'bg-blue-50 border-blue-200 text-slate-900'
                        : darkMode
                          ? 'bg-slate-800/50 border-slate-800 text-slate-200 hover:bg-slate-800'
                          : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold">
                      {conv.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold truncate">{conv.name}</h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {conv.lastMessage || 'اضغط لفتح المحادثة'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* العمود الأيسر: الرسائل والإرسال */}
        <div className="flex-1 flex flex-col h-full">
          <div
            className={`p-4 border-b flex items-center gap-3 ${
              darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-white'
            }`}
          >
            {recipientId ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {displayChatName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{displayChatName}</h3>
                  <p className="text-[11px] text-slate-400">محادثة مباشرة عبر عقارهب</p>
                </div>
              </>
            ) : (
              <span className="text-sm font-bold text-slate-400">لم يتم تحديد محادثة</span>
            )}
          </div>

          <div
            className={`flex-1 p-5 overflow-y-auto flex flex-col gap-3 ${
              darkMode ? 'bg-slate-950/40' : 'bg-slate-50/30'
            }`}
          >
            {!recipientId ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="text-4xl">💬</span>
                <p className="text-sm font-medium">اختر محادثة من القائمة لبدء الدردشة</p>
              </div>
            ) : safeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="text-3xl">👋</span>
                <p className="text-sm font-medium">لا توجد رسائل سابقة. أرسل رسالتك الأولى!</p>
              </div>
            ) : (
              safeMessages.map((msg, idx) => {
                const isMe = isSenderMe(msg);
                const timeLabel = formatTime(msg.timestamp || msg.created_at);
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col max-w-[75%] ${
                      isMe ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                      {isMe ? 'أنت' : displayChatName}
                    </span>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tl-none'
                          : darkMode
                            ? 'bg-slate-800 text-slate-200 rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tr-none'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {timeLabel && (
                          <span
                            className={`text-[10px] ${
                              isMe ? 'text-blue-100/80' : 'text-slate-400'
                            }`}
                          >
                            {timeLabel}
                          </span>
                        )}
                        {isMe && <DeliveryTicks msg={msg} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div
            className={`p-4 border-t ${
              darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}
          >
            {sendError && (
              <div className="mb-2.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold break-all">
                {sendError}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                disabled={!recipientId || isSending}
                placeholder={recipientId ? 'اكتب رسالتك هنا...' : 'حدد محادثة أولاً للكتابة...'}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-2xl text-sm border outline-none transition-all disabled:opacity-50 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                }`}
              />
              <button
                type="submit"
                disabled={!recipientId || !newMessage.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-md"
              >
                {isSending ? 'جارٍ الإرسال...' : 'إرسال'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messenger;