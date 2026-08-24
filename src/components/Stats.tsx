import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Stats({ records }: { records: any[] }) {
  const chartData = useMemo(() => {
    const dataBySite: Record<string, number> = {};
    records.forEach(r => {
      dataBySite[r.siteName] = (dataBySite[r.siteName] || 0) + r.amount;
    });
    return Object.entries(dataBySite).map(([name, total]) => ({ name, total }));
  }, [records]);

  const totalMonthly = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-200 dark:border-slate-700/50 p-6 flex flex-col min-h-[400px] animate-in fade-in duration-200">
      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6">📊 현장별 수익 통계</h2>
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-600 dark:bg-orange-500/10 rounded-xl">
        <p className="text-sm text-blue-600 dark:text-orange-400 font-semibold mb-1">총 누적 일당</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{totalMonthly.toLocaleString()}원</p>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis tickFormatter={(val) => `${val/10000}만`} width={40} tick={{fontSize: 12}} />
              <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()}원`, '수익']} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-900 dark:text-gray-400 dark:text-slate-500 text-sm">
            데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
