import { CheckCircle, XCircle, Wallet, AlertCircle } from 'lucide-react'
import { Dialog } from '@capacitor/dialog'
import { useState } from 'react'

export default function SettlementManager({ records, setCurrentView, onUpdateStatus }: { records: any[], setCurrentView: (view: 'calendar' | 'site' | 'settlement' | 'stats' | 'settings') => void, onUpdateStatus: (id: string, status: '미수금' | '완료') => void }) {
  
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const unpaidRecords = records.filter(r => r.status === '미수금');
  const paidRecords = records.filter(r => r.status === '완료');
  const unpaidAmount = unpaidRecords.reduce((sum, r) => sum + r.amount, 0);
  const paidAmount = paidRecords.reduce((sum, r) => sum + r.amount, 0);

  const filteredRecords = records.filter(r => {
    if (filter === 'unpaid') return r.status === '미수금';
    if (filter === 'paid') return r.status === '완료';
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSettle = async (record: any) => {
    const { value } = await Dialog.confirm({
      title: '수금 확인',
      message: `'${record.siteName}' 현장의 ${record.amount.toLocaleString()}원을 수금 완료 처리하시겠습니까?`
    });
    
    if (value) {
      onUpdateStatus(record.id, '완료');
    }
  };

  const handleCancelSettle = async (record: any) => {
    const { value } = await Dialog.confirm({
      title: '수금 취소',
      message: `'${record.siteName}' 현장의 수금 완료를 취소하고 다시 미수금으로 변경하시겠습니까?`
    });
    
    if (value) {
      onUpdateStatus(record.id, '미수금');
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* 요약 카드 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Wallet className="text-blue-600 dark:text-orange-400" size={24} />
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-50">내 지갑 현황</h2>
        </div>
        
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">이번 달 총수입</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-50">{totalAmount.toLocaleString()}원</p>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1 flex items-center gap-1">
              <AlertCircle size={14} /> 미수금 잔액
            </p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{unpaidAmount.toLocaleString()}원</p>
          </div>
          <div className="flex-1 bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20">
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1 flex items-center gap-1">
              <CheckCircle size={14} /> 수금 완료
            </p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{paidAmount.toLocaleString()}원</p>
          </div>
        </div>
      </div>

      {/* 정산 현황 목록 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-5 min-h-[400px]">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">수금 내역 관리</h3>
          
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            {(['all', 'unpaid', 'paid'] as const).map((type) => (
              <button 
                key={type}
                onClick={() => setFilter(type)} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === type ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
              >
                {type === 'all' ? '전체' : type === 'unpaid' ? '미수금' : '완료'}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🧾</span>
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-6">해당하는 기록이 없어요</p>
            {filter === 'all' && (
              <button 
                onClick={() => setCurrentView('calendar')}
                className="px-6 py-2.5 bg-blue-600 dark:bg-orange-500 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 dark:bg-orange-600 transition-all cursor-pointer"
              >
                기록 추가하러 가기
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRecords.map(record => (
              <div key={record.id} className="flex flex-col p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <h4 className="font-extrabold text-gray-900 dark:text-slate-100 text-base">{record.siteName}</h4>
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">{record.date}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${record.status === '미수금' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-900/50'}`}>
                    {record.status}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-200 dark:border-slate-700/50">
                  <span className="font-extrabold text-lg text-gray-900 dark:text-slate-100">{record.amount.toLocaleString()}원</span>
                  {record.status === '미수금' ? (
                    <button 
                      onClick={() => handleSettle(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm font-bold text-blue-600 dark:text-orange-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                    >
                      <CheckCircle size={16} /> 수금 완료
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleCancelSettle(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <XCircle size={16} /> 취소
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
