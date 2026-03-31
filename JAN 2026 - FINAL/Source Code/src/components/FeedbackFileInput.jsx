import { useState, useRef } from 'react';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
    Paperclip,
    X,
    File,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { formatFileSize } from '../utils/helpers';

// Max 10MB for feedback attachments
const MAX_FEEDBACK_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'text/plain'
];

/**
 * Feedback File Input Component
 * Allows reviewers (HOS/Exam Unit) to attach files to their feedback
 */
export default function FeedbackFileInput({ onFileChange, disabled = false }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState('');
    const [uploadedData, setUploadedData] = useState(null);
    const inputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        setError('');

        if (!selectedFile) return;

        // Validate file type
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Unsupported file type. Please upload PDF, DOC, DOCX, PNG, JPG, or TXT files.');
            return;
        }

        // Validate file size
        if (selectedFile.size > MAX_FEEDBACK_FILE_SIZE) {
            setError(`File size must be less than ${formatFileSize(MAX_FEEDBACK_FILE_SIZE)}`);
            return;
        }

        setFile(selectedFile);
        setUploading(true);

        try {
            // Upload to Firebase Storage
            const timestamp = Date.now();
            const safeName = selectedFile.name.replace(/[^a-z0-9._-]/gi, '_');
            const filePath = `feedback-attachments/${timestamp}_${safeName}`;
            const fileRef = ref(storage, filePath);

            await uploadBytes(fileRef, selectedFile);
            const downloadURL = await getDownloadURL(fileRef);

            const fileData = {
                attachmentFileName: selectedFile.name,
                attachmentURL: downloadURL,
                attachmentSize: selectedFile.size
            };

            setUploadedData(fileData);
            setUploaded(true);
            onFileChange(fileData);
        } catch (err) {
            console.error('Error uploading feedback file:', err);
            setError('Failed to upload file. Please try again.');
            setFile(null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setUploaded(false);
        setUploadedData(null);
        setError('');
        onFileChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attach File (Optional)
                </div>
            </label>

            {!file && !uploaded && (
                <div>
                    <label htmlFor="feedback-file" className="cursor-pointer">
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${disabled
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-blue-400'
                            }`}>
                            <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700">
                                Click to attach a file
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PDF, DOC, DOCX, PNG, JPG, TXT (max {formatFileSize(MAX_FEEDBACK_FILE_SIZE)})
                            </p>
                            <input
                                ref={inputRef}
                                id="feedback-file"
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                                disabled={disabled}
                            />
                        </div>
                    </label>
                </div>
            )}

            {uploading && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">{file?.name}</p>
                        <p className="text-xs text-blue-700">Uploading...</p>
                    </div>
                </div>
            )}

            {uploaded && uploadedData && !uploading && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <File className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-900">{uploadedData.attachmentFileName}</p>
                            <p className="text-xs text-green-700">{formatFileSize(uploadedData.attachmentSize)}</p>
                        </div>
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-green-700" />
                        </button>
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
        </div>
    );
}
