import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';

interface Props {
  onAnalyze: (file: File, jobDesc: string, jobTitle: string) => void;
  loading: boolean;
}

interface UploadError {
  code: string;
  message: string;
  fileName?: string;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

function getFriendlyErrorMessage(code: string, fileName: string): string {
  switch (code) {
    case 'file-too-large':
      return `"${fileName}" exceeds the ${MAX_SIZE_MB} MB size limit. Please choose a smaller file.`;
    case 'file-invalid-type':
      return `"${fileName}" is not a supported format. Please upload a PDF file.`;
    case 'too-many-files':
      return 'You can only upload one file at a time.';
    default:
      return `"${fileName}" could not be uploaded. Please try a different file.`;
  }
}

export default function UploadZone({ onAnalyze, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [showJob, setShowJob] = useState(false);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setUploadError(null);
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: MAX_SIZE,
  });

  // Translate the first dropzone rejection into a user-friendly error message.
  useEffect(() => {
    if (fileRejections.length > 0) {
      const { file: rejectedFile, errors } = fileRejections[0];
      const primaryError = errors[0];
      setUploadError({
        code: primaryError.code,
        message: getFriendlyErrorMessage(primaryError.code, rejectedFile.name),
        fileName: rejectedFile.name,
      });
    }
  }, [fileRejections]);

  // Auto-dismiss the error banner after a short delay so it doesn't linger.
  useEffect(() => {
    if (!uploadError) return;
    const timer = setTimeout(() => setUploadError(null), 8000);
    return () => clearTimeout(timer);
  }, [uploadError]);

  const handleDismissError = () => setUploadError(null);

  const handleSubmit = () => {
    if (file) onAnalyze(file, jobDesc, jobTitle);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative group cursor-pointer rounded-2xl border-2 border-dashed p-12
          transition-all duration-300 ease-out
          ${isDragReject
            ? 'border-red-400 bg-red-50'
            : isDragActive
              ? 'border-brand-500 bg-brand-50 scale-[1.02]'
              : file
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50/30'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-center">
          {file ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(0)} KB · Click or drop to replace
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop a PDF or click to browse · Max {MAX_SIZE_MB} MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* Error banner */}
        {uploadError && (
          <div
            role="alert"
            aria-live="assertive"
            onClick={(e) => e.stopPropagation()}
            className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <span className="flex-1">{uploadError.message}</span>
            <button
              type="button"
              onClick={handleDismissError}
              className="text-red-400 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Optional job description */}
      {file && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => setShowJob(!showJob)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {showJob ? 'Hide' : 'Add'} job description for targeted analysis
          </button>

          {showJob && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Job title (e.g., Senior Software Engineer)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
              />
              <textarea
                placeholder="Paste the job description here for skill gap analysis..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition resize-none"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold
              hover:from-brand-700 hover:to-brand-800 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze Resume
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
