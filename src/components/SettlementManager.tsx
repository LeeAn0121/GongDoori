import { CheckCircle, XCircle, Wallet, AlertCircle, FileText, Table, Plus, X } from 'lucide-react'
import { Dialog } from '@capacitor/dialog'
import { useState } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { parseISO, format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

import { supabase } from '../supabaseClient'

export default function SettlementManager({ records, settlements, setSettlements, setCurrentView, onUpdateStatus, session }: { records: any[], settlements: any[], setSettlements: any, setCurrentView: (view: 'calendar' | 'site' | 'settlement' | 'stats' | 'settings') => void, onUpdateStatus: (id: string, status: '미수금' | '완료') => void, session: any }) {
  
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [isAddSettlementOpen, setIsAddSettlementOpen] = useState(false);
  const [settleDate, setSettleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [settleSiteName, setSettleSiteName] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMemo, setSettleMemo] = useState('');

  const handleAddSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleSiteName || !settleAmount) return;

    const newSettlement = {
      user_id: session.user.id,
      site_name: settleSiteName,
      date: settleDate,
      amount: parseInt(settleAmount, 10),
      memo: settleMemo
    };

    const { data, error } = await supabase.from('settlements').insert([newSettlement]).select();
    if (error) {
      await Dialog.alert({ title: '오류', message: '저장 중 오류가 발생했습니다: ' + error.message });
      return;
    }
    
    if (data && data.length > 0) {
      const d = data[0];
      setSettlements([...settlements, {
        id: d.id,
        siteName: d.site_name,
        date: d.date,
        amount: d.amount,
        memo: d.memo || ''
      }]);
    }

    setIsAddSettlementOpen(false);
    setSettleSiteName('');
    setSettleAmount('');
    setSettleMemo('');
  };

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const paidAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const unpaidAmount = Math.max(0, totalAmount - paidAmount);

  // Instead of filtering records by status, we can filter them by whether their site has unpaid amounts, 
  // but for simplicity let's just group by Site to show what's owed.
  // Actually, since SettlementManager lists records, let's keep showing records but update the top totals.
  const filteredRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const filteredTotal = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('노무비 청구서', {
      pageSetup: { paperSize: 9, orientation: 'portrait', margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 } }
    });

    sheet.columns = [
      { width: 12 }, { width: 20 }, { width: 25 }, { width: 15 }, { width: 18 }, { width: 15 }
    ];

    sheet.mergeCells('A1:F1');
    const title = sheet.getCell('A1');
    title.value = '청   구   서';
    title.font = { name: 'Malgun Gothic', size: 24, bold: true, underline: true };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 50;

    sheet.addRow([]);

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
    dateRangeCell.value = `출력일 : ${format(new Date(), 'yyyy.MM.dd')}`;
    dateRangeCell.font = { name: 'Malgun Gothic', size: 10, color: { argb: 'FF666666' } };
    dateRangeCell.alignment = { horizontal: 'left', vertical: 'bottom' };

    sheet.addRow([]);

    sheet.mergeCells('A7:F7');
    const sumCell = sheet.getCell('A7');
    sumCell.value = `청 구 금 액 :   ₩ ${filteredTotal.toLocaleString()} 원`;
    sumCell.font = { name: 'Malgun Gothic', size: 16, bold: true, color: { argb: 'FF000000' } };
    sumCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    sumCell.border = { top: { style: 'thick' }, left: { style: 'thick' }, bottom: { style: 'thick' }, right: { style: 'thick' } };
    sheet.getRow(7).height = 40;

    sheet.addRow([]);

    const headerRow = sheet.addRow(['일 자', '현 장 명', '상세 작업 및 내역', '', '금 액', '비 고']);
    sheet.mergeCells('C9:D9');
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.font = { name: 'Malgun Gothic', bold: true, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    let currentRow = 10;
    filteredRecords.forEach(record => {
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

    const totalRow = sheet.addRow(['', '합    계', '', '', filteredTotal, '']);
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
      
      {/* 요약 카드 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col gap-5 no-print">
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

      {/* Export Action Buttons */}
      <div className="flex gap-3 no-print">
        <button 
          onClick={exportToExcel}
          className="flex-1 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 py-3 rounded-2xl font-extrabold text-sm shadow-sm hover:bg-green-500/20 dark:hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 border border-green-200 dark:border-green-800"
        >
          <Table size={18} /> 청구서 엑셀 다운로드
        </button>
        <button 
          onClick={exportToPDF}
          className="flex-1 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 py-3 rounded-2xl font-extrabold text-sm shadow-sm hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
        >
          <FileText size={18} /> 청구서 PDF 출력
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
            <p className="text-sm text-gray-700 font-semibold mb-1">출력 일자 : {format(new Date(), 'yyyy년 MM월 dd일')}</p>
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
          <span className="text-2xl font-extrabold">₩ {filteredTotal.toLocaleString()}</span>
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
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => (
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
                  해당 기록이 없습니다.
                </td>
              </tr>
            )}
            <tr className="bg-gray-50">
              <td colSpan={3} className="border border-black py-3 px-4 text-center font-extrabold text-lg tracking-widest border-t-[3px]">합 계</td>
              <td className="border border-black py-3 px-2 text-right pr-4 font-extrabold text-lg border-t-[3px]">{filteredTotal.toLocaleString()}</td>
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

      {/* 정산 현황 목록 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-5 min-h-[400px] no-print">
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">수금 내역 관리</h3>
            <button 
              onClick={() => setIsAddSettlementOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} strokeWidth={3} /> 받은 금액 기록
            </button>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg w-full">
            {(['all', 'unpaid', 'paid'] as const).map((type) => (
              <button 
                key={type}
                onClick={() => setFilter(type)} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === type ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer group"
                    >
                      <CheckCircle size={16} /> 
                      <span className="group-hover:hidden">정산 완료</span>
                      <span className="hidden group-hover:inline">수동으로 정산 완료 처리</span>
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

      {/* 정산 추가 모달 */}
      <AnimatePresence>
        {isAddSettlementOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  정산 추가
                </h3>
                <button 
                  onClick={() => setIsAddSettlementOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddSettlement} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">정산일</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date"
                      value={settleDate}
                      onChange={(e) => setSettleDate(e.target.value)}
                      className="px-4 py-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">현장명</label>
                  <input 
                    type="text"
                    required
                    value={settleSiteName}
                    onChange={(e) => setSettleSiteName(e.target.value)}
                    placeholder="예) 강남 아파트 현장"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[15px] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">정산액 (원)</label>
                  <input 
                    type="number"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-blue-600 dark:text-blue-400 placeholder:text-gray-400 placeholder:font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">메모 (선택)</label>
                  <input 
                    type="text"
                    value={settleMemo}
                    onChange={(e) => setSettleMemo(e.target.value)}
                    placeholder="예) 세금공제, 식대 포함 등"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-[15px]"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full mt-4 bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  저장
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
