import { useState, useEffect } from 'react'
import { Calendar } from 'react-calendar'
import { Plus, MapPin, DollarSign, Trash2, Edit2, Calendar as CalendarIcon, MoreVertical, BarChart2, Settings as SettingsIcon, Sun, Moon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from './supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Dialog } from '@capacitor/dialog'
import Auth from './Auth'
import Stats from './components/Stats'
import Settings from './components/Settings'
import SiteManager from './components/SiteManager'
import SettlementManager from './components/SettlementManager'
import Tutorial from './components/Tutorial'
import ToastContainer from './components/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import 'react-calendar/dist/Calendar.css'

type WageRecord = {
  id: string
  date: string
  siteName: string
  taskContent: string
  amount: number
  taxDeduction: boolean
  poomsu: number
  expenses: number
  color: string
  status: '미수금' | '완료'
  memo: string
  googleEventId?: string
}

import { syncGoogleCalendar } from './googleCalendarSync'

type SettlementRecord = {
  id: string
  siteName: string
  date: string
  amount: number
  memo: string
}

function MainApp({ session }: { session: Session }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  })

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setIsDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  const [date, setDate] = useState<Date>(new Date())
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(new Date())
  const [records, setRecords] = useState<WageRecord[]>([])
  const [settlements, setSettlements] = useState<SettlementRecord[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'calendar' | 'site' | 'settlement' | 'stats' | 'settings'>('calendar')
  
  // New record form state
  const [siteName, setSiteName] = useState('')
  const [taskContent, setTaskContent] = useState('')
  const [amount, setAmount] = useState('')
  const [taxDeduction, setTaxDeduction] = useState(false)
  const [poomsu, setPoomsu] = useState(1.0)
  const [expenses, setExpenses] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [memo, setMemo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Daily Detail Modal state
  const [isDailyDetailOpen, setIsDailyDetailOpen] = useState(false)
  const [isSchedule, setIsSchedule] = useState(false)
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null)
  const [inlineMemo, setInlineMemo] = useState('')

  const selectedDateStr = format(date, 'yyyy-MM-dd')
  const selectedRecords = records.filter(r => r.date === selectedDateStr)

  useEffect(() => {
    fetchRecords();
  }, []);

  const [, setTick] = useState(0);
  useEffect(() => {
    const handleSettingsChange = () => setTick(t => t + 1);
    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  useEffect(() => {
    const mainColorHex = localStorage.getItem('mainColor') || '#3B82F6';
    const colorPalettes: Record<string, Record<number, string>> = {
      '#3B82F6': { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
      '#EF4444': { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
      '#10B981': { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
      '#8B5CF6': { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
      '#F97316': { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
      '#6B7280': { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' }
    };
    const palette = colorPalettes[mainColorHex] || colorPalettes['#3B82F6'];
    for (const [key, value] of Object.entries(palette)) {
      document.documentElement.style.setProperty(`--mc-${key}`, value);
    }
  }, []);

  const fetchRecords = async () => {
    const { data: recordsData, error: recordsError } = await supabase
      .from('wage_records')
      .select('*')
      .eq('user_id', session.user.id)
      
    if (recordsError) {
      console.error('데이터 불러오기 에러:', recordsError)
    } else if (recordsData) {
      setRecords(recordsData.map(d => ({
        id: d.id,
        date: d.date,
        siteName: d.site_name,
        taskContent: d.task_content || '',
        amount: d.amount,
        taxDeduction: d.tax_deduction || false,
        poomsu: d.poomsu || 1.0,
        expenses: d.expenses || 0,
        color: d.color || '#3B82F6',
        status: d.status || '미수금',
        memo: d.memo || '',
        googleEventId: d.google_event_id
      })))
    }

    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .eq('user_id', session.user.id)

    if (settlementsError) {
      console.error('정산 데이터 불러오기 에러:', settlementsError)
    } else if (settlementsData) {
      setSettlements(settlementsData.map(d => ({
        id: d.id,
        siteName: d.site_name,
        date: d.date,
        amount: d.amount,
        memo: d.memo || ''
      })))
    }
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteName) return
    if (!isSchedule && !amount) return

    const recordData = {
      user_id: session.user.id,
      date: selectedDateStr,
      site_name: siteName,
      task_content: taskContent,
      amount: isSchedule ? 0 : (parseInt(amount, 10) || 0),
      tax_deduction: taxDeduction,
      poomsu,
      expenses: expenses ? (parseInt(expenses, 10) || 0) : 0,
      color,
      memo
    }

    if (editingId) {
      const existingRecord = records.find(r => r.id === editingId);
      const googleEventId = await syncGoogleCalendar(recordData, 'update', existingRecord?.googleEventId);
      const updatedData = googleEventId ? { ...recordData, google_event_id: googleEventId } : recordData;

      const { error } = await supabase.from('wage_records').update(updatedData).eq('id', editingId)
      if (error) {
        await Dialog.alert({ title: '오류', message: '수정 중 오류가 발생했습니다: ' + error.message })
        return
      }
      setRecords(records.map(r => r.id === editingId ? { 
        ...r, 
        siteName: recordData.site_name, 
        taskContent: recordData.task_content,
        amount: recordData.amount, 
        taxDeduction: recordData.tax_deduction,
        poomsu: recordData.poomsu,
        expenses: recordData.expenses,
        color: recordData.color,
        memo: recordData.memo,
        googleEventId
      } : r))
    } else {
      const googleEventId = await syncGoogleCalendar(recordData, 'insert');
      const insertData = googleEventId ? { ...recordData, google_event_id: googleEventId } : recordData;

      const { data, error } = await supabase.from('wage_records').insert([insertData]).select()
      if (error) {
        await Dialog.alert({ title: '오류', message: '저장 중 오류가 발생했습니다: ' + error.message })
        return
      }
      if (data && data.length > 0) {
        const d = data[0]
        setRecords([...records, { 
          id: d.id, 
          date: d.date, 
          siteName: d.site_name, 
          taskContent: d.task_content || '',
          amount: d.amount, 
          taxDeduction: d.tax_deduction || false,
          poomsu: d.poomsu || 1.0,
          expenses: d.expenses || 0,
          color: d.color || '#3B82F6',
          status: d.status || '미수금',
          memo: d.memo || '',
          googleEventId: d.google_event_id
        }])
      }
    }
    
    setIsModalOpen(false)
    resetForm()
  }

  const handleSaveInlineMemo = async () => {
    if (!inlineMemo.trim()) return
    const recordData = {
      user_id: session.user.id,
      date: format(date, 'yyyy-MM-dd'),
      site_name: '개인 메모',
      task_content: '',
      memo: inlineMemo,
      amount: 0,
      poomsu: 0,
      expenses: 0,
      color: '#8B5CF6',
      status: '완료'
    }
    const googleEventId = await syncGoogleCalendar(recordData, 'insert');
    const insertData = googleEventId ? { ...recordData, google_event_id: googleEventId } : recordData;

    const { data, error } = await supabase.from('wage_records').insert([insertData]).select()
    if (!error && data && data.length > 0) {
      const d = data[0]
      setRecords([...records, {
        id: d.id,
        date: d.date,
        siteName: d.site_name,
        taskContent: d.task_content || '',
        amount: d.amount,
        taxDeduction: d.tax_deduction || false,
        poomsu: d.poomsu || 1.0,
        expenses: d.expenses || 0,
        color: d.color || '#3B82F6',
        status: d.status || '미수금',
        memo: d.memo || '',
        googleEventId: d.google_event_id
      }])
      setInlineMemo('')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedRecordId(prev => prev === id ? null : id)
  }

  const handleDelete = async (id: string) => {
    const { value } = await Dialog.confirm({ title: '삭제', message: '이 내역을 삭제하시겠습니까?' })
    if (value) {
      const recordToDelete = records.find(r => r.id === id);
      const { error } = await supabase.from('wage_records').delete().eq('id', id)
      if (error) {
        await Dialog.alert({ title: '오류', message: '삭제 중 오류가 발생했습니다.' })
      } else {
        if (recordToDelete?.googleEventId) {
          await syncGoogleCalendar(recordToDelete, 'delete', recordToDelete.googleEventId);
        }
        setRecords(records.filter(r => r.id !== id))
      }
    }
  }

  const handleUpdateStatus = async (id: string, status: '미수금' | '완료') => {
    const { error } = await supabase.from('wage_records').update({ status }).eq('id', id)
    if (error) {
      await Dialog.alert({ title: '오류', message: '상태 업데이트 중 오류가 발생했습니다.' })
    } else {
      setRecords(records.map(r => r.id === id ? { ...r, status } : r))
    }
  }

  const openEdit = (record: WageRecord) => {
    setEditingId(record.id)
    setIsSchedule(record.amount === 0 && !record.poomsu)
    setSiteName(record.siteName)
    setTaskContent(record.taskContent)
    setAmount(record.amount === 0 ? '' : record.amount.toString())
    setTaxDeduction(record.taxDeduction)
    setPoomsu(record.poomsu)
    setExpenses(record.expenses === 0 ? '' : record.expenses.toString())
    setColor(record.color)
    setMemo(record.memo || '')
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setIsSchedule(false)
    setSiteName('')
    setTaskContent('')
    setAmount('')
    setTaxDeduction(false)
    setPoomsu(1.0)
    setExpenses('')
    setColor('#3B82F6')
    setMemo('')
  }


  // Custom calendar tile content to show wage indicator
  const tileContent = ({ date: tileDate, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const tileDateStr = format(tileDate, 'yyyy-MM-dd')
      const dayRecords = records.filter(r => r.date === tileDateStr)
      const isSaturday = tileDate.getDay() === 6;
      
      let weeklyTotal = null;
      if (isSaturday && localStorage.getItem('showWeeklyTotal') === 'true') {
        // Calculate total for the past 7 days ending on this Saturday
        const weekStart = new Date(tileDate);
        weekStart.setDate(weekStart.getDate() - 6);
        const weekRecords = records.filter(r => {
          const d = new Date(r.date);
          return d >= weekStart && d <= tileDate;
        });
        const wTotal = weekRecords.reduce((sum, r) => sum + r.amount, 0);
        if (wTotal > 0) {
          weeklyTotal = wTotal;
        }
      }

      return (
        <div className="flex flex-col items-center mt-1 w-full relative">
          {dayRecords.length > 0 && (
            <>
              <div className="flex gap-0.5 mb-0.5">
                {dayRecords.map(r => (
                  <div key={r.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color || '#3B82F6' }}></div>
                ))}
              </div>
              <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold leading-tight truncate px-1">
                {(dayRecords.reduce((s, r) => s + r.amount, 0) / 10000).toFixed(0)}만
              </span>
            </>
          )}
          {weeklyTotal && (
            <div className="absolute -top-6 -right-2 bg-primary-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md z-10 whitespace-nowrap hidden sm:block">
              주: {(weeklyTotal / 10000).toFixed(0)}만
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('hasSeenTutorial'));

  const handleTutorialComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  return (
    <>
    <ToastContainer />
    <AnimatePresence>
      {showTutorial && <Tutorial onComplete={handleTutorialComplete} onPageChange={(view) => setCurrentView(view as any)} />}
    </AnimatePresence>
    <div className="min-h-screen bg-gradient-to-br from-primary-50/50 via-gray-50 to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col pb-20 transition-colors duration-500">
      <header className="w-full max-w-full px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4 flex justify-between items-center z-40 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[0.85rem] overflow-hidden shadow-sm shadow-primary-900/5 dark:shadow-black/50 border-[1.5px] border-white dark:border-slate-700/50">
            <img src={`${import.meta.env.BASE_URL}app_icon_v2.jpg`} alt="공돌이" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            공돌이
          </h1>
        </div>
        <button 
          onClick={toggleDarkMode}
          className="w-10 h-10 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-[0.85rem] shadow-sm border border-white/60 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-700/90 transition-all active:scale-90 text-gray-500 dark:text-yellow-400 cursor-pointer"
          aria-label="다크 모드 전환"
        >
          {isDarkMode ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
        </button>
      </header>
      
      <main className="w-full max-w-full px-4 flex flex-col gap-4 mt-2 pb-36 relative">
        <AnimatePresence mode="wait">
          {currentView === 'calendar' && (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* Custom Calendar Header & Stats */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                  <button 
                    onClick={() => {
                      const current = activeStartDate || date;
                      setActiveStartDate(new Date(current.getFullYear(), current.getMonth() - 1, 1));
                    }} 
                    className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {format(activeStartDate || date, 'yyyy년 M월')}
                  </h2>
                  <button 
                    onClick={() => {
                      const current = activeStartDate || date;
                      setActiveStartDate(new Date(current.getFullYear(), current.getMonth() + 1, 1));
                    }} 
                    className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-gray-50 dark:bg-slate-900/50 text-center">
                    <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                      {new Set(records.filter(r => r.date.startsWith(format(activeStartDate || date, 'yyyy-MM')) && (r.amount > 0 || r.poomsu)).map(r => r.date)).size}<span className="text-[11px] font-semibold ml-0.5">일</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold mt-1">작업일수</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-gray-50 dark:bg-slate-900/50 text-center">
                    <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                      {records.filter(r => r.date.startsWith(format(activeStartDate || date, 'yyyy-MM'))).reduce((sum, r) => sum + (r.poomsu || 0), 0)}<span className="text-[11px] font-semibold ml-0.5">품</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold mt-1">품</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-center">
                    <span className="text-[15px] font-bold text-primary-600 dark:text-primary-400">
                      {(records.filter(r => r.date.startsWith(format(activeStartDate || date, 'yyyy-MM'))).reduce((sum, r) => sum + r.amount, 0) / 10000).toLocaleString(undefined, {maximumFractionDigits: 1})}<span className="text-[11px] font-semibold ml-0.5">만원</span>
                    </span>
                    <span className="text-[10px] text-primary-500 font-semibold mt-1">총 일당</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-red-50 dark:bg-red-500/10 text-center">
                    <span className="text-[15px] font-bold text-red-600 dark:text-red-400">
                      {(records.filter(r => r.date.startsWith(format(activeStartDate || date, 'yyyy-MM')) && r.status === '미수금').reduce((sum, r) => sum + r.amount, 0) / 10000).toLocaleString(undefined, {maximumFractionDigits: 1})}<span className="text-[11px] font-semibold ml-0.5">만원</span>
                    </span>
                    <span className="text-[10px] text-red-500 font-semibold mt-1">미수금</span>
                  </div>
                </div>
              </div>
              {/* Calendar Card */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-5 overflow-hidden relative mb-4">
                <button 
                  onClick={() => {
                    const now = new Date();
                    setDate(now);
                    setActiveStartDate(now);
                  }}
                  className="absolute top-5 right-5 z-10 px-3.5 py-1.5 text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20 active:scale-95 transition-all shadow-sm"
                >
                  오늘
                </button>
            <style>{`
              .react-calendar { border: none !important; width: 100% !important; font-family: inherit !important; background: transparent !important; }
              .react-calendar__navigation { padding-right: 4rem; margin-bottom: 0.5rem; } 
              .react-calendar__navigation button { font-weight: 800; font-size: 1.15rem; border-radius: 1rem; color: inherit; }
              .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: rgba(0,0,0,0.04) !important; }
              .dark .react-calendar__navigation button:enabled:hover, .dark .react-calendar__navigation button:enabled:focus { background-color: rgba(255,255,255,0.05) !important; }
              .react-calendar__month-view__weekdays { text-transform: uppercase; font-weight: 700; font-size: 0.75rem; color: #94a3b8; padding-bottom: 0.75rem; }
              .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
              .react-calendar__tile { padding: 0.5em 0.25em !important; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 68px; font-size: 0.95rem; font-weight: 600; border-radius: 1rem; color: inherit; transition: all 0.2s; }
              .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background: rgba(0,0,0,0.04) !important; }
              .dark .react-calendar__tile:enabled:hover, .dark .react-calendar__tile:enabled:focus { background: rgba(255,255,255,0.05) !important; }
              
              /* Unify 'now' (today) and 'active' (selected) styles */
              .react-calendar__tile--now, .react-calendar__tile--active { background: #eff6ff !important; color: #2563eb !important; border: 2px solid #bfdbfe !important; }
              .dark .react-calendar__tile--now, .dark .react-calendar__tile--active { background: rgba(59, 130, 246, 0.15) !important; color: #60a5fa !important; border: 2px solid rgba(59, 130, 246, 0.3) !important; box-shadow: none !important; }
            `}</style>
          <Calendar 
            showNavigation={false}
            onChange={(val) => { setDate(val as any); setIsDailyDetailOpen(true); }} 
            value={date}
            activeStartDate={activeStartDate || undefined}
            onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate as Date)}
            tileContent={tileContent}
            formatDay={(_locale, date) => format(date, 'd')}
            className="w-full"
          />
        </div>
        
        
        {/* Daily Details Modal (Replaces inline list) */}
        <AnimatePresence>
          {isDailyDetailOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
              onClick={() => setIsDailyDetailOpen(false)}
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl w-full max-w-full mx-auto rounded-t-[2rem] p-6 shadow-2xl border-t border-white/20 dark:border-slate-700 min-h-[50vh] max-h-[85vh] overflow-y-auto flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full mx-auto mb-6 shrink-0"></div>
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                    {format(date, 'M월 d일')} 기록
                  </h2>
                  <div className="flex items-center gap-2">
                    {selectedRecords.length > 0 && (
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-3 py-1.5 rounded-full shadow-sm">
                        총 {selectedRecords.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}원
                      </span>
                    )}
                    <button onClick={() => setIsDailyDetailOpen(false)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Quick Memo Input & Add Work Button */}
                <div className="flex flex-col gap-3 mb-6 shrink-0">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inlineMemo}
                      onChange={(e) => setInlineMemo(e.target.value)}
                      placeholder="오늘 한 일 (개인 메모) 입력..."
                      className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineMemo()}
                    />
                    <button 
                      onClick={handleSaveInlineMemo}
                      className="bg-purple-100 dark:bg-slate-700 text-purple-700 dark:text-white px-4 py-3 rounded-xl font-extrabold text-sm hover:bg-purple-200 transition-colors whitespace-nowrap"
                    >
                      저장
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => { resetForm(); setIsSchedule(false); setIsModalOpen(true); }}
                    className="w-full bg-primary-600 dark:bg-primary-500 text-white py-3.5 rounded-xl font-extrabold text-sm shadow-sm hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} strokeWidth={3} /> 이날 작업 추가
                  </button>
                </div>

                {selectedRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-900 dark:text-gray-400 dark:text-slate-500 flex-1">
                    <div className="w-16 h-16 bg-gray-50/50 dark:bg-slate-900/50 rounded-[2rem] flex items-center justify-center mb-4 shadow-inner border border-gray-100 dark:border-slate-800">
                      <DollarSign size={28} className="text-gray-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 tracking-tight">등록된 현장 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 overflow-y-auto pb-8">
                    {selectedRecords.map(record => {
                      const isItemSchedule = record.amount === 0 && !record.poomsu
                      const isExpanded = expandedRecordId === record.id
                      return (
                        <div key={record.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow shrink-0">
                          <div className="p-4 flex flex-col gap-2 cursor-pointer" onClick={() => toggleExpand(record.id)}>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 text-gray-900 dark:text-slate-50 font-extrabold">
                                <div className={`p-1.5 rounded-lg ${isItemSchedule ? 'bg-purple-50 dark:bg-emerald-500/10' : 'bg-primary-50 dark:bg-primary-500/10'}`}>
                                  {isItemSchedule ? <CalendarIcon size={16} className="text-purple-500 dark:text-emerald-400" /> : <MapPin size={16} className="text-primary-600 dark:text-primary-400" />}
                                </div>
                                {record.siteName}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`font-extrabold ${isItemSchedule ? 'text-purple-600 dark:text-emerald-400' : 'text-primary-600 dark:text-primary-400'}`}>
                                  {isItemSchedule ? '일정' : `${record.amount.toLocaleString()}원`}
                                </div>
                                <button className="p-1 -mr-2 text-gray-400 dark:text-slate-500 transition-colors">
                                  <MoreVertical size={20} />
                                </button>
                              </div>
                            </div>
                            {(record.taskContent || record.memo) && (
                              <div className="flex flex-col text-gray-600 dark:text-slate-400 text-sm mt-1 pr-8 leading-relaxed font-medium">
                                {record.taskContent && <span className="font-bold text-gray-800 dark:text-slate-300">[{record.taskContent}]</span>}
                                {record.memo && <span>{record.memo}</span>}
                              </div>
                            )}
                          </div>
                          
                          {/* Expandable Action Menu */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 overflow-hidden"
                              >
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openEdit(record); setExpandedRecordId(null); setIsDailyDetailOpen(false); }} 
                                  className="flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors active:bg-gray-100 dark:active:bg-slate-800 cursor-pointer"
                                >
                                  <Edit2 size={16} /> 수정
                                </button>
                                <div className="w-[1px] bg-gray-200 dark:bg-slate-700 my-2"></div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(record.id); setExpandedRecordId(null); }} 
                                  className="flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors active:bg-gray-100 dark:active:bg-slate-800 cursor-pointer"
                                >
                                  <Trash2 size={16} /> 삭제
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
        )}

        {currentView === 'stats' && <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><Stats records={records} /></motion.div>}

        {currentView === 'settings' && <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><Settings session={session} /></motion.div>}

        {currentView === 'site' && <motion.div key="site" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><SiteManager records={records} settlements={settlements} setCurrentView={setCurrentView} /></motion.div>}

        {currentView === 'settlement' && <motion.div key="settlement" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}><SettlementManager records={records} settlements={settlements} setSettlements={setSettlements} setCurrentView={setCurrentView} onUpdateStatus={handleUpdateStatus} session={session} /></motion.div>}
      </AnimatePresence>


      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200/80 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { id: 'calendar', icon: CalendarIcon, label: '달력' },
            { id: 'site', icon: MapPin, label: '현장' },
            { id: 'settlement', icon: DollarSign, label: '정산' },
            { id: 'stats', icon: BarChart2, label: '통계' },
            { id: 'settings', icon: SettingsIcon, label: '설정' },
          ].map((item) => {
            const isActive = currentView === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setCurrentView(item.id as any)} 
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive ? 'text-primary-600 dark:text-primary-400 scale-105' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1.5 rounded-b-full bg-primary-600 dark:bg-primary-500 animate-in fade-in zoom-in duration-300"></span>
                )}
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-sm' : ''} />
                <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-semibold'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Floating Action Button (Only on home) */}
      {/* We removed the huge FAB because Quick Actions are now at the top of the dashboard for better UX! */}
      <AnimatePresence>
        {/* We kept this AnimatePresence just in case, but no FAB rendered anymore */}
      </AnimatePresence>

      {/* Add Record Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-full rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  {editingId ? '작업 수정' : '작업 추가'}
                </h3>
                <button 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            
            <form onSubmit={handleAddRecord} className="flex flex-col gap-5">

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">현장명</label>
                <input 
                  type="text" 
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="예) 강남 아파트 현장"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:bg-slate-800 transition-all font-medium text-[15px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">작업 내용 (선택)</label>
                <input 
                  type="text" 
                  value={taskContent}
                  onChange={(e) => setTaskContent(e.target.value)}
                  placeholder="예) 목공 마감, 창호 설치" 
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:bg-slate-800 transition-all font-medium text-[15px]"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">일당 (원)</label>
                  <input 
                    type="number" 
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0" 
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:bg-slate-800 transition-all font-bold text-lg text-primary-600 dark:text-primary-400 placeholder:text-gray-400 placeholder:font-medium"
                  />
                  <label className="flex items-center gap-2 cursor-pointer mt-3">
                    <input 
                      type="checkbox" 
                      checked={taxDeduction} 
                      onChange={(e) => setTaxDeduction(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <span className="text-[13px] font-semibold text-gray-500 dark:text-slate-400">인적공제 3.3% 공제 후 받음</span>
                  </label>
                </div>
                <div className="w-28 flex flex-col">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">품수</label>
                  <select 
                    value={poomsu} 
                    onChange={(e) => setPoomsu(Number(e.target.value))}
                    className="w-full px-3 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:bg-slate-800 transition-all font-bold text-gray-900 dark:text-white"
                  >
                    <option value={1.0}>1품 — 하루</option>
                    <option value={0.5}>0.5품 — 반나절</option>
                    <option value={1.5}>1.5품 — 연장</option>
                    <option value={2.0}>2품 — 야간</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">경비 (선택 · 식대·자재비 등, 3.3% 공제 대상 아님)</label>
                </div>
                {!expenses && expenses !== '0' ? (
                  <button 
                    type="button"
                    onClick={() => setExpenses('0')}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 transition-all text-left flex items-center gap-2"
                  >
                    <Plus size={16} /> + 경비 추가
                  </button>
                ) : (
                  <input 
                    type="number" 
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="0" 
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:bg-slate-800 transition-all font-bold text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">달력 색상</label>
                  <span className="text-[11px] font-medium text-gray-400">달력에서 현장을 색으로 구분해요</span>
                </div>
                <div className="flex gap-3">
                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-slate-800' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">일한 날짜</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input 
                    type="date"
                    value={format(date, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDate(new Date(e.target.value));
                      }
                    }}
                    className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-bold border-none focus:ring-0"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full mt-4 bg-primary-600 dark:bg-primary-500 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 active:scale-[0.98] transition-all cursor-pointer"
              >
                저장
              </button>
            </form>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Add Record Modal Ends */}
    </div>
    </>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.provider_token) {
        localStorage.setItem('google_provider_token', session.provider_token)
      }
      if (session?.provider_refresh_token) {
        localStorage.setItem('google_provider_refresh_token', session.provider_refresh_token)
      }
    })
    
    // Capacitor 모바일 기기 뒤로가기 종료 방지 (안드로이드)
    let backButtonListener: any = null;
    const setupBackButton = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }
    setupBackButton();
    
    // 모바일 딥링크(Oauth 등) 처리
    let urlOpenListener: any = null;
    const setupDeepLink = async () => {
      urlOpenListener = await CapacitorApp.addListener('appUrlOpen', (event) => {
        // gongdoori://login-callback?code=... 형태 또는 #access_token=... 형태로 들어왔을 때 처리
        if (event.url.includes('gongdoori://login-callback')) {
          // 모바일 인앱 브라우저 닫기
          Browser.close().catch(() => {});
          
          const urlObj = new URL(event.url);
          
          // 에러가 넘어온 경우 팝업창 띄우기
          if (event.url.includes('error=')) {
            const errorDesc = urlObj.searchParams.get('error_description') || 
                              new URLSearchParams(urlObj.hash.substring(1)).get('error_description') || 
                              '소셜 로그인 중 알 수 없는 에러가 발생했습니다.';
            
            // alert가 완전히 뜨고 확인을 누를 때까지 기다림(await)
            Dialog.alert({ title: '로그인 실패', message: decodeURIComponent(errorDesc).replace(/\+/g, ' ') }).then(() => {
              window.location.href = window.location.origin;
            });
            return;
          }
          
          // 해시(#access_token)가 있는 경우
          if (urlObj.hash && urlObj.hash.includes('access_token=')) {
            const params = new URLSearchParams(urlObj.hash.substring(1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
                if (error) {
                  Dialog.alert({ title: '세션 에러', message: error.message }).then(() => {
                    window.location.href = window.location.origin;
                  });
                }
              });
            }
          } 
          // 쿼리 파라미터(?code=)가 있는 경우 (Supabase v2 PKCE 흐름)
          else if (urlObj.searchParams.has('code')) {
            const code = urlObj.searchParams.get('code');
            if (code) {
              supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) {
                  Dialog.alert({ title: '인증 에러', message: error.message }).then(() => {
                    window.location.href = window.location.origin;
                  });
                }
                // 성공 시 자동으로 onAuthStateChange가 감지하여 로그인 처리됨
              });
            }
          }
        }
      });
    };
    setupDeepLink();
    
    return () => {
      if (backButtonListener) backButtonListener.remove();
      if (urlOpenListener) urlOpenListener.remove();
    }
  }, [])

  return (
    <>
      {!session ? <Auth /> : <MainApp session={session} />}
    </>
  )
}

export default App
