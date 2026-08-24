import os
import glob

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

# We must be careful about ordering. 
# Longer matches first to avoid partial replacements.
replacements = [
    ('bg-slate-900/80', 'bg-gray-50/80 dark:bg-slate-900/80'),
    ('bg-slate-800/50', 'bg-gray-50/50 dark:bg-slate-800/50'),
    ('border-slate-700/50', 'border-gray-100 dark:border-slate-700/50'),
    ('bg-orange-900/30', 'bg-blue-100 dark:bg-orange-900/30'),
    ('bg-orange-500/10', 'bg-blue-50 dark:bg-orange-500/10'),
    ('shadow-orange-900/50', 'shadow-blue-200 dark:shadow-orange-900/50'),
    ('bg-black/60', 'bg-black/30 dark:bg-black/60'),
    ('bg-black/70', 'bg-black/40 dark:bg-black/70'),
    ('bg-slate-900', 'bg-gray-50 dark:bg-slate-900'),
    ('bg-slate-800', 'bg-white dark:bg-slate-800'),
    ('bg-slate-700', 'bg-gray-100 dark:bg-slate-700'),
    ('bg-slate-600', 'bg-gray-200 dark:bg-slate-600'),
    ('text-slate-50', 'text-gray-900 dark:text-slate-50'),
    ('text-slate-100', 'text-gray-800 dark:text-slate-100'),
    ('text-slate-300', 'text-gray-700 dark:text-slate-300'),
    ('text-slate-400', 'text-gray-500 dark:text-slate-400'),
    ('text-slate-500', 'text-gray-400 dark:text-slate-500'),
    ('border-slate-700', 'border-gray-200 dark:border-slate-700'),
    ('bg-orange-500', 'bg-blue-600 dark:bg-orange-500'),
    ('bg-orange-600', 'bg-blue-700 dark:bg-orange-600'),
    ('text-orange-400', 'text-blue-600 dark:text-orange-400'),
    ('text-orange-500', 'text-blue-500 dark:text-orange-500'),
    ('text-orange-200', 'text-blue-200 dark:text-orange-200'),
    ('text-emerald-400', 'text-purple-600 dark:text-emerald-400'),
    ('text-emerald-500', 'text-purple-500 dark:text-emerald-500'),
    ('from-slate-800', 'from-blue-600 dark:from-slate-800'),
    ('to-slate-900', 'to-blue-800 dark:to-slate-900'),
]

for filepath in glob.glob('src/**/*.tsx', recursive=True):
    replace_in_file(filepath, replacements)
