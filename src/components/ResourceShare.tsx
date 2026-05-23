import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ExternalLink, Sparkles, Compass, ShieldCheck, FileText } from 'lucide-react';

interface ResourceShareProps {
  currentUser: { uid: string; email: string; displayName: string; photoURL: string };
  isOfficer: boolean;
  canManageResource?: boolean;
}

export default function ResourceShare({ currentUser, isOfficer }: ResourceShareProps) {
  const NOTION_URL = "https://zigzag-mandrill-e69.notion.site/369222875606804385a8ebd2673b8a20?source=copy_link";

  useEffect(() => {
    // Automatically trigger navigation in a new tab on mount
    const timer = setTimeout(() => {
      window.open(NOTION_URL, '_blank');
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenNotion = () => {
    window.open(NOTION_URL, '_blank');
  };

  return (
    <div className="space-y-6" id="resource-share-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📂 자료 공유</span>
            <span className="text-xs bg-[#4078c0]/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">Notion Workspace</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">로봇 제작 매뉴얼, 설계 코드, 연구 자료가 동아리 통합 노션 허브로 이관되었습니다.</p>
        </div>
      </div>

      {/* CORE INTEGRATION CONNECTOR CARD */}
      <div className="max-w-2xl mx-auto py-8">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#121216] border border-blue-900/15 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden shadow-2xl"
          id="notion-connector-box"
        >
          {/* Decorative faint background glow */}
          <div className="absolute -top-24 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Connected Icon Badge Loop */}
          <div className="flex items-center justify-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono rounded-full font-bold uppercase tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping mr-0.5" />
              Connected
            </div>
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-white text-xl shadow-md select-none font-display">
              N
            </div>
          </div>

          {/* Central Notification copy */}
          <div className="space-y-2.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>노션 자료 공유 허브 연동 완료</span>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              새 창(탭)에서 K.F.C. 연구개발 자료실 노션 페이지를 열고 있습니다.<br />
              만약 새 창이 자동으로 열리지 않는다면 아래의 수동 입장 버튼을 클릭해 주세요.
            </p>
          </div>

          {/* Call to action Button */}
          <div className="pt-2">
            <button
              id="goto-external-notion-btn"
              onClick={handleOpenNotion}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-650 to-blue-550 hover:from-blue-600 hover:to-blue-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-900/30 transition hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>노션(Notion) 허브 바로가기</span>
            </button>
          </div>

          {/* Quick link metadata info */}
          <div className="border-t border-slate-800/60 pt-4 mt-6 grid grid-cols-3 gap-2.5 text-left">
            <div className="bg-[#0A0A0C]/50 border border-slate-855 rounded-xl p-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Category</span>
              <span className="text-[11px] font-semibold text-slate-200 mt-0.5 block truncate flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                전체 공유
              </span>
            </div>
            <div className="bg-[#0A0A0C]/50 border border-slate-855 rounded-xl p-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Access</span>
              <span className="text-[11px] font-semibold text-slate-200 mt-0.5 block truncate flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                정단원 이상
              </span>
            </div>
            <div className="bg-[#0A0A0C]/50 border border-slate-855 rounded-xl p-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Engine</span>
              <span className="text-[11px] font-semibold text-slate-200 mt-0.5 block truncate flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                Notion Workspace
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
