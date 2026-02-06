
import React, { useState } from 'react';
import { Delete, History } from 'lucide-react';
import { AppSettings } from './types';

interface CalculatorProps {
  settings: AppSettings;
}

const CalculatorModule: React.FC<CalculatorProps> = ({ settings }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0') setDisplay(num);
    else setDisplay(display + num);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const safeCalculate = (eq: string) => {
    try {
      const tokens = eq.trim().split(/\s+/);
      if (tokens.length < 3) return display;
      
      const num1 = parseFloat(tokens[0]);
      const operator = tokens[1];
      const num2 = parseFloat(tokens[2]);

      let result: number;
      switch (operator) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/': result = num1 / num2; break;
        case '%': result = num1 % num2; break;
        default: return 'Error';
      }
      
      const resStr = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, "");
      setHistory(prev => [`${eq} = ${resStr}`, ...prev].slice(0, 10));
      return resStr;
    } catch (e) {
      return 'Error';
    }
  };

  const calculate = () => {
    if (!equation) return;
    const res = safeCalculate(equation + display);
    setEquation('');
    setDisplay(res);
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const del = () => {
    if (display.length === 1) setDisplay('0');
    else setDisplay(display.slice(0, -1));
  };

  const Btn = ({ label, color = 'bg-dm-bg text-dm-text', onClick, wide = false }: any) => (
    <button 
      onClick={onClick}
      className={`${color} ${wide ? 'col-span-2' : ''} h-16 rounded-[2rem] font-bold text-xl active:scale-90 transition-all shadow-sm flex items-center justify-center`}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-[calc(100vh-210px)] max-w-sm mx-auto">
      <div className="flex justify-between items-center px-4 mb-2">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 text-dm-muted hover:text-dm-accent transition-colors"
        >
          <History size={20} />
        </button>
        <div className="text-[10px] font-black text-dm-muted uppercase tracking-widest">DailyMate Calculator</div>
      </div>

      <div className="flex-1 flex flex-col justify-end items-end p-6 mb-4 relative">
        {showHistory && history.length > 0 && (
          <div className="absolute top-0 left-0 right-0 max-h-32 overflow-y-auto bg-dm-card backdrop-blur-md rounded-2xl p-4 z-10 text-[10px] space-y-2 border border-dm-border">
             {history.map((h, i) => <div key={i} className="text-dm-muted font-medium">{h}</div>)}
          </div>
        )}
        <div className="text-dm-muted text-lg mb-1 h-7 font-medium tracking-wider">{equation}</div>
        <div className="text-6xl font-bold text-dm-text break-all text-right transition-all">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 p-2 bg-dm-card rounded-[3rem] shadow-inner border border-dm-border">
        <Btn label="AC" color="bg-red-500/10 text-red-600" onClick={clear} />
        <Btn label={<Delete size={24} />} color="bg-dm-bg text-dm-muted" onClick={del} />
        <Btn label="%" color="bg-dm-bg text-dm-accent" onClick={() => handleOperator('%')} />
        <Btn label="÷" color="bg-dm-accent text-white" onClick={() => handleOperator('/')} />

        <Btn label="7" onClick={() => handleNumber('7')} />
        <Btn label="8" onClick={() => handleNumber('8')} />
        <Btn label="9" onClick={() => handleNumber('9')} />
        <Btn label="×" color="bg-dm-accent-muted text-dm-accent" onClick={() => handleOperator('*')} />

        <Btn label="4" onClick={() => handleNumber('4')} />
        <Btn label="5" onClick={() => handleNumber('5')} />
        <Btn label="6" onClick={() => handleNumber('6')} />
        <Btn label="−" color="bg-dm-accent-muted text-dm-accent" onClick={() => handleOperator('-')} />

        <Btn label="1" onClick={() => handleNumber('1')} />
        <Btn label="2" onClick={() => handleNumber('2')} />
        <Btn label="3" onClick={() => handleNumber('3')} />
        <Btn label="+" color="bg-dm-accent-muted text-dm-accent" onClick={() => handleOperator('+')} />

        <Btn label="0" onClick={() => handleNumber('0')} wide />
        <Btn label="." onClick={() => handleNumber('.')} />
        <Btn label="=" color="bg-dm-accent text-white shadow-xl shadow-dm" onClick={calculate} />
      </div>
    </div>
  );
};

export default CalculatorModule;
