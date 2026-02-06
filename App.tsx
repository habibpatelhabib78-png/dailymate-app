
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Bell, 
  Calculator, 
  Calendar as CalendarIcon, 
  Lock, 
  Settings as SettingsIcon,
  ShieldAlert,
  Unlock,
  ShieldCheck,
  AlarmClock,
  X,
  Moon,
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { View, AppSettings, Reminder, AlarmSound } from './modules/types';
import NotesModule from './modules/Notes';
import TodoModule from './modules/Todo';
import RemindersModule from './modules/Reminders';
import CalculatorModule from './modules/Calculator';
import CalendarModule from './modules/Calendar';
import LockerModule from './modules/Locker';
import SettingsModule from './modules/Settings';
import MateAI from './modules/AI';

const SOUNDS: Record<AlarmSound, string> = {
  classic: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  zen: 'https://assets.mixkit.co/active_storage/sfx/1070/1070-preview.mp3',
  digital: 'https://assets.mixkit.co/active_storage/sfx/991/991-preview.mp3'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('notes');
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Alarm State
  const [ringingReminder, setRingingReminder] = useState<Reminder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('dm_settings');
      const defaultSet: AppSettings = { 
        darkMode: false, 
        language: 'English', 
        pinLock: null, 
        appLockEnabled: false, 
        defaultAlarmSound: 'classic',
        defaultAlarmDuration: 60,
        enableAssistant: false
      };
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSet, ...parsed };
      }
      return defaultSet;
    } catch {
      return { 
        darkMode: false, language: 'English', pinLock: null, appLockEnabled: false, 
        defaultAlarmSound: 'classic', defaultAlarmDuration: 60,
        enableAssistant: false
      };
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsAppReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: any) => {
      const { msg, type } = e.detail;
      showToast(msg, type || 'success');
    };
    window.addEventListener('dm-toast', handleToastEvent);
    return () => window.removeEventListener('dm-toast', handleToastEvent);
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (isResetting) return;
    
    // Apply theme classes to document root
    if (settings.darkMode) {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.classList.add('theme-light');
    }
    
    localStorage.setItem('dm_settings', JSON.stringify(settings));
    
    if (!settings.enableAssistant && currentView === 'ai') {
      setCurrentView('notes');
    }
  }, [settings, isResetting, currentView]);

  const stopAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
  };

  const triggerAlarm = (reminder: Reminder) => {
    if (ringingReminder || isResetting) return; 

    setRingingReminder(reminder);
    
    const soundUrl = SOUNDS[reminder.sound || settings.defaultAlarmSound];
    const audio = new Audio(soundUrl);
    audio.loop = true;
    audioRef.current = audio;
    audio.play().catch(() => {
      showToast("Tap screen to enable audio!", "error");
    });

    const duration = reminder.duration !== undefined ? reminder.duration : settings.defaultAlarmDuration;
    if (duration > 0) {
      alarmTimeoutRef.current = window.setTimeout(() => {
        dismissAlarm();
      }, duration * 1000);
    }
  };

  const dismissAlarm = () => {
    if (!ringingReminder) return;
    stopAlarmSound();
    
    const saved = localStorage.getItem('dm_reminders');
    if (saved) {
      const reminders: Reminder[] = JSON.parse(saved);
      const updated = reminders.map(r => r.id === ringingReminder.id ? { ...r, lastNotified: new Date().toISOString() } : r);
      localStorage.setItem('dm_reminders', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }

    setRingingReminder(null);
  };

  const snoozeAlarm = () => {
    if (!ringingReminder) return;
    stopAlarmSound();

    const [y, m, d] = ringingReminder.date.split('-').map(Number);
    const [hh, mm] = ringingReminder.time.split(':').map(Number);
    const date = new Date(y, m - 1, d, hh, mm + 5, 0, 0); 
    
    const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const saved = localStorage.getItem('dm_reminders');
    if (saved) {
      const reminders: Reminder[] = JSON.parse(saved);
      const updated = reminders.map(r => r.id === ringingReminder.id ? { 
        ...r, time: newTime, date: newDate, lastNotified: undefined 
      } : r);
      localStorage.setItem('dm_reminders', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }

    showToast(settings.language === 'Hindi' ? "5 मिनट के लिए स्थगित" : "Snoozed for 5 mins", "success");
    setRingingReminder(null);
  };

  useEffect(() => {
    if (isResetting) return;

    const checkReminders = () => {
      try {
        const saved = localStorage.getItem('dm_reminders');
        if (!saved) return;
        const reminders: Reminder[] = JSON.parse(saved);
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); 
        const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        reminders.forEach(rem => {
          const isDueNow = rem.date === currentDate && rem.time === currentTime;
          if (isDueNow && !rem.lastNotified) { 
            triggerAlarm(rem); 
          }
        });
      } catch (e) {}
    };
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [ringingReminder, isResetting]);

  const handleUnlock = () => {
    if (unlockPin === settings.pinLock) { 
        setIsAppUnlocked(true); 
        setUnlockPin(''); 
    } else { 
        showToast('Incorrect PIN', 'error'); 
        setUnlockPin(''); 
    }
  };

  const handleFullReset = async () => {
    const confirmMsg = settings.language === 'Hindi'
      ? 'सावधानी: यह इस डिवाइस से सभी डेटा को स्थायी रूप से हटा देगा।'
      : 'CRITICAL WARNING: This will permanently delete ALL data from this device.';

    if (window.confirm(confirmMsg)) {
      setIsResetting(true);
      localStorage.clear();
      sessionStorage.clear();
      try {
        await indexedDB.deleteDatabase('DailyMateLocker');
      } catch (e) {}
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 z-[1000] bg-dm-bg flex flex-col items-center justify-center">
         <div className="w-24 h-24 bg-dm-accent rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl animate-bounce">
            <Sparkles size={48} />
         </div>
         <h1 className="mt-6 text-2xl font-black text-dm-accent tracking-tighter uppercase italic">DailyMate</h1>
      </div>
    );
  }

  if (isResetting) {
    return (
      <div className="fixed inset-0 z-[1000] bg-dm-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Trash2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-dm-text mb-2">Clearing All Data</h2>
        <p className="text-dm-muted text-sm mb-8">Securely wiping records from this device...</p>
        <RefreshCw size={24} className="animate-spin text-dm-accent" />
      </div>
    );
  }

  if (settings.pinLock && settings.appLockEnabled && !isAppUnlocked && !ringingReminder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-dm-bg text-dm-text">
        <div className="w-20 h-20 bg-dm-accent text-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">DailyMate Locked</h1>
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <input 
            type="password" 
            maxLength={4}
            value={unlockPin}
            onChange={(e) => setUnlockPin(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full text-center text-4xl tracking-[1.5rem] bg-dm-card p-5 rounded-3xl border-none shadow-dm outline-none text-dm-text"
            placeholder="****"
            autoFocus
          />
          <button onClick={handleUnlock} className="w-full py-4 bg-dm-accent text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Unlock size={20} /> {settings.language === 'Hindi' ? 'खोलें' : 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dm-bg transition-colors duration-300">
      {toast && !ringingReminder && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-bold text-sm animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {ringingReminder && (
        <div className="fixed inset-0 z-[200] bg-red-600 dark:bg-red-900 flex flex-col items-center justify-center text-white p-8 animate-in fade-in zoom-in duration-300">
           <div className="relative mb-12">
             <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-50"></div>
             <div className="w-32 h-32 bg-white text-red-600 rounded-full flex items-center justify-center shadow-2xl relative z-10">
               <AlarmClock size={64} />
             </div>
           </div>
           <h2 className="text-4xl font-black mb-2 text-center uppercase tracking-tighter">Alarm</h2>
           <p className="text-xl font-bold mb-8 text-center bg-white/20 px-6 py-2 rounded-full">{ringingReminder.time}</p>
           <div className="max-w-xs text-center mb-12">
             <h3 className="text-3xl font-bold mb-2">{ringingReminder.title}</h3>
           </div>
           <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
              <button onClick={dismissAlarm} className="w-full py-6 bg-white text-red-600 rounded-3xl font-black text-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"><X size={32} /> DISMISS</button>
              <button onClick={snoozeAlarm} className="w-full py-5 bg-red-500/50 border-2 border-white/30 text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Moon size={24} /> SNOOZE (5M)</button>
           </div>
        </div>
      )}

      <header className="sticky top-0 z-50 p-4 border-b border-dm-border flex flex-col gap-2 bg-dm-card/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-dm-accent rounded-lg flex items-center justify-center text-white font-bold"><Sparkles size={18}/></div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-dm-accent to-indigo-600 bg-clip-text text-transparent leading-none">DailyMate</h1>
              <div className="flex items-center gap-1 text-[8px] text-green-500 font-black uppercase tracking-widest mt-0.5">
                <ShieldCheck size={10} /> Local Sandbox
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {settings.enableAssistant && (
              <button onClick={() => setCurrentView('ai')} className={`p-2 rounded-xl transition-all ${currentView === 'ai' ? 'text-dm-accent bg-dm-accent-muted shadow-inner scale-110' : 'text-dm-muted'}`}><Sparkles size={20} /></button>
            )}
            <button onClick={() => setCurrentView('reminders')} className={`p-2 rounded-xl transition-all ${currentView === 'reminders' ? 'text-dm-accent bg-dm-accent-muted' : 'text-dm-muted'}`}><Bell size={20} /></button>
            <button onClick={() => setCurrentView('calculator')} className={`p-2 rounded-xl transition-all ${currentView === 'calculator' ? 'text-dm-accent bg-dm-accent-muted' : 'text-dm-muted'}`}><Calculator size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto px-4 pt-4 max-w-lg mx-auto w-full scroll-smooth">
        {currentView === 'notes' && <NotesModule settings={settings} />}
        {currentView === 'todo' && <TodoModule settings={settings} />}
        {currentView === 'reminders' && <RemindersModule settings={settings} />}
        {currentView === 'calculator' && <CalculatorModule settings={settings} />}
        {currentView === 'calendar' && <CalendarModule settings={settings} />}
        {currentView === 'locker' && <LockerModule settings={settings} />}
        {currentView === 'settings' && <SettingsModule settings={settings} setSettings={setSettings} showToast={showToast} onClearAll={handleFullReset} />}
        {currentView === 'ai' && settings.enableAssistant && <MateAI settings={settings} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-dm-card/90 backdrop-blur-lg border-t border-dm-border px-2 py-1 flex justify-around items-center z-50">
        {[
          { id: 'notes', icon: FileText, label: settings.language === 'Hindi' ? 'नोट्स' : 'Notes' },
          { id: 'todo', icon: CheckSquare, label: settings.language === 'Hindi' ? 'कार्य' : 'To-Do' },
          { id: 'calendar', icon: CalendarIcon, label: settings.language === 'Hindi' ? 'कैलेंडर' : 'Calendar' },
          { id: 'locker', icon: Lock, label: settings.language === 'Hindi' ? 'लॉकर' : 'Locker' },
          { id: 'settings', icon: SettingsIcon, label: settings.language === 'Hindi' ? 'सेटिंग्स' : 'Settings' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as View)}
            className={`flex flex-col items-center p-2 min-w-[64px] transition-all rounded-xl ${currentView === item.id ? 'text-dm-accent bg-dm-accent-muted scale-105' : 'text-dm-muted'}`}
          >
            <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
