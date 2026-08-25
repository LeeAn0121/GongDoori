import { MapPin, Search, ChevronRight, Briefcase, ArrowLeft, Calendar } from 'lucide-react'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SiteManager({ records, settlements, setCurrentView }: { records: any[], settlements: any[], setCurrentView: (view: 'calendar' | 'site' | 'settlement' | 'stats' | 'settings') => void }) {
  const [search, setSearch] = useState('');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const groupedSites = useMemo(() => {
    const map: Record<string, { totalAmount: number, paidAmount: number, unpaidAmount: number, days: number, color: string, lastDate: string, records: any[] }> = {};
    records.forEach(r => {
      const site = r.siteName || '미지정 현장';
      if (!map[site]) {
        map[site] = { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, days: 0, color: r.color || '#3b82f6', lastDate: r.date, records: [] };
      }
      map[site].totalAmount += Number(r.amount) || 0;
      map[site].days += 1;
      map[site].records.push(r);
      if (new Date(r.date) > new Date(map[site].lastDate)) {
        map[site].lastDate = r.date;
      }
    });

    settlements?.forEach(s => {
      const site = s.siteName;
      if (map[site]) {
        map[site].paidAmount += Number(s.amount) || 0;
      }
    });

    Object.values(map).forEach(site => {
      site.unpaidAmount = Math.max(0, site.totalAmount - site.paidAmount);
      site.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .filter(site => site.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
  }, [records, search]);

  const selectedSiteData = groupedSites.find(s => s.name === selectedSite);

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedSite ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Header & Search */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-primary-50 dark:bg-orange-500/10 rounded-2xl">
                    <Briefcase className="text-primary-600 dark:text-orange-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">내 작업현장</h2>
                </div>
              </div>
              
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  placeholder="현장 이름으로 검색..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm font-semibold"
                />
              </div>
            </div>

            {/* Site List */}
            <div className="flex flex-col gap-3 min-h-[400px]">
              {groupedSites.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-700/50 p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner">
                    <span className="text-4xl">🏗️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2 tracking-tight">기록된 현장이 없습니다</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-8">캘린더에서 오늘의 출역을 먼저 등록해주세요.</p>
                  <button 
                    onClick={() => setCurrentView('calendar')}
                    className="px-8 py-3.5 bg-primary-600 dark:bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-primary-200/50 dark:shadow-orange-900/30 hover:bg-primary-700 dark:hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
                  >
                    기록 추가하러 가기
                  </button>
                </div>
              ) : (
                groupedSites.map((site, idx) => {
                  const progress = site.totalAmount > 0 ? (site.paidAmount / site.totalAmount) * 100 : 0;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={site.name} 
                      onClick={() => setSelectedSite(site.name)}
                      className="flex flex-col p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 dark:border-slate-700/50 hover:border-primary-200 dark:hover:border-slate-600 transition-all active:scale-[0.98] cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: site.color + '20', color: site.color }}>
                            <MapPin size={26} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                            <h4 className="font-extrabold text-gray-900 dark:text-slate-100 text-lg mb-1 tracking-tight">{site.name}</h4>
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                              총 <span className="text-primary-600 dark:text-orange-400 font-bold">{site.days}일</span> 출역 • 최근 {site.lastDate.substring(5)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 dark:text-slate-600 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      
                      <div className="flex flex-col gap-2 bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-500 dark:text-slate-400">수금 진척도</span>
                          <span className="font-extrabold text-gray-900 dark:text-slate-100">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 dark:bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs">
                          <div className="flex flex-col">
                            <span className="text-gray-400 dark:text-slate-500">받은 금액</span>
                            <span className="font-bold text-gray-700 dark:text-slate-300">{site.paidAmount.toLocaleString()}원</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-red-400 dark:text-red-400/80 font-bold">미수금</span>
                            <span className="font-extrabold text-red-500 dark:text-red-400">{site.unpaidAmount.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Detail Header */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col">
              <button 
                onClick={() => setSelectedSite(null)}
                className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors mb-6 font-bold w-fit cursor-pointer"
              >
                <ArrowLeft size={20} /> 뒤로 가기
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-md" style={{ backgroundColor: selectedSiteData?.color + '20', color: selectedSiteData?.color }}>
                  <MapPin size={32} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">{selectedSiteData?.name}</h2>
                  <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-1">현장 세부 기록</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">총 출역일</p>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-slate-50">{selectedSiteData?.days}일</p>
                </div>
                <div className="flex-1 bg-primary-50/50 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100/50 dark:border-primary-900/20">
                  <p className="text-xs font-bold text-primary-600/80 dark:text-primary-400/80 mb-1">총 발생 금액</p>
                  <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">{selectedSiteData?.totalAmount.toLocaleString()}원</p>
                </div>
                <div className="flex-1 bg-red-50/50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100/50 dark:border-red-900/20">
                  <p className="text-xs font-bold text-red-500/80 dark:text-red-400/80 mb-1">총 미수금</p>
                  <p className="text-xl font-extrabold text-red-500 dark:text-red-400">{selectedSiteData?.unpaidAmount.toLocaleString()}원</p>
                </div>
              </div>
            </div>

            {/* Record Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-slate-700/50 p-6 min-h-[300px]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50 mb-5 tracking-tight flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" /> 출역 일지
              </h3>
              
              <div className="flex flex-col gap-4 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gray-100 dark:bg-slate-700/50 rounded-full z-0"></div>
                {selectedSiteData?.records.map((r) => (
                  <div key={r.id} className="relative z-10 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-4 border-gray-50 dark:border-slate-900 shadow-sm flex items-center justify-center shrink-0 mt-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedSiteData.color }}></div>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900 dark:text-slate-100">{r.date}</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${r.status === '미수금' ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'bg-green-50 text-green-600 dark:bg-green-900/30'}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-3">
                        <div className="flex flex-col text-sm text-gray-600 dark:text-slate-400">
                          {r.taskContent && <span className="font-semibold text-gray-700 dark:text-slate-300">[{r.taskContent}]</span>}
                          {r.memo && <span>{r.memo}</span>}
                          {!r.taskContent && !r.memo && <span>기본 출역</span>}
                        </div>
                        <span className="font-extrabold text-lg text-gray-900 dark:text-slate-50">{r.amount.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
