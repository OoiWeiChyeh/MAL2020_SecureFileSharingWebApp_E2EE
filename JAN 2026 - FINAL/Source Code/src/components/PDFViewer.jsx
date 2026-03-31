import { useState, useEffect } from 'react';
import { X, Download, Loader2, AlertCircle } from 'lucide-react';
import { downloadEncryptedFile } from '../services/storageService';
import { decryptFile } from '../services/encryptionService';
import { downloadBlob } from '../utils/helpers';

export default function PDFViewer({ file, encryptionKey, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (file && encryptionKey) {
      loadPDF();
    }
    return () => {
      // Cleanup: revoke object URL when component unmounts
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [file?.id, encryptionKey]); // Use file.id to avoid re-rendering on file object changes

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError('');

      // Cleanup previous URL if exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }

      if (!file || !file.downloadURL) {
        throw new Error('Download URL not found');
      }

      if (!encryptionKey) {
        throw new Error('Encryption key not found');
      }

      console.log('Loading PDF:', {
        fileName: file.fileName,
        hasDownloadURL: !!file.downloadURL,
        hasEncryptionKey: !!encryptionKey,
        keyLength: encryptionKey?.length
      });

      // Download encrypted file
      const encryptedData = await downloadEncryptedFile(file.downloadURL);

      if (encryptedData.length === 0) {
        throw new Error('Downloaded file is empty');
      }

      console.log('Downloaded encrypted data size:', encryptedData.length, 'bytes');

      // Decrypt file
      const decryptedBlob = await decryptFile(encryptedData, encryptionKey);

      if (!decryptedBlob || decryptedBlob.size === 0) {
        throw new Error('Decryption failed - resulting file is empty');
      }

      console.log('Decrypted file size:', decryptedBlob.size, 'bytes');

      // Convert blob to array buffer to recreate with correct MIME type
      const arrayBuffer = await decryptedBlob.arrayBuffer();
      
      // Create blob with correct MIME type for PDF
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      // Create object URL for PDF
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      console.log('PDF URL created, blob type:', pdfBlob.type, 'size:', pdfBlob.size);
      
      console.log('PDF URL created successfully');
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'Failed to load PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      setDownloading(true);
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      downloadBlob(blob, file.fileName);
    } catch (err) {
      console.error('Error downloading:', err);
      alert('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{file?.fileName}</h3>
            <p className="text-sm text-gray-500">PDF Viewer</p>
          </div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">Failed to Load PDF</p>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {pdfUrl && !loading && !error && (
            <div className="flex justify-center">
              <iframe
                src={pdfUrl}
                className="w-full h-full min-h-[600px] border border-gray-300 rounded-lg"
                title={file?.fileName}
                style={{ maxHeight: 'calc(90vh - 120px)' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
