import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, ExternalLink, Sparkles, Compass, ShieldCheck, Layers, Wrench, Clock } from 'lucide-react';

interface PartRentalProps {
  currentUser: { uid: string; email: string; displayName: string; photoURL: string };
  isOfficer: boolean;
}

export default function PartRental({ currentUser, isOfficer }: PartRentalProps) {
  const RENTAL_URL = "https://rentlegobykfcrobotpw.netlify.app/";

  useEffect(() => {
    // Automatically trigger navigation in a new tab on mount
    const timer = setTimeout(() => {
      window.open(RENTAL_URL, '_blank');
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenRental = () => {
    window.open(RENTAL_URL, '_blank');
  };

  return (
    <div className="space-y-6" id="part-rental-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>⚙️ 부품 대여</span>
            <span className="text-xs bg-[#22c55e]/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-medium">Part Rental System</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">로봇 제작 부품, 모터, 센서, 레고 블록 키트 등 동아리 부품들의 실시간 대여 현황 및 신청 관리 시스템입니다.</p>
        </div>
      </div>

      {/* CORE INTEGRATION CONNECTOR CARD */}
      <div className="max-w-2xl mx-auto py-8">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#121216] border border-emerald-950/15 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden shadow-2xl"
          id="rental-connector-box"
        >
          {/* Decorative faint background glow */}
          <div className="absolute -top-24 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Connected Icon Badge Loop */}
          <div className="flex items-center justify-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Package className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-mono rounded-full font-bold uppercase tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block animate-ping mr-0.5" />
              Live Connected
            </div>
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white p-2.5 shadow-md">
              <Wrench className="w-6 h-6 text-yellow-500" />
            </div>
          </div>

          {/* Central Notification copy */}
          <div className="space-y-2.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>부품 대여 시스템 연동 완료</span>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              새 창(탭)에서 K.F.C. 부품 대여&반납 관리 시스템 페이지를 열고 있습니다.<br />
              만약 새 창이 자동으로 열리지 않는다면 아래의 수동 입장 버튼을 클릭해 주세요.
            </p>
          </div>

          {/* Call to action Button */}
          <div className="pt-2">
            <button
              id="goto-external-rental-btn"
              onClick={handleOpenRental}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-650 to-emerald-555 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-900/30 transition hover:scale-[1.015] active:scale-[0.985] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>부품 대여 시스템으로 이동</span>
            </button>
          </div>

          {/* Quick link metadata info */}
          <div className="border-t border-slate-800/60 pt-4 mt-6 grid grid-cols-3 gap-2.5 text-left">
            <div className="bg-[#0A0A0C]/50 border border-slate-855 rounded-xl p-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Category</span>
              <span className="text-[11px] font-semibold text-slate-200 mt-0.5 block truncate flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                부품 & 키트
              </span>
            </div>
            <div className="bg-[#0A0A0C]/50 border border-slate-855 rounded-xl p-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Permission</span>
              <span className="text-[11px] font-semibold text-slate-200 mt-0.5 block truncate flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                전체 회원
              </span>
            </div>
            <div className="bg-[#0A0A0C]/50 border border-slate-855 rounded-xl p-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Platform</span>
              <span className="text-[11px] font-semibold text-slate-200 mt-0.5 block truncate flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Realtime Space
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
