import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog } from '@capacitor/dialog';
import { ActionSheet } from '@capacitor/action-sheet';
import type { Session } from '@supabase/supabase-js';
import { ChevronRight, Sparkles, Hammer, Wallet, Palette, Monitor, HelpCircle, CalendarDays, DollarSign, Calculator, Bug, Users, KeyRound, LogOut, Trash2, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings({ session }: { session: Session }) {
  const [displayName, setDisplayName] = useState('');
  
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isCalSubOpen, setIsCalSubOpen] = useState(false);
  const [isTeamManageOpen, setIsTeamManageOpen] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [supportContent, setSupportContent] = useState('');
  const [themeMode, setThemeMode] = useState(localStorage.getItem('themePreference') || 'system');
  const [isPremium, setIsPremium] = useState(localStorage.getItem('isPremium') === 'true');
  const [jobType, setJobType] = useState(localStorage.getItem('jobType') || '🏗️ 종합');
  const [accountNumber, setAccountNumber] = useState(localStorage.getItem('accountNumber') || '미설정');
  const [mainColor, setMainColor] = useState(localStorage.getItem('mainColor') || '블루');
  const [showWeeklyTotal, setShowWeeklyTotal] = useState(localStorage.getItem('showWeeklyTotal') === 'true');
  const [defaultWage, setDefaultWage] = useState(localStorage.getItem('defaultWage') || '미설정');
  const [taxDeductionDefault, setTaxDeductionDefault] = useState(localStorage.getItem('taxDeductionDefault') === 'true');
  
  const [myTeams, setMyTeams] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchTeams();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setDisplayName(data.display_name || '');
    }
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('teams(id, name, invite_code)')
      .eq('user_id', session.user.id);
    
    if (data) {
      // @ts-ignore - Supabase nested select type inference issue
      setMyTeams(data.map((d: any) => d.teams));
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: teamData, error: teamError } = await supabase.from('teams').insert([{ name: newTeamName, invite_code: code }]).select();
    
    if (teamError || !teamData) {
      await Dialog.alert({title: '오류', message: '팀 생성 실패'});
      return;
    }
    const teamId = teamData[0].id;
    const { error: memberError } = await supabase.from('team_members').insert([{ team_id: teamId, user_id: session.user.id }]);
    
    if (memberError) {
      await Dialog.alert({title: '오류', message: '팀 멤버 등록 실패'});
      return;
    }
    await Dialog.alert({title: '성공', message: `팀이 생성되었습니다! 초대 코드: ${code}`});
    fetchTeams();
    setIsCreateTeamOpen(false);
    setNewTeamName('');
  };

  const handleJoinTeam = async () => {
    if (!inviteCode) return;
    const { data: teamData } = await supabase.from('teams').select('id, name').eq('invite_code', inviteCode).single();
    
    if (!teamData) {
      await Dialog.alert({title: '오류', message: '유효하지 않은 초대 코드입니다.'});
      return;
    }
    
    const { error } = await supabase.from('team_members').insert([{ team_id: teamData.id, user_id: session.user.id }]);
    if (error) {
      await Dialog.alert({title: '오류', message: '이미 가입된 팀이거나 가입에 실패했습니다.'});
      return;
    }
    await Dialog.alert({title: '성공', message: `'${teamData.name}' 팀에 가입되었습니다!`});
    fetchTeams();
    setIsJoinTeamOpen(false);
    setInviteCode('');
    setJoinMessage('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleEditProfile = async () => {
    const { value, cancelled } = await Dialog.prompt({
      title: '프로필 수정',
      message: '새로운 이름을 입력하세요.',
      inputText: displayName || ''
    });
    if (!cancelled && value) {
      const { error } = await supabase.from('profiles').update({ display_name: value }).eq('id', session.user.id);
      if (!error) {
        setDisplayName(value);
        await Dialog.alert({ title: '성공', message: '프로필이 업데이트 되었습니다.' });
      }
    }
  };

  const handleDeleteAccount = async () => {
    const { value } = await Dialog.confirm({
      title: '계정 삭제',
      message: '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 데이터가 삭제됩니다.',
      okButtonTitle: '삭제',
      cancelButtonTitle: '취소'
    });
    if (value) {
      await supabase.from('profiles').delete().eq('id', session.user.id);
      await supabase.auth.signOut();
    }
  };

  const handlePremiumPayment = async () => {
    if (isPremium) {
      const { value } = await Dialog.confirm({ title: '안내', message: '이미 프리미엄 사용 중입니다. 해지하시겠습니까?', okButtonTitle: '해지', cancelButtonTitle: '취소' });
      if (value) {
        setIsPremium(false);
        localStorage.setItem('isPremium', 'false');
      }
      return;
    }
    const { value } = await Dialog.confirm({
      title: '프리미엄 구독',
      message: '월 4,900원에 프리미엄 기능을 사용하시겠습니까? (현재 베타 기간 무료 가입)',
      okButtonTitle: '결제하기',
      cancelButtonTitle: '취소'
    });
    if (value) {
      setIsPremium(true);
      localStorage.setItem('isPremium', 'true');
      await Dialog.alert({ title: '성공', message: '프리미엄 구독이 완료되었습니다!' });
      setIsPremiumOpen(false);
    }
  };

  const handleReissueCalendarLink = async () => {
    const { value } = await Dialog.confirm({
      title: '링크 재발급',
      message: '새로운 링크를 발급하면 기존 캘린더 연동이 끊어집니다. 계속하시겠습니까?',
      okButtonTitle: '재발급',
      cancelButtonTitle: '취소'
    });
    if (value) {
      await Dialog.alert({ title: '성공', message: '새로운 구독 링크가 발급되었습니다.' });
    }
  };

  const handleUpdateTeamName = async (teamId: string, currentName: string) => {
    const { value, cancelled } = await Dialog.prompt({
      title: '팀 이름 변경',
      message: '새 팀 이름을 입력하세요.',
      inputText: currentName
    });
    if (!cancelled && value) {
      const { error } = await supabase.from('teams').update({ name: value }).eq('id', teamId);
      if (!error) {
        fetchTeams();
        await Dialog.alert({ title: '성공', message: '팀 이름이 변경되었습니다.' });
      } else {
        await Dialog.alert({ title: '오류', message: '팀 이름 변경 권한이 없거나 실패했습니다.' });
      }
    }
  };

  const handleChangeTheme = async () => {
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
  };

  const handleQRScanMock = async () => {
    // 실제 카메라 뷰 대신 프롬프트로 QR 코드 텍스트(초대 코드)를 입력받아 가입 처리
    const { value, cancelled } = await Dialog.prompt({
      title: 'QR 코드 스캔 (시뮬레이션)',
      message: '카메라로 촬영한 QR 코드의 내용을 입력해주세요. (초대 코드 입력)',
    });
    if (!cancelled && value) {
      // 입력받은 값으로 바로 가입 처리 로직 재활용
      const { data: teamData } = await supabase.from('teams').select('id, name').eq('invite_code', value.toUpperCase()).single();
      if (!teamData) {
        await Dialog.alert({title: '오류', message: '유효하지 않은 QR(초대) 코드입니다.'});
        return;
      }
      const { error } = await supabase.from('team_members').insert([{ team_id: teamData.id, user_id: session.user.id }]);
      if (error) {
        await Dialog.alert({title: '오류', message: '이미 가입된 팀이거나 가입에 실패했습니다.'});
        return;
      }
      await Dialog.alert({title: '성공', message: `'${teamData.name}' 팀에 가입되었습니다!`});
      fetchTeams();
    }
  };

  const handleUpdateJobType = async () => {
    const result = await ActionSheet.showActions({
      title: '직종 선택',
      options: [{ title: '🏗️ 종합' }, { title: '🔨 철근' }, { title: '🪚 목수' }, { title: '⚡ 전기' }]
    });
    const jobs = ['🏗️ 종합', '🔨 철근', '🪚 목수', '⚡ 전기'];
    if (result.index >= 0 && result.index < jobs.length) {
      setJobType(jobs[result.index]);
      localStorage.setItem('jobType', jobs[result.index]);
    }
  };

  const handleUpdateAccount = async () => {
    const { value, cancelled } = await Dialog.prompt({ title: '계좌번호 설정', message: '정산 시 보낼 계좌번호를 입력하세요', inputText: accountNumber === '미설정' ? '' : accountNumber });
    if (!cancelled && value) {
      setAccountNumber(value);
      localStorage.setItem('accountNumber', value);
    }
  };

  const handleUpdateMainColor = async () => {
    const result = await ActionSheet.showActions({ title: '메인 색상 선택', options: [{ title: '블루' }, { title: '오렌지' }, { title: '그린' }] });
    const colors = ['블루', '오렌지', '그린'];
    if (result.index >= 0 && result.index < colors.length) {
      setMainColor(colors[result.index]);
      localStorage.setItem('mainColor', colors[result.index]);
      await Dialog.alert({title:'안내', message:'색상이 변경되었습니다. (다음 업데이트에 앱 전반에 적용됩니다)'});
    }
  };

  const handleRestartTutorial = async () => {
    const { value } = await Dialog.confirm({ title: '앱 사용법', message: '튜토리얼을 다시 보시겠습니까?', okButtonTitle: '확인', cancelButtonTitle: '취소' });
    if (value) {
      localStorage.removeItem('hasSeenTutorial');
      window.location.reload();
    }
  };

  const handleToggleWeeklyTotal = () => {
    const newVal = !showWeeklyTotal;
    setShowWeeklyTotal(newVal);
    localStorage.setItem('showWeeklyTotal', String(newVal));
  };

  const handleUpdateDefaultWage = async () => {
    const { value, cancelled } = await Dialog.prompt({ title: '기본 일당 설정', message: '숫자만 입력하세요 (예: 150000)', inputText: defaultWage === '미설정' ? '' : defaultWage });
    if (!cancelled && value) {
      setDefaultWage(value);
      localStorage.setItem('defaultWage', value);
    }
  };

  const handleToggleTax = () => {
    const newVal = !taxDeductionDefault;
    setTaxDeductionDefault(newVal);
    localStorage.setItem('taxDeductionDefault', String(newVal));
  };

  const ListItem = ({ icon: Icon, title, subtitle, value, onClick, highlight = false }: any) => (
    <div onClick={onClick} className={`flex items-center justify-between p-4 cursor-pointer active:bg-gray-50 dark:active:bg-slate-700/50 transition-colors ${highlight ? 'bg-amber-50 dark:bg-amber-900/10 rounded-2xl mb-2 border border-amber-100 dark:border-amber-900/20' : 'border-b border-gray-100 dark:border-slate-800 last:border-0'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl ${highlight ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className={`font-extrabold text-[15px] ${highlight ? 'text-amber-700 dark:text-amber-500' : 'text-gray-900 dark:text-slate-50'}`}>{title}</div>
          {subtitle && <div className="text-[12px] font-semibold text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{value}</span>}
        <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col pb-10 animate-in fade-in duration-300">
      <div className="px-4 py-2">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">설정</h2>
        
        {/* Profile Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex justify-between items-center cursor-pointer active:scale-95 transition-transform" onClick={handleEditProfile}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-xl">
              {displayName ? displayName.charAt(0) : '나'}
            </div>
            <div>
              <div className="font-extrabold text-lg text-gray-900 dark:text-white">{displayName || '이름 없음'}</div>
              <div className="text-sm font-medium text-gray-500">{session.user.email}</div>
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-sm font-bold text-gray-600 dark:text-gray-300 rounded-xl">
            수정
          </div>
        </div>

        {/* Premium */}
        <ListItem 
          icon={Sparkles} 
          title={isPremium ? "프리미엄 사용 중" : "프리미엄"} 
          subtitle={isPremium ? "모든 기능을 사용 중입니다" : "더 많은 기능 살펴보기"} 
          highlight={!isPremium}
          onClick={() => isPremium ? handlePremiumPayment() : setIsPremiumOpen(true)}
        />

        {/* General Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Hammer} title="내 직종" value={jobType} onClick={handleUpdateJobType} />
          <ListItem icon={Wallet} title="계좌번호" subtitle="정산 요청 시 자동으로 같이 보내드려요" value={accountNumber} onClick={handleUpdateAccount} />
          <ListItem icon={Monitor} title="테마" value={themeMode === 'system' ? '시스템' : (themeMode === 'dark' ? '다크' : '라이트')} onClick={handleChangeTheme} />
          <ListItem icon={Palette} title="메인 색상" value={mainColor} onClick={handleUpdateMainColor} />
          <ListItem icon={CalendarDays} title="캘린더 구독" subtitle="다른 캘린더 앱(구글, 애플 등)과 연동해요" onClick={() => setIsCalSubOpen(true)} />
          <ListItem icon={HelpCircle} title="앱 사용법 다시 보기" subtitle="달력·정산·통계 등 각 탭 설명을 처음부터 다시 봐요" onClick={handleRestartTutorial} />
          <ListItem icon={CalendarDays} title="달력 주간 합계" subtitle="각 주 수입 합계를 달력에 표시" value={showWeeklyTotal ? "켜짐" : "꺼짐"} onClick={handleToggleWeeklyTotal} />
        </div>

        {/* Work Settings */}
        <h3 className="text-sm font-extrabold text-gray-500 px-4 mb-3">작업</h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={DollarSign} title="기본 일당" subtitle="새 현장 추가 시 자동 입력" value={defaultWage} onClick={handleUpdateDefaultWage} />
          <ListItem icon={Calculator} title="인적공제 3.3% 기본값" subtitle="새 현장 추가 시 공제 체크 자동 적용" value={taxDeductionDefault ? "켜짐" : "꺼짐"} onClick={handleToggleTax} />
        </div>

        {/* Support */}
        <h3 className="text-sm font-extrabold text-gray-500 px-4 mb-3">지원</h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Bug} title="버그 제보 / 문의하기" subtitle="사진 첨부해서 문의하면 답변을 알려드려요" onClick={() => setIsSupportOpen(true)} />
        </div>

        {/* Team */}
        <h3 className="text-sm font-extrabold text-gray-500 px-4 mb-3">팀</h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Users} title="팀 관리" subtitle="현재 소속된 팀을 관리해요" onClick={() => setIsTeamManageOpen(true)} />
          <ListItem icon={Users} title="팀 만들기" subtitle="팀원들과 현장을 함께 관리해요" onClick={() => setIsCreateTeamOpen(true)} />
          <ListItem icon={KeyRound} title="코드로 참여하기" subtitle="초대 코드를 입력해 팀 가입을 신청해요" onClick={() => setIsJoinTeamOpen(true)} />
          <ListItem icon={QrCode} title="QR코드 기능" subtitle="QR코드를 스캔하여 팀에 가입해요" onClick={handleQRScanMock} />
        </div>

        {/* Account Actions */}
        <div className="flex flex-col gap-3 mt-8 mb-8">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-extrabold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
            <LogOut size={18} /> 로그아웃
          </button>
          <button onClick={handleDeleteAccount} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 font-extrabold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
            <Trash2 size={18} /> 계정 삭제
          </button>
        </div>
      </div>

      {/* 팀 만들기 모달 */}
      <AnimatePresence>
        {isCreateTeamOpen && (
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
                  팀 만들기
                </h3>
                <button 
                  onClick={() => setIsCreateTeamOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">새 팀 이름</label>
                  <input 
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="팀 이름을 입력하세요"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium"
                  />
                  <p className="text-xs font-semibold text-gray-500 mt-2 ml-1">무료 플랜은 팀장 포함 최대 3명까지</p>
                </div>

                <button 
                  onClick={handleCreateTeam}
                  className="w-full mt-4 bg-blue-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  만들기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팀 가입 신청 모달 */}
      <AnimatePresence>
        {isJoinTeamOpen && (
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
                  팀 가입 신청
                </h3>
                <button 
                  onClick={() => setIsJoinTeamOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">초대 코드 6자리</label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="예: A1B2C3"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-extrabold text-2xl text-center text-gray-900 dark:text-white placeholder:text-gray-300 placeholder:font-medium uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">한마디 (선택)</label>
                  <input 
                    type="text"
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="팀장에게 남길 메시지"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-[15px]"
                  />
                </div>

                <button 
                  onClick={handleJoinTeam}
                  className="w-full mt-4 bg-gray-900 dark:bg-slate-700 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-black dark:hover:bg-slate-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  가입 신청
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 프리미엄 안내 모달 */}
      <AnimatePresence>
        {isPremiumOpen && (
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
              <div className="flex flex-col items-center text-center mt-4 mb-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight mb-2">
                  ✨ 프리미엄
                </h3>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                  결제 즉시 프리미엄 혜택이 영구적으로 적용되며,<br/>
                  모든 프리미엄 기능을 제한 없이 사용할 수 있습니다.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePremiumPayment}
                  className="w-full bg-amber-500 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  프리미엄 시작하기
                </button>
                <button 
                  onClick={() => setIsPremiumOpen(false)}
                  className="w-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-extrabold text-lg py-4 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  다음에 할게요
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 고객 지원 모달 */}
      <AnimatePresence>
        {isSupportOpen && (
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
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  문의 내역
                </h3>
                <button 
                  onClick={() => setIsSupportOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="border-b border-gray-100 dark:border-slate-700 pb-6">
                  <h4 className="text-sm font-extrabold text-gray-500 mb-3">새 문의하기</h4>
                  <textarea 
                    value={supportContent}
                    onChange={(e) => setSupportContent(e.target.value)}
                    placeholder="버그나 개선사항을 자유롭게 남겨주세요"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-[15px] h-32 resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                      사진 첨부
                    </button>
                    <button className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                      문의 등록
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-gray-500 mb-3">전체 문의 관리</h4>
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-sm font-semibold text-gray-400">등록된 문의 내역이 없습니다.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 캘린더 구독 모달 */}
      <AnimatePresence>
        {isCalSubOpen && (
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
                  캘린더 구독
                </h3>
                <button 
                  onClick={() => setIsCalSubOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-4">
                    구독 링크를 복사하여 구글 캘린더, 애플 캘린더 등 즐겨 쓰는 앱에서 공도리 일정을 확인하세요.
                  </p>
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
                    <p className="text-xs font-mono text-gray-500 truncate">https://gongdoori.app/cal/sub/a1b2c3d4e5f6</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { Dialog.alert({ title: '안내', message: '링크가 복사되었습니다.' }) }}
                    className="w-full bg-blue-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    링크 복사
                  </button>
                  <button 
                    onClick={handleReissueCalendarLink}
                    className="w-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-extrabold text-lg py-4 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    링크 재발급
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팀 관리 모달 */}
      <AnimatePresence>
        {isTeamManageOpen && (
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
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  팀 관리
                </h3>
                <button 
                  onClick={() => setIsTeamManageOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-8">
                {myTeams.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 font-bold mb-4">현재 소속된 팀이 없습니다.</p>
                    <button 
                      onClick={() => { setIsTeamManageOpen(false); setIsCreateTeamOpen(true); }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
                    >
                      새 팀 만들기
                    </button>
                  </div>
                ) : (
                  myTeams.map(team => (
                    <div key={team.id} className="border border-gray-200 dark:border-slate-700 rounded-2xl p-5 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-extrabold text-gray-900 dark:text-white">{team.name}</h4>
                        <div className="bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-lg text-sm font-mono text-gray-600 dark:text-gray-300">
                          초대 코드: {team.invite_code}
                        </div>
                      </div>
                      
                      {/* 팀 이름 수정 */}
                      <div className="mb-6">
                        <h4 className="text-xs font-extrabold text-gray-500 mb-2">팀 이름 수정</h4>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="새 팀 이름"
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-gray-900 dark:text-white"
                          />
                          <button onClick={() => handleUpdateTeamName(team.id, team.name)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
                            변경
                          </button>
                        </div>
                      </div>

                      {/* 팀원 목록 (나머지 로직은 백엔드 완성 후) */}
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-500 mb-2">기능 준비 중</h4>
                        <p className="text-sm text-gray-400">팀원 추방, 권한 위임, 가입 수락 기능은 백엔드 작업 후 연동됩니다.</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
