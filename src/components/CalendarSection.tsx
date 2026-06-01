import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Schedule } from '../types';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Clock, MapPin, X, HelpCircle, Check, Info
} from 'lucide-react';

interface CalendarSectionProps {
  currentUser: { uid: string; email: string; displayName: string; photoURL: string };
  isOfficer: boolean;
  canManageCalendar?: boolean;
}

export default function CalendarSection({ currentUser, isOfficer, canManageCalendar = false }: CalendarSectionProps) {
  const [events, setEvents] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar view state
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Default to May 2026 based on mock clock (May 23, 2026)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Create / Edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [eventColor, setEventColor] = useState('bg-sky-500');

  useEffect(() => {
    // Listen to all club schedules
    const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const list: Schedule[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Schedule);
      });
      setEvents(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'schedules');
    });

    return () => unsubscribe();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDesc.trim() || !startDateStr || !endDateStr) return;

    if (startDateStr > endDateStr) {
      alert('종료일이 시작일보다 빠를 수 없습니다.');
      return;
    }

    try {
      const scheduleCol = collection(db, 'schedules');
      const docRef = doc(scheduleCol); // Specific doc ID for secure write rules

      await setDoc(docRef, {
        id: docRef.id,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        startDate: startDateStr,
        endDate: endDateStr,
        color: eventColor,
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // Clear states
      setEventTitle('');
      setEventDesc('');
      setStartDateStr('');
      setEndDateStr('');
      setEventColor('bg-sky-500');
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedules');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!canManageCalendar) return;
    if (!confirm('정말로 이 일정을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schedules/${id}`);
    }
  };

  // Grid builder operations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1...

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const getFormattedDateString = (day: number) => {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(month + 1).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Find events occurring on a specific YYYY-MM-DD
  const getEventsForDay = (day: number) => {
    const dateStr = getFormattedDateString(day);
    return events.filter(ev => dateStr >= ev.startDate && dateStr <= ev.endDate);
  };

  // Color options helper for schedule creator
  const colorOptions = [
    { bg: 'bg-indigo-500', label: '인디고' },
    { bg: 'bg-emerald-500', label: '그린' },
    { bg: 'bg-amber-500', label: '옐로우' },
    { bg: 'bg-rose-500', label: '레드' },
    { bg: 'bg-sky-500', label: '블루' },
  ];

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-6" id="calendar-section-container">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📅 일정 관리</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-medium">Calendar</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">동아리 주요 소식과 교육 일정을 전해드립니다.</p>
        </div>

        {canManageCalendar && (
          <button
            id="open-add-event-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-blue-500/15 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>새 일정 추가</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CALENDAR MONTH MATRIX */}
        <div className="xl:col-span-8 bg-[#121216] border border-slate-800 rounded-2xl p-6" id="calendar-dashboard">
          {/* Calendar Controller Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white tracking-tight">{year}년</span>
                <h3 className="text-lg font-bold text-slate-300 -mt-1">{monthNames[month]} ({month + 1}월)</h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0A0A0C]/60 p-1 rounded-lg border border-slate-800">
              <button
                id="prev-month-btn"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
              </button>
              <button
                id="next-month-btn"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* DAY-OF-WEEK TITLES */}
          <div className="grid grid-cols-7 text-center font-mono text-xs font-bold text-slate-500 pb-3 border-b border-slate-800">
            <div className="text-rose-500">SUN (일)</div>
            <div>MON (월)</div>
            <div>TUE (화)</div>
            <div>WED (수)</div>
            <div>THU (목)</div>
            <div>FRI (금)</div>
            <div className="text-sky-400">SAT (토)</div>
          </div>

          {/* DAY MESH GRID */}
          <div className="grid grid-cols-7 gap-1.5 mt-2 min-h-[350px]">
            {blankDays.map((i) => (
              <div key={`blank-${i}`} className="bg-[#0A0A0C]/10 border border-transparent min-h-[70px] p-1.5" />
            ))}

            {daysArray.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isSelected = selectedDay === day;

              return (
                <div
                  id={`calendar-day-${day}`}
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[75px] bg-[#0A0A0C]/40 border p-1 rounded-lg flex flex-col justify-between transition cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 shadow-sm shadow-blue-500/20 bg-blue-500/5' 
                      : isToday 
                        ? 'border-slate-750 bg-[#121216]/60 font-semibold' 
                        : 'border-slate-800/80 hover:bg-[#121216]/30 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs p-1 font-semibold font-mono ${
                      new Date(year, month, day).getDay() === 0 ? 'text-rose-500' :
                      new Date(year, month, day).getDay() === 6 ? 'text-sky-400' : 'text-slate-350'
                    }`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="오늘" />
                    )}
                  </div>

                  {/* Day Events listing */}
                  <div className="space-y-1 mt-1.5 w-full">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        id={`day-event-chip-${ev.id}`}
                        key={ev.id}
                        className={`${ev.color} text-[9px] text-slate-950 font-medium px-1 rounded truncate leading-tight py-0.5 border-l-2 border-slate-950/20`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] text-slate-500 text-center font-bold">
                        +{dayEvents.length - 3}개 더보기
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DAY DETAILS POP-DRAWER */}
        <div className="xl:col-span-4 bg-[#121216] border border-slate-800 rounded-2xl p-6 min-h-[400px] flex flex-col" id="calendar-day-details">
          {selectedDay ? (
            <div className="flex-1 flex flex-col justify-between" id="day-details-selected">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
                  <h3 className="font-bold text-white text-base font-mono">
                    {year}년 {month + 1}월 {selectedDay}일 일정
                  </h3>
                  <button
                    id="clear-selected-day"
                    onClick={() => setSelectedDay(null)}
                    className="p-1 rounded text-slate-500 hover:text-white"
                  >
                    <X className="w-4.5 h-4.5 shrink-0" />
                  </button>
                </div>

                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm italic">
                    등록된 일정이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                    {selectedDayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        id={`event-item-${ev.id}`}
                        className="bg-[#0A0A0C]/50 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-[10px] text-slate-950 ${ev.color} rounded font-semibold`}>
                            {ev.title}
                          </span>
                          {canManageCalendar && (
                            <button
                              id={`delete-event-btn-${ev.id}`}
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-slate-600 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed break-keep">{ev.description}</p>

                        <div className="flex flex-col gap-1.5 border-t border-slate-900 pt-2.5 mt-1 text-[10px] text-slate-500 font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            <span>기간: {ev.startDate} ~ {ev.endDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] text-slate-500 mt-4 pt-4 border-t border-slate-800">
                일정을 선택하면 세부 설명을 보거나 변경할 수 있습니다.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500" id="day-details-empty">
              <Info className="w-10 h-10 text-slate-700 mb-2.5" />
              <h4 className="font-semibold text-slate-400 text-sm mb-1">상세 일정 정보</h4>
              <p className="text-xs leading-relaxed">달력의 유효 일자 칸을 마우스로 클릭하시면 등록된 일정을 상세히 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* SCHEDULE ADD FORM MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" id="add-schedule-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121216] border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <CalendarIcon className="w-5 h-5 text-blue-405" />
                  <span>새 동아리 일정 등록</span>
                </h3>
                <button
                  id="close-schedule-modal"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">일정 제목</label>
                  <input
                    id="schedule-title-input"
                    type="text"
                    required
                    maxLength={100}
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="예: 2Q 스마트 모빌리티 경진대회"
                    className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">상세 안내 글</label>
                  <textarea
                    id="schedule-desc-input"
                    required
                    rows={4}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="대회 요강, 시각 및 소지해야 할 준비물 등을 설명해 주세요..."
                    className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">시작 일자</label>
                    <input
                      id="schedule-start-date"
                      type="date"
                      required
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">종료 일자</label>
                    <input
                      id="schedule-end-date"
                      type="date"
                      required
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#0A0A0C] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Event chip color setup */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">뱃지 색상</label>
                  <div className="flex gap-2">
                    {colorOptions.map((opt) => (
                      <button
                        id={`color-opt-btn-${opt.bg}`}
                        key={opt.bg}
                        type="button"
                        onClick={() => setEventColor(opt.bg)}
                        className={`w-7 h-7 rounded-full ${opt.bg} border-2 transition relative cursor-pointer flex items-center justify-center ${
                          eventColor === opt.bg ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                        }`}
                      >
                        {eventColor === opt.bg && <Check className="w-4.5 h-4.5 text-slate-950 font-bold" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    id="cancel-schedule-btn"
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 bg-[#0A0A0C] hover:bg-slate-900 border border-slate-800 rounded-lg transition"
                  >
                    취소
                  </button>
                  <button
                    id="submit-schedule-btn"
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                  >
                    일정 추가하기
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
