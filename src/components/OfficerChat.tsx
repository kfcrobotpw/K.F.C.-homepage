import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Send, MessageSquare, ShieldAlert, Trash2, Search, Users, Clock, Flame, Shield, UserCheck 
} from 'lucide-react';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

interface OfficerChatProps {
  currentUser: AuthUser;
  isOfficer: boolean;
}

interface ChatMsg {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  createdAt: any;
}

export default function OfficerChat({ currentUser, isOfficer }: OfficerChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Real-time synchronization
  useEffect(() => {
    if (!isOfficer) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText('');

    const chatColRef = collection(db, 'officer_messages');
    const q = query(chatColRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMsg[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          msgs.push({
            id: docSnap.id,
            content: data.content || '',
            senderId: data.senderId || '',
            senderName: data.senderName || '',
            senderPhoto: data.senderPhoto || '',
            createdAt: data.createdAt,
          });
        });
        setMessages(msgs);
        setLoading(false);

        // Scroll to bottom on new message
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      },
      (error) => {
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, 'officer_messages');
        } catch (e: any) {
          setErrorText('메시지를 불러오는 도중 권한 오류가 발생했습니다.');
        }
      }
    );

    return () => unsubscribe();
  }, [isOfficer]);

  // Scroll to bottom on load
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, 'officer_messages', msgId);
      
      const payload = {
        id: msgId,
        content: textToSend,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        createdAt: serverTimestamp(),
      };

      await setDoc(docRef, payload);
      
      // Auto scroll
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'officer_messages');
      } catch (e: any) {
        alert('메시지 전송에 실패했습니다. 권한을 확인해주세요.');
      }
    }
  };

  const handleDeleteMessage = async (msgId: string, senderId: string) => {
    const isOwner = senderId === currentUser.uid;
    const isAdminBypass = currentUser.email === 'kfcrobotpw@gmail.com';

    if (!isOwner && !isAdminBypass) {
      alert('본인이 작성한 메시지만 삭제할 수 있습니다.');
      return;
    }

    if (!confirm('이 메시지를 정말 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'officer_messages', msgId));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, 'officer_messages');
      } catch (e: any) {
        alert('메시지 삭제 권한이 없습니다.');
      }
    }
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter((msg) => {
    const queryLower = searchQuery.toLowerCase();
    return (
      msg.content.toLowerCase().includes(queryLower) ||
      msg.senderName.toLowerCase().includes(queryLower)
    );
  });

  // Access check lock UI
  if (!isOfficer) {
    return (
      <div className="max-w-md mx-auto py-16 px-4" id="officer-lockout-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#121216] border border-red-900/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-650/10 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-wide">임원 전용 구역</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              죄송합니다. 이 공간은 동아리 **임원(Officer)** 전용 회의실입니다.<br />
              임원으로 지정되지 않은 일반 회원은 접속할 수 없습니다.<br />
              임원 권한이 필요하시다면 마스터 계정으로 로그인하시거나 권한 승인을 요청해 주세요.
            </p>
          </div>
          <div className="text-[10px] bg-red-500/5 text-red-400/80 p-2.5 rounded-lg border border-red-500/10 font-mono">
            AUTHENTICATION: MEMBER_ACCESS_DENIED
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[750px] flex flex-col bg-[#121216] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl" id="officer-chatroom-viewport">
      {/* 1. HEADER CONTROL RAIL */}
      <div className="p-4 bg-[#16161D] border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🛡️ 임원 실시간 소통방</span>
              <span className="text-[9px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono font-bold font-semibold">SECURE HUB</span>
            </h2>
            <div className="flex items-center gap-2 text-slate-450 text-xs mt-0.5">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>동아리 임원진 전용 채널</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                Online Realtime
              </span>
            </div>
          </div>
        </div>

        {/* Search bar inside header */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="메시지 또는 보낸이 검색..."
            className="w-full pl-9 pr-4 py-2 bg-[#0A0A0C]/80 border border-slate-800 focus:border-blue-500/50 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 2. CHAT FEED BLOCK */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#0A0A0C]/90 relative" style={{ minHeight: 0 }}>
        {errorText && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️ {errorText}</span>
          </div>
        )}

        {loading ? (
          <div className="h-full flex items-center justify-center font-mono text-xs text-slate-500">
            대화 내역을 가져오는 중...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-800/45 flex items-center justify-center text-slate-500">
              <MessageSquare className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-slate-450 text-xs">
              {searchQuery ? '검색된 대화 메시지가 없습니다.' : '임원 톡방의 첫 메시지를 전송해 보세요! (보안 통신 탑재)'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.senderId === currentUser.uid;
            
            // Format Timestamp
            let displayTime = '';
            if (msg.createdAt) {
              const date = msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
              displayTime = date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
            } else {
              displayTime = '방금 전';
            }

            // Check if sender is master admin
            const isSenderMaster = msg.senderId.includes('admin') || msg.senderName.includes('관리자') || msg.senderName.includes('KFC');

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Profile Photo */}
                <div className="shrink-0">
                  <img
                    src={msg.senderPhoto}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900 object-cover"
                  />
                </div>

                {/* Message Bubble + Meta details */}
                <div className={`space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {/* Sender nickname label */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-550 font-bold tracking-tight">
                    <span className="text-slate-350">{msg.senderName}</span>
                    {isSenderMaster && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] px-1 rounded flex items-center gap-0.5">
                        <Flame className="w-2 h-2" />
                        마스터
                      </span>
                    )}
                    {!isSenderMaster && (
                      <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[8px] px-1 rounded flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        임원
                      </span>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className="relative group/msg flex items-end gap-2 justify-end">
                    {/* Timestamp on opposite side of bubble */}
                    {isMe && (
                      <span className="text-[9px] font-mono text-slate-600 self-end mb-0.5 shrink-0 selection:bg-transparent">
                        {displayTime}
                      </span>
                    )}

                    <div
                      className={`p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-md transition-all ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-[#16161D] text-slate-200 border border-slate-805/90 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {!isMe && (
                      <span className="text-[9px] font-mono text-slate-600 self-end mb-0.5 shrink-0 selection:bg-transparent">
                        {displayTime}
                      </span>
                    )}

                    {/* Delete trigger */}
                    {(isMe || currentUser.email === 'kfcrobotpw@gmail.com') && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id, msg.senderId)}
                        className={`opacity-0 group-hover/msg:opacity-100 p-1 hover:bg-slate-800 rounded transition duration-150 cursor-pointer ${
                          isMe ? 'order-first text-slate-650 hover:text-red-400' : 'text-slate-650 hover:text-red-400'
                        }`}
                        title="메시지 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* 3. INPUT COMPONENT BAR */}
      <div className="p-4 bg-[#16161D] border-t border-slate-800">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="임원 회의방에 전송할 한 장의 메시지를 입력하세요... (최대 1500자)"
            maxLength={1500}
            className="flex-1 px-4 py-3 bg-[#0A0A0C] border border-slate-800 hover:border-slate-700 focus:border-blue-500/50 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition duration-155"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800/80 disabled:text-slate-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs select-none cursor-pointer shadow-lg shadow-blue-900/10 active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">전송</span>
          </button>
        </form>

        {/* Quick notification bottom prompt */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-550 font-mono mt-2.5">
          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>보안 경고: 본 화면은 승인된 임원 전용 채널로, 나누신 대화는 실시간으로 암호화되어 동기화됩니다.</span>
        </div>
      </div>
    </div>
  );
}
