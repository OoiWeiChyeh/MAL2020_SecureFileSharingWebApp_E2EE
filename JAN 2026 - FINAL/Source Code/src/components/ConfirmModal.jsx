import { X, AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation modal component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} [props.confirmText='Confirm'] - Confirm button text
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {string} [props.variant='danger'] - 'danger' or 'warning' for styling
 * @param {function} props.onConfirm - Callback when confirmed
 * @param {function} props.onCancel - Callback when cancelled
 * @param {boolean} [props.loading=false] - Whether action is in progress
 */
export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
    loading = false
}) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            button: 'bg-red-600 hover:bg-red-700 text-white',
            icon: 'text-red-600 bg-red-100'
        },
        warning: {
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
            icon: 'text-yellow-600 bg-yellow-100'
        }
    };

    const styles = variantStyles[variant] || variantStyles.danger;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl max-w-md w-full shadow-xl animate-scale-in">
                {/* Header */}
                <div className="p-6 flex items-start gap-4">
                    <div className={`p-3 rounded-full ${styles.icon}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{message}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${styles.button}`}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
