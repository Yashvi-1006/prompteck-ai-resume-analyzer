'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, X, ClipboardPaste, AlertCircle } from 'lucide-react';

interface ResumeUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  mode: 'file' | 'text';
  onModeChange: (mode: 'file' | 'text') => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ResumeUploader({
  onFileSelect,
  selectedFile,
  pastedText,
  onPastedTextChange,
  mode,
  onModeChange,
}: ResumeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateAndSelectFile = (file: File) => {
    setFileError(null);
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Invalid file format. Please upload a text-based PDF (.pdf) file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File exceeds 5MB limit. Please upload a smaller PDF or paste resume text.');
      return;
    }
    onFileSelect(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const wordCount = pastedText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Mode Toggle Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.4rem',
          background: 'rgba(0,0,0,0.25)',
          padding: '0.25rem',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setFileError(null);
            onModeChange('file');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: mode === 'file' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
            color: mode === 'file' ? '#ffffff' : '#9ca3af',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Upload size={14} /> Upload PDF
        </button>

        <button
          type="button"
          onClick={() => {
            setFileError(null);
            onModeChange('text');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: mode === 'text' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
            color: mode === 'text' ? '#ffffff' : '#9ca3af',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ClipboardPaste size={14} /> Paste Resume Text
        </button>
      </div>

      {fileError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.8rem',
          }}
        >
          <AlertCircle size={15} />
          <span>{fileError}</span>
        </div>
      )}

      {mode === 'file' ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              style={{
                height: '240px',
                border: isDragging
                  ? '2px dashed #818cf8'
                  : '2px dashed rgba(255,255,255,0.18)',
                borderRadius: '12px',
                background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <Upload size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#e5e7eb', fontSize: '0.95rem' }}>
                  Drag & drop your resume PDF here
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  or click to browse files (Text-based PDF, max 5MB)
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: '240px',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                textAlign: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}
              >
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                  {selectedFile.name}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {formatFileSize(selectedFile.size)} • Ready for extraction
                </div>
              </div>
              <button
                type="button"
                onClick={() => onFileSelect(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <X size={14} /> Remove File
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af' }}>
            <span>{selectedFile ? 'PDF selected' : 'No file selected'}</span>
            <span>Max 5MB • Text-selectable PDF</span>
          </div>
        </>
      ) : (
        <>
          <textarea
            placeholder="Paste your full resume text here (Education, Technical Skills, Experience, Projects)..."
            value={pastedText}
            onChange={(e) => onPastedTextChange(e.target.value)}
            style={{
              width: '100%',
              height: '240px',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '1rem',
              color: 'white',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
            <span>
              {wordCount} words • {pastedText.length} characters
            </span>
            {pastedText.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => onPastedTextChange('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            ) : (
              <span>Minimum 30 characters</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
