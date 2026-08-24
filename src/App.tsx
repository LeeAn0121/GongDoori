import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { Plus, Menu, MapPin, DollarSign, AlignLeft, X, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from './supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { App as CapacitorApp } from '@capacitor/app'
import Auth from './Auth'
import 'react-calendar/dist/Calendar.css'

type WageRecord = {
  id: string
  date: string
  siteName: string
  amount: number
  memo: string
}

function MainApp({ session }: { session: Session }) {
  const [date, setDate] = useState<Date>(new Date())
  const [records, setRecords] = useState<WageRecord[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // New record form state
  const [siteName, setSiteName] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

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
        amount: d.amount,
        memo: d.memo
      })))
    }
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteName || !amount) return

    const { data, error } = await supabase
      .from('wage_records')
      .insert([
        {
          user_id: session.user.id,
          date: selectedDateStr,
          site_name: siteName,
          amount: parseInt(amount, 10),
          memo
        }
      ])
      .select()

    if (error) {
      alert('저장 중 오류가 발생했습니다: ' + error.message)
      return
    }
    
    if (data && data.length > 0) {
      const d = data[0]
      const newRecord: WageRecord = {
        id: d.id,
        date: d.date,
        siteName: d.site_name,
        amount: d.amount,
        memo: d.memo
      }
      setRecords([...records, newRecord])
    }
    
    setIsModalOpen(false)
    setSiteName('')
    setAmount('')
    setMemo('')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mb-0.5"></div>
            <span className="text-[10px] text-blue-600 font-semibold leading-tight">
              {(totalAmount / 10000).toFixed(0)}만
            </span>
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-20">
      <header className="w-full max-w-md p-4 pt-6 flex justify-between items-center sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">현장일지</h1>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors cursor-pointer border border-gray-200">
            <LogOut size={20} />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-white rounded-full shadow-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
            <Menu size={20} />
          </button>
        </div>
      </header>
      
      <main className="w-full max-w-md px-4 flex flex-col gap-4">
        {/* Calendar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-hidden">
          <style>{`
            .react-calendar { border: none !important; width: 100% !important; font-family: inherit !important; background: transparent !important; }
            .react-calendar__navigation button { font-weight: 700; font-size: 1.1rem; border-radius: 0.5rem; }
            .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #f3f4f6 !important; }
            .react-calendar__month-view__weekdays { text-transform: uppercase; font-weight: 600; font-size: 0.75rem; color: #6b7280; padding-bottom: 0.5rem; }
            .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
            .react-calendar__tile { padding: 0.5em 0.25em !important; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 60px; font-size: 0.9rem; font-weight: 500; border-radius: 0.75rem; color: #374151; }
            .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background: #f3f4f6 !important; }
            .react-calendar__tile--now { background: #eff6ff !important; color: #2563eb !important; }
            .react-calendar__tile--active { background: #2563eb !important; color: white !important; }
            .react-calendar__tile--active span { color: white !important; }
            .react-calendar__tile--active .bg-blue-500 { background: white !important; }
          `}</style>
          <Calendar 
            onChange={setDate as any} 
            value={date}
            tileContent={tileContent}
            formatDay={(_locale, date) => format(date, 'd')}
            className="w-full"
          />
        </div>
        
        {/* Daily Details List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 min-h-[250px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {format(date, 'M월 d일')} 내역
            </h2>
            {selectedRecords.length > 0 && (
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                총 {selectedRecords.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}원
              </span>
            )}
          </div>

          {selectedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <DollarSign size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">등록된 현장 내역이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedRecords.map(record => (
                <div key={record.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 text-gray-800 font-bold">
                      <MapPin size={16} className="text-blue-500" />
                      {record.siteName}
                    </div>
                    <div className="text-blue-600 font-bold">
                      {record.amount.toLocaleString()}원
                    </div>
                  </div>
                  {record.memo && (
                    <div className="flex items-start gap-1.5 text-gray-500 text-sm mt-1">
                      <AlignLeft size={14} className="mt-0.5" />
                      <p>{record.memo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 w-full max-w-md px-4 pointer-events-none flex justify-end z-20">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center pointer-events-auto hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {format(date, 'M월 d일')} 일당 추가
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddRecord} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">현장명</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="예: 강남 래미안 인테리어" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">일당 금액</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="예: 180000" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">원</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">메모 (선택)</label>
                <div className="relative">
                  <AlignLeft size={18} className="absolute left-3 top-4 text-gray-400" />
                  <textarea 
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="특이사항이나 작업 내용을 적어주세요" 
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  ></textarea>
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full mt-2 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                저장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-900">메뉴</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex flex-col gap-2 flex-1">
              <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left text-gray-700 font-semibold transition-colors">
                🏠 홈 (달력)
              </button>
              <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left text-gray-700 font-semibold transition-colors">
                📊 월별 통계
              </button>
              <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left text-gray-700 font-semibold transition-colors">
                👥 팀 및 크루 관리
              </button>
              <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left text-gray-700 font-semibold transition-colors">
                ⚙️ 내 설정
              </button>
            </nav>

            <div className="mt-auto">
              <div className="p-4 bg-gray-50 rounded-xl mb-4">
                <p className="text-xs text-gray-500 mb-1">로그인된 계정</p>
                <p className="text-sm font-bold text-gray-800 break-all">{session.user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
    
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    }
  }, [])

  return (
    <>
      {!session ? <Auth /> : <MainApp session={session} />}
    </>
  )
}

export default App
