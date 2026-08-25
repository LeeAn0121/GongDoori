import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, DollarSign, BarChart2, Settings, ChevronRight, X } from 'lucide-react';

const slides = [
  {
    viewId: 'calendar',
    icon: Calendar,
    title: '📅 달력',
    desc: '날짜를 눌러 일당을 기록하세요.',
    details: [
      '날짜 선택 후 + 버튼으로 일정/일당 등록',
      '현장명, 금액, 품수, 경비를 한 번에 입력',
      '등록한 일정은 달력에 색상 점으로 표시',
    ],
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50/90 dark:bg-blue-900/40',
  },
  {
    viewId: 'site',
    icon: MapPin,
    title: '🏗️ 현장 관리',
    desc: '현장별 수입과 정산 현황을 한눈에.',
    details: [
      '현장별 총 수입, 미수금, 완료 금액 확인',
      '현장 탭을 눌러 상세 기록 조회',
      '정산 진행률이 바 형태로 표시',
    ],
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50/90 dark:bg-emerald-900/40',
  },
  {
    viewId: 'settlement',
    icon: DollarSign,
    title: '💰 정산',
    desc: '미수금을 관리하고 청구서를 출력하세요.',
    details: [
      '수금 완료/미수금 상태를 한 번에 관리',
      '엑셀 다운로드로 청구서 자동 생성',
      'PDF 출력으로 정식 노무비 청구서 발행',
    ],
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50/90 dark:bg-amber-900/40',
  },
  {
    viewId: 'stats',
    icon: BarChart2,
    title: '📊 통계',
    desc: '월별·현장별 수입을 차트로 확인.',
    details: [
      '월별 수입 추이를 그래프로 한눈에',
      '현장별 수입 비율 원형 차트',
      '종합소득세 예상 계산기 (프리미엄)',
    ],
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50/90 dark:bg-purple-900/40',
  },
  {
    viewId: 'settings',
    icon: Settings,
    title: '⚙️ 설정',
    desc: '테마, 직종, 색상 등 내 정보를 관리.',
    details: [
      '라이트/다크/시스템 테마 즉시 전환',
      '메인 색상 6가지 팔레트에서 선택',
      '팀 만들기, 초대 코드로 협업',
    ],
    color: 'from-gray-500 to-gray-600',
    bg: 'bg-gray-100/90 dark:bg-gray-800/60',
  },
];

export default function Tutorial({ onComplete, onPageChange }: { onComplete: () => void, onPageChange?: (view: string) => void }) {
  const [page, setPage] = useState(0);
  const slide = slides[page];
  const isLast = page === slides.length - 1;
  const Icon = slide.icon;

  useEffect(() => {
    if (onPageChange) {
      onPageChange(slides[page].viewId);
    }
  }, [page, onPageChange]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-transparent flex flex-col justify-end pointer-events-none pb-20 sm:pb-6 px-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md mx-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/50 dark:border-slate-700/50 mb-[env(safe-area-inset-bottom)] pointer-events-auto flex flex-col gap-4 relative"
        >
          {/* Skip Button (Top Right) */}
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100/50 dark:bg-slate-700/50 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-md shrink-0`}>
              <Icon size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">
                {slide.title}
              </h2>
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                {slide.desc}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className={`w-full ${slide.bg} rounded-xl p-3 text-left`}>
            {slide.details.map((d, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-700 text-[10px] font-extrabold flex items-center justify-center shadow-sm text-gray-700 dark:text-slate-200 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-snug">{d}</span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-2">
            {/* Dots */}
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === page ? 'w-5 bg-primary-500' : 'w-1.5 bg-gray-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Button */}
            <button
              onClick={() => {
                if (isLast) onComplete();
                else setPage(page + 1);
              }}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-sm shadow-md transition-all active:scale-[0.96] flex items-center gap-1 ${
                isLast
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              }`}
            >
              {isLast ? '시작하기 🚀' : <>다음 <ChevronRight size={16} /></>}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
