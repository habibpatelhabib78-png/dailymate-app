
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Moon, Bell, CheckSquare, FileText, Clock, Flag, Heart, Sparkles, Star } from 'lucide-react';
import { AppSettings, Note, Todo, Reminder } from './types';
import { FESTIVAL_DATA, Festival } from './festivalData';

interface CalendarProps {
  settings: AppSettings;
}

const CalendarModule: React.FC<CalendarProps> = ({ settings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [activityData, setActivityData] = useState<{
    notes: Note[],
    todos: Todo[],
    reminders: Reminder[]
  }>({ notes: [], todos: [], reminders: [] });

  const [quickAddType, setQuickAddType] = useState<'none' | 'todo' | 'reminder' | 'note'>('none');
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddTime, setQuickAddTime] = useState('12:00');

  useEffect(() => {
    const loadData = () => {
      const notes = JSON.parse(localStorage.getItem('dm_notes') || '[]');
      const todos = JSON.parse(localStorage.getItem('dm_todos') || '[]');
      const reminders = JSON.parse(localStorage.getItem('dm_reminders') || '[]');
      setActivityData({ notes, todos, reminders });
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getFestivalsForDate = (date: Date): Festival[] => {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${m}-${d}`;
    return FESTIVAL_DATA.filter(f => f.date === dateStr);
  };

  const hasActivity = (date: Date) => {
    const dStr = formatDate(date);
    const hasNote = activityData.notes.some(n => n.targetDate === dStr);
    const hasTodo = activityData.todos.some(t => t.dueDate === dStr);
    const hasRem = activityData.reminders.some(r => r.date === dStr);
    const hasFest = getFestivalsForDate(date).length > 0;
    return hasNote || hasTodo || hasRem || hasFest;
  };

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fullWeekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleQuickAdd = () => {
    if (!selectedDay || !quickAddText.trim()) return;
    const dStr = formatDate(selectedDay);

    if (quickAddType === 'todo') {
      const newTodo: Todo = { id: Date.now().toString(), text: quickAddText, completed: false, dueDate: dStr };
      const updated = [newTodo, ...activityData.todos];
      localStorage.setItem('dm_todos', JSON.stringify(updated));
      setActivityData({ ...activityData, todos: updated });
    } else if (quickAddType === 'reminder') {
      const newRem: Reminder = { id: Date.now().toString(), title: quickAddText, date: dStr, time: quickAddTime, repeat: 'none' };
      const updated = [newRem, ...activityData.reminders];
      localStorage.setItem('dm_reminders', JSON.stringify(updated));
      setActivityData({ ...activityData, reminders: updated });
    } else if (quickAddType === 'note') {
      const newNote: Note = { id: Date.now().toString(), title: `Note: ${dStr}`, content: quickAddText, updatedAt: Date.now(), targetDate: dStr };
      const updated = [newNote, ...activityData.notes];
      localStorage.setItem('dm_notes', JSON.stringify(updated));
      setActivityData({ ...activityData, notes: updated });
    }

    setQuickAddType('none');
    setQuickAddText('');
    window.dispatchEvent(new CustomEvent('dm-toast', { detail: { msg: 'Entry Added', type: 'success' } }));
  };

  const renderDays = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const days = [];
    const totalDays = daysInMonth(month, year);
    const startOffset = firstDayOfMonth(month, year);
    const today = new Date();

    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-14"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      const isSelected = selectedDay && selectedDay.getDate() === d && selectedDay.getMonth() === month && selectedDay.getFullYear() === year;
      const festivals = getFestivalsForDate(dateObj);
      const active = hasActivity(dateObj);

      days.push(
        <button 
          key={d} 
          onClick={() => setSelectedDay(dateObj)}
          className={`h-14 flex flex-col items-center justify-center relative rounded-xl transition-all active:scale-90
            ${isSelected ? 'bg-dm-accent text-white shadow-lg z-10' : (isToday ? 'bg-dm-accent-muted text-dm-accent' : 'hover:bg-dm-bg text-dm-text')}
          `}
        >
          <span className="text-base font-bold">{d}</span>
          {active && !isSelected && (
            <div className={`absolute bottom-2 w-1 h-1 rounded-full ${festivals.length > 0 ? 'bg-amber-500' : 'bg-dm-accent'}`}></div>
          )}
        </button>
      );
    }
    return days;
  };

  const festivalsForDay = selectedDay ? getFestivalsForDate(selectedDay) : [];
  const dayItems = selectedDay ? {
    notes: activityData.notes.filter(n => n.targetDate === formatDate(selectedDay)),
    todos: activityData.todos.filter(t => t.dueDate === formatDate(selectedDay)),
    reminders: activityData.reminders.filter(r => r.date === formatDate(selectedDay))
  } : null;

  const FestivalIcon = ({ type }: { type: Festival['type'] }) => {
    switch(type) {
      case 'national': return <Flag size={14} className="text-red-500" />;
      case 'religious': return <Sparkles size={14} className="text-amber-500" />;
      case 'jayanti': return <Star size={14} className="text-indigo-500" />;
      case 'international': return <Heart size={14} className="text-pink-500" />;
      case 'lunar': return <Moon size={14} className="text-blue-400" />;
    }
  };

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      <div className="bg-dm-card rounded-[2rem] p-5 shadow-dm border border-dm-border mb-6">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-dm-text leading-none">
              {monthNames[currentDate.getMonth()]}
            </h2>
            <span className="text-dm-muted font-bold text-[10px] uppercase tracking-widest mt-1">
              {currentDate.getFullYear()}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-2 bg-dm-bg rounded-xl text-dm-text active:scale-95 transition-all"><ChevronLeft size={18} /></button>
            <button onClick={nextMonth} className="p-2 bg-dm-bg rounded-xl text-dm-text active:scale-95 transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, idx) => (
            <div key={day} className={`text-center text-[9px] font-black uppercase tracking-widest py-1 ${idx === 0 ? 'text-red-500' : 'text-dm-muted'}`}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
      </div>

      <div className="bg-dm-card rounded-[2rem] p-6 shadow-dm border border-dm-border animate-in slide-in-from-bottom duration-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-dm-accent text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
            {selectedDay.getDate()}
          </div>
          <div>
            <h3 className="font-bold text-dm-text text-lg leading-none">
              {monthNames[selectedDay.getMonth()]} {selectedDay.getFullYear()}
            </h3>
            <p className="text-dm-accent text-xs font-black uppercase tracking-widest mt-1">
              {fullWeekDays[selectedDay.getDay()]}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {festivalsForDay.map(f => (
            <div key={f.nameEn} className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-2xl text-xs border border-amber-500/20">
              <FestivalIcon type={f.type} />
              <div className="flex-1">
                <span className="font-bold text-dm-text">{settings.language === 'Hindi' ? f.nameHi : f.nameEn}</span>
                <span className="ml-2 text-[8px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase font-black">{f.type}</span>
              </div>
            </div>
          ))}

          {dayItems?.reminders.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-dm-accent-muted rounded-2xl text-xs">
              <Bell size={14} className="text-dm-accent" />
              <span className="font-bold text-dm-text">{r.title}</span>
              <span className="ml-auto text-dm-muted font-medium">{r.time}</span>
            </div>
          ))}
          {dayItems?.todos.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-dm-bg rounded-2xl text-xs">
              <CheckSquare size={14} className={t.completed ? 'text-green-500' : 'text-dm-muted'} />
              <span className={`font-medium text-dm-text ${t.completed ? 'line-through opacity-50' : ''}`}>{t.text}</span>
            </div>
          ))}
          {dayItems?.notes.map(n => (
            <div key={n.id} className="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-2xl text-xs">
              <FileText size={14} className="text-indigo-500" />
              <span className="font-medium text-dm-text truncate">{n.title}</span>
            </div>
          ))}
          
          {(!festivalsForDay.length && !dayItems?.reminders.length && !dayItems?.todos.length && !dayItems?.notes.length) && (
            <div className="text-center py-6 text-xs text-dm-muted italic">No schedules or festivals today</div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-dm-border">
          {quickAddType === 'none' ? (
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setQuickAddType('reminder')} className="flex flex-col items-center gap-2 p-4 bg-dm-bg rounded-2xl active:scale-95 transition-all group">
                <Bell size={20} className="text-dm-accent group-hover:animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest text-dm-muted">Alarm</span>
              </button>
              <button onClick={() => setQuickAddType('todo')} className="flex flex-col items-center gap-2 p-4 bg-dm-bg rounded-2xl active:scale-95 transition-all group">
                <CheckSquare size={20} className="text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-dm-muted">Task</span>
              </button>
              <button onClick={() => setQuickAddType('note')} className="flex flex-col items-center gap-2 p-4 bg-dm-bg rounded-2xl active:scale-95 transition-all group">
                <FileText size={20} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-dm-muted">Note</span>
              </button>
            </div>
          ) : (
            <div className="bg-dm-accent-muted p-5 rounded-[2rem] border border-dm-accent/10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-dm-accent">Quick Add: {quickAddType}</span>
                <button onClick={() => setQuickAddType('none')} className="p-1 text-dm-muted hover:text-red-500"><X size={16} /></button>
              </div>
              <input 
                autoFocus
                value={quickAddText}
                onChange={e => setQuickAddText(e.target.value)}
                placeholder={`Type your ${quickAddType}...`}
                className="w-full bg-dm-card p-3 rounded-xl text-sm mb-3 outline-none text-dm-text border border-dm-border"
              />
              {quickAddType === 'reminder' && (
                <div className="flex items-center gap-3 bg-dm-card p-3 rounded-xl mb-3 border border-dm-border">
                   <Clock size={16} className="text-dm-muted" />
                   <input type="time" value={quickAddTime} onChange={e => setQuickAddTime(e.target.value)} className="text-xs bg-transparent text-dm-text outline-none flex-1 font-bold" />
                </div>
              )}
              <button onClick={handleQuickAdd} className="w-full py-3 bg-dm-accent text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">SAVE ENTRY</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarModule;
