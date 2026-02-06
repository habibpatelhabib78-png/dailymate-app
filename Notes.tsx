import React, { useState } from 'react';
import { Plus, Search, Trash2, ChevronLeft, Save } from 'lucide-react';
import { Note, AppSettings } from './types';

interface NotesProps {
  settings: AppSettings;
}

const STORAGE_KEY = 'dm_notes';

const NotesModule: React.FC<NotesProps> = ({ settings }) => {
  // 1. SINGLE SOURCE OF TRUTH: Initialize state directly from localStorage once.
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

  // Helper function to persist data and notify other components (like Calendar)
  const saveAndSync = (updatedNotes: Note[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('storage')); // Notify other modules in same window
  };

  const addNote = () => {
    const newNote: Note = {
      // 3. UNIQUE IDENTIFIER: Stable unique string ID
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
    // 7. CONFIRMATION: Mandatory dialog
    const confirmMsg = settings.language === 'Hindi' 
      ? 'क्या आप इस नोट को हटाना चाहते हैं?' 
      : 'Are you sure you want to delete this note?';

    if (window.confirm(confirmMsg)) {
      // 4. DELETE IMPLEMENTATION: Atomic filter and save
      const nextNotes = notes.filter(n => n.id !== id);
      
      // Update storage FIRST to ensure persistence
      saveAndSync(nextNotes);
      
      // Update UI state SECOND
      setNotes(nextNotes);
      
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
      
      window.dispatchEvent(new CustomEvent('dm-toast', { 
        detail: { 
          msg: settings.language === 'Hindi' ? 'नोट हटा दिया गया' : 'Note deleted', 
          type: 'success' 
        } 
      }));
    }
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const nextNotes = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n);
    // Auto-save on every update
    saveAndSync(nextNotes);
    setNotes(nextNotes);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const activeNote = notes.find(n => n.id === activeNoteId);

  // VIEW: Single Note Editor
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

  // VIEW: Notes List
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
            className="bg-dm-card rounded-2xl border border-dm-border shadow-sm group active:scale-[0.99] transition-all overflow-hidden"
          >
            {/* Clickable Area for Opening Note */}
            <div 
              onClick={() => setActiveNoteId(note.id)}
              className="p-4 cursor-pointer hover:bg-dm-bg/50 transition-colors"
            >
              <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-dm-text">
                {note.title || (settings.language === 'Hindi' ? 'बिना शीर्षक' : 'Untitled')}
              </h3>
              <p className="text-dm-muted text-sm line-clamp-2 mb-2">
                {note.content || (settings.language === 'Hindi' ? 'कोई सामग्री नहीं' : 'No content')}
              </p>
              
              <div className="flex justify-between items-center text-[10px] text-dm-muted mt-2">
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Separate Delete Button Area */}
            <button 
              onClick={() => deleteNote(note.id)}
              className="absolute top-4 right-4 p-2 text-dm-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete Note"
            >
              <Trash2 size={16} />
            </button>
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