import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog } from '@capacitor/dialog';
import type { Session } from '@supabase/supabase-js';

export default function Settings({ session }: { session: Session }) {
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('팀원');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setDisplayName(data.display_name || '');
      setRole(data.role || '팀원');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName
    }).eq('id', session.user.id);
    setLoading(false);

    if (error) {
      await Dialog.alert({ title: '오류', message: '프로필 저장에 실패했습니다.' });
    } else {
      await Dialog.alert({ title: '성공', message: '프로필이 업데이트 되었습니다.' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col min-h-[400px] animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50">내 설정</h2>
      </div>
      
      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">이메일</label>
          <input type="text" disabled value={session.user.email} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400" />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">이름 (닉네임)</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="이름을 입력하세요" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">직책</label>
          <input type="text" disabled value={role} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400 font-bold" />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">직책은 팀을 생성할 때 자동으로 부여됩니다.</p>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-4 bg-gray-900 dark:bg-slate-700 text-white font-bold py-4 rounded-xl hover:bg-black dark:hover:bg-slate-600 transition-all">
          {loading ? '저장 중...' : '프로필 저장'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700/50">
        <button 
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
