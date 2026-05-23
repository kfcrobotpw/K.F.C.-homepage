import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

import LoginScreen from './components/LoginScreen';
import NoticeBoard from './components/NoticeBoard';
import ResourceShare from './components/ResourceShare';
import CalendarSection from './components/CalendarSection';
import ExecutiveSection from './components/ExecutiveSection';
import AdminPanel from './components/AdminPanel';

import { 
  Bell, BookOpen, Calendar, Info, ShieldAlert, Cpu, LogOut, ChevronRight, User, GraduationCap
} from 'lucide-react';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isOfficer, setIsOfficer] = useState(false);
  const [permissions, setPermissions] = useState({
    canManageNotice: false,
    canManageResource: false,
    canManageCalendar: false,
    canManageExecutive: false,
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notice' | 'resource' | 'calendar' | 'executive' | 'admin'>('notice');

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const loggedUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'K.F.C. 단원',
          photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=150',
        };

        setCurrentUser(loggedUser);
        
        // Ensure user registration is safely documented in Firestore users collection
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (!userSnap.exists()) {
            // New user registration
            const defaultOfficer = firebaseUser.email === 'kfcrobotpw@gmail.com';
            await setDoc(userDocRef, {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'K.F.C. 단원',
              photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=150',
              isOfficer: defaultOfficer,
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      } else {
        setCurrentUser(null);
        setIsOfficer(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time synchronization of the user's isOfficer capabilities
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setIsOfficer(!!d.isOfficer);
        setPermissions({
          canManageNotice: !!d.canManageNotice,
          canManageResource: !!d.canManageResource,
          canManageCalendar: !!d.canManageCalendar,
          canManageExecutive: !!d.canManageExecutive,
        });
      } else {
        // Default check if they logged-in via admin bypass
        const isDefaultOfficer = currentUser.email === 'kfcrobotpw@gmail.com';
        setIsOfficer(isDefaultOfficer);
        setPermissions({
          canManageNotice: isDefaultOfficer,
          canManageResource: isDefaultOfficer,
          canManageCalendar: isDefaultOfficer,
          canManageExecutive: isDefaultOfficer,
        });
      }
    }, (error) => {
      console.warn('Current user sync warning - permissions might be loading: ', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLoggedUser = async (user: AuthUser) => {
    setCurrentUser(user);
    
    // Direct registration sync for bypassed users
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        const defaultOfficer = user.email === 'kfcrobotpw@gmail.com' || user.uid.includes('admin');
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isOfficer: defaultOfficer,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setIsOfficer(false);
    setActiveTab('notice');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-slate-500 text-xs">
        동아리 네트워크 초기화 중...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLoggedUser} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-200 flex flex-col font-sans" id="app-main-portal">
      {/* Dynamic ambient grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F12_1px,transparent_1px),linear-gradient(to_bottom,#0F0F12_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* 1. PORTAL NAVIGATION HEADER */}
      <header className="h-16 border-b border-slate-800 bg-[#0F0F12] flex items-center sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/30">
              KFC
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-display leading-none">
                K.F.C. <span className="text-blue-500 font-normal text-xs ml-2 uppercase tracking-widest hidden sm:inline">Robot Research Club</span>
              </h1>
              <span className="text-[10px] text-slate-500 font-medium sm:hidden block mt-0.5">ROBOT RESEARCH</span>
            </div>
          </div>

          {/* User widget profile card */}
          <div className="flex items-center gap-3 pl-6">
            <img 
              src={currentUser.photoURL} 
              alt={currentUser.displayName} 
              className="w-9 h-9 rounded-full border border-blue-500/50 bg-[#121216] object-cover"
            />
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-white flex items-center justify-end gap-1.5">
                <span>{currentUser.displayName}</span>
                {isOfficer && (
                  <span className="bg-blue-600/15 text-blue-400 border border-blue-500/30 text-[9px] px-1 py-0.2 rounded font-medium">
                    임원
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 italic block truncate max-w-[150px]">{currentUser.email}</span>
            </div>

            <button
              id="header-logout-btn"
              onClick={handleLogout}
              className="p-1.5 px-2.5 text-slate-400 hover:text-white hover:bg-[#121216] border border-slate-800 hover:border-slate-700 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. TAB CONTROLS (Main Sub Navigation bar) */}
      <div className="border-b border-slate-800 bg-[#0F0F12]/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar scroll-smooth">
            <button
              id="tab-notice"
              onClick={() => setActiveTab('notice')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                activeTab === 'notice'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#121216]/80'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>공지사항</span>
            </button>

            <button
              id="tab-resource"
              onClick={() => setActiveTab('resource')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                activeTab === 'resource'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#121216]/80'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>자료 공유</span>
            </button>

            <button
              id="tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#121216]/80'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>일정 안내</span>
            </button>

            <button
              id="tab-executive"
              onClick={() => setActiveTab('executive')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                activeTab === 'executive'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#121216]/80'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>임원 소개</span>
            </button>

            {isOfficer && (
              <button
                id="tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 shrink-0 border border-dashed transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-blue-600/10 border-blue-500 text-blue-450 font-bold'
                    : 'text-slate-500 border-slate-800 hover:text-blue-400 hover:border-blue-500/30'
                }`}
              >
                <Cpu className="w-4 h-4 shrink-0" />
                <span>권한 관리</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. PORTAL CORE PANELS CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full z-15 relative">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'notice' && (
            <NoticeBoard currentUser={currentUser} isOfficer={isOfficer} canManageNotice={currentUser?.email === 'kfcrobotpw@gmail.com' || permissions.canManageNotice} />
          )}

          {activeTab === 'resource' && (
            <ResourceShare currentUser={currentUser} isOfficer={isOfficer} canManageResource={currentUser?.email === 'kfcrobotpw@gmail.com' || permissions.canManageResource} />
          )}

          {activeTab === 'calendar' && (
            <CalendarSection currentUser={currentUser} isOfficer={isOfficer} canManageCalendar={currentUser?.email === 'kfcrobotpw@gmail.com' || permissions.canManageCalendar} />
          )}

          {activeTab === 'executive' && (
            <ExecutiveSection currentUser={currentUser} isOfficer={isOfficer} canManageExecutive={currentUser?.email === 'kfcrobotpw@gmail.com' || permissions.canManageExecutive} />
          )}

          {activeTab === 'admin' && isOfficer && (
            <AdminPanel currentUser={currentUser} />
          )}
        </motion.div>
      </main>

      {/* Footer copyright decor */}
      <footer className="h-10 bg-[#0F0F12] border-t border-slate-800 flex items-center justify-between px-8 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 KFC ROBOTICS • YONGIN YOUTH CENTER</p>
          <p className="text-[9px]">Managed persistently with Google Cloud Firestore ABAC Security Framework.</p>
        </div>
      </footer>
    </div>
  );
}
