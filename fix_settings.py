import re

with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

# 1. State
content = content.replace(
    "const [taxDeductionDefault, setTaxDeductionDefault] = useState(localStorage.getItem('taxDeductionDefault') === 'true');",
    "const [taxDeductionDefault, setTaxDeductionDefault] = useState(localStorage.getItem('taxDeductionDefault') === 'true');\n  const [isColorModalOpen, setIsColorModalOpen] = useState(false);"
)

# 2. handleUpdateJobType
old_job = """      setJobType(jobs[result.index]);
      localStorage.setItem('jobType', jobs[result.index]);
    }
  };"""
new_job = """      setJobType(jobs[result.index]);
      localStorage.setItem('jobType', jobs[result.index]);
      await Dialog.alert({ title: '안내', message: '내 직종이 변경되었습니다.' });
    }
  };"""
content = content.replace(old_job, new_job)

# 3. handleChangeTheme
old_theme = """    } else {
      document.documentElement.classList.toggle('dark', newMode === 'dark');
    }
  };"""
new_theme = """    } else {
      document.documentElement.classList.toggle('dark', newMode === 'dark');
    }
    await Dialog.alert({ title: '안내', message: '테마가 변경되었습니다.' });
  };"""
content = content.replace(old_theme, new_theme)

# 4. handleUpdateMainColor
old_color = """  const handleUpdateMainColor = async () => {
    const result = await ActionSheet.showActions({ title: '메인 색상 선택', options: [{ title: '블루' }, { title: '오렌지' }, { title: '그린' }] });
    const colors = ['블루', '오렌지', '그린'];
    if (result.index >= 0 && result.index < colors.length) {
      setMainColor(colors[result.index]);
      localStorage.setItem('mainColor', colors[result.index]);
      await Dialog.alert({title:'안내', message:'색상이 변경되었습니다. (다음 업데이트에 앱 전반에 적용됩니다)'});
    }
  };"""
new_color = """  const handleUpdateMainColor = async () => {
    setIsColorModalOpen(true);
  };
  
  const handleSelectMainColor = async (colorHex: string) => {
    setMainColor(colorHex);
    localStorage.setItem('mainColor', colorHex);
    setIsColorModalOpen(false);
    await Dialog.alert({title:'안내', message:'색상이 변경되었습니다. (다음 업데이트에 앱 전반에 적용됩니다)'});
  };"""
content = content.replace(old_color, new_color)

# 5. handleRestartTutorial
old_tut = """      localStorage.removeItem('hasSeenTutorial');
      window.location.reload();"""
new_tut = """      localStorage.removeItem('hasSeenTutorial');
      await Dialog.alert({ title: '안내', message: '앱 사용법을 다시 표시합니다.' });
      window.location.reload();"""
content = content.replace(old_tut, new_tut)

# 6. Bug report list item
old_bug = """<ListItem icon={Bug} title="버그 제보 / 문의하기" subtitle="사진 첨부해서 문의하면 답변을 알려드려요" onClick={() => setIsSupportOpen(true)} />"""
new_bug = """<ListItem icon={Bug} title="버그 제보 / 문의하기" subtitle="사진 첨부는 Github 핫라인을 이용해주세요" onClick={() => window.open('https://github.com/LeeAn0121/GongDoori/issues/new', '_blank')} />"""
content = content.replace(old_bug, new_bug)

# 7. Replace isSupportOpen Modal with isColorModalOpen Modal
# Using regex to find the isSupportOpen modal block
modal_pattern = re.compile(r"\{\/\* 고객 지원 모달 \*\/.*?<\/AnimatePresence>", re.DOTALL)
new_modal = """{/* 메인 색상 모달 */}
      <AnimatePresence>
        {isColorModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsColorModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-slate-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  메인 색상 선택
                </h3>
                <button 
                  onClick={() => setIsColorModalOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-6 place-items-center">
                {[
                  { label: '블루', color: '#3B82F6' },
                  { label: '레드', color: '#EF4444' },
                  { label: '그린', color: '#10B981' },
                  { label: '퍼플', color: '#8B5CF6' },
                  { label: '오렌지', color: '#F97316' },
                  { label: '그레이', color: '#6B7280' }
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => handleSelectMainColor(item.color)}>
                    <div 
                      className={`w-14 h-14 rounded-full shadow-md border-4 transition-transform ${mainColor === item.color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>"""

content = modal_pattern.sub(new_modal, content)

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)
