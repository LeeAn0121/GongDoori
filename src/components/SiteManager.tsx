import { MapPin, Search, ChevronRight, Briefcase } from 'lucide-react'
import { useState, useMemo } from 'react'

export default function SiteManager({ records, setCurrentView }: { records: any[], setCurrentView: (view: 'calendar' | 'site' | 'settlement' | 'stats' | 'settings') => void }) {
  const [search, setSearch] = useState('');

  const groupedSites = useMemo(() => {
    const map: Record<string, { totalAmount: number, days: number, color: string, lastDate: string }> = {};
    records.forEach(r => {
      const site = r.siteName || '미지정 현장';
      if (!map[site]) {
        map[site] = { totalAmount: 0, days: 0, color: r.color || '#3b82f6', lastDate: r.date };
      }
      map[site].totalAmount += Number(r.amount) || 0;
      map[site].days += 1;
      if (new Date(r.date) > new Date(map[site].lastDate)) {
        map[site].lastDate = r.date;
      }
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .filter(site => site.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
  }, [records, search]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Briefcase className="text-blue-600 dark:text-orange-400" size={24} />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-50">내 작업현장</h2>
          </div>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="현장 이름으로 검색..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Site List */}
      <div className="flex flex-col gap-3 min-h-[400px]">
        {groupedSites.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🏗️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">기록된 현장이 없습니다</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">캘린더에서 오늘의 출역을 먼저 등록해주세요.</p>
            <button 
              onClick={() => setCurrentView('calendar')}
              className="px-6 py-2.5 bg-blue-600 dark:bg-orange-500 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 dark:bg-orange-600 transition-all cursor-pointer"
            >
              기록 추가하러 가기
            </button>
          </div>
        ) : (
          groupedSites.map(site => (
            <div key={site.name} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-slate-600 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: site.color + '20', color: site.color }}>
                  <MapPin size={24} />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-extrabold text-gray-900 dark:text-slate-100 text-base mb-0.5">{site.name}</h4>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                    총 <span className="text-blue-600 dark:text-orange-400">{site.days}일</span> 출역 • 최근 {site.lastDate}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-extrabold text-gray-900 dark:text-slate-50">{site.totalAmount.toLocaleString()}원</span>
                <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
