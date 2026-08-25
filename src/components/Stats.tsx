import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function Stats({ records }: { records: any[] }) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const chartData = useMemo(() => {
    const dataBySite: Record<string, { total: number, color: string }> = {};
    records.forEach(r => {
      const site = r.siteName || '미지정 현장';
      if (!dataBySite[site]) {
        dataBySite[site] = { total: 0, color: r.color || '#3b82f6' };
      }
      dataBySite[site].total += Number(r.amount) || 0;
    });
    return Object.entries(dataBySite)
      .map(([name, data]) => ({ name, total: data.total, color: data.color }))
      .sort((a, b) => b.total - a.total); // Sort by highest amount
  }, [records]);

  const totalMonthly = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col gap-4">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 mb-2">리포트 요약</h2>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">전체 누적 수입</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{totalMonthly.toLocaleString()}원</p>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-5 flex flex-col min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">작업별 수입 분포</h3>
          
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            <button 
              onClick={() => setChartType('bar')} 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
            >
              막대
            </button>
            <button 
              onClick={() => setChartType('pie')} 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartType === 'pie' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
            >
              원형
            </button>
          </div>
        </div>

        <div className="w-full h-[300px] mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${val/10000}만`} width={60} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
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
                    innerRadius={60}
                    outerRadius={90}
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
              아직 기록된 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
