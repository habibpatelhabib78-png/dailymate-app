
import React, { useState, useEffect } from 'react';
import { Plus, Bell, Trash2, Clock, Music, Hourglass, CheckCircle2, AlertTriangle, CalendarDays, AlertCircle } from 'lucide-react';
import { Reminder, AppSettings, AlarmSound, AlarmDuration } from './types';

interface RemindersProps {
  settings: AppSettings;
}

const RemindersModule: React.FC<RemindersProps> = ({ settings }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<Omit<Reminder, 'id'>>({
    title: '',
    time: '',
    date: getTodayStr(),
    repeat: 'none',
    sound: settings.defaultAlarmSound,
    duration: settings.defaultAlarmDuration
  });

  const loadReminders = () => {
    const saved = localStorage.getItem('dm_reminders');
    if (saved) setReminders(JSON.parse(saved));
  };

  useEffect(() => {
    loadReminders();
    if ('Notification' in window) setNotifPermission(Notification.permission);
    window.addEventListener('storage', loadReminders);
    return () => window.removeEventListener('storage', loadReminders);
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

  const addReminder = () => {
    if (!formData.title || !formData.time) return;
    
    const [y, m, d] = formData.date.split('-').map(Number);
    const [hh, mm] = formData.time.split(':').map(Number);

    const newRem: Reminder = {
      ...formData,
      id: Date.now().toString()
    };
    const updatedReminders = [newRem, ...reminders];
    setReminders(updatedReminders);
    localStorage.setItem('dm_reminders', JSON.stringify(updatedReminders));
    
    setFormData({ 
      title: '', 
      time: '', 
      date: getTodayStr(), 
      repeat: 'none', 
      sound: settings.defaultAlarmSound, 
      duration: settings.defaultAlarmDuration 
    });
    setShowAdd(false);
    
    if (Notification.permission === 'default') {
      requestPermission();
    }
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem('dm_reminders', JSON.stringify(updated));
  };

  const getReminderStatus = (rem: Reminder) => {
    const now = new Date();
    const [y, m, d] = rem.date.split('-').map(Number);
    const [hh, mm] = rem.time.split(':').map(Number);
    const scheduledDate = new Date(y, m - 1, d, hh, mm, 0, 0);
    
    if (rem.lastNotified) return 'triggered';
    if (scheduledDate < now) return 'missed';
    return 'scheduled';
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-dm-text">
            {settings.language === 'Hindi' ? 'रिमाइंडर और अलार्म' : 'Alarms & Reminders'}
          </h2>
          <p className="text-[10px] text-dm-muted font-bold uppercase tracking-wider mt-1">
             {reminders.length} {settings.language === 'Hindi' ? 'निर्धारित' : 'Scheduled'}
          </p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-dm-accent text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Plus size={16} />
          {settings.language === 'Hindi' ? 'नया अलार्म' : 'New Alarm'}
        </button>
      </div>

      {notifPermission !== 'granted' && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {settings.language === 'Hindi' ? 'सूचनाएं चालू करें' : 'Enable Notifications'}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              {settings.language === 'Hindi' ? 'समय पर अलर्ट पाने के लिए अनुमति दें' : 'Allow notifications to get alerts'}
            </p>
          </div>
          <button onClick={requestPermission} className="px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg">Allow</button>
        </div>
      )}

      {showAdd && (
        <div className="bg-dm-card p-6 rounded-2xl border border-dm-border shadow-xl mb-8 animate-in zoom-in-95 duration-200">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-dm-muted uppercase tracking-wider mb-1 block">Label</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Medicine, Meeting..." 
                className="w-full bg-dm-bg px-4 py-2 rounded-lg outline-none text-dm-text"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-dm-muted uppercase tracking-wider mb-1 block">Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-dm-bg px-4 py-2 rounded-lg outline-none text-dm-text"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dm-muted uppercase tracking-wider mb-1 block">Time</label>
                <input 
                  type="time" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full bg-dm-bg px-4 py-2 rounded-lg outline-none text-dm-text"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-dm-muted uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Music size={10} /> Sound
                </label>
                <select 
                  value={formData.sound}
                  onChange={(e) => setFormData({...formData, sound: e.target.value as AlarmSound})}
                  className="w-full bg-dm-bg px-4 py-2 rounded-lg outline-none text-dm-text"
                >
                  <option value="classic">Classic Beep</option>
                  <option value="zen">Zen Chime</option>
                  <option value="digital">Digital Alert</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-dm-muted uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Hourglass size={10} /> Ring Time
                </label>
                <select 
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: Number(e.target.value) as AlarmDuration})}
                  className="w-full bg-dm-bg px-4 py-2 rounded-lg outline-none text-dm-text"
                >
                  <option value={30}>30 Sec</option>
                  <option value={60}>1 Min</option>
                  <option value={120}>2 Min</option>
                  <option value={300}>5 Min</option>
                  <option value={0}>Until Stopped</option>
                </select>
              </div>
            </div>

            <button 
              onClick={addReminder}
              className="w-full py-3 bg-dm-accent text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
              SAVE ALARM
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reminders.length > 0 ? reminders.map(rem => {
          const status = getReminderStatus(rem);
          const statusConfig = {
            triggered: { bgColor: 'bg-green-500/10', iconColor: 'text-green-500', icon: CheckCircle2, label: 'Done' },
            missed: { bgColor: 'bg-red-500/10', iconColor: 'text-red-500', icon: AlertTriangle, label: 'Missed' },
            scheduled: { bgColor: 'bg-dm-accent-muted', iconColor: 'text-dm-accent', icon: Bell, label: 'Active' }
          }[status];

          return (
            <div key={rem.id} className={`p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-dm-border transition-all ${statusConfig.bgColor} group relative`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.iconColor} bg-dm-card shadow-sm shrink-0`}>
                <statusConfig.icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold truncate text-dm-text ${status === 'triggered' ? 'opacity-60' : ''}`}>{rem.title}</h3>
                  <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-dm-bg text-dm-muted">{statusConfig.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 text-[10px] text-dm-muted font-medium">
                  <span className="flex items-center gap-1"><Clock size={10} /> {rem.time}</span>
                  <span className="flex items-center gap-1"><CalendarDays size={10} /> {rem.date}</span>
                  <span className="flex items-center gap-1 text-dm-accent font-bold lowercase tracking-tighter">{rem.sound || 'classic'}</span>
                </div>
              </div>
              <button onClick={() => deleteReminder(rem.id)} className="p-2 text-dm-muted hover:text-red-500"><Trash2 size={18} /></button>
            </div>
          );
        }) : (
          <div className="text-center py-20 text-dm-muted">
            <Bell size={64} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
            <p className="font-medium">No alarms set</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemindersModule;
