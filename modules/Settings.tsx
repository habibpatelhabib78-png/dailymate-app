
import React, { useState, useRef } from 'react';
import { 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  Trash2, 
  AppWindow,
  Lock,
  RefreshCw,
  ShieldCheck,
  Volume2,
  Hourglass,
  Download,
  Upload,
  TriangleAlert,
  Bot,
  CloudOff,
  Info
} from 'lucide-react';
import { AppSettings, AlarmSound, AlarmDuration } from './types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onClearAll?: () => void;
}

const SettingsModule: React.FC<SettingsProps> = ({ settings, setSettings, showToast, onClearAll }) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [tempPin, setTempPin] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLanguage = () => {
    setSettings({ ...settings, language: settings.language === 'English' ? 'Hindi' : 'English' });
  };

  const toggleDarkMode = () => {
    setSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const setPin = () => {
    if (tempPin.length === 4) {
      setSettings({ ...settings, pinLock: tempPin });
      setShowPinInput(false);
      setTempPin('');
      showToast('PIN Saved Successfully');
    } else {
      alert('PIN must be 4 digits');
    }
  };

  const validateBackupStructure = (data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') return false;
      const hasNotes = Array.isArray(data.notes);
      const hasTodos = Array.isArray(data.todos);
      const hasReminders = Array.isArray(data.reminders);
      const hasSettings = data.settings && typeof data.settings === 'object';
      return hasNotes && hasTodos && hasReminders && hasSettings;
    } catch (e) {
      return false;
    }
  };

  const exportBackup = () => {
    try {
      const data = {
        settings: JSON.parse(localStorage.getItem('dm_settings') || '{}'),
        notes: JSON.parse(localStorage.getItem('dm_notes') || '[]'),
        todos: JSON.parse(localStorage.getItem('dm_todos') || '[]'),
        reminders: JSON.parse(localStorage.getItem('dm_reminders') || '[]'),
        backupDate: new Date().toISOString(),
        version: '2.5.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      const now = new Date();
      const dateStr = `${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}`;
      link.href = url;
      link.download = `dailymate_backup_${dateStr}.json`;
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Backup Exported Successfully');
    } catch (error) {
      showToast('Export Failed', 'error');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('Invalid or corrupted backup file', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error("File empty");
        const data = JSON.parse(content);

        if (!validateBackupStructure(data)) {
          throw new Error("Invalid structure");
        }

        const confirmMsg = settings.language === 'Hindi' 
          ? 'क्या आप डेटा रिस्टोर करना चाहते हैं? वर्तमान डेटा ओवरराइट हो जाएगा।' 
          : 'This will replace ALL current data. Continue?';

        if (window.confirm(confirmMsg)) {
          const oldData = {
            settings: localStorage.getItem('dm_settings'),
            notes: localStorage.getItem('dm_notes'),
            todos: localStorage.getItem('dm_todos'),
            reminders: localStorage.getItem('dm_reminders'),
          };
          localStorage.setItem('dm_backup_before_import', JSON.stringify(oldData));

          localStorage.setItem('dm_settings', JSON.stringify(data.settings));
          localStorage.setItem('dm_notes', JSON.stringify(data.notes));
          localStorage.setItem('dm_todos', JSON.stringify(data.todos));
          localStorage.setItem('dm_reminders', JSON.stringify(data.reminders));
          
          showToast('Import successful');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Import cancelled by user');
        }
      } catch (error) {
        showToast('Invalid or corrupted backup file', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const SettingRow = ({ icon: Icon, title, desc, action, onRowClick, danger = false }: any) => (
    <div className="flex items-center gap-4 py-4 px-2 hover:bg-dm-bg transition-colors rounded-2xl cursor-pointer" onClick={() => onRowClick ? onRowClick() : null}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10 text-red-500' : 'bg-dm-bg text-dm-muted'}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1">
        <h4 className={`font-bold text-sm text-dm-text ${danger ? 'text-red-500' : ''}`}>{title}</h4>
        <p className="text-[10px] text-dm-muted font-medium uppercase tracking-wider">{desc}</p>
      </div>
      <div onClick={(e) => e.stopPropagation()}>{action}</div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300 max-w-md mx-auto pb-8 px-1">
      <h2 className="text-2xl font-bold mb-6 text-dm-text flex items-center gap-2 px-2">
        <AppWindow size={24} className="text-dm-accent" />
        {settings.language === 'Hindi' ? 'सेटिंग्स' : 'App Settings'}
      </h2>

      {/* 1. Alarm Defaults */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-dm-muted uppercase tracking-[0.2em] mb-3 px-2">Alarm Defaults</h3>
        <div className="bg-dm-card rounded-[2rem] p-3 shadow-dm border border-dm-border">
          <div className="flex items-center gap-4 px-3 py-2">
            <div className="w-10 h-10 bg-dm-accent-muted rounded-xl flex items-center justify-center text-dm-accent"><Volume2 size={20} /></div>
            <div className="flex-1">
              <p className="text-xs font-bold text-dm-text">Default Alarm Sound</p>
              <select 
                value={settings.defaultAlarmSound}
                onChange={(e) => setSettings({...settings, defaultAlarmSound: e.target.value as AlarmSound})}
                className="w-full bg-transparent text-[10px] text-dm-muted font-bold uppercase tracking-widest outline-none mt-0.5"
              >
                <option value="classic">Classic Beep</option>
                <option value="zen">Zen Chime</option>
                <option value="digital">Digital Alert</option>
              </select>
            </div>
          </div>
          <div className="h-px bg-dm-border mx-3 my-1"></div>
          <div className="flex items-center gap-4 px-3 py-2">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><Hourglass size={20} /></div>
            <div className="flex-1">
              <p className="text-xs font-bold text-dm-text">Default Ring Time</p>
              <select 
                value={settings.defaultAlarmDuration}
                onChange={(e) => setSettings({...settings, defaultAlarmDuration: Number(e.target.value) as AlarmDuration})}
                className="w-full bg-transparent text-[10px] text-dm-muted font-bold uppercase tracking-widest outline-none mt-0.5"
              >
                <option value={30}>30 Seconds</option>
                <option value={60}>1 Minute</option>
                <option value={120}>2 Minutes</option>
                <option value={300}>5 Minutes</option>
                <option value={0}>Infinite Loop</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visuals & Language */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-dm-muted uppercase tracking-[0.2em] mb-3 px-2">Visuals & Language</h3>
        <div className="bg-dm-card rounded-[2rem] p-3 shadow-dm border border-dm-border">
          <SettingRow 
            icon={settings.darkMode ? Sun : Moon}
            title="Dark Mode"
            desc={settings.darkMode ? 'Light Theme' : 'Dark Theme'}
            onRowClick={toggleDarkMode}
            action={<div className={`w-12 h-6 rounded-full transition-all relative ${settings.darkMode ? 'bg-dm-accent' : 'bg-dm-bg border border-dm-border'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.darkMode ? 'left-7 shadow-lg' : 'left-1'}`} /></div>}
          />
          <SettingRow icon={Globe} title="App Language" desc={settings.language} onRowClick={toggleLanguage} action={<button className="p-2 bg-dm-bg rounded-xl text-dm-accent"><RefreshCw size={16} /></button>} />
        </div>
      </section>

      {/* 3. Data & Backup */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-dm-muted uppercase tracking-[0.2em] mb-3 px-2">Data & Backup</h3>
        <div className="bg-dm-card rounded-[2rem] p-3 shadow-dm border border-dm-border">
          <SettingRow 
            icon={Upload}
            title="Export Backup"
            desc="Save all app data to your device"
            onRowClick={exportBackup}
            action={<button className="p-2 bg-dm-accent-muted text-dm-accent rounded-xl"><Upload size={16} /></button>}
          />
          <SettingRow 
            icon={Download}
            title="Import Backup"
            desc="Restore data from a JSON file"
            onRowClick={() => fileInputRef.current?.click()}
            action={<button className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl"><Download size={16} /></button>}
          />
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </section>

      {/* 4. Privacy Controls */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-dm-muted uppercase tracking-[0.2em] mb-3 px-2">Privacy Controls</h3>
        <div className="bg-dm-card rounded-[2rem] p-3 shadow-dm border border-dm-border">
          <SettingRow 
            icon={Lock}
            title="App Lock"
            desc={settings.appLockEnabled ? 'Active' : 'Off'}
            onRowClick={() => setSettings({...settings, appLockEnabled: !settings.appLockEnabled})}
            action={<div className={`w-12 h-6 rounded-full transition-all relative ${settings.appLockEnabled ? 'bg-green-500' : 'bg-dm-bg border border-dm-border'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.appLockEnabled ? 'left-7' : 'left-1'}`} /></div>}
          />
          <SettingRow 
            icon={Shield}
            title="Update PIN"
            desc={settings.pinLock ? 'PIN Configured' : 'PIN Not Set'}
            onRowClick={() => setShowPinInput(!showPinInput)}
            action={<button className="text-dm-accent text-[10px] font-black uppercase tracking-widest">{settings.pinLock ? 'Change' : 'Set'}</button>}
          />
          {showPinInput && (
            <div className="p-4 bg-dm-bg rounded-2xl mx-2 mb-2 animate-in zoom-in-95">
              <input 
                type="password" 
                placeholder="****" 
                maxLength={4} 
                value={tempPin} 
                onChange={e => setTempPin(e.target.value.replace(/[^0-9]/g, ''))} 
                className="w-full bg-dm-card p-4 rounded-xl text-center text-3xl tracking-[1rem] font-bold text-dm-text mb-3 shadow-inner border border-dm-border outline-none" 
              />
              <div className="flex gap-2">
                <button onClick={setPin} className="flex-1 py-3 bg-dm-accent text-white rounded-xl text-xs font-bold shadow-md">SAVE PIN</button>
                <button onClick={() => setShowPinInput(false)} className="flex-1 py-3 bg-dm-card text-xs font-bold rounded-xl text-dm-text border border-dm-border">CANCEL</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Assistant (Optional) */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-dm-muted uppercase tracking-[0.2em] mb-3 px-2">Assistant (Optional)</h3>
        <div className="bg-dm-card rounded-[2rem] p-3 shadow-dm border border-dm-border">
          <SettingRow 
            icon={Bot}
            title="Enable DailyMate Assistant"
            desc={settings.enableAssistant ? 'Active' : 'Disabled'}
            onRowClick={() => setSettings({...settings, enableAssistant: !settings.enableAssistant})}
            action={<div className={`w-12 h-6 rounded-full transition-all relative ${settings.enableAssistant ? 'bg-dm-accent' : 'bg-dm-bg border border-dm-border'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.enableAssistant ? 'left-7' : 'left-1'}`} /></div>}
          />
        </div>
      </section>

      {/* 6. About & Offline */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-dm-muted uppercase tracking-[0.2em] mb-3 px-2">About & Offline</h3>
        <div className="bg-dm-card rounded-[2rem] p-3 shadow-dm border border-dm-border">
          <div className="p-4 flex items-start gap-4">
            <div className="w-11 h-11 bg-dm-bg rounded-2xl flex items-center justify-center shrink-0 text-dm-muted">
              <CloudOff size={22} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-dm-text">Offline usage</h4>
              <p className="text-[9px] text-dm-muted mt-1 font-medium">DailyMate is an offline-first app. All your notes, reminders, and calendar data are stored on your device securely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Danger Zone */}
      <section className="mb-8">
        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 px-2">Danger Zone</h3>
        <div className="bg-red-500/10 rounded-[2rem] p-3 shadow-dm border border-red-500/20">
          <SettingRow 
            icon={Trash2}
            title="Clear All Data"
            desc="Permanently wipe this device"
            danger={true}
            onRowClick={onClearAll}
          />
        </div>
      </section>

      <div className="text-center py-6 opacity-30">
        <p className="text-[8px] font-bold tracking-[0.4em] uppercase text-dm-text">DailyMate Utility v2.7.0</p>
      </div>
    </div>
  );
};

export default SettingsModule;
