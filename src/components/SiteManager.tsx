import { MapPin, Search } from 'lucide-react'

export default function SiteManager({ records, setCurrentView }: { records: any[], setCurrentView: (view: 'calendar' | 'site' | 'settlement' | 'stats' | 'settings') => void }) {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-50">내 작업기록</h2>
          <button className="text-gray-500 dark:text-slate-400 hover:text-gray-700">
            <Search size={20} />
          </button>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🗂️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">기록된 작업이 없습니다</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">캘린더에서 오늘의 출역을 등록해보세요.</p>
            <button 
              onClick={() => setCurrentView('calendar')}
              className="px-6 py-3 bg-blue-600 dark:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-orange-900/50 hover:bg-blue-700 dark:bg-orange-600 active:scale-95 transition-all cursor-pointer"
            >
              달력으로 이동하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {records.map(record => (
              <div key={record.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: record.color + '20', color: record.color }}>
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-slate-100">{record.siteName}</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{record.date}</p>
                </div>
                <div className="font-bold text-blue-600 dark:text-orange-400">
                  {record.amount.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
