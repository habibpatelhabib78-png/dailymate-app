import React, { useState, useRef } from 'react';
import { Plus, Search, Trash2, ChevronLeft, Save, X, AlertCircle } from 'lucide-react';
import { Note, AppSettings } from './types';

interface NotesProps {
  settings: AppSettings;
}

const STORAGE_KEY = 'dm_notes';
const LONG_PRESS_THRESHOLD = 500; // ms

const NotesModule: React.FC<NotesProps> = ({ settings }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load notes from storage", e);
      return [];
    }
  });

  const [search, setSearch] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null);
  const [deleteModeId, setDeleteModeId] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);

  const saveAndSync = (updatedNotes: Note[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('storage'));
  };

  const addNote = () => {
    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      content: '',
      updatedAt: Date.now()
    };
    
    const nextNotes = [newNote, ...notes];
    saveAndSync(nextNotes);
    setNotes(nextNotes);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (id: string) => {
    const nextNotes = notes.filter(n => n.id !== id);
    saveAndSync(nextNotes);
    setNotes(nextNotes);
    
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
    
    setDeleteModeId(null);
    
    window.dispatchEvent(new CustomEvent('dm-toast', { 
      detail: { 
        msg: settings.language === 'Hindi' ? 'नोट हटा दिया गया' : 'Note deleted', 
        type: 'success' 
      } 
    }));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const nextNotes = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n);
    saveAndSync(nextNotes);
    setNotes(nextNotes);
  };

  const handlePressStart = (id: string) => {
    // If we're already in delete mode for any note, don't start a new press timer
    if (deleteModeId) return;

    isLongPressTriggered.current = false;
    setPressingId(id);
    
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      if ('vibrate' in navigator) navigator.vibrate(50);
      setDeleteModeId(id);
      setPressingId(null);
    }, LONG_PRESS_THRESHOLD);
  };

  const handlePressEnd = (id: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // MANDATORY GUARD: Only open if NOT a long press AND not already in delete mode
    if (!isLongPressTriggered.current && pressingId === id) {
      if (!deleteModeId) {
        setActiveNoteId(id);
      }
    }
    
    setPressingId(null);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const activeNote = notes.find(n => n.id === activeNoteId);

  if (activeNoteId && activeNote) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setActiveNoteId(null)} className="p-2 -ml-2 text-dm-muted flex items-center gap-1">
            <ChevronLeft size={20} />
            <span>{settings.language === 'Hindi' ? 'पीछे' : 'Back'}</span>
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveNoteId(null)}
              className="px-3 py-1 bg-dm-accent text-white rounded-lg text-sm flex items-center gap-1 shadow-md"
            >
              <Save size={16} />
              {settings.language === 'Hindi' ? 'सहेजें' : 'Save'}
            </button>
          </div>
        </div>
        <input 
          autoFocus
          value={activeNote.title}
          onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
          placeholder={settings.language === 'Hindi' ? 'शीर्षक' : 'Title'}
          className="text-2xl font-bold bg-transparent border-none outline-none mb-4 w-full text-dm-text"
        />
        <textarea 
          value={activeNote.content}
          onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
          placeholder={settings.language === 'Hindi' ? 'लिखना शुरू करें...' : 'Start writing...'}
          className="flex-1 bg-transparent border-none outline-none resize-none w-full min-h-[400px] leading-relaxed text-dm-text"
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dm-muted" size={18} />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={settings.language === 'Hindi' ? 'नोट्स खोजें...' : 'Search notes...'}
          className="w-full pl-10 pr-4 py-3 bg-dm-card rounded-2xl shadow-dm border border-dm-border outline-none focus:ring-2 focus:ring-dm-accent text-dm-text"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredNotes.length > 0 ? filteredNotes.map(note => (
          <div 
            key={note.id}
            className="bg-dm-card rounded-2xl border border-dm-border shadow-sm group transition-all overflow-hidden select-none relative h-32"
          >
            {/* MANDATORY: Structural separation - Inner content area handles edit/long-press only */}
            <div 
              onMouseDown={() => handlePressStart(note.id)}
              onMouseUp={() => handlePressEnd(note.id)}
              onMouseLeave={() => {
                if (timerRef.current) {
                  clearTimeout(timerRef.current);
                  timerRef.current = null;
                }
                setPressingId(null);
              }}
              onTouchStart={() => handlePressStart(note.id)}
              onTouchEnd={() => handlePressEnd(note.id)}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-full h-full p-4 cursor-pointer transition-all ${
                pressingId === note.id ? 'scale-[0.98] bg-dm-bg brightness-95' : 'hover:bg-dm-bg/30'
              }`}
            >
              <h3 className="font-semibold text-lg line-clamp-1 text-dm-text mb-1">
                {note.title || (settings.language === 'Hindi' ? 'बिना शीर्षक' : 'Untitled')}
              </h3>
              <p className="text-dm-muted text-sm line-clamp-2">
                {note.content || (settings.language === 'Hindi' ? 'कोई सामग्री नहीं' : 'No content')}
              </p>
              <div className="absolute bottom-4 left-4 text-[10px] text-dm-muted font-medium">
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
              
              {/* Press feedback */}
              {pressingId === note.id && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1 text-dm-accent animate-pulse">
                   <div className="w-1.5 h-1.5 rounded-full bg-dm-accent"></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest">
                     {settings.language === 'Hindi' ? 'दबाए रखें...' : 'Holding...'}
                   </span>
                </div>
              )}
            </div>

            {/* MANDATORY: Separate Delete Overlay - High z-index, captures all clicks */}
            {deleteModeId === note.id && (
              <div className="absolute inset-0 z-20 bg-dm-card/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                <AlertCircle className="text-red-500 mb-2" size={24} />
                <p className="text-xs font-bold text-dm-text uppercase tracking-[0.1em] mb-4">
                  {settings.language === 'Hindi' ? 'क्या आप इस नोट को हटाना चाहते हैं?' : 'Delete this note?'}
                </p>
                <div className="flex gap-3 w-full max-w-[200px]">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModeId(null);
                    }}
                    className="flex-1 py-2 bg-dm-bg text-dm-text rounded-xl text-[10px] font-black uppercase tracking-widest border border-dm-border active:scale-95 transition-all"
                  >
                    {settings.language === 'Hindi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="flex-1 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all"
                  >
                    {settings.language === 'Hindi' ? 'हटाएं' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Desktop-only traditional delete icon (hover) - Hidden when delete mode is active */}
            {!deleteModeId && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModeId(note.id);
                }}
                className="absolute top-4 right-4 p-2 text-dm-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )) : (
          <div className="text-center py-20 text-dm-muted">
            <p>{settings.language === 'Hindi' ? 'कोई नोट नहीं मिला' : 'No notes found'}</p>
          </div>
        )}
      </div>

      <button 
        onClick={addNote}
        className="fixed bottom-24 right-6 w-14 h-14 bg-dm-accent text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 active:scale-95 transition-all z-40"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default NotesModule;