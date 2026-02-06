
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Plus, Shield, Trash2, Camera, Eye, Images, AlertTriangle, ShieldCheck, Database, X, Camera as CameraIcon } from 'lucide-react';
import { Document as AppDoc, AppSettings } from './types';

interface LockerProps {
  settings: AppSettings;
}

const DB_NAME = 'DailyMateLocker';
const STORE_NAME = 'documents';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const LockerModule: React.FC<LockerProps> = ({ settings }) => {
  const [docs, setDocs] = useState<AppDoc[]>([]);
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadDocs = async () => {
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        setDocs(request.result);
        setIsLoading(false);
      };
    } catch (err) {
      console.error("IDB Load Error", err);
      setIsLoading(false);
    }
  };

  const saveToDB = async (doc: AppDoc) => {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(doc);
    await new Promise(r => tx.oncomplete = r);
  };

  const deleteFromDB = async (id: string) => {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise(r => tx.oncomplete = r);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newDoc: AppDoc = {
          id: Date.now().toString(),
          type: 'Other',
          name: file.name,
          imageData: reader.result as string,
          createdAt: Date.now()
        };
        await saveToDB(newDoc);
        setDocs(prev => [newDoc, ...prev]);
        setShowAdd(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowAdd(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Could not access camera");
      setShowCamera(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      const newDoc: AppDoc = {
        id: Date.now().toString(),
        type: 'ID',
        name: `Captured_${new Date().toLocaleTimeString()}.jpg`,
        imageData,
        createdAt: Date.now()
      };
      
      await saveToDB(newDoc);
      setDocs(prev => [newDoc, ...prev]);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const deleteDoc = async (id: string) => {
    if (confirm(settings.language === 'Hindi' ? 'हटाएं?' : 'Delete?')) {
      await deleteFromDB(id);
      setDocs(docs.filter(d => d.id !== id));
    }
  };

  const unlock = () => {
    if (pin === settings.pinLock) setLocked(false);
    else { alert('Wrong PIN'); setPin(''); }
  };

  if (locked && settings.pinLock) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-dm-accent-muted text-dm-accent rounded-[2rem] flex items-center justify-center mb-6 shadow-xl">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-dm-text">{settings.language === 'Hindi' ? 'सुरक्षित लॉकर' : 'Secure Vault'}</h2>
        <input 
          type="password" maxLength={4} value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-48 text-center text-4xl tracking-[1.5rem] bg-dm-bg p-5 rounded-3xl outline-none text-dm-text shadow-inner mb-6"
          placeholder="****" autoFocus
        />
        <button onClick={unlock} className="w-full max-w-xs py-4 bg-dm-accent text-white rounded-2xl font-bold shadow-lg">Verify PIN</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black text-dm-text uppercase tracking-tight">{settings.language === 'Hindi' ? 'निजी लॉकर' : 'Private Locker'}</h2>
          <div className="flex items-center gap-1 text-[9px] text-green-500 font-black uppercase tracking-widest mt-1">
            <ShieldCheck size={12} /> Local Storage Only
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-dm-accent text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={20} /></button>
      </div>

      {showAdd && (
        <div className="bg-dm-card p-6 rounded-[2.5rem] border-2 border-dashed border-dm-border mb-8 flex flex-col items-center animate-in zoom-in-95">
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <button onClick={startCamera} className="flex flex-col items-center gap-2 p-6 bg-dm-accent-muted rounded-3xl group active:scale-95 transition-all">
              <Camera size={32} className="text-dm-accent group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-dm-accent">Camera</span>
            </button>
            <label htmlFor="file-upload" className="flex flex-col items-center gap-2 p-6 bg-indigo-500/10 rounded-3xl group cursor-pointer active:scale-95 transition-all">
              <Images size={32} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Gallery</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
            </label>
          </div>
          <p className="text-[10px] text-dm-muted font-bold uppercase tracking-[0.2em] text-center">Add Document or Photo</p>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-[70vh] rounded-3xl bg-gray-900" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-6 mt-8">
            <button onClick={stopCamera} className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-md"><X size={32} /></button>
            <button onClick={capturePhoto} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl ring-8 ring-white/20"><CameraIcon size={40} /></button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {docs.map(doc => (
          <div key={doc.id} className="bg-dm-card rounded-3xl overflow-hidden shadow-sm border border-dm-border relative group active:scale-95 transition-all">
            <div className="h-40 bg-dm-bg flex items-center justify-center overflow-hidden relative">
               <img src={doc.imageData} className="w-full h-full object-cover blur-lg opacity-30" />
               <button onClick={() => setPreview(doc.imageData)} className="absolute inset-0 flex items-center justify-center">
                  <Eye size={24} className="text-dm-accent" />
               </button>
            </div>
            <div className="p-3">
              <p className="text-[10px] font-black truncate text-dm-text uppercase tracking-tighter mb-2">{doc.name}</p>
              <div className="flex justify-between items-center">
                <span className="text-[8px] text-dm-muted font-bold uppercase">{new Date(doc.createdAt).toLocaleDateString()}</span>
                <button onClick={() => deleteDoc(doc.id)} className="p-1.5 text-red-500 bg-red-500/10 rounded-lg"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <img src={preview} className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
          <button onClick={() => setPreview(null)} className="mt-10 px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs">Close</button>
        </div>
      )}
    </div>
  );
};

export default LockerModule;
