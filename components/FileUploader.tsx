
import React, { useState, useCallback, DragEvent } from 'react';
import { Mode } from '../types';
import { UploadCloudIcon, FileIcon, XIcon } from './Icons';

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  file: File | null;
  mode: Mode;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange, file, mode }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onFileChange(null);
  }

  const acceptedFileType = mode === Mode.Decrypt ? ".vault" : "*";

  if (file) {
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 text-slate-400">
                    <FileIcon className="w-8 h-8"/>
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
            </div>
            <button onClick={removeFile} className="flex-shrink-0 text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700">
                <XIcon className="w-5 h-5"/>
            </button>
        </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300
        ${isDragging ? 'border-blue-500 bg-slate-900/50' : 'border-slate-700 hover:border-slate-500 bg-slate-900'}
      `}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileSelect}
        accept={acceptedFileType}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
        <UploadCloudIcon className="w-12 h-12 text-slate-500 mb-3"/>
        <p className="text-slate-300 font-semibold">
          {mode === Mode.Encrypt ? 'Drop a file here or ' : 'Drop .vault file here or '}
          <span className="text-blue-400">browse</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {mode === Mode.Encrypt ? 'Select any file to encrypt' : 'Select a .vault file to decrypt'}
        </p>
      </label>
    </div>
  );
};

export default FileUploader;
