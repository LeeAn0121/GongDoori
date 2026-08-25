import { useState, useEffect } from 'react'
import { Calendar } from 'react-calendar'
import { Plus, MapPin, DollarSign, AlignLeft, Trash2, Edit2, Calendar as CalendarIcon, MoreVertical, BarChart2, Settings as SettingsIcon, Sun, Moon } from 'lucide-react'
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
}

function MainApp({ session }: { session: Session }) {
  const [date, setDate] = useState<Date>(new Date())
  const [activeStartDate, setActiveStartDate] = useState<Date | null>(new Date())
  const [records, setRecords] = useState<WageRecord[]>([])
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
  const [isSchedule, setIsSchedule] = useState(false)
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null)

  const selectedDateStr = format(date, 'yyyy-MM-dd')
  const selectedRecords = records.filter(r => r.date === selectedDateStr)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('wage_records')
      .select('*')
      .eq('user_id', session.user.id)
      
    if (error) {
      console.error('데이터 불러오기 에러:', error)
      return
    }

    if (data) {
      setRecords(data.map(d => ({
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
      amount: isSchedule ? 0 : parseInt(amount, 10),
      tax_deduction: taxDeduction,
      poomsu,
      expenses: expenses ? parseInt(expenses, 10) : 0,
      color,
      memo
    }

    if (editingId) {
      const { error } = await supabase.from('wage_records').update(recordData).eq('id', editingId)
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
        memo: recordData.memo 
      } : r))
    } else {
      const { data, error } = await supabase.from('wage_records').insert([recordData]).select()
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
          memo: d.memo || '' 
        }])
      }
    }
    
    setIsModalOpen(false)
    resetForm()
  }

  const toggleExpand = (id: string) => {
    setExpandedRecordId(prev => prev === id ? null : id)
  }

  const handleDelete = async (id: string) => {
    const { value } = await Dialog.confirm({ title: '삭제', message: '이 내역을 삭제하시겠습니까?' })
    if (value) {
      const { error } = await supabase.from('wage_records').delete().eq('id', id)
      if (error) {
        await Dialog.alert({ title: '오류', message: '삭제 중 오류가 발생했습니다.' })
      } else {
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
      if (dayRecords.length > 0) {
        const totalAmount = dayRecords.reduce((sum, r) => sum + r.amount, 0)
        return (
          <div className="flex flex-col items-center mt-1">
            <div className="flex gap-0.5 mb-0.5">
              {dayRecords.map(r => (
                <div key={r.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color || '#3B82F6' }}></div>
              ))}
            </div>
            <span className="text-[10px] text-blue-600 dark:text-orange-400 font-semibold leading-tight">
              {(totalAmount / 10000).toFixed(0)}만
            </span>
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center pb-20 transition-colors duration-300">
      <header className="w-full max-w-md p-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] flex justify-between items-center sticky top-0 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-xl z-40">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}app_icon_v2.jpg`} alt="공돌이" className="w-8 h-8 rounded-lg shadow-sm" />
          공돌이
        </h1>
        <button 
          onClick={toggleDarkMode}
          className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer text-gray-600 dark:text-yellow-400"
          aria-label="다크 모드 전환"
        >
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>
      
      <main className="w-full max-w-md px-4 flex flex-col gap-4 pb-28">
        {currentView === 'calendar' && (
          <>
            {/* Calendar Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-200 dark:border-slate-700/50 p-4 overflow-hidden relative">
              <button 
                onClick={() => {
                  const now = new Date();
                  setDate(now);
                  setActiveStartDate(now);
                }}
                className="absolute top-4 right-4 z-10 px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-600 dark:bg-orange-500/10 text-blue-600 dark:text-orange-400 rounded-full hover:bg-blue-100 dark:bg-orange-900/30 active:scale-95 transition-all"
              >
                오늘
              </button>
          <style>{`
            .react-calendar { border: none !important; width: 100% !important; font-family: inherit !important; background: transparent !important; }
            .react-calendar__navigation { padding-right: 3rem; } /* Make room for Today button */
            .react-calendar__navigation button { font-weight: 700; font-size: 1.1rem; border-radius: 0.5rem; }
            .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #f3f4f6 !important; }
            .react-calendar__month-view__weekdays { text-transform: uppercase; font-weight: 600; font-size: 0.75rem; color: #6b7280; padding-bottom: 0.5rem; }
            .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
            .react-calendar__tile { padding: 0.5em 0.25em !important; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 60px; font-size: 0.9rem; font-weight: 500; border-radius: 0.75rem; color: #374151; }
            .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background: #f3f4f6 !important; }
            .react-calendar__tile--now { background: #eff6ff !important; color: #2563eb !important; }
            .react-calendar__tile--active { background: #2563eb !important; color: white !important; }
            .react-calendar__tile--active span { color: white !important; }
            .react-calendar__tile--active .bg-blue-50 dark:bg-blue-600 dark:bg-orange-500/100 { background: white !important; }
            .react-calendar__tile--active .bg-purple-500 { background: white !important; }
          `}</style>
          <Calendar 
            onChange={setDate as any} 
            value={date}
            activeStartDate={activeStartDate || undefined}
            onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate as Date)}
            tileContent={tileContent}
            formatDay={(_locale, date) => format(date, 'd')}
            className="w-full"
          />
        </div>
        
        {/* Daily Details List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-200 dark:border-slate-700/50 p-5 min-h-[250px]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-50">
              {format(date, 'M월 d일')} 내역
            </h2>
            {selectedRecords.length > 0 && (
              <span className="text-sm font-semibold text-blue-600 dark:text-orange-400 bg-blue-50 dark:bg-blue-600 dark:bg-orange-500/10 px-3 py-1 rounded-full">
                총 {selectedRecords.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}원
              </span>
            )}
          </div>

          {selectedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-900 dark:text-gray-400 dark:text-slate-500">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                <DollarSign size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">등록된 현장 내역이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedRecords.map(record => {
                const isItemSchedule = record.amount === 0 && !record.poomsu
                const isExpanded = expandedRecordId === record.id
                return (
                  <div key={record.id} className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-200 dark:border-slate-700/50 flex flex-col relative overflow-hidden shadow-sm">
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5 text-gray-800 dark:text-slate-100 font-bold">
                          {isItemSchedule ? <CalendarIcon size={16} className="text-purple-500 dark:text-emerald-500" /> : <MapPin size={16} className="text-blue-500 dark:text-orange-500" />}
                          {record.siteName}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`font-bold ${isItemSchedule ? 'text-purple-600 dark:text-emerald-400' : 'text-blue-600 dark:text-orange-400'}`}>
                            {isItemSchedule ? '일정' : `${record.amount.toLocaleString()}원`}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleExpand(record.id); }}
                            className="p-1 -mr-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                          >
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </div>
                      {(record.taskContent || record.memo) && (
                        <div className="flex flex-col text-gray-600 dark:text-slate-300 text-sm mt-1.5 pr-8 leading-relaxed">
                          {record.taskContent && <p className="font-semibold text-gray-700 dark:text-slate-200">[{record.taskContent}]</p>}
                          {record.memo && <p>{record.memo}</p>}
                        </div>
                      )}
                    </div>
                    
                    {/* Expandable Action Menu */}
                    {isExpanded && (
                      <div className="flex border-t border-gray-100 dark:border-gray-200 dark:border-slate-700/50 bg-gray-50/50 dark:bg-white dark:bg-slate-800/50">
                        <button 
                          onClick={() => { openEdit(record); setExpandedRecordId(null); }} 
                          className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:text-orange-400 transition-colors"
                        >
                          <Edit2 size={16} /> 수정
                        </button>
                        <div className="w-[1px] bg-gray-100 dark:bg-slate-700/50"></div>
                        <button 
                          onClick={() => { handleDelete(record.id); setExpandedRecordId(null); }} 
                          className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} /> 삭제
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        </>
        )}

        {currentView === 'stats' && <Stats records={records} />}

        {currentView === 'settings' && <Settings session={session} />}

        {currentView === 'site' && <SiteManager records={records} setCurrentView={setCurrentView} />}

        {currentView === 'settlement' && <SettlementManager records={records} setCurrentView={setCurrentView} onUpdateStatus={handleUpdateStatus} />}


      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 pb-[env(safe-area-inset-bottom)] z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => setCurrentView('calendar')} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'calendar' ? 'text-blue-600 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
          >
            <CalendarIcon size={24} className={currentView === 'calendar' ? 'fill-blue-50 dark:fill-orange-900/30' : ''} />
            <span className="text-[10px] font-bold">캘린더</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('site')} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'site' ? 'text-blue-600 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
          >
            <MapPin size={24} className={currentView === 'site' ? 'fill-blue-50 dark:fill-orange-900/30' : ''} />
            <span className="text-[10px] font-bold">작업기록</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('settlement')} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'settlement' ? 'text-blue-600 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
          >
            <DollarSign size={24} className={currentView === 'settlement' ? 'fill-blue-50 dark:fill-orange-900/30' : ''} />
            <span className="text-[10px] font-bold">내 지갑</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('stats')} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'stats' ? 'text-blue-600 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
          >
            <BarChart2 size={24} className={currentView === 'stats' ? 'fill-blue-50 dark:fill-orange-900/30' : ''} />
            <span className="text-[10px] font-bold">리포트</span>
          </button>

          <button 
            onClick={() => setCurrentView('settings')} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'settings' ? 'text-blue-600 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'}`}
          >
            <SettingsIcon size={24} className={currentView === 'settings' ? 'fill-blue-50 dark:fill-orange-900/30' : ''} />
            <span className="text-[10px] font-bold">내 정보</span>
          </button>
        </div>
      </nav>

      {/* Floating Action Button (Only on home) */}
      {currentView === 'calendar' && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] w-full max-w-md px-4 pointer-events-none flex justify-end z-20">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-14 h-14 bg-blue-600 dark:bg-orange-500 text-white rounded-full shadow-lg shadow-blue-200 dark:shadow-orange-900/50 flex items-center justify-center pointer-events-auto hover:bg-blue-700 dark:bg-orange-600 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={28} />
          </button>
        </div>
      )}

      {/* Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                {format(date, 'M월 d일')} {editingId ? '기록 수정' : '기록 추가'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:bg-slate-600 cursor-pointer"
              >
                닫기
              </button>
            </div>
            
            <form onSubmit={handleAddRecord} className="flex flex-col gap-4">
              <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-2">
                <button type="button" onClick={() => setIsSchedule(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSchedule ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-orange-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}>일당 기록</button>
                <button type="button" onClick={() => setIsSchedule(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSchedule ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}>일정 (메모)</button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{isSchedule ? '일정 제목' : '현장명'}</label>
                <div className="relative">
                  {isSchedule ? <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 dark:text-slate-500" /> : <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 dark:text-slate-500" />}
                  <input 
                    type="text" 
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder={isSchedule ? "예: 팀 회식, 공구 구매" : "예: 강남 래미안 인테리어"}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
              </div>
              
              {!isSchedule && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">작업 내용 (선택)</label>
                    <div className="relative">
                      <AlignLeft size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 dark:text-slate-500" />
                      <input 
                        type="text" 
                        value={taskContent}
                        onChange={(e) => setTaskContent(e.target.value)}
                        placeholder="예: 목공 마감, 창호 설치" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">일당 (원)</label>
                      <div className="relative">
                        <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 dark:text-slate-500" />
                        <input 
                          type="number" 
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="예: 180000" 
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all"
                        />
                      </div>
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">품수</label>
                      <select 
                        value={poomsu} 
                        onChange={(e) => setPoomsu(Number(e.target.value))}
                        className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all appearance-none text-center"
                      >
                        <option value={1.0}>1품</option>
                        <option value={0.5}>0.5품</option>
                        <option value={1.5}>1.5품</option>
                        <option value={2.0}>2품</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer mt-[-4px]">
                    <input 
                      type="checkbox" 
                      checked={taxDeduction} 
                      onChange={(e) => setTaxDeduction(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <span className="text-sm font-medium text-gray-600 dark:text-slate-400">인적공제 3.3% 공제 후 받음</span>
                  </label>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">경비 (선택)</label>
                    <div className="relative">
                      <Plus size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 dark:text-slate-500" />
                      <input 
                        type="number" 
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        placeholder="예: 식대, 자재비 등 (3.3% 공제 제외)" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">달력 색상</label>
                    <div className="flex gap-3">
                      {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-slate-800' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">상세 메모 (선택)</label>
                <div className="relative">
                  <AlignLeft size={18} className="absolute left-3 top-4 text-gray-900 dark:text-gray-400 dark:text-slate-500" />
                  <textarea 
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="특이사항이나 작업 내용을 적어주세요" 
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all resize-none"
                  ></textarea>
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full mt-2 bg-blue-600 dark:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-orange-900/50 hover:bg-blue-700 dark:bg-orange-600 active:scale-[0.98] transition-all cursor-pointer"
              >
                저장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Record Modal Ends */}
    </div>
  )
}

function App() {
  const [selectedRecord, setSelectedRecord] = useState<WageRecord | null>(null)
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  })

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setIsDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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
