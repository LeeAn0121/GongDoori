import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { subWeeks, subMonths, isAfter, parseISO, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { FileText, Table } from 'lucide-react';

export default function Stats({ records }: { records: any[] }) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [dateFilter, setDateFilter] = useState<'all' | '2w' | '1m' | '3m' | '6m'>('1m');

  const filteredRecords = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    
    if (dateFilter === '2w') startDate = subWeeks(now, 2);
    else if (dateFilter === '1m') startDate = subMonths(now, 1);
    else if (dateFilter === '3m') startDate = subMonths(now, 3);
    else if (dateFilter === '6m') startDate = subMonths(now, 6);

    if (!startDate) return records;
    return records.filter(r => isAfter(parseISO(r.date), startDate!));
  }, [records, dateFilter]);

  const chartData = useMemo(() => {
    const dataBySite: Record<string, { total: number, color: string }> = {};
    filteredRecords.forEach(r => {
      const site = r.siteName || '미지정 현장';
      if (!dataBySite[site]) {
        dataBySite[site] = { total: 0, color: r.color || '#3b82f6' };
      }
      dataBySite[site].total += Number(r.amount) || 0;
    });
    return Object.entries(dataBySite)
      .map(([name, data]) => ({ name, total: data.total, color: data.color }))
      .sort((a, b) => b.total - a.total); // Sort by highest amount
  }, [filteredRecords]);

  const totalFiltered = chartData.reduce((sum, item) => sum + item.total, 0);

  const exportToExcel = () => {
    const dataForExcel = filteredRecords.map(r => ({
      '작업일자': r.date,
      '현장명': r.siteName,
      '수입(원)': r.amount,
      '상세작업': r.taskContent || '',
      '메모': r.memo || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 30 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "작업내역");
    XLSX.writeFile(wb, `공돌이_내역정리_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 w-full">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {/* Date Filter Toggle */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-4 no-print flex overflow-x-auto gap-2 snap-x hide-scrollbar">
        {[
          { id: '1m', label: '1개월' },
          { id: '2w', label: '2주' },
          { id: '3m', label: '3개월' },
          { id: '6m', label: '6개월' },
          { id: 'all', label: '전체' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setDateFilter(filter.id as any)}
            className={`shrink-0 snap-center px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 ${dateFilter === filter.id ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(37,99,235,0.2)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-white relative overflow-hidden print-container">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <p className="text-blue-100 dark:text-gray-400 font-semibold mb-1 text-sm">조회 기간 누적 수입</p>
          <div className="flex items-end gap-2">
            <h2 className="text-4xl font-extrabold tracking-tight">{totalFiltered.toLocaleString()}</h2>
            <span className="text-lg font-bold text-blue-200 dark:text-gray-500 mb-1">원</span>
          </div>
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex gap-3 no-print">
        <button 
          onClick={exportToExcel}
          className="flex-1 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 py-3 rounded-2xl font-extrabold text-sm shadow-sm hover:bg-green-500/20 dark:hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 border border-green-200 dark:border-green-800"
        >
          <Table size={18} /> 엑셀 다운로드
        </button>
        <button 
          onClick={exportToPDF}
          className="flex-1 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 py-3 rounded-2xl font-extrabold text-sm shadow-sm hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
        >
          <FileText size={18} /> PDF 인쇄
        </button>
      </div>

      {/* Chart Card */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-5 flex flex-col min-h-[350px] no-print">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">현장별 수입 분포</h3>
          
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            <button 
              onClick={() => setChartType('bar')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
            >
              막대
            </button>
            <button 
              onClick={() => setChartType('pie')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartType === 'pie' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
            >
              원형
            </button>
          </div>
        </div>

        <div className="w-full h-[250px] mt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${val/10000}만`} width={50} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '수입']} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="name"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '수입']} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm font-semibold">
              해당 기간에 기록된 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
      
      {/* Data Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden print-container mt-2">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">상세 내역</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-gray-100 dark:border-slate-700">날짜</th>
                <th className="p-4 border-b border-gray-100 dark:border-slate-700">현장명</th>
                <th className="p-4 border-b border-gray-100 dark:border-slate-700 text-right">수입</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.sort((a,b) => b.date.localeCompare(a.date)).map(record => (
                  <tr key={record.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600 dark:text-slate-400 font-medium whitespace-nowrap">{format(parseISO(record.date), 'M.d')}</td>
                    <td className="p-4 text-sm text-gray-900 dark:text-slate-300 font-bold whitespace-nowrap">
                      {record.siteName}
                      {(record.taskContent || record.memo) && (
                        <div className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-0.5 font-normal truncate max-w-[120px]">
                          {record.taskContent} {record.memo}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-blue-600 dark:text-blue-400 font-extrabold text-right whitespace-nowrap">{record.amount.toLocaleString()}원</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-sm text-gray-400 dark:text-slate-500 font-medium">조회된 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

