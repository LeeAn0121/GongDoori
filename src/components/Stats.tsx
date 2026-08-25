import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { subWeeks, subMonths, isAfter, parseISO, format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FileText, Table, Calculator, X } from 'lucide-react';
import { Dialog } from '@capacitor/dialog';
import { motion, AnimatePresence } from 'framer-motion';

export default function Stats({ records }: { records: any[] }) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [dateFilter, setDateFilter] = useState<'all' | '2w' | '1m' | '3m' | '6m'>('1m');
  const [isTaxCalcOpen, setIsTaxCalcOpen] = useState(false);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear().toString());

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

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

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
      .sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  const totalFiltered = chartData.reduce((sum, item) => sum + item.total, 0);

  const getFilterLabel = () => {
    if (dateFilter === 'all') return '전체 기간';
    if (dateFilter === '2w') return '최근 2주';
    if (dateFilter === '1m') return '최근 1개월';
    if (dateFilter === '3m') return '최근 3개월';
    if (dateFilter === '6m') return '최근 6개월';
    return '';
  }

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('작업 내역 이력', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    sheet.columns = [
      { width: 15 }, { width: 25 }, { width: 45 }, { width: 20 }
    ];

    sheet.mergeCells('A1:D1');
    const title = sheet.getCell('A1');
    title.value = '작업 내역 이력';
    title.font = { name: 'Malgun Gothic', size: 20, bold: true };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    sheet.mergeCells('A2:D2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = `조회 기간: ${getFilterLabel()}   |   출력 일자: ${format(new Date(), 'yyyy.MM.dd')}`;
    infoCell.font = { name: 'Malgun Gothic', size: 11, color: { argb: 'FF666666' } };
    infoCell.alignment = { horizontal: 'right', vertical: 'middle' };

    sheet.addRow([]);

    const headerRow = sheet.addRow(['작업 일자', '현 장 명', '작업 내용 및 특이사항', '금 액']);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.font = { name: 'Malgun Gothic', bold: true, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    sortedRecords.forEach(record => {
      const details = [record.taskContent, record.memo].filter(Boolean).join(' / ');
      const row = sheet.addRow([
        record.date,
        record.siteName,
        details,
        record.amount
      ]);
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(4).numFmt = '#,##0"원"';

      row.eachCell((cell) => {
        cell.font = { name: 'Malgun Gothic', size: 11 };
        cell.border = { top: { style: 'thin', color: { argb: 'FFEEEEEE' } }, bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } }, left: { style: 'thin', color: { argb: 'FFEEEEEE' } }, right: { style: 'thin', color: { argb: 'FFEEEEEE' } } };
      });
    });

    const totalRow = sheet.addRow(['', '', '합 계 :', totalFiltered]);
    totalRow.height = 30;
    totalRow.getCell(3).font = { name: 'Malgun Gothic', bold: true, size: 12 };
    totalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(4).font = { name: 'Malgun Gothic', bold: true, size: 14, color: { argb: 'FF2563EB' } };
    totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(4).numFmt = '#,##0"원"';
    totalRow.eachCell((cell, colNum) => {
      if (colNum >= 3) {
        cell.border = { top: { style: 'double', color: { argb: 'FF000000' } }, bottom: { style: 'thick', color: { argb: 'FF000000' } } };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `내역이력_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = () => {
    window.print();
  };

  const handleCalculateTax = async () => {
    const yearRecords = records.filter(r => r.date.startsWith(taxYear));
    const totalIncome = yearRecords.reduce((sum, r) => sum + r.amount, 0);
    
    // 단순 계산 (기본공제 150만, 단순경비율 미반영, 사업소득 기준)
    const taxBase = Math.max(0, totalIncome - 1500000);
    let tax = 0;
    if (taxBase <= 14000000) tax = taxBase * 0.06;
    else if (taxBase <= 50000000) tax = taxBase * 0.15 - 1260000;
    else if (taxBase <= 88000000) tax = taxBase * 0.24 - 5760000;
    else if (taxBase <= 150000000) tax = taxBase * 0.35 - 15440000;
    else tax = taxBase * 0.38 - 19940000;
    
    const totalTax = tax * 1.1; // 지방소득세 10% 추가

    await Dialog.alert({
      title: `${taxYear}년 종합소득세 예상`,
      message: `총 수입: ${totalIncome.toLocaleString()}원\n\n예상 납부세액(지방세 포함): 약 ${Math.floor(totalTax).toLocaleString()}원\n\n*단순 기본공제(150만)만 적용된 참고용 수치입니다.`
    });
    setIsTaxCalcOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 w-full">
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            background-color: white !important;
          }
          @page { size: A4 portrait; margin: 15mm; }
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            display: block !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: white !important;
          }
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
            className={`shrink-0 snap-center px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 ${dateFilter === filter.id ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(37,99,235,0.2)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-white relative overflow-hidden no-print">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <p className="text-primary-100 dark:text-gray-400 font-semibold mb-1 text-sm">조회 기간 누적 수입</p>
          <div className="flex items-end gap-2">
            <h2 className="text-4xl font-extrabold tracking-tight">{totalFiltered.toLocaleString()}</h2>
            <span className="text-lg font-bold text-primary-200 dark:text-gray-500 mb-1">원</span>
          </div>
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex gap-3 no-print">
        <button 
          onClick={exportToExcel}
          className="flex-1 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 py-3.5 rounded-2xl font-extrabold text-sm shadow-sm hover:bg-green-500/20 dark:hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 border border-green-200 dark:border-green-800"
        >
          <Table size={18} /> 엑셀 다운로드
        </button>
        <button 
          onClick={async () => {
            if (localStorage.getItem('isPremium') !== 'true') {
              const { Dialog } = await import('@capacitor/dialog');
              await Dialog.alert({ title: '프리미엄 기능', message: '인건비 명세서(PDF) 양식 출력은 프리미엄 구독 시 이용 가능합니다. 설정에서 가입해주세요.' });
              return;
            }
            exportToPDF();
          }}
          className="flex-1 bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 py-3.5 rounded-2xl font-extrabold text-sm shadow-sm hover:bg-primary-500/20 dark:hover:bg-primary-500/30 transition-all flex items-center justify-center gap-2 border border-primary-200 dark:border-primary-800 relative overflow-hidden group"
        >
          {localStorage.getItem('isPremium') !== 'true' && <div className="absolute inset-0 bg-white/40 dark:bg-black/40 z-10 flex items-center justify-center backdrop-blur-[1px]"><span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">PRO</span></div>}
          <FileText size={18} /> 인건비 명세서 PDF
        </button>
      </div>

      {/* 종합소득세 예상 계산기 Button */}
      <button 
        onClick={async () => {
          if (localStorage.getItem('isPremium') !== 'true') {
            const { Dialog } = await import('@capacitor/dialog');
            await Dialog.alert({ title: '프리미엄 기능', message: '종합소득세 예상 계산기는 프리미엄 구독 시 이용 가능합니다. 설정에서 가입해주세요.' });
            return;
          }
          setIsTaxCalcOpen(true);
        }}
        className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-4 rounded-2xl font-extrabold text-[15px] shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-800/50 no-print relative overflow-hidden group"
      >
        {localStorage.getItem('isPremium') !== 'true' && <div className="absolute inset-0 bg-white/40 dark:bg-black/40 z-10 flex items-center justify-center backdrop-blur-[1px]"><span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">PRO</span></div>}
        <Calculator size={18} /> 종합소득세 예상 계산기
      </button>

      {/* Premium Invoice Print Layout (Hidden on Screen, Visible on Print) */}
      <div className="print-only hidden bg-white text-black p-10 max-w-[210mm] mx-auto min-h-[297mm]">
        {/* Header */}
        <div className="text-center mb-10 pb-6 border-b-4 border-gray-900">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-widest">노 무 비 청 구 명 세 서</h1>
          <p className="text-gray-500 font-bold text-sm">Invoice for Labor Cost</p>
        </div>

        {/* Info Grid */}
        <div className="flex justify-between items-start mb-8 text-sm">
          <div className="w-1/2 pr-4 border-r border-gray-300">
            <h2 className="font-extrabold text-lg mb-3">청구 내역 요약</h2>
            <div className="grid grid-cols-3 gap-2 mb-2 font-bold text-gray-700">
              <span className="text-gray-500">청구 기간</span>
              <span className="col-span-2">{getFilterLabel()}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2 font-bold text-gray-700">
              <span className="text-gray-500">출력 일자</span>
              <span className="col-span-2">{format(new Date(), 'yyyy년 MM월 dd일')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-bold text-gray-700">
              <span className="text-gray-500">총 청구액</span>
              <span className="col-span-2 text-lg text-black font-black">{totalFiltered.toLocaleString()} 원</span>
            </div>
          </div>
          
          <div className="w-1/2 pl-6">
            <h2 className="font-extrabold text-lg mb-3">수신 / 송금 정보</h2>
            <div className="grid grid-cols-3 gap-2 mb-2 font-bold text-gray-700">
              <span className="text-gray-500">직 종</span>
              <span className="col-span-2">{localStorage.getItem('jobType') || '건설 일용직'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2 font-bold text-gray-700">
              <span className="text-gray-500">계 좌 번 호</span>
              <span className="col-span-2">{localStorage.getItem('accountNumber') || '별도 전달'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-bold text-gray-700">
              <span className="text-gray-500">비 고</span>
              <span className="col-span-2 text-xs">본 명세서는 공도리 앱에서 발행되었습니다.</span>
            </div>
          </div>
        </div>

        <div className="mb-2 text-sm font-bold text-gray-500">
          * 아래 내역에 대하여 노무비를 정히 청구합니다.
        </div>

        <table className="w-full border-collapse border-2 border-gray-900 text-sm mb-12">
          <thead>
            <tr className="bg-gray-100 text-gray-900">
              <th className="border border-gray-900 p-3 w-[15%]">출역 일자</th>
              <th className="border border-gray-900 p-3 w-[25%]">현장명</th>
              <th className="border border-gray-900 p-3 w-[40%]">상세 작업 / 특이사항</th>
              <th className="border border-gray-900 p-3 w-[20%] text-right">청 구 금 액</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length > 0 ? (
              sortedRecords.map(record => (
                <tr key={record.id}>
                  <td className="border border-gray-400 p-3 text-center">{format(parseISO(record.date), 'yyyy-MM-dd')}</td>
                  <td className="border border-gray-400 p-3 text-center font-extrabold">{record.siteName}</td>
                  <td className="border border-gray-400 p-3 text-gray-700">
                    {record.taskContent} {record.memo ? `(${record.memo})` : ''}
                  </td>
                  <td className="border border-gray-400 p-3 text-right font-extrabold">{record.amount.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="border border-gray-400 p-12 text-center text-gray-500 font-bold">
                  해당 기간에 청구할 내역이 없습니다.
                </td>
              </tr>
            )}
            <tr className="bg-gray-100 border-t-2 border-gray-900">
              <td colSpan={3} className="border border-gray-900 p-4 text-center font-black text-lg tracking-widest">총 청 구 합 계 (₩)</td>
              <td className="border border-gray-900 p-4 text-right font-black text-lg">{totalFiltered.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-center mt-20">
          <p className="font-bold text-gray-600 mb-8">위의 청구 금액을 수령하고자 하오니 결제하여 주시기 바랍니다.</p>
          <div className="flex justify-end pr-10 items-end">
            <span className="font-bold text-lg mr-4">성 명 :</span>
            <span className="w-40 border-b border-gray-500"></span>
            <span className="ml-4 font-bold text-gray-500">(서명/인)</span>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-5 flex flex-col min-h-[350px] no-print">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">현장별 수입 분포</h3>
          
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            <button 
              onClick={() => setChartType('bar')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
            >
              막대
            </button>
            <button 
              onClick={() => setChartType('pie')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${chartType === 'pie' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
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
      
      {/* 종합소득세 예상 계산기 모달 */}
      <AnimatePresence>
        {isTaxCalcOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 no-print"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  종합소득세 예상 계산기
                </h3>
                <button 
                  onClick={() => setIsTaxCalcOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">계산 연도</label>
                  <select 
                    value={taxYear} 
                    onChange={(e) => setTaxYear(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg text-gray-900 dark:text-white appearance-none"
                  >
                    {[0,1,2].map(offset => {
                      const y = new Date().getFullYear() - offset;
                      return <option key={y} value={y}>{y}년</option>
                    })}
                  </select>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 mt-2">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    * 입력하신 데이터를 바탕으로 대략적인 소득세액을 계산합니다. 실제 신고 시 금액과 차이가 있을 수 있습니다.
                  </p>
                </div>

                <button 
                  onClick={handleCalculateTax}
                  className="w-full mt-2 bg-indigo-600 dark:bg-indigo-500 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  계산하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Screen Data Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden no-print mt-2">
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
              {sortedRecords.length > 0 ? (
                sortedRecords.map(record => (
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
                    <td className="p-4 text-sm text-primary-600 dark:text-primary-400 font-extrabold text-right whitespace-nowrap">{record.amount.toLocaleString()}원</td>
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

