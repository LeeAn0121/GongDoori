import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog } from '@capacitor/dialog';
import type { Session } from '@supabase/supabase-js';
import { ChevronRight, Sparkles, Hammer, Wallet, Palette, Monitor, HelpCircle, CalendarDays, DollarSign, Calculator, Bug, Users, KeyRound, LogOut, Trash2, X, QrCode, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from './Toast';
import { QRCodeCanvas } from 'qrcode.react';
import { downloadAndShareBase64 } from '../utils/download';

import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan }: { onScan: (text: string) => void }) => {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      false
    );
    
    scanner.render(
      (decodedText) => {
        scanner.clear();
        if (onScanRef.current) {
          onScanRef.current(decodedText);
        }
      },
      () => {
        // ignore errors for each frame
      }
    );

    return () => {
      try {
        scanner.clear().catch(() => {});
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return <div id="qr-reader" className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-lg border-none [&_div]:border-none [&_video]:rounded-xl"></div>;
};

export default function Settings({ session }: { session: Session }) {
  const [displayName, setDisplayName] = useState('');
  
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isCalSubOpen, setIsCalSubOpen] = useState(false);
  const [isTeamManageOpen, setIsTeamManageOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [themeMode, setThemeMode] = useState(localStorage.getItem('themePreference') || 'system');
  const [isPremium, setIsPremium] = useState(localStorage.getItem('isPremium') === 'true');
  const [jobType, setJobType] = useState(localStorage.getItem('jobType') || '🏗️ 종합');
  const [accountNumber, setAccountNumber] = useState(localStorage.getItem('accountNumber') || '미설정');
  const [mainColor, setMainColor] = useState(localStorage.getItem('mainColor') || '블루');
  const [showWeeklyTotal, setShowWeeklyTotal] = useState(localStorage.getItem('showWeeklyTotal') === 'true');
  const [defaultWage, setDefaultWage] = useState(localStorage.getItem('defaultWage') || '미설정');
  const [taxDeductionDefault, setTaxDeductionDefault] = useState(localStorage.getItem('taxDeductionDefault') === 'true');
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  
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
      await Dialog.alert({title: '오류', message: '팀 생성 실패: ' + (teamError?.message || '알 수 없는 오류')});
      return;
    }
    const teamId = teamData[0].id;
    const { error: memberError } = await supabase.from('team_members').insert([{ team_id: teamId, user_id: session.user.id }]);
    
    if (memberError) {
      await Dialog.alert({title: '오류', message: '팀 멤버 등록 실패: ' + memberError.message});
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
      await Dialog.alert({title: '오류', message: '이미 가입된 팀이거나 가입에 실패했습니다: ' + error.message});
      return;
    }
    await Dialog.alert({title: '성공', message: `'${teamData.name}' 팀에 가입되었습니다!`});
    fetchTeams();
    setIsJoinTeamOpen(false);
    setInviteCode('');
    setJoinMessage('');
  };

  const handleLogout = async () => {
    const { value } = await Dialog.confirm({ title: '로그아웃', message: '정말로 로그아웃 하시겠습니까?' });
    if (value) {
      await supabase.auth.signOut();
      window.location.reload();
    }
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
      window.location.reload();
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

  const handleChangeTheme = () => {
    setIsThemeModalOpen(true);
  };
  
  const handleSelectTheme = (newMode: string) => {
    setThemeMode(newMode);
    localStorage.setItem('themePreference', newMode);
    
    if (newMode === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.toggle('dark', newMode === 'dark');
      localStorage.setItem('theme', newMode === 'dark' ? 'dark' : 'light');
    }
    
    setIsThemeModalOpen(false);
    showToast(`테마: ${newMode === 'system' ? '시스템' : newMode === 'dark' ? '다크' : '라이트'} 적용`, 'success');
  };

  const handleJoinByCode = async (code: string) => {
    const { data: teamData } = await supabase.from('teams').select('id, name').eq('invite_code', code.toUpperCase()).single();
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
  };

  const handleQRScanMock = () => {
    setIsScannerOpen(true);
  };

  const handleUpdateJobType = async () => {
    setIsJobModalOpen(true);
  };
  
  const handleSelectJobType = (job: string) => {
    setJobType(job);
    localStorage.setItem('jobType', job);
    setIsJobModalOpen(false);
    showToast(`직종: ${job} 변경됨`, 'success');
  };

  const handleUpdateAccount = async () => {
    const { value, cancelled } = await Dialog.prompt({ title: '계좌번호 설정', message: '정산 시 보낼 계좌번호를 입력하세요', inputText: accountNumber === '미설정' ? '' : accountNumber });
    if (!cancelled && value) {
      setAccountNumber(value);
      localStorage.setItem('accountNumber', value);
      showToast('계좌번호가 저장되었습니다', 'success');
    }
  };

  const handleUpdateMainColor = async () => {
    setIsColorModalOpen(true);
  };
  
  const handleSelectMainColor = (colorHex: string) => {
    setMainColor(colorHex);
    localStorage.setItem('mainColor', colorHex);
    setIsColorModalOpen(false);
    // 즉시 CSS 변수 업데이트
    const colorPalettes: Record<string, Record<number, string>> = {
      '#3B82F6': { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
      '#EF4444': { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
      '#10B981': { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
      '#8B5CF6': { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
      '#F97316': { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
      '#6B7280': { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' }
    };
    const palette = colorPalettes[colorHex] || colorPalettes['#3B82F6'];
    for (const [key, value] of Object.entries(palette)) {
      document.documentElement.style.setProperty(`--mc-${key}`, value);
    }
    showToast('메인 색상이 변경되었습니다', 'success');
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
    window.dispatchEvent(new Event('settingsChanged'));
    showToast(`주간 합계 ${newVal ? '켜짐' : '꺼짐'}`, 'success');
  };

  const handleUpdateDefaultWage = async () => {
    const { value, cancelled } = await Dialog.prompt({ title: '기본 일당 설정', message: '숫자만 입력하세요 (예: 150000)', inputText: defaultWage === '미설정' ? '' : defaultWage });
    if (!cancelled && value) {
      setDefaultWage(value);
      localStorage.setItem('defaultWage', value);
      showToast(`기본 일당: ${parseInt(value).toLocaleString()}원 설정`, 'success');
    }
  };

  const handleToggleTax = () => {
    const newVal = !taxDeductionDefault;
    setTaxDeductionDefault(newVal);
    localStorage.setItem('taxDeductionDefault', String(newVal));
    showToast(`3.3% 원천징수 ${newVal ? '기본 적용' : '기본 해제'}`, 'success');
  };

  const handleToggleNotification = async () => {
    try {
      // Use Capacitor LocalNotifications if available (mobile)
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const permStatus = await LocalNotifications.requestPermissions();
      if (permStatus.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: '공돌이 알림',
              body: '오늘 일당은 기록하셨나요? 잊지 말고 등록하세요!',
              id: 1,
              schedule: { on: { hour: 18, minute: 0 }, repeats: true },
              actionTypeId: '',
              extra: null
            }
          ]
        });
        localStorage.setItem('notificationsEnabled', 'true');
        showToast('매일 오후 6시 시스템 알림이 활성화되었습니다', 'success');
      } else {
        localStorage.setItem('notificationsEnabled', 'false');
        showToast('알림 권한이 거부되었습니다', 'error');
      }
    } catch {
      // Fallback to web Notifications if not running in Capacitor (browser)
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('공돌이 알림', { body: '웹 시스템 알림이 활성화되었습니다!', icon: '/app_icon_v2.jpg' });
          localStorage.setItem('notificationsEnabled', 'true');
          showToast('시스템 알림 활성화', 'success');
        } else {
          localStorage.setItem('notificationsEnabled', 'false');
          showToast('알림 권한이 거부되었습니다', 'error');
        }
      } else {
        showToast('알림 설정 중 오류가 발생했습니다', 'error');
      }
    }
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
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-extrabold text-xl">
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
          <ListItem 
            icon={CalendarDays} 
            title="캘린더 구독" 
            subtitle="다른 캘린더 앱(구글, 애플 등)과 연동해요" 
            onClick={async () => {
              if (!isPremium) {
                const { Dialog } = await import('@capacitor/dialog');
                await Dialog.alert({ title: '프리미엄 기능', message: '캘린더 구독(외부 앱 연동) 기능은 프리미엄 구독 시 이용 가능합니다.' });
                return;
              }
              setIsCalSubOpen(true);
            }} 
          />
          <ListItem icon={HelpCircle} title="앱 사용법 다시 보기" subtitle="달력·정산·통계 등 각 탭 설명을 처음부터 다시 봐요" onClick={handleRestartTutorial} />
          <ListItem 
            icon={Bell} 
            title="일일 알림" 
            subtitle="매일 오후 6시에 일당 기록 알림 받기" 
            value={localStorage.getItem('notificationsEnabled') === 'true' ? "켜짐" : "꺼짐"} 
            onClick={handleToggleNotification} 
          />
          <ListItem 
            icon={CalendarDays} 
            title="달력 주간 합계" 
            subtitle="각 주 수입 합계를 달력에 표시" 
            value={showWeeklyTotal ? "켜짐" : "꺼짐"} 
            onClick={async () => {
              if (!isPremium) {
                const { Dialog } = await import('@capacitor/dialog');
                await Dialog.alert({ title: '프리미엄 기능', message: '달력 주간 합계 표시 기능은 프리미엄 구독 시 이용 가능합니다.' });
                return;
              }
              handleToggleWeeklyTotal();
            }} 
          />
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
          <ListItem icon={Bug} title="버그 제보 / 문의하기" subtitle="사진 첨부는 Github 핫라인을 이용해주세요" onClick={() => window.open('https://github.com/LeeAn0121/GongDoori/issues/new', '_blank')} />
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

      {/* 테마 모달 */}
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
              className="bg-white dark:bg-slate-800 w-full max-w-full rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
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
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium"
                  />
                  <p className="text-xs font-semibold text-gray-500 mt-2 ml-1">무료 플랜은 팀장 포함 최대 3명까지</p>
                </div>

                <button 
                  onClick={handleCreateTeam}
                  className="w-full mt-4 bg-primary-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-primary-700 active:scale-[0.98] transition-all cursor-pointer"
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
              className="bg-white dark:bg-slate-800 w-full max-w-full rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
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
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-extrabold text-2xl text-center text-gray-900 dark:text-white placeholder:text-gray-300 placeholder:font-medium uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">한마디 (선택)</label>
                  <input 
                    type="text"
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="팀장에게 남길 메시지"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-[15px]"
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
              className="bg-white dark:bg-slate-800 w-full max-w-full rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
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

      {/* 메인 색상 모달 */}
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
              className="bg-white dark:bg-slate-800 w-full max-w-full rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
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
                    className="w-full bg-primary-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-primary-700 active:scale-[0.98] transition-all cursor-pointer"
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
              className="bg-white dark:bg-slate-800 w-full max-w-full rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
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
                      className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold"
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
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-sm text-gray-900 dark:text-white"
                          />
                          <button onClick={() => handleUpdateTeamName(team.id, team.name)} className="px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors text-sm whitespace-nowrap">
                            변경
                          </button>
                        </div>
                      </div>

                      {/* QR 코드 및 공유 */}
                      <div className="mb-6">
                        <h4 className="text-xs font-extrabold text-gray-500 mb-2">QR 코드 (팀 초대)</h4>
                        <div className="flex flex-col items-center gap-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                          <QRCodeCanvas id={`qr-${team.id}`} value={team.invite_code} size={150} level={"H"} />
                          <button 
                            onClick={async () => {
                              const canvas = document.getElementById(`qr-${team.id}`) as HTMLCanvasElement;
                              if (canvas) {
                                const base64 = canvas.toDataURL('image/png').split(',')[1];
                                await downloadAndShareBase64(`Team_QR_${team.invite_code}.png`, base64, 'image/png');
                              }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors text-sm w-full"
                          >
                            QR 이미지 다운로드 및 공유
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
      {/* 스캐너 모달 */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col"
          >
            <div className="flex justify-between items-center p-6">
              <h3 className="text-xl font-extrabold text-white tracking-tight">QR 코드 스캔</h3>
              <button onClick={() => setIsScannerOpen(false)} className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <QRScanner onScan={(text) => {
                setIsScannerOpen(false);
                handleJoinByCode(text);
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
