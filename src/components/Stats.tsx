import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { subWeeks, subMonths, isAfter, parseISO, format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
    const sheet = workbook.addWorksheet('노무비 청구서', {
      pageSetup: { paperSize: 9, orientation: 'portrait', margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 } }
    });

    // Columns config (Total 6 columns for fine layout)
    sheet.columns = [
      { width: 12 }, // A: Date
      { width: 20 }, // B: Site
      { width: 25 }, // C: Details 1
      { width: 15 }, // D: Details 2
      { width: 18 }, // E: Amount
      { width: 15 }, // F: Remark
    ];

    // 1. Title
    sheet.mergeCells('A1:F1');
    const title = sheet.getCell('A1');
    title.value = '청   구   서';
    title.font = { name: 'Malgun Gothic', size: 24, bold: true, underline: true };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 50;

    sheet.addRow([]); // Row 2 empty

    // 3. Provider / Receiver Info (Row 3-5)
    sheet.mergeCells('A3:C3');
    const receiver = sheet.getCell('A3');
    receiver.value = '공급받는자 :                         귀하';
    receiver.font = { name: 'Malgun Gothic', size: 14, bold: true };
    receiver.border = { bottom: { style: 'thick' } };

    sheet.mergeCells('D3:D5');
    const providerLabel = sheet.getCell('D3');
    providerLabel.value = '공\n급\n자';
    providerLabel.font = { name: 'Malgun Gothic', size: 11, bold: true };
    providerLabel.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    providerLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    providerLabel.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    sheet.getCell('E3').value = '상  호';
    sheet.getCell('E3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    sheet.getCell('E3').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('F3').border = { top: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    sheet.getCell('E3').border = { top: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

    sheet.getCell('E4').value = '성  명';
    sheet.getCell('E4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    sheet.getCell('E4').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('F4').border = { right: { style: 'thin' }, bottom: { style: 'thin' } };
    sheet.getCell('E4').border = { right: { style: 'thin' }, bottom: { style: 'thin' } };

    sheet.getCell('E5').value = '연락처';
    sheet.getCell('E5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    sheet.getCell('E5').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('F5').border = { right: { style: 'thin' }, bottom: { style: 'thin' } };
    sheet.getCell('E5').border = { right: { style: 'thin' }, bottom: { style: 'thin' } };

    sheet.mergeCells('A5:C5');
    const dateRangeCell = sheet.getCell('A5');
    dateRangeCell.value = `조회 기간 : ${getFilterLabel()} / 출력일 : ${format(new Date(), 'yyyy.MM.dd')}`;
    dateRangeCell.font = { name: 'Malgun Gothic', size: 10, color: { argb: 'FF666666' } };
    dateRangeCell.alignment = { horizontal: 'left', vertical: 'bottom' };

    sheet.addRow([]); // Row 6 empty

    // 7. Total Amount Summary Box
    sheet.mergeCells('A7:F7');
    const sumCell = sheet.getCell('A7');
    sumCell.value = `청 구 금 액 :   ₩ ${totalFiltered.toLocaleString()} 원`;
    sumCell.font = { name: 'Malgun Gothic', size: 16, bold: true, color: { argb: 'FF000000' } };
    sumCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    sumCell.border = { top: { style: 'thick' }, left: { style: 'thick' }, bottom: { style: 'thick' }, right: { style: 'thick' } };
    sheet.getRow(7).height = 40;

    sheet.addRow([]); // Row 8 empty

    // 9. Table Header
    const headerRow = sheet.addRow(['일 자', '현 장 명', '상세 작업 및 내역', '', '금 액', '비 고']);
    sheet.mergeCells('C9:D9');
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.font = { name: 'Malgun Gothic', bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 10. Data Rows
    let currentRow = 10;
    sortedRecords.forEach(record => {
      const row = sheet.addRow([
        format(parseISO(record.date), 'MM/dd'),
        record.siteName,
        record.taskContent || '',
        '',
        record.amount,
        record.memo || ''
      ]);
      sheet.mergeCells(`C${currentRow}:D${currentRow}`);
      
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(5).numFmt = '#,##0"원"';
      row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle' };

      row.eachCell((cell) => {
        cell.font = { name: 'Malgun Gothic', size: 10 };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      currentRow++;
    });

    // Total Row Bottom
    const totalRow = sheet.addRow(['', '합    계', '', '', totalFiltered, '']);
    sheet.mergeCells(`C${currentRow}:D${currentRow}`);
    totalRow.height = 30;
    
    totalRow.getCell(2).font = { name: 'Malgun Gothic', bold: true, size: 12 };
    totalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(5).font = { name: 'Malgun Gothic', bold: true, size: 12 };
    totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(5).numFmt = '#,##0"원"';
    
    totalRow.eachCell((cell) => {
      cell.border = { top: { style: 'double' }, bottom: { style: 'thick' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    
    currentRow += 3;
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const signCell = sheet.getCell(`A${currentRow}`);
    signCell.value = '위와 같이 작업 내역 및 청구 금액을 확인합니다.\n\n\n서명(인) :                         ';
    signCell.font = { name: 'Malgun Gothic', size: 12, bold: true };
    signCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    sheet.getRow(currentRow).height = 100;

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `청구서_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = () => {
    window.print();
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
            className={`shrink-0 snap-center px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 ${dateFilter === filter.id ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(37,99,235,0.2)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-white relative overflow-hidden no-print">
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
          <FileText size={18} /> PDF/청구서 인쇄
        </button>
      </div>

      {/* Professional PDF Print Layout (Hidden on Screen, Visible on Print) */}
      <div className="print-only hidden bg-white text-black p-4 w-[210mm] min-h-[297mm] mx-auto box-border">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-[1em] underline underline-offset-[12px] decoration-4 text-black">청 구 서</h1>
        </div>

        <div className="flex justify-between items-start mb-10">
          <div className="w-[48%] flex flex-col justify-end h-full">
            <div className="border-b-[3px] border-black pb-1 mb-3">
              <span className="text-xl font-bold">공급받는자 : <span className="float-right pr-4">귀하</span></span>
            </div>
            <p className="text-sm text-gray-700 font-semibold mb-1">조회 기간 : {getFilterLabel()}</p>
            <p className="text-sm text-gray-700 font-semibold">출력 일자 : {format(new Date(), 'yyyy년 MM월 dd일')}</p>
          </div>
          
          <div className="w-[45%]">
            <table className="w-full border-[3px] border-black text-sm text-center">
              <tbody>
                <tr>
                  <td rowSpan={3} className="w-6 border border-black bg-gray-100 font-bold p-2 text-center" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>공급자</td>
                  <td className="w-20 border border-black bg-gray-100 font-bold p-2">상 호</td>
                  <td className="border border-black p-2 font-bold"></td>
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold p-2">성 명</td>
                  <td className="border border-black p-2 font-bold"></td>
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold p-2">연 락 처</td>
                  <td className="border border-black p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#EFF6FF] border-[3px] border-black p-5 text-center mb-8 flex justify-center items-center">
          <span className="text-xl font-bold mr-6">청 구 금 액 :</span>
          <span className="text-2xl font-extrabold">₩ {totalFiltered.toLocaleString()}</span>
          <span className="text-base font-bold ml-4">(VAT 별도/포함)</span>
        </div>

        <table className="w-full border-collapse border-[3px] border-black text-sm text-center mb-16">
          <thead>
            <tr className="bg-gray-100 border-b-[3px] border-black">
              <th className="border border-black py-3 px-2 w-[12%] font-extrabold">일 자</th>
              <th className="border border-black py-3 px-2 w-[22%] font-extrabold">현장명</th>
              <th className="border border-black py-3 px-2 w-[35%] font-extrabold">상세 내역</th>
              <th className="border border-black py-3 px-2 w-[16%] font-extrabold text-right pr-4">금 액</th>
              <th className="border border-black py-3 px-2 w-[15%] font-extrabold">비 고</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length > 0 ? (
              sortedRecords.map(record => (
                <tr key={record.id} className="border-b border-black">
                  <td className="border border-black py-2 px-2 text-center font-semibold">{format(parseISO(record.date), 'MM/dd')}</td>
                  <td className="border border-black py-2 px-2 text-center font-bold">{record.siteName}</td>
                  <td className="border border-black py-2 px-2 text-left">
                    {record.taskContent}
                  </td>
                  <td className="border border-black py-2 px-2 text-right pr-4 font-bold">{record.amount.toLocaleString()}</td>
                  <td className="border border-black py-2 px-2 text-left">{record.memo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border border-black p-8 text-center text-gray-500 font-bold">
                  해당 기간 내역이 없습니다.
                </td>
              </tr>
            )}
            <tr className="bg-gray-50">
              <td colSpan={3} className="border border-black py-3 px-4 text-center font-extrabold text-lg tracking-widest border-t-[3px]">합 계</td>
              <td className="border border-black py-3 px-2 text-right pr-4 font-extrabold text-lg border-t-[3px]">{totalFiltered.toLocaleString()}</td>
              <td className="border border-black py-3 px-2 border-t-[3px]"></td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 text-center border-t-2 border-dashed border-gray-400 pt-12">
          <p className="text-xl font-bold mb-12 tracking-wide">위와 같이 작업 내역 및 청구 금액을 정히 확인합니다.</p>
          <div className="flex justify-end pr-12">
            <p className="text-xl font-bold flex items-end gap-3">
              <span>서 명 (인) :</span>
              <span className="w-48 border-b-2 border-black inline-block"></span>
            </p>
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

