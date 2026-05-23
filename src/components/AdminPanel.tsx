import { useState, useEffect } from 'react';
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

  return (
    <div className="space-y-6" id="admin-panel-container">
      {/* SECTION HEADER */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>⚙️ 임원 및 역할 지정지</span>
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">RBAC Admin Settings</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">동아리에 최초 가입한 회원 목록을 모니터링하고, 특정 계정에 관리 권한 및 임원 등급을 지정할 수 있습니다.</p>
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
                  <th className="p-4 text-right">관리 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isMainAdmin = u.email === 'kfcrobotpw@gmail.com';
                  return (
                    <tr key={u.id} className="hover:bg-[#0A0A0C]/20 transition-colors" id={`admin-user-row-${u.id}`}>
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
                          <span className="inline-flex items-center gap-1 bg-blue-500/15 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-lg font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            동아리 임원진
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#0A0A0C] border border-slate-800 text-slate-500 text-xs px-2.5 py-1 rounded-lg">
                            일반 정단원
                          </span>
                        )}
                      </td>

                      {/* Promotion Actions */}
                      <td className="p-4 text-right">
                        {isMainAdmin ? (
                          <span className="text-[10px] text-slate-500 font-mono italic">기본 마스터 보장</span>
                        ) : (
                          <button
                            id={`toggle-officer-btn-${u.id}`}
                            onClick={() => handleToggleOfficer(u)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition cursor-pointer select-none ${
                              u.isOfficer
                                ? 'bg-rose-500/15 hover:bg-rose-500/35 text-rose-400 border border-rose-500/30'
                                : 'bg-blue-600/15 hover:bg-blue-600/35 text-blue-405 border border-blue-600/30'
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
                                <span>임원 지정</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
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
