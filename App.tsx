
import React, { useState, useCallback } from 'react';
import { Mode } from './types';
import { encrypt, decrypt } from './services/crypto';
import FileUploader from './components/FileUploader';
import { LockIcon, UnlockIcon, DownloadIcon, CheckCircleIcon, AlertTriangleIcon, LoaderIcon } from './components/Icons';

// Helper function to create and trigger file download
const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper function to convert base64 to blob
const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
};


export default function App() {
  const [mode, setMode] = useState<Mode>(Mode.Encrypt);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setStatus(null);
  };

  const resetState = () => {
    setFile(null);
    setPassword('');
    setIsLoading(false);
    setStatus(null);
  };
  
  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    resetState();
  };

  const handleProcessFile = useCallback(async () => {
    if (!file || !password) {
      setStatus({ message: 'Please select a file and enter a password.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatus({ message: mode === Mode.Encrypt ? 'Encrypting file...' : 'Decrypting file...', type: 'info' });

    try {
      if (mode === Mode.Encrypt) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64Data = (e.target?.result as string).split(',')[1];
            const dataToEncrypt = {
              name: file.name,
              type: file.type,
              data: base64Data,
            };
            const encryptedData = await encrypt(JSON.stringify(dataToEncrypt), password);
            const blob = new Blob([encryptedData], { type: 'text/plain' });
            downloadFile(blob, `${file.name}.vault`);
            setStatus({ message: 'File encrypted and download started!', type: 'success' });
          } catch (err) {
            setStatus({ message: `Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
          } finally {
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setStatus({ message: 'Failed to read file.', type: 'error' });
          setIsLoading(false);
        };
        reader.readAsDataURL(file);

      } else { // Decrypt mode
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const encryptedText = e.target?.result as string;
            const decryptedJson = await decrypt(encryptedText, password);
            if (!decryptedJson) {
                throw new Error("Decryption failed. Check password or file integrity.");
            }
            const decryptedData = JSON.parse(decryptedJson);
            const { name, type, data } = decryptedData;
            const blob = base64ToBlob(data, type);
            downloadFile(blob, name);
            setStatus({ message: 'File decrypted and download started!', type: 'success' });
          } catch (err) {
            setStatus({ message: `Decryption failed. Please check your password and file.`, type: 'error' });
          } finally {
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setStatus({ message: 'Failed to read encrypted file.', type: 'error' });
          setIsLoading(false);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      setStatus({ message: `An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      setIsLoading(false);
    }
  }, [file, password, mode]);
  
  const isEncryptMode = mode === Mode.Encrypt;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">DataVault</h1>
            <p className="text-slate-400 mt-2">Client-Side AES File Encryption</p>
        </header>

        <main className="bg-slate-800 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 md:p-8 border border-slate-700">
          <div className="flex bg-slate-900 rounded-lg p-1 mb-6 border border-slate-700">
            <button
              onClick={() => switchMode(Mode.Encrypt)}
              className={`w-1/2 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 ${isEncryptMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              <LockIcon className="w-4 h-4" />
              Encrypt
            </button>
            <button
              onClick={() => switchMode(Mode.Decrypt)}
              className={`w-1/2 py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 ${!isEncryptMode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              <UnlockIcon className="w-4 h-4" />
              Decrypt
            </button>
          </div>

          <div className="space-y-6">
            <FileUploader onFileChange={handleFileChange} file={file} mode={mode} />

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                )}
              </button>
            </div>
            
            <button
              onClick={handleProcessFile}
              disabled={!file || !password || isLoading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 text-base font-semibold rounded-lg transition-all duration-300 ease-in-out
                ${isEncryptMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-cyan-600 hover:bg-cyan-700'}
                text-white disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none`}
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isEncryptMode ? <LockIcon className="w-5 h-5"/> : <UnlockIcon className="w-5 h-5"/>}
                  {isEncryptMode ? 'Encrypt & Download' : 'Decrypt & Download'}
                </>
              )}
            </button>
            
            {status && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 text-sm
                ${status.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : ''}
                ${status.type === 'error' ? 'bg-red-900/50 text-red-300 border border-red-700' : ''}
                ${status.type === 'info' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : ''}
              `}>
                {status.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                {status.type === 'error' && <AlertTriangleIcon className="w-5 h-5" />}
                {status.type === 'info' && <LoaderIcon className="w-5 h-5 animate-spin"/>}
                <span className="font-medium">{status.message}</span>
              </div>
            )}
          </div>
        </main>
        <footer className="text-center mt-8 text-xs text-slate-500">
          <p>All encryption and decryption operations are performed locally in your browser.</p>
          <p>Your files are never uploaded to any server.</p>
        </footer>
      </div>
    </div>
  );
}
