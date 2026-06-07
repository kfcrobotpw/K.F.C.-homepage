import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ShieldCheck, User, Users, GraduationCap, ArrowRight, ArrowLeft, AlertCircle, Sparkles, Send
} from 'lucide-react';

interface RegistrationWizardProps {
  firebaseUser: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
  };
  onRegistrationComplete: () => void;
  onCancel: () => void;
}

export default function RegistrationWizard({ firebaseUser, onRegistrationComplete, onCancel }: RegistrationWizardProps) {
  const [step, setStep] = useState(1);
  const [realName, setRealName] = useState(firebaseUser.displayName.replace(/\s*\(.*?\)\s*/g, '').replace(/\[.*?\]\s*/g, '') || '');
  const [techInterest, setTechInterest] = useState('로봇 코딩 및 알고리즘');
  const [customTechInterest, setCustomTechInterest] = useState('');
  const [isCustomTech, setIsCustomTech] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [oathAgreed, setOathAgreed] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const nextStep = () => {
    if (step === 1 && !privacyAgreed) {
      alert('동아리 개인정보 취급 및 가입 약관에 사전 동의해 주세요.');
      return;
    }
    if (step === 2 && !realName.trim()) {
      alert('정확한 실제 회원 성명을 입력해 주세요 (실명 기반 등록).');
      return;
    }
    if (step === 2 && isCustomTech && !customTechInterest.trim()) {
      alert('자신이 직접 입력할 관심/연구 분야를 작성해 주세요.');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!oathAgreed) {
      alert('K.F.C. 단원 수칙 및 서약서에 동의해 주셔야 최종 가입 처리가 완료됩니다.');
      return;
    }

    setSubmitting(true);
    setErrorStatus(null);

    // Format display name as Name (Tech) to make it globally distinguishable
    const finalInterest = isCustomTech ? customTechInterest.trim() : techInterest;
    const formattedDisplayName = `${realName.trim()} (${finalInterest})`;
    const defaultOfficer = firebaseUser.email === 'kfcrobotpw@gmail.com';

    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: formattedDisplayName,
      photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=150',
      isOfficer: defaultOfficer,
    };

    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      // Synchronously write user profile to Firestore
      await setDoc(userDocRef, userData);
      
      // Complete!
      onRegistrationComplete();
    } catch (err: any) {
      console.error('Registration Firestore Write Failed:', err);
      setErrorStatus(err.message || '데이터베이스 통신 오류가 발생했습니다. 잠시 후 임원진에게 가입 승인을 문의해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-4 relative overflow-hidden" id="registration-wizard-viewport">
      {/* Visual background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F12_1px,transparent_1px),linear-gradient(to_bottom,#0F0F12_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-70 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-[#121216] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          
          {/* Header Progress Stepper */}
          <div className="flex items-center justify-between mb-8 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600/15 rounded-lg border border-blue-500/20 text-blue-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight leading-none">신규 단원 등록 가이드</h2>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-1 block">Yongin Center K.F.C. Space</span>
              </div>
            </div>
            
            {/* Stepper bubbles */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all ${step === 1 ? 'bg-blue-600 text-white shadow' : step > 1 ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-850 text-slate-500'}`}>1</span>
              <span className="w-4 h-[1px] bg-slate-800" />
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all ${step === 2 ? 'bg-blue-600 text-white shadow' : step > 2 ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-850 text-slate-500'}`}>2</span>
              <span className="w-4 h-[1px] bg-slate-800" />
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all ${step === 3 ? 'bg-blue-600 text-white shadow animate-pulse' : 'bg-slate-850 text-slate-500'}`}>3</span>
            </div>
          </div>

          {errorStatus && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 mb-6 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">가입 처리 중 데이터 동기화 지연:</span>
                <p className="mt-1 opacity-90">{errorStatus}</p>
              </div>
            </div>
          )}

          {/* Steps Display */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <span>01단계. 가입 안내 및 정보 수집 안내</span>
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    용인시청소년수련관 소속 동아리 K.F.C.(Yongin Youth Center Robot Club) 공간에 오신것을 환영합니다!<br />
                    본 시스템은 소속 단원 관리의 신뢰도를 보완하기 위해 최초 로그인 시 동아리원 데이터베이스 직접 매핑 승인 절차를 도입하고 있습니다.
                  </p>
                </div>

                <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 text-xs space-y-3.5 text-slate-300">
                  <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider font-mono">📌 회원 정보 수집 항목 및 사용 목적</span>
                  <div className="space-y-2 font-light leading-relaxed">
                    <p>• <b>수집 항목</b>: 프로필 사진, 구글 인증 이메일 주소, 실명 및 관심 로봇 공학 분야</p>
                    <p>• <b>보존 목적</b>: 동아리 공지 피드백 투표, 임원진 보안 등급 설정, 부품 대여 이력 연계 추적, 단원 간 원활한 자료 공유 활성화</p>
                    <p>• <b>보존 기간</b>: K.F.C. 해체 시 또는 관리자에 의한 강제 탈퇴 처리 시 데이터 영구 삭제</p>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3.5 bg-[#0A0A0C]/40 hover:bg-slate-900/20 border border-slate-800 rounded-xl transition cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-tight">
                    <b>[필수]</b> 위 항목에 동의하며, 실명 기반으로 K.F.C. 동아리 네트워크에 내 계정을 안전하게 영구 등록하겠습니다.
                  </span>
                </label>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
                    <User className="w-5 h-5 text-blue-400" />
                    <span>02단계. 단원 활동 프로필 설정</span>
                  </h3>
                  <p className="text-slate-400 text-xs">
                    전체 단원 목록 및 공지 게시물 작성자 태그에 공개될 프로필 메타데이터를 기입합니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">이름 (진짜 성함)</label>
                    <input 
                      type="text"
                      placeholder="예시: 홍길동"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      className="w-full bg-[#0A0A0C] border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase font-mono tracking-wider">주요 관심/연구 분야</label>
                    <select
                      value={isCustomTech ? 'custom' : techInterest}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomTech(true);
                        } else {
                          setIsCustomTech(false);
                          setTechInterest(e.target.value);
                        }
                      }}
                      className="w-full bg-[#0A0A0C] border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 transition font-medium cursor-pointer"
                    >
                      <option value="로봇 코딩 및 알고리즘">로봇 코딩 및 알고리즘 개발</option>
                      <option value="레고 스파이크 & 마인드스톰">레고 스파이크 & 마인드스톰 조립</option>
                      <option value="하드웨어 기구 설계">하드웨어 기구 설계 및 조립</option>
                      <option value="아두이노 임베디드 코딩">아두이노 임베디드 임프루빙</option>
                      <option value="AI 자율주행 및 드론">AI 자율주행 및 드론 연구</option>
                      <option value="지도 및 관리">동아리 총괄 및 교육 지도</option>
                      <option value="custom">✍️ 직접 입력하기...</option>
                    </select>

                    <AnimatePresence>
                      {isCustomTech && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <input 
                            type="text"
                            placeholder="자신의 관심/연구 분야를 자유롭게 20자 이내로 입력하세요"
                            value={customTechInterest}
                            onChange={(e) => setCustomTechInterest(e.target.value.slice(0, 20))}
                            className="w-full bg-[#0A0A0C] border border-slate-850 rounded-xl p-3 text-xs text-blue-400 focus:outline-[#3B82F6] hover:border-slate-700 focus:border-blue-500 transition font-semibold"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span>03단계. 동아리 서약서 및 등록 실행</span>
                  </h3>
                  <p className="text-slate-400 text-xs">
                    최종 등록 실행 전, K.F.C. 동아리 윤리 서약과 DB 동기화 검증을 진행합니다.
                  </p>
                </div>

                <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 text-xs space-y-2.5">
                  <span className="font-bold text-blue-400 flex items-center gap-1">
                    <GraduationCap className="w-4.5 h-4.5 text-blue-400" />
                    <span className="text-blue-300 font-semibold font-display">📜 K.F.C. 단원 명예 연맹 수칙</span>
                  </span>
                  <div className="space-y-2.5 my-2 text-slate-200 leading-relaxed font-semibold">
                    <p>1. 용인시청소년수련관의 규칙을 우수하게 따르며 장비를 아낍니다.</p>
                    <p>2. 동아리 공동 공간의 로봇 부품은 자산 대여 수칙에 서명 후 대여합니다.</p>
                    <p>3. 상호 존중과 배려 깊은 팀웍을 통해 로봇 창의 프로젝트에 헌신합니다.</p>
                  </div>
                </div>

                <div className="bg-[#0A0A0C] border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={firebaseUser.photoURL} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full object-cover border border-slate-800"
                    />
                    <div>
                      <span className="text-xs text-slate-500 block">매핑될 고유 성명</span>
                      <strong className="text-sm text-white font-bold block">
                        {realName} ({isCustomTech ? customTechInterest : techInterest})
                      </strong>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase font-bold animate-pulse">Ready</span>
                </div>

                <label className="flex items-start gap-2.5 p-3.5 bg-blue-950/10 hover:bg-blue-950/20 border border-blue-500/20 rounded-xl transition cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={oathAgreed}
                    onChange={(e) => setOathAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-tight">
                    <b>[최종 확약]</b> 본인은 위 단원 서약에 서명하며, 데이터베이스에 본 회원 메타데이터 정보가 확실하게 추가되어 모니터링되는 것을 준수하겠습니다.
                  </span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Footer Controls */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={step === 1 ? onCancel : prevStep}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer select-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{step === 1 ? '취소' : '이전'}</span>
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer select-none shadow-lg shadow-blue-900/20"
              >
                <span>다음 단계로</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRegisterSubmit}
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer select-none shadow-lg shadow-emerald-900/20"
              >
                {submitting ? (
                  <span>연동 등록 중...</span>
                ) : (
                  <>
                    <span>단원 등록 완료 및 가입</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
