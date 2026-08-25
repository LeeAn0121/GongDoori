import re

with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

# Add Modal states
content = content.replace(
    "const [isColorModalOpen, setIsColorModalOpen] = useState(false);",
    "const [isColorModalOpen, setIsColorModalOpen] = useState(false);\n  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);\n  const [isJobModalOpen, setIsJobModalOpen] = useState(false);"
)

# Replace handleChangeTheme
old_theme = """  const handleChangeTheme = async () => {
    const result = await ActionSheet.showActions({
      title: '테마 선택',
      options: [
        { title: '시스템 설정 (기본)' },
        { title: '라이트 모드' },
        { title: '다크 모드' }
      ]
    });
    
    let newMode = 'system';
    if (result.index === 1) newMode = 'light';
    if (result.index === 2) newMode = 'dark';
    
    setThemeMode(newMode);
    localStorage.setItem('themePreference', newMode);
    
    if (newMode === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', newMode === 'dark');
    }
    
    await Dialog.alert({ title: '안내', message: '테마가 변경되었습니다.' });
  };"""
new_theme = """  const handleChangeTheme = async () => {
    setIsThemeModalOpen(true);
  };
  
  const handleSelectTheme = async (newMode: string) => {
    setThemeMode(newMode);
    localStorage.setItem('themePreference', newMode);
    
    if (newMode === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', newMode === 'dark');
    }
    
    setIsThemeModalOpen(false);
    await Dialog.alert({ title: '안내', message: '테마가 변경되었습니다.' });
  };"""
content = content.replace(old_theme, new_theme)

# Replace handleUpdateJobType
old_job = """  const handleUpdateJobType = async () => {
    const result = await ActionSheet.showActions({
      title: '직종 선택',
      options: [{ title: '🏗️ 종합' }, { title: '🔨 철근' }, { title: '🪚 목수' }, { title: '⚡ 전기' }]
    });
    const jobs = ['🏗️ 종합', '🔨 철근', '🪚 목수', '⚡ 전기'];
    if (result.index >= 0 && result.index < jobs.length) {
      setJobType(jobs[result.index]);
      localStorage.setItem('jobType', jobs[result.index]);
      await Dialog.alert({ title: '안내', message: '내 직종이 변경되었습니다.' });
    }
  };"""
new_job = """  const handleUpdateJobType = async () => {
    setIsJobModalOpen(true);
  };
  
  const handleSelectJobType = async (job: string) => {
    setJobType(job);
    localStorage.setItem('jobType', job);
    setIsJobModalOpen(false);
    await Dialog.alert({ title: '안내', message: '내 직종이 변경되었습니다.' });
  };"""
content = content.replace(old_job, new_job)

# Add Modals
modals = """      {/* 테마 모달 */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsThemeModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-slate-700" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight mb-4">테마 선택</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: '시스템 설정 (기본)', value: 'system' },
                  { label: '라이트 모드', value: 'light' },
                  { label: '다크 모드', value: 'dark' }
                ].map(t => (
                  <button key={t.value} onClick={() => handleSelectTheme(t.value)} className={`p-4 rounded-xl font-bold text-left ${themeMode === t.value ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300'}`}>{t.label}</button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 직종 모달 */}
      <AnimatePresence>
        {isJobModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsJobModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-slate-700" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight mb-4">직종 선택</h3>
              <div className="grid grid-cols-2 gap-2">
                {['🏗️ 종합', '🔨 철근', '🪚 목수', '⚡ 전기'].map(j => (
                  <button key={j} onClick={() => handleSelectJobType(j)} className={`p-4 rounded-xl font-bold ${jobType === j ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300'}`}>{j}</button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 컬러 팔레트 모달 */}"""
content = content.replace("{/* 컬러 팔레트 모달 */}", modals)

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)
