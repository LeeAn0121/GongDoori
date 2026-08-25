import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

/** 어디서든 호출 가능한 토스트 함수 */
export function showToast(message: string, type: ToastType = 'info') {
  if (addToastFn) addToastFn(message, type);
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-gray-800 dark:bg-slate-700',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`${colors[toast.type]} text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 max-w-sm w-full pointer-events-auto`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="text-sm font-bold flex-1">{toast.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
