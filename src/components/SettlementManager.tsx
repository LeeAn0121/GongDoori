import { CheckCircle } from 'lucide-react'
import { Dialog } from '@capacitor/dialog'

export default function SettlementManager({ records, setCurrentView, onUpdateStatus }: { records: any[], setCurrentView: (view: 'calendar' | 'site' | 'settlement' | 'stats' | 'settings') => void, onUpdateStatus: (id: string, status: '미수금' | '완료') => void }) {
  
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const unpaidRecords = records.filter(r => r.status === '미수금');
  const unpaidAmount = unpaidRecords.reduce((sum, r) => sum + r.amount, 0);

  const handleSettle = async (record: any) => {
    const { value } = await Dialog.confirm({
      title: '수금 확인',
      message: `'${record.siteName}' 현장의 ${record.amount.toLocaleString()}원을 수금 완료 처리하시겠습니까?`
    });
    
    if (value) {
      onUpdateStatus(record.id, '완료');
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* 요약 카드 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col gap-4">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 mb-2">내 지갑 현황</h2>
        
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">이번 달 총수입</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{totalAmount.toLocaleString()}원</p>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <p className="text-sm text-red-500 font-semibold">수금 대기 (미수금)</p>
          <p className="text-2xl font-bold text-red-500">{unpaidAmount.toLocaleString()}원</p>
        </div>
      </div>

      {/* 정산 현황 목록 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50 mb-4">수금 내역 관리</h3>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🧾</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">아직 기록된 현장이 없어요</p>
            <button 
              onClick={() => setCurrentView('calendar')}
              className="px-6 py-2 bg-blue-600 dark:bg-orange-500 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 dark:bg-orange-600 transition-all cursor-pointer"
            >
              기록하러 가기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {records.map(record => (
              <div key={record.id} className="flex flex-col p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-slate-100">{record.siteName}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{record.date}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-bold ${record.status === '미수금' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {record.status}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <span className="font-bold text-gray-900 dark:text-slate-100">{record.amount.toLocaleString()}원</span>
                  {record.status === '미수금' && (
                    <button 
                      onClick={() => handleSettle(record)}
                      className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-orange-400 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      <CheckCircle size={16} /> 수금 완료 (입금확인)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
