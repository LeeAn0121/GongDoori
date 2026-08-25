import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog } from '@capacitor/dialog';
import { Users, UserPlus, Shield, Copy, LogOut, Plus, Crown } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeamManager({ session }: { session: Session }) {
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    // 내 유저 ID가 포함된 team_members 레코드 검색
    const { data: memberData } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', session.user.id)
      .single();

    if (memberData) {
      // 해당 팀 정보 가져오기
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', memberData.team_id)
        .single();
      
      setTeam(teamData);

      // 팀원 목록 가져오기 (profiles 조인)
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          user_id,
          joined_at,
          profiles ( display_name, email, role )
        `)
        .eq('team_id', memberData.team_id);
      
      setMembers(membersData || []);
    } else {
      setTeam(null);
      setMembers([]);
    }
    setLoading(false);
  };

  const handleCreateTeam = async () => {
    const { value: teamName } = await Dialog.prompt({
      title: '새 팀 만들기',
      message: '생성하실 팀의 이름을 입력해주세요.',
      inputPlaceholder: '예: 강남 어벤져스'
    });

    if (!teamName) return;

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 팀 생성
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert([{ name: teamName, invite_code: inviteCode }])
      .select()
      .single();

    if (teamError) {
      await Dialog.alert({ title: '오류', message: '팀 생성에 실패했습니다.' });
      return;
    }

    // 나를 팀 멤버로 추가
    const { error: memberError } = await supabase
      .from('team_members')
      .insert([{ team_id: newTeam.id, user_id: session.user.id }]);

    if (memberError) {
      await Dialog.alert({ title: '오류', message: '팀 멤버 등록에 실패했습니다.' });
      return;
    }

    // 팀 생성자는 자동으로 팀장 권한 부여
    await supabase.from('profiles').update({ role: '팀장' }).eq('id', session.user.id);

    await Dialog.alert({ title: '성공', message: `'${teamName}' 팀이 성공적으로 생성되었습니다!` });
    fetchTeam();
  };

  const handleJoinTeam = async () => {
    const { value: code } = await Dialog.prompt({
      title: '팀 참가하기',
      message: '전달받은 6자리 팀 초대 코드를 입력해주세요.',
      inputPlaceholder: '초대 코드 입력'
    });

    if (!code) return;

    // 초대 코드로 팀 검색
    const { data: foundTeam, error: searchError } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (searchError || !foundTeam) {
      await Dialog.alert({ title: '오류', message: '해당 초대 코드를 가진 팀을 찾을 수 없습니다.' });
      return;
    }

    // 팀 참가
    const { error: joinError } = await supabase
      .from('team_members')
      .insert([{ team_id: foundTeam.id, user_id: session.user.id }]);

    if (joinError) {
      await Dialog.alert({ title: '오류', message: '팀 참가에 실패했거나 이미 소속되어 있습니다.' });
      return;
    }

    // 팀 참가자는 자동으로 팀원 권한 부여
    await supabase.from('profiles').update({ role: '팀원' }).eq('id', session.user.id);

    await Dialog.alert({ title: '성공', message: `'${foundTeam.name}' 팀에 성공적으로 합류했습니다!` });
    fetchTeam();
  };

  const handleLeaveTeam = async () => {
    // 본인이 팀장인지 확인
    const isLeader = members.find(m => m.user_id === session.user.id)?.profiles?.role === '팀장';

    if (isLeader) {
      if (members.length > 1) {
        await Dialog.alert({ 
          title: '팀 삭제 불가', 
          message: '팀원이 아직 남아있습니다. 팀을 삭제하려면 먼저 모든 팀원을 내보내주세요.' 
        });
        return;
      }

      const { value } = await Dialog.confirm({
        title: '팀 삭제',
        message: '팀원이 아무도 없습니다. 팀을 완전히 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)'
      });

      if (value && team) {
        // 팀 삭제 (DB에서 teams 레코드를 삭제하면 team_members도 연쇄적으로 삭제되거나 따로 처리)
        // 안전을 위해 team_members 먼저 삭제 후 teams 삭제
        await supabase.from('team_members').delete().eq('team_id', team.id);
        const { error } = await supabase.from('teams').delete().eq('id', team.id);

        if (error) {
          await Dialog.alert({ title: '오류', message: '팀 삭제에 실패했습니다. 권한을 확인해주세요.' });
        } else {
          // 팀 삭제 후 내 직책을 다시 팀원으로 초기화
          await supabase.from('profiles').update({ role: '팀원' }).eq('id', session.user.id);
          await Dialog.alert({ title: '성공', message: '팀이 성공적으로 삭제되었습니다.' });
          fetchTeam();
        }
      }
    } else {
      // 일반 팀원 나가기 로직
      const { value } = await Dialog.confirm({
        title: '팀 나가기',
        message: '정말로 현재 소속된 팀에서 나가시겠습니까?'
      });

      if (value && team) {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('user_id', session.user.id)
          .eq('team_id', team.id);

        if (error) {
          await Dialog.alert({ title: '오류', message: '팀 나가기에 실패했습니다.' });
        } else {
          await Dialog.alert({ title: '성공', message: '팀에서 나갔습니다.' });
          fetchTeam();
        }
      }
    }
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    const { value } = await Dialog.confirm({
      title: '팀원 내보내기',
      message: `'${memberName}' 님을 팀에서 강제로 내보내시겠습니까?`
    });

    if (value && team) {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', memberId)
        .eq('team_id', team.id);

      if (error) {
        await Dialog.alert({ title: '오류', message: '팀원 내보내기에 실패했습니다. (DB 권한 확인 필요)' });
      } else {
        await Dialog.alert({ title: '성공', message: `'${memberName}' 님을 내보냈습니다.` });
        fetchTeam();
      }
    }
  };

  const copyInviteCode = async () => {
    if (team?.invite_code) {
      try {
        await navigator.clipboard.writeText(team.invite_code);
        await Dialog.alert({ title: '복사 완료', message: '초대 코드가 클립보드에 복사되었습니다. 팀원들에게 공유하세요!' });
      } catch (err) {
        await Dialog.alert({ title: '초대 코드', message: `초대 코드: ${team.invite_code}` });
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 dark:text-slate-400">불러오는 중...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-200 dark:border-slate-700/50 p-6 flex flex-col min-h-[400px]">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 mb-6 flex items-center gap-2">
          <Users className="text-primary-600 dark:text-orange-400" /> 팀 관리
        </h2>
        
        <AnimatePresence mode="wait">
          {!team ? (
            <motion.div 
              key="no-team"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50/50 dark:bg-white dark:bg-slate-800/50 rounded-2xl"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Shield size={32} className="text-gray-900 dark:text-gray-400 dark:text-slate-500" />
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-medium mb-8 text-center leading-relaxed">
                현재 소속된 팀이 없습니다.<br/>새로운 팀을 만들거나 초대를 받아보세요.
              </p>
              
              <div className="w-full flex flex-col gap-3">
                <button onClick={handleCreateTeam} className="w-full bg-primary-600 dark:bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-200 dark:shadow-orange-900/50 hover:bg-primary-700 dark:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Plus size={20} /> 새 팀 만들기
                </button>
                <button onClick={handleJoinTeam} className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold py-4 rounded-2xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <UserPlus size={20} /> 초대 코드로 참가
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="has-team"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <div className="bg-gradient-to-br from-primary-600 dark:from-slate-800 to-primary-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-primary-200 dark:shadow-orange-900/50 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Users size={80} />
                </div>
                <h3 className="text-sm font-semibold text-primary-200 dark:text-orange-200 mb-1">나의 소속 팀</h3>
                <h2 className="text-2xl font-extrabold mb-6 relative z-10">{team.name}</h2>
                
                <div className="bg-white dark:bg-slate-800/10 rounded-xl p-4 backdrop-blur-md flex justify-between items-center relative z-10 border border-white/20">
                  <div>
                    <p className="text-xs text-primary-200 dark:text-orange-200 mb-1">팀 초대 코드</p>
                    <p className="font-mono font-bold text-lg tracking-widest">{team.invite_code}</p>
                  </div>
                  <button onClick={copyInviteCode} className="p-3 bg-white dark:bg-slate-800/20 hover:bg-white dark:bg-slate-800/30 rounded-lg transition-colors active:scale-95">
                    <Copy size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-4 px-2">팀원 목록 ({members.length}명)</h3>
                <div className="flex flex-col gap-2">
                  {members.map((m, idx) => {
                    const isMe = m.user_id === session.user.id;
                    const amILeader = members.find(my => my.user_id === session.user.id)?.profiles?.role === '팀장';
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-orange-400 font-bold">
                            {m.profiles?.display_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-slate-50 flex items-center gap-1.5">
                              {m.profiles?.display_name || '이름 없음'}
                              {m.profiles?.role === '팀장' && <Crown size={16} className="text-yellow-500" />}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{m.profiles?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
                            {m.profiles?.role || '팀원'}
                          </span>
                          {amILeader && !isMe && (
                            <button 
                              onClick={() => handleKickMember(m.user_id, m.profiles?.display_name || '이름 없음')}
                              className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-bold rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              내보내기
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-200 dark:border-slate-700/50">
                <button 
                  onClick={handleLeaveTeam} 
                  className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
                >
                  <LogOut size={18} /> {members.find(m => m.user_id === session.user.id)?.profiles?.role === '팀장' ? '팀 삭제하기' : '팀 나가기'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
