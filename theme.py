import os
import glob

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

replacements = [
    ('bg-gray-50/80', 'bg-slate-900/80'),
    ('bg-gray-50/50', 'bg-slate-800/50'),
    ('bg-gray-50', 'bg-slate-900'),
    ('bg-white', 'bg-slate-800'),
    ('text-gray-900', 'text-slate-50'),
    ('text-gray-800', 'text-slate-100'),
    ('text-gray-700', 'text-slate-300'),
    ('text-gray-600', 'text-slate-400'),
    ('text-gray-500', 'text-slate-400'),
    ('text-gray-400', 'text-slate-500'),
    ('border-gray-100', 'border-slate-700/50'),
    ('border-gray-200', 'border-slate-700'),
    ('bg-gray-100', 'bg-slate-700'),
    ('bg-gray-200', 'bg-slate-600'),
    ('bg-blue-600', 'bg-orange-500'),
    ('bg-blue-700', 'bg-orange-600'),
    ('text-blue-600', 'text-orange-400'),
    ('text-blue-500', 'text-orange-500'),
    ('text-blue-200', 'text-orange-200'),
    ('bg-blue-100', 'bg-orange-900/30'),
    ('bg-blue-50', 'bg-orange-500/10'),
    ('shadow-blue-200/50', 'shadow-orange-900/50'),
    ('shadow-blue-200', 'shadow-orange-900/50'),
    ('text-purple-600', 'text-emerald-400'),
    ('text-purple-500', 'text-emerald-500'),
    ('from-blue-600', 'from-slate-800'),
    ('to-blue-800', 'to-slate-900'),
    ('bg-black/30', 'bg-black/60'),
    ('bg-black/40', 'bg-black/70'),
]

for filepath in glob.glob('src/**/*.tsx', recursive=True):
    replace_in_file(filepath, replacements)
