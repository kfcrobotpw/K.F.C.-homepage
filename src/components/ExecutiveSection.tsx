import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDocs, where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Executive, Notice, Resource, UserProfile } from '../types';
import { 
  UserCircle, Settings, Edit, Trash2, Plus, X, Laptop, FileText, Calendar, Sparkles, Check, ChevronDown
} from 'lucide-react';

interface ExecutiveSectionProps {
  currentUser: { uid: string; email: string; displayName: string; photoURL: string };
  isOfficer: boolean;
}

export default function ExecutiveSection({ currentUser, isOfficer }: ExecutiveSectionProps) {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Filtering / Reading posts written by selected officer
  const [selectedExecutive, setSelectedExecutive] = useState<Executive | null>(null);
  const [officerNotices, setOfficerNotices] = useState<Notice[]>([]);
  const [officerResources, setOfficerResources] = useState<Resource[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Admin Profile Modifying modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modifying form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [linkedUserId, setLinkedUserId] = useState('');

  // Built-in cool photo presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150', // Developer Male
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', // Developer Female
    'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=150', // Robot Art 1
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150', // Robot Art 2
  ];

  useEffect(() => {
    // 1. Listen to Executive list
    const unsubscribeExec = onSnapshot(collection(db, 'executives'), (snapshot) => {
      const list: Executive[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Executive);
      });
      setExecutives(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'executives');
    });

    // 2. Listen to registered users (for link selection dropdown)
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
      unsubscribeExec();
      unsubscribeUsers();
    };
  }, []);

  // Fetch notices / resources belonging to clicking officer
  useEffect(() => {
    if (!selectedExecutive) {
      setOfficerNotices([]);
      setOfficerResources([]);
      return;
    }

    const loadOfficerFeed = async () => {
      setLoadingPosts(true);
      try {
        const uId = selectedExecutive.userId;
        // If not linked to a user account, default to matching name
        const matchField = uId ? 'authorId' : 'authorName';
        const matchVal = uId ? uId : selectedExecutive.name;

        // Fetch matching Notices
        const noticesQ = query(
          collection(db, 'notices'),
          where(matchField, '==', matchVal)
        );
        const noticesSnap = await getDocs(noticesQ);
        const fetchedNotices: Notice[] = [];
        noticesSnap.forEach(d => {
          fetchedNotices.push({ id: d.id, ...d.data() } as Notice);
        });

        // Fetch matching Resources
        const resQ = query(
          collection(db, 'resources'),
          where(matchField, '==', matchVal)
        );
        const resSnap = await getDocs(resQ);
        const fetchedRes: Resource[] = [];
        resSnap.forEach(d => {
          fetchedRes.push({ id: d.id, ...d.data() } as Resource);
        });

        setOfficerNotices(fetchedNotices);
        setOfficerResources(fetchedRes);
      } catch (err) {
        console.error('Error fetching officer posts: ', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadOfficerFeed();
  }, [selectedExecutive]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setRole('');
    setDescription('');
    setPhotoUrl(avatarPresets[0]);
    setLinkedUserId('');
    setShowEditModal(true);
  };

  const handleOpenEditModal = (exec: Executive) => {
    setEditingId(exec.id);
    setName(exec.name);
    setRole(exec.role);
    setDescription(exec.description);
    setPhotoUrl(exec.photoUrl);
    setLinkedUserId(exec.userId || '');
    setShowEditModal(true);
  };

  const handleSaveExecutive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !description.trim()) return;

    try {
      const execId = editingId || doc(collection(db, 'executives')).id;
      const docRef = doc(db, 'executives', execId);

      await setDoc(docRef, {
        id: execId,
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        photoUrl: photoUrl.trim() || avatarPresets[0],
        userId: linkedUserId || null,
        createdAt: serverTimestamp(),
      });

      setShowEditModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `executives/${editingId || 'new'}`);
    }
  };

  const handleDeleteExecutive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말로 이 임원 프로필을 목록에서 제외하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'executives', id));
      if (selectedExecutive?.id === id) {
        setSelectedExecutive(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `executives/${id}`);
    }
  };

  return (
    <div className="space-y-6" id="executive-section-container">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🛡️ 임원진 소개</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">Executives</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">K.F.C. 로봇동아리를 이끌어가는 든든한 운영진들입니다. 카드를 눌러 활동 기록을 조회해 보세요.</p>
        </div>

        {isOfficer && (
          <button
            id="register-exec-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-blue-500/15 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>임원 프로필 새로 등록</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm font-mono">로딩 중...</div>
      ) : executives.length === 0 ? (
        <div className="bg-[#121216] border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
          현재 등록된 임원이 없습니다. {isOfficer && "새 프로필을 등록해 임원진을 소개해 보세요!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Executive grid lists */}
          <div className={`${selectedExecutive ? 'lg:col-span-7' : 'lg:col-span-12'} grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-1`}>
            {executives.map((exec) => {
              const isSelected = selectedExecutive?.id === exec.id;
              return (
                <div
                  id={`executive-card-${exec.id}`}
                  key={exec.id}
                  onClick={() => setSelectedExecutive(exec)}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition duration-200 cursor-pointer shadow-md ${
                    isSelected
                      ? 'bg-blue-500/5 border-blue-500/60 shadow-blue-500/5'
                      : 'bg-[#121216] border-slate-800/80 hover:bg-[#121216]/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Upper row */}
                    <div className="flex justify-between items-start mb-4">
                      <img
                        src={exec.photoUrl}
                        alt={exec.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shadow"
                      />

                      {isOfficer && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`edit-exec-${exec.id}`}
                            onClick={() => handleOpenEditModal(exec)}
                            className="p-1.5 text-slate-405 hover:text-white rounded bg-[#0A0A0C] border border-slate-800 hover:border-slate-700 transition"
                            title="수정"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-exec-${exec.id}`}
                            onClick={(e) => handleDeleteExecutive(exec.id, e)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded bg-[#0A0A0C] border border-slate-800 hover:border-slate-700 transition"
                            title="임원 해임"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                      {exec.role}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2 mb-1">{exec.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed break-keep">{exec.description}</p>
                  </div>

                  {/* Footer item */}
                  <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500">
                    <span>누르고 해당 임원의 작성 글 조회</span>
                    {exec.userId && (
                      <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        계정 연동됨
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic officer's authored posts board */}
          <AnimatePresence>
            {selectedExecutive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-5 bg-[#121216] border border-slate-800 rounded-2xl p-6 relative lg:sticky lg:top-4 overflow-y-auto max-h-[800px] shadow-lg"
                id="executive-posts-panel"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <span className="text-xs font-mono text-slate-500">임원이 창작한 공간 피드</span>
                  <button
                    id="close-posts-panel"
                    onClick={() => setSelectedExecutive(null)}
                    className="p-1.5 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                <div className="flex items-center gap-3.5 mb-5 p-3.5 bg-[#0A0A0C]/50 border border-slate-800 rounded-xl">
                  <img src={selectedExecutive.photoUrl} alt={selectedExecutive.name} className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                  <div>
                    <h3 className="font-bold text-white text-base leading-none">{selectedExecutive.name}</h3>
                    <span className="text-xs text-blue-400 mt-1 block">{selectedExecutive.role}</span>
                  </div>
                </div>

                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <span>임원이 포스팅한 내역</span>
                </h4>

                {loadingPosts ? (
                  <div className="text-xs text-slate-500 font-mono py-8 text-center animate-pulse">포스트 탐색 중...</div>
                ) : officerNotices.length === 0 && officerResources.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-8 border border-dashed border-slate-800 rounded-lg text-center bg-[#0A0A0C]/30">
                    아직 등록한 피드 또는 공유 자료가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Notice Board list */}
                    {officerNotices.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-blue-400 font-bold font-mono">📢 공지사항 고정글 ({officerNotices.length})</span>
                        {officerNotices.map((n) => (
                          <div key={n.id} className="bg-[#0A0A0C]/50 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-350">
                            <h5 className="font-bold text-white mb-1 line-clamp-1">{n.title}</h5>
                            <p className="text-slate-400 line-clamp-2 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resources Shared list */}
                    {officerResources.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-bold font-mono">📂 공유한 학습 자산 ({officerResources.length})</span>
                        {officerResources.map((r) => (
                          <div key={r.id} className="bg-[#0A0A0C]/50 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-350">
                            <h5 className="font-bold text-white mb-1 line-clamp-1">{r.title}</h5>
                            <p className="text-slate-400 line-clamp-2 leading-relaxed">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CREATE / EDIT EXECUTIVE DETAILS MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" id="edit-executive-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121216] border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <UserCircle className="w-5 h-5 text-blue-400" />
                  <span>{editingId ? '운영 임원 상세 변경' : '운영 임원 프로필 신설'}</span>
                </h3>
                <button
                  id="close-edit-modal-btn"
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExecutive} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">임원 성명</label>
                  <input
                    id="exec-name-input"
                    type="text"
                    required
                    maxLength={30}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">동아리 직책</label>
                  <input
                    id="exec-role-input"
                    type="text"
                    required
                    maxLength={30}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="예: 하드웨어 기술팀장"
                    className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">한줄 약력 / 설명</label>
                  <textarea
                    id="exec-desc-input"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="로봇동아리 K.F.C.에서의 담당 역할 및 하고 싶은 한 마디를 적어주세요..."
                    className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Account Link Dropdown (connecting User profile UID) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>실제 동아리 회원 계정 연동</span>
                    <span className="text-[10px] text-slate-500 font-medium">연동 시 작성글 실시간 조회 연계</span>
                  </label>
                  <div className="relative">
                    <select
                      id="exec-user-link-select"
                      value={linkedUserId}
                      onChange={(e) => setLinkedUserId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs text-white appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">계정 연동 안 함 (단순 표시 프로필)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName} ({u.email.substring(0, 15)}...)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    id="cancel-exec-edit"
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 bg-[#0A0A0C] hover:bg-slate-900 border border-slate-800 rounded-lg transition"
                  >
                    취소
                  </button>
                  <button
                    id="submit-exec-save"
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                  >
                    등록 완료
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
