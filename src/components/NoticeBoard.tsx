import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, setDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Notice, Comment } from '../types';
import { 
  AlertCircle, MessageSquare, Heart, Vote as VoteIcon, Trash2, Plus, X, ListPlus, Check, Sparkles 
} from 'lucide-react';

interface NoticeBoardProps {
  currentUser: { uid: string; email: string; displayName: string; photoURL: string };
  isOfficer: boolean;
  canManageNotice?: boolean;
}

export default function NoticeBoard({ currentUser, isOfficer, canManageNotice = isOfficer }: NoticeBoardProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);

  // States for creating a notice
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [addPoll, setAddPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Expanded notice states (comments, likes, votes)
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [votes, setVotes] = useState<{ [userId: string]: number }>({});
  const [userVote, setUserVote] = useState<number | null>(null);

  // Load notices path listener
  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Notice[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Notice);
      });
      setNotices(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notices');
    });

    return () => unsubscribe();
  }, []);

  // Listen to comments, likes, and votes for active Notice
  useEffect(() => {
    if (!activeNoticeId) {
      setComments([]);
      setLikesCount(0);
      setIsLiked(false);
      setVotes({});
      setUserVote(null);
      return;
    }

    // 1. Comments listener
    const commentsQuery = query(
      collection(db, `notices/${activeNoticeId}/comments`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `notices/${activeNoticeId}/comments`);
    });

    // 2. Likes listener
    const likesRef = collection(db, `notices/${activeNoticeId}/likes`);
    const unsubscribeLikes = onSnapshot(likesRef, (snapshot) => {
      setLikesCount(snapshot.size);
      let userHasLiked = false;
      snapshot.forEach((doc) => {
        if (doc.id === currentUser.uid) {
          userHasLiked = true;
        }
      });
      setIsLiked(userHasLiked);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `notices/${activeNoticeId}/likes`);
    });

    // 3. Votes listener
    const votesRef = collection(db, `notices/${activeNoticeId}/votes`);
    const unsubscribeVotes = onSnapshot(votesRef, (snapshot) => {
      const voteMap: { [userId: string]: number } = {};
      let userSelected: number | null = null;
      snapshot.forEach((doc) => {
        const d = doc.data();
        voteMap[doc.id] = d.optionIndex;
        if (doc.id === currentUser.uid) {
          userSelected = d.optionIndex;
        }
      });
      setVotes(voteMap);
      setUserVote(userSelected);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `notices/${activeNoticeId}/votes`);
    });

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
      unsubscribeVotes();
    };
  }, [activeNoticeId, currentUser.uid]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const filteredOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (addPoll && (filteredOptions.length < 2 || !pollQuestion.trim())) {
      alert('투표를 만드시려면 질문과 최소 2개 이상의 선택지를 입력해 주세요.');
      return;
    }

    try {
      const noticesCol = collection(db, 'notices');
      const docRef = doc(noticesCol); // Generate custom doc ID to check in rules
      
      const payload: any = {
        id: docRef.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL,
        createdAt: serverTimestamp(),
        hasPoll: addPoll,
      };

      if (addPoll) {
        payload.pollQuestion = pollQuestion.trim();
        payload.pollOptions = filteredOptions;
      }

      await setDoc(docRef, payload);

      // Clean up states
      setNewTitle('');
      setNewContent('');
      setAddPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowCreateModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notices');
    }
  };

  const handleDeleteNotice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'notices', id));
      if (activeNoticeId === id) {
        setActiveNoticeId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notices/${id}`);
    }
  };

  // Toggle Like Status
  const handleToggleLike = async () => {
    if (!activeNoticeId) return;
    const likeDocRef = doc(db, `notices/${activeNoticeId}/likes`, currentUser.uid);

    try {
      if (isLiked) {
        await deleteDoc(likeDocRef);
      } else {
        await setDoc(likeDocRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notices/${activeNoticeId}/likes/${currentUser.uid}`);
    }
  };

  // Submit Comments
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeNoticeId) return;

    try {
      const commentRef = doc(collection(db, `notices/${activeNoticeId}/comments`));
      await setDoc(commentRef, {
        id: commentRef.id,
        noticeId: activeNoticeId,
        content: newComment.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `notices/${activeNoticeId}/comments`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activeNoticeId) return;
    if (!confirm('정말로 댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, `notices/${activeNoticeId}/comments`, commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notices/${activeNoticeId}/comments/${commentId}`);
    }
  };

  // Cast a Vote in notice poll
  const handleCastVote = async (optionIndex: number) => {
    if (!activeNoticeId) return;
    const voteDocRef = doc(db, `notices/${activeNoticeId}/votes`, currentUser.uid);

    try {
      await setDoc(voteDocRef, {
        userId: currentUser.uid,
        optionIndex,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notices/${activeNoticeId}/votes/${currentUser.uid}`);
    }
  };

  const handleAddOptionInput = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOptionInput = (index: number) => {
    if (pollOptions.length > 2) {
      const list = [...pollOptions];
      list.splice(index, 1);
      setPollOptions(list);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const list = [...pollOptions];
    list[idx] = val;
    setPollOptions(list);
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Poll percentage calculator helper
  const getPollStats = (options: string[] | undefined) => {
    if (!options) return { total: 0, counts: [], percentages: [] };
    const counts = options.map(() => 0);
    let total = 0;

    Object.values(votes).forEach((val) => {
      const optIndex = val as number;
      if (optIndex >= 0 && optIndex < counts.length) {
        counts[optIndex]++;
        total++;
      }
    });

    const percentages = counts.map((count) => 
      total === 0 ? 0 : Math.round((count / total) * 100)
    );

    return { total, counts, percentages };
  };

  const activeNotice = notices.find(n => n.id === activeNoticeId);
  const pollStats = activeNotice ? getPollStats(activeNotice.pollOptions) : null;

  return (
    <div className="space-y-6" id="notice-board-container">
      {/* Notice header banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📢 공지사항</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">Notice</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">K.F.C. 동아리의 공식 소식과 긴급 안내를 전해드립니다.</p>
        </div>

        {canManageNotice && (
          <button
            id="create-notice-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>공지 신규 작성</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm font-mono">로딩 중...</div>
      ) : notices.length === 0 ? (
        <div className="bg-[#121216] border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
          현재 등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main list */}
          <div className={`${activeNoticeId ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4 max-h-[800px] overflow-y-auto pr-1`}>
            {notices.map((notice) => (
              <div
                id={`notice-card-${notice.id}`}
                key={notice.id}
                onClick={() => setActiveNoticeId(notice.id)}
                className={`p-5 rounded-xl border transition duration-200 cursor-pointer ${
                  activeNoticeId === notice.id
                    ? 'bg-blue-600/5 border-blue-500/50 shadow-md shadow-blue-550/5'
                    : 'bg-[#121216] border-slate-800/80 hover:bg-[#121216]/65 hover:border-slate-750/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src={notice.authorPhoto} 
                      alt={notice.authorName} 
                      className="w-5 h-5 rounded-full object-cover border border-slate-700"
                    />
                    <span className="text-xs text-slate-400 font-medium">{notice.authorName}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500 font-mono">{formatTimestamp(notice.createdAt)}</span>
                  </div>

                  {canManageNotice && (
                    <button
                      id={`delete-notice-btn-${notice.id}`}
                      onClick={(e) => handleDeleteNotice(notice.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-800/50 transition cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-blue-400 transition mb-2">
                  {notice.title}
                </h3>

                <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed mb-4 whitespace-pre-wrap">
                  {notice.content}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <span>자세히 보기 & 댓글 작성</span>
                  </div>
                  {notice.hasPoll && (
                    <span className="flex items-center gap-1 text-blue-405 font-medium bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
                      <VoteIcon className="w-3.5 h-3.5" />
                      투표 포함
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Details & Comments section */}
          <AnimatePresence>
            {activeNoticeId && activeNotice && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-6 bg-[#121216] border border-slate-800 rounded-xl p-6 relative lg:sticky lg:top-4 overflow-y-auto max-h-[800px]"
                id="notice-details-panel"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <span className="text-xs text-slate-500 font-mono">세부사항 및 소통 창구</span>
                  <button
                    id="close-details-btn"
                    onClick={() => setActiveNoticeId(null)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                  >
                    <X className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                {/* Header Author Info */}
                <div className="flex items-center gap-3 mb-4 bg-[#0A0A0C]/50 p-3 rounded-lg border border-slate-800/60">
                  <img src={activeNotice.authorPhoto} alt={activeNotice.authorName} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  <div>
                    <div className="font-semibold text-white text-sm">{activeNotice.authorName} (임원)</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{formatTimestamp(activeNotice.createdAt)}</div>
                  </div>
                </div>

                {/* Title and Content */}
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{activeNotice.title}</h3>
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed border-b border-slate-800 pb-6 mb-6">
                  {activeNotice.content}
                </p>

                {/* POLL WIDGET (Dynamic Voting) */}
                {activeNotice.hasPoll && activeNotice.pollOptions && pollStats && (
                  <div className="bg-[#0A0A0C]/50 border border-blue-500/20 rounded-xl p-5 mb-6" id="poll-widget">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1.5">
                      <VoteIcon className="w-4 h-4 text-blue-500" />
                      <span>{activeNotice.pollQuestion}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">하나를 선택해 투표를 진행해 주세요. (실시간 반영)</p>

                    <div className="space-y-3">
                      {activeNotice.pollOptions.map((opt, idx) => {
                        const score = pollStats.counts[idx] || 0;
                        const pct = pollStats.percentages[idx] || 0;
                        const isChosen = userVote === idx;

                        return (
                          <div 
                            key={idx}
                            id={`poll-option-${idx}`}
                            onClick={() => handleCastVote(idx)}
                            className={`group relative p-3 rounded-lg border transition duration-150 cursor-pointer overflow-hidden ${
                              isChosen 
                                ? 'bg-blue-500/10 border-blue-500/40 font-medium' 
                                : 'bg-[#121216] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {/* Progress Fill bar in absolute background */}
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-blue-500/5 transition-all duration-300" 
                              style={{ width: `${pct}%` }} 
                            />

                            <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isChosen ? 'border-blue-500 bg-blue-500' : 'border-slate-700'
                                }`}>
                                  {isChosen && <Check className="w-3 h-3 text-white shrink-0 stroke-[3]" />}
                                </div>
                                <span className={isChosen ? 'text-blue-200' : 'text-slate-300'}>{opt}</span>
                              </div>
                              <span className="font-mono text-xs text-slate-400 shrink-0">{score}표 ({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 text-right text-xs text-slate-500 font-mono">
                      전체 투표수: {pollStats.total}표
                    </div>
                  </div>
                )}

                {/* LIKE TOGGLE PANEL */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-5">
                  <button
                    id="notice-like-btn"
                    onClick={handleToggleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition cursor-pointer select-none ${
                      isLiked 
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
                        : 'bg-[#0A0A0C]/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Heart className={`w-4.5 h-4.5 shrink-0 ${isLiked ? 'fill-rose-500' : ''}`} />
                    <span>좋아요 {likesCount}</span>
                  </button>

                  <span className="text-xs text-slate-500 font-mono">댓글 {comments.length}개</span>
                </div>

                {/* COMMENTS LIST */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-xs font-mono uppercase text-slate-500 tracking-wider">단원 소통 데크</h4>
                  
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">댓글이 없습니다. 첫 소통을 남겨보세요!</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {comments.map((comment) => (
                        <div 
                          key={comment.id} 
                          id={`comment-${comment.id}`}
                          className="bg-[#0A0A0C]/50 border border-slate-800/60 rounded-xl p-3 flex gap-3 text-xs"
                        >
                          <img 
                            src={comment.authorPhoto} 
                            alt={comment.authorName} 
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white">{comment.authorName}</span>
                                <span className="text-slate-600 font-mono text-[10px]">{formatTimestamp(comment.createdAt)}</span>
                              </div>

                              {(comment.authorId === currentUser.uid || canManageNotice) && (
                                <button
                                  id={`delete-comment-btn-${comment.id}`}
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-slate-600 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                </button>
                              )}
                            </div>
                            <p className="text-slate-300 mt-1 leading-relaxed break-words whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WRITE A COMMENT FORM */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    id="comment-input"
                    type="text"
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="공지글에 소통 댓글을 달아주세요..."
                    className="flex-1 px-3 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    id="comment-submit-btn"
                    type="submit"
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer"
                  >
                    등록
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" id="create-notice-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121216] border border-slate-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-blue-500" />
                  <span>공지사항 신규 등록</span>
                </h3>
                <button
                  id="close-create-modal"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5 shrink-0" />
                </button>
              </div>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 font-mono uppercase mb-1.5">공지 제목</label>
                  <input
                    id="notice-title-input"
                    type="text"
                    required
                    maxLength={100}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="제목을 입력하세요 (최대 100자)"
                    className="w-full px-4 py-2.5 bg-[#0A0A0C] border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 font-mono uppercase mb-1.5">상세 내용</label>
                  <textarea
                    id="notice-content-input"
                    required
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="안내할 공지 상세 내용을 입력해 주세요..."
                    className="w-full px-4 py-2.5 bg-[#0A0A0C] border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* POLL ADDITION TOGGLE */}
                <div className="bg-[#0A0A0C] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <VoteIcon className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">투표 컴포넌트 추가</span>
                        <span className="text-[10px] text-slate-500 block">설문이나 의사결정 수집을 위한 투표 섹션을 함께 포스팅합니다.</span>
                      </div>
                    </div>
                    <button
                      id="toggle-poll-btn"
                      type="button"
                      onClick={() => setAddPoll(!addPoll)}
                      className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none cursor-pointer ${
                        addPoll ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-[#0A0A0C] transition-transform duration-200 shadow-md ${
                        addPoll ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {addPoll && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-3 border-t border-slate-800"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">투표 질문</label>
                        <input
                          id="poll-question-input"
                          type="text"
                          required={addPoll}
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          placeholder="예: 이번 주 모임 참여 일자를 정해주세요."
                          className="w-full px-3 py-2 bg-[#121216] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                          <span>선택지 입력 (최소 2개, 최대 10개)</span>
                          {pollOptions.length < 10 && (
                            <button
                              id="add-poll-opt-btn"
                              type="button"
                              onClick={handleAddOptionInput}
                              className="text-[10px] text-blue-550 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <ListPlus className="w-3 h-3 shrink-0" />
                              <span>선택지 추가</span>
                            </button>
                          )}
                        </label>

                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex gap-2 items-center" id={`poll-opt-input-${idx}`}>
                            <input
                              id={`poll-opt-${idx}-field`}
                              type="text"
                              required={addPoll && idx < 2}
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              placeholder={`선택지 ${idx + 1}`}
                              className="flex-1 px-3 py-1.5 bg-[#121216] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                            {pollOptions.length > 2 && (
                               <button
                                 id={`remove-poll-opt-btn-${idx}`}
                                 type="button"
                                 onClick={() => handleRemoveOptionInput(idx)}
                                 className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                               >
                                 <X className="w-4 h-4 shrink-0" />
                               </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    id="cancel-create-btn"
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 bg-[#0A0A0C] hover:bg-slate-900 border border-slate-800 rounded-lg transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    id="submit-create-btn"
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                  >
                    공지 등록하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
