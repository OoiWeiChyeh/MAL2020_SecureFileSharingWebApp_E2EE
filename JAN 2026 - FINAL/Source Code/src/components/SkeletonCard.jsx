/**
 * Skeleton loading card for dashboard
 * Displays animated placeholder while data is loading
 */
export default function SkeletonCard({ variant = 'default' }) {
    if (variant === 'stat') {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'file') {
        return (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-pulse">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="flex gap-2">
                            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default variant
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
        </div>
    );
}
