
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Calendar as CalIcon } from 'lucide-react';
import { Todo, AppSettings } from './types';

interface TodoProps {
  settings: AppSettings;
}

const TodoModule: React.FC<TodoProps> = ({ settings }) => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('dm_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [inputDate, setInputDate] = useState('');

  useEffect(() => {
    localStorage.setItem('dm_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
      dueDate: inputDate || undefined
    };

    setTodos([newTodo, ...todos]);
    setInputValue('');
    setInputDate('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-dm-accent rounded-2xl p-6 text-white mb-6 shadow-dm">
        <h2 className="text-2xl font-bold mb-1">{settings.language === 'Hindi' ? 'आज के कार्य' : "Today's Tasks"}</h2>
        <p className="text-blue-100 text-sm">{stats.completed}/{stats.total} {settings.language === 'Hindi' ? 'पूरा हुआ' : 'Completed'}</p>
        
        <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500" 
            style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <form onSubmit={addTodo} className="bg-dm-card p-4 rounded-2xl border border-dm-border shadow-sm mb-6">
        <input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={settings.language === 'Hindi' ? 'नया कार्य जोड़ें...' : 'Add a new task...'}
          className="w-full bg-transparent outline-none mb-3 py-1 font-medium text-dm-text"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-dm-bg px-3 py-1 rounded-lg">
            <CalIcon size={14} className="text-dm-muted" />
            <input 
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="bg-transparent text-xs text-dm-muted outline-none border-none"
            />
          </div>
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-dm-accent text-white rounded-full disabled:opacity-50"
          >
            <Plus size={20} />
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {todos.length > 0 ? todos.map(todo => (
          <div 
            key={todo.id}
            className={`flex items-center gap-3 p-4 bg-dm-card rounded-xl border border-dm-border shadow-sm group transition-all ${todo.completed ? 'opacity-60' : ''}`}
          >
            <button onClick={() => toggleTodo(todo.id)} className="text-dm-accent">
              {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} className="text-dm-muted opacity-30" />}
            </button>
            <div className="flex-1 overflow-hidden">
              <p className={`font-medium text-dm-text truncate ${todo.completed ? 'line-through text-dm-muted' : ''}`}>
                {todo.text}
              </p>
              {todo.dueDate && (
                <span className="text-[10px] text-dm-muted flex items-center gap-1 mt-0.5">
                  <CalIcon size={10} />
                  {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <button 
              onClick={() => deleteTodo(todo.id)}
              className="p-1 text-dm-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )) : (
          <div className="text-center py-10 text-dm-muted italic">
            {settings.language === 'Hindi' ? 'कोई कार्य नहीं' : 'All caught up!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoModule;
