
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, Loader2, Trash2, Globe } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppSettings } from './types';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface AIProps {
  settings: AppSettings;
}

const MateAI: React.FC<AIProps> = ({ settings }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('dm_ai_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groundingUrls, setGroundingUrls] = useState<{title: string, uri: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('dm_ai_chat', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = { role: 'user', parts: [{ text: userText }] };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setGroundingUrls([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const lowercaseInput = userText.toLowerCase();
      let contextString = "";
      
      if (lowercaseInput.includes('note') || lowercaseInput.includes('summarize') || lowercaseInput.includes('todo') || lowercaseInput.includes('task')) {
        const notes = localStorage.getItem('dm_notes') || '[]';
        const todos = localStorage.getItem('dm_todos') || '[]';
        contextString = `User Data Context: Notes: ${notes}, Todos: ${todos}. Only use this if the user asks about their specific items.`;
      }
      
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [...messages, userMessage] as any,
        config: {
          systemInstruction: `You are 'Mate', the official AI assistant of the DailyMate app. 
          Your tone is friendly, organized, and helpful. 
          Current date: ${new Date().toLocaleDateString()}.
          Privacy Rule: You work locally. Do not claim to send data to servers unnecessarily.
          Context Handling: ${contextString || "No background data accessed."}
          If you use Google Search, always keep your answer concise.
          Respond in ${settings.language}.`,
          tools: [{ googleSearch: {} }],
        },
      });

      let fullText = "";
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "" }] }]);

      for await (const chunk of stream) {
        fullText += chunk.text;
        
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
            const urls = chunks
                .map((c: any) => c.web)
                .filter((w: any) => w && w.uri)
                .map((w: any) => ({ title: w.title, uri: w.uri }));
            if (urls.length > 0) setGroundingUrls(prev => [...prev, ...urls]);
        }

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].parts[0].text = fullText;
          return newMessages;
        });
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: "Oops! I'm having trouble connecting right now. Please check your internet connection." }] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm(settings.language === 'Hindi' ? "चैट हिस्ट्री साफ़ करें?" : "Clear chat history?")) {
      setMessages([]);
      localStorage.removeItem('dm_ai_chat');
      setGroundingUrls([]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 px-2">
        <div>
          <h2 className="text-xl font-black text-dm-text flex items-center gap-2">
            <Sparkles className="text-dm-accent" size={20} />
            {settings.language === 'Hindi' ? 'मेट एआई' : 'Mate AI'}
          </h2>
          <p className="text-[10px] text-dm-muted font-bold uppercase tracking-widest mt-0.5">Your Smart Companion</p>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-dm-muted hover:text-red-500 active:scale-90 transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="w-16 h-16 bg-dm-accent-muted rounded-3xl flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-dm-accent" />
            </div>
            <p className="text-sm font-medium text-dm-text">
              {settings.language === 'Hindi' ? 'नमस्ते! मैं मेट हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?' : "Hi! I'm Mate. How can I help you organize your day?"}
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-dm-accent text-white rounded-br-none' 
                : 'bg-dm-card text-dm-text rounded-bl-none border border-dm-border'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-60 text-[10px] font-bold uppercase">
                {msg.role === 'user' ? <User size={10}/> : <Bot size={10}/>}
                {msg.role === 'user' ? (settings.language === 'Hindi' ? 'आप' : 'You') : 'Mate'}
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.parts[0].text}</p>
              
              {msg.role === 'model' && groundingUrls.length > 0 && idx === messages.length - 1 && (
                <div className="mt-3 pt-3 border-t border-dm-border space-y-2">
                   <p className="text-[9px] font-black text-dm-muted uppercase tracking-widest flex items-center gap-1">
                     <Globe size={10} /> Sources
                   </p>
                   {Array.from(new Set(groundingUrls.map(u => u.uri))).slice(0, 3).map((uri) => {
                     const urlObj = groundingUrls.find(u => u.uri === uri);
                     return (
                       <a key={uri} href={uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-dm-accent hover:underline truncate">
                         {urlObj?.title || uri}
                       </a>
                     );
                   })}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-dm-card p-4 rounded-[1.5rem] rounded-bl-none border border-dm-border shadow-sm">
              <Loader2 size={20} className="animate-spin text-dm-accent" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-dm-card p-2 rounded-[2rem] border border-dm-border shadow-lg flex items-center gap-2 ring-4 ring-dm-accent-muted">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={settings.language === 'Hindi' ? 'मेट से पूछें...' : 'Ask Mate anything...'}
          className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-dm-text"
        />
        <button 
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 bg-dm-accent text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MateAI;
