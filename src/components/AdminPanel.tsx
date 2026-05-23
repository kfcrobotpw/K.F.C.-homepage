import React, { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, doc, updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { 
  ShieldAlert, ShieldCheck, UserMinus, UserPlus, Users, Cpu, Key, Mail, Clock
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: { uid: string; email: string; displayName: string; photoURL: string };
}

export default function AdminPanel({ currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Stream registered users
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const toggleUserExpand = (userId: string) => {
    setExpandedUserIds(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleToggleOfficer = async (user: UserProfile) => {
    // Rules safeguard
    if (user.email === 'kfcrobotpw@gmail.com') {
      alert('마스터 최고 관리자 계정(kfcrobotpw@gmail.com)은 직책을 변경할 수 없습니다.');
      return;
    }

    if (user.id === currentUser.uid) {
      if (!confirm('본인의 관리자/임원 권한을 해제하시겠습니까? 해제 시 관리 기능 탭이 즉시 비활성화됩니다.')) {
        return;
      }
    }

    const nextStatus = !user.isOfficer;
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        isOfficer: nextStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleTogglePermission = async (user: UserProfile, permissionField: 'canManageNotice' | 'canManageResource' | 'canManageCalendar' | 'canManageExecutive') => {
    if (user.email === 'kfcrobotpw@gmail.com') {
      alert('최고 최고관리자는 모든 변경 사항이 고정되어 수정할 수 없습니다.');
      return;
    }

    const currentVal = !!user[permissionField];
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        [permissionField]: !currentVal
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  return (
    <div className="space-y-6" id="admin-panel-container">
      {/* SECTION HEADER */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>⚙️ 임원 및 역할 지정</span>
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">RBAC Admin Settings</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">동아리에 가입한 회원 목록을 모니터링하고, 특정 계정에 관리 권한 지정 및 임원으로 임명 또는 해임 처리를 대행할 수 있습니다.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm font-mono">단원 리스트를 로드 중...</div>
      ) : (
        <div className="bg-[#121216] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800 bg-[#0A0A0C]/40 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 uppercase">
              <Users className="w-4 h-4 text-blue-400" />
              <span>전체 등록 단원 수 ({users.length}명)</span>
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0C]/20 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4">단원 정보</th>
                  <th className="p-4">이메일 계정</th>
                  <th className="p-4">현재 등급</th>
                  <th className="p-4 text-right">관리 조치 및 개별 권한 지정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isMainAdmin = u.email === 'kfcrobotpw@gmail.com';
                  const isExpanded = !!expandedUserIds[u.id];
                  
                  return (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-[#0A0A0C]/20 transition-colors" id={`admin-user-row-${u.id}`}>
                        {/* User profile details */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.photoURL} 
                              alt={u.displayName} 
                              className="w-9 h-9 rounded-xl object-cover border border-slate-800"
                            />
                            <div>
                              <span className="text-sm font-bold text-white block">{u.displayName}</span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">UID: {u.id.substring(0, 10)}...</span>
                            </div>
                          </div>
                        </td>

                        {/* Email info */}
                        <td className="p-4">
                          <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-600" />
                            <span>{u.email}</span>
                          </span>
                        </td>

                        {/* Duty Status */}
                        <td className="p-4">
                          {isMainAdmin ? (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-lg font-semibold">
                              <Cpu className="w-3.5 h-3.5" />
                              최고 최고관리자
                            </span>
                          ) : u.isOfficer ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 bg-blue-500/15 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-lg font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                동아리 임원진
                              </span>
                              {/* Show badges for individual direct permissions */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {u.canManageNotice && (
                                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded font-medium">공지작성</span>
                                )}
                                {u.canManageResource && (
                                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded font-medium">자료삭제</span>
                                )}
                                {u.canManageCalendar && (
                                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded font-medium">일정작성</span>
                                )}
                                {u.canManageExecutive && (
                                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded font-medium">임원수정</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 bg-[#0A0A0C] border border-slate-800 text-slate-500 text-xs px-2.5 py-1 rounded-lg">
                                일반 정단원
                              </span>
                              {/* Show badges for individual direct permissions */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {u.canManageNotice && (
                                  <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.2 rounded">공지작성</span>
                                )}
                                {u.canManageResource && (
                                  <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.2 rounded">자료삭제</span>
                                )}
                                {u.canManageCalendar && (
                                  <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.2 rounded">일정작성</span>
                                )}
                                {u.canManageExecutive && (
                                  <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.2 rounded">임원수정</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Promotion Actions */}
                        <td className="p-4 text-right">
                          {isMainAdmin ? (
                            <span className="text-[10px] text-slate-500 font-mono italic">기본 마스터 보장</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {/* Directly configure dynamic permissions toggle */}
                              <button
                                id={`toggle-permissions-btn-${u.id}`}
                                onClick={() => toggleUserExpand(u.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight border transition cursor-pointer select-none ${
                                  isExpanded
                                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <Key className="w-3.5 h-3.5 shrink-0" />
                                <span>{isExpanded ? '접기' : '특정 권한부여'}</span>
                              </button>

                              <button
                                id={`toggle-officer-btn-${u.id}`}
                                onClick={() => handleToggleOfficer(u)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition cursor-pointer select-none ${
                                  u.isOfficer
                                    ? 'bg-rose-500/15 hover:bg-rose-500/35 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-600/15 hover:bg-emerald-600/35 text-emerald-400 border border-emerald-600/20'
                                }`}
                              >
                                {u.isOfficer ? (
                                  <>
                                    <UserMinus className="w-3.5 h-3.5 shrink-0" />
                                    <span>임원 해임</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                                    <span>임원 임명</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expanded ABAC direct configuration panel */}
                      {isExpanded && !isMainAdmin && (
                        <tr className="bg-[#0A0A0C]/50" id={`permissions-panel-row-${u.id}`}>
                          <td colSpan={4} className="p-4 border-t border-b border-slate-850 bg-[#0F0F12]/30">
                            <div className="bg-[#121216] border border-blue-900/15 rounded-xl p-4 space-y-3.5 max-w-4xl mx-auto shadow-inner text-left">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                                  <Key className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{u.displayName} {u.isOfficer ? '임원' : '단원'}의 개별 권한 관리</span>
                                </h4>
                                {u.isOfficer && (
                                  <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded font-mono font-medium animate-pulse">
                                    ⚠️ 임원 직책 상태 (행위 권한 별도 허용 필요)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {u.isOfficer
                                  ? "임원 직책을 지정하였어도 실제 보드별 글쓰기 및 제어 권한은 아래에서 개별 승인해야 위임됩니다."
                                  : "전체 임원으로 지정하지 않고도 특정 분야의 공유/수정/안내 권한만 유연하게 위임하고 싶을 때 사용합니다."
                                }
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {/* canManageNotice toggle */}
                                <label className={`flex items-start gap-2.5 p-3 rounded-lg border transition select-none cursor-pointer ${
                                  u.canManageNotice 
                                    ? 'bg-blue-500/5 border-blue-500/30 text-white font-medium border-blue-500/40 shadow shadow-blue-500/10' 
                                    : 'bg-[#0A0A0C] border-slate-800 text-slate-400 hover:border-slate-705'
                                }`}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!u.canManageNotice} 
                                    onChange={() => handleTogglePermission(u, 'canManageNotice')}
                                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="text-xs font-bold block">공지사항 관리</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">공지 등록 및 전체 댓글 삭제</span>
                                  </div>
                                </label>

                                {/* canManageResource toggle */}
                                <label className={`flex items-start gap-2.5 p-3 rounded-lg border transition select-none cursor-pointer ${
                                  u.canManageResource 
                                    ? 'bg-blue-500/5 border-blue-500/30 text-white font-medium border-blue-500/40 shadow shadow-blue-500/10' 
                                    : 'bg-[#0A0A0C] border-slate-800 text-slate-400 hover:border-slate-705'
                                }`}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!u.canManageResource} 
                                    onChange={() => handleTogglePermission(u, 'canManageResource')}
                                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="text-xs font-bold block">자료실 게시글 통제</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">단원들이 공유한 자료 강제 삭제</span>
                                  </div>
                                </label>

                                {/* canManageCalendar toggle */}
                                <label className={`flex items-start gap-2.5 p-3 rounded-lg border transition select-none cursor-pointer ${
                                  u.canManageCalendar 
                                    ? 'bg-blue-500/5 border-blue-500/30 text-white font-medium border-blue-500/40 shadow shadow-blue-500/10' 
                                    : 'bg-[#0A0A0C] border-slate-800 text-slate-400 hover:border-slate-705'
                                }`}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!u.canManageCalendar} 
                                    onChange={() => handleTogglePermission(u, 'canManageCalendar')}
                                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="text-xs font-bold block">일정 안내 관리</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">새 동아리 일정 추가 및 삭제</span>
                                  </div>
                                </label>

                                {/* canManageExecutive toggle */}
                                <label className={`flex items-start gap-2.5 p-3 rounded-lg border transition select-none cursor-pointer ${
                                  u.canManageExecutive 
                                    ? 'bg-blue-500/5 border-blue-500/30 text-white font-medium border-blue-500/40 shadow shadow-blue-500/10' 
                                    : 'bg-[#0A0A0C] border-slate-800 text-slate-400 hover:border-slate-705'
                                }`}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!u.canManageExecutive} 
                                    onChange={() => handleTogglePermission(u, 'canManageExecutive')}
                                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="text-xs font-bold block">임원진 프로필 편집</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">운영팀 소개 페이지 카드 등록</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
