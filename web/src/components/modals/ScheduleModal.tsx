import React, { useState } from 'react';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (date: Date, time: string) => void;
    postContent: string;
}

/**
 * Modal for scheduling posts to be published at a specific date and time
 */
const ScheduleModal: React.FC<ScheduleModalProps> = ({
    isOpen,
    onClose,
    onSchedule,
    postContent,
}) => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [selectedTime, setSelectedTime] = useState<string>('09:00');
    const [isScheduling, setIsScheduling] = useState(false);

    if (!isOpen) return null;

    const handleSchedule = async () => {
        setIsScheduling(true);
        try {
            const scheduledDate = new Date(`${selectedDate}T${selectedTime}`);
            await onSchedule(scheduledDate, selectedTime);
            onClose();
        } catch (error) {
            console.error('Failed to schedule post:', error);
        } finally {
            setIsScheduling(false);
        }
    };

    // Suggested times for best LinkedIn engagement
    const suggestedTimes = [
        { time: '08:00', label: '8:00 AM', engagement: 'High' },
        { time: '12:00', label: '12:00 PM', engagement: 'Peak' },
        { time: '17:00', label: '5:00 PM', engagement: 'High' },
        { time: '20:00', label: '8:00 PM', engagement: 'Medium' },
    ];

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 id="schedule-modal-title" className="text-xl font-bold">Schedule Post</h2>
                                <p className="text-blue-100 text-sm">Choose when to publish</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close modal"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Post Preview */}
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Preview</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                            {postContent || 'No content to preview'}
                        </p>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Date
                        </label>
                        <input
                            id="schedule-date"
                            type="date"
                            value={selectedDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Time Picker */}
                    <div>
                        <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Time
                        </label>
                        <input
                            id="schedule-time"
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Suggested Times */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Best times for engagement
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {suggestedTimes.map((suggestion) => (
                                <button
                                    key={suggestion.time}
                                    type="button"
                                    onClick={() => setSelectedTime(suggestion.time)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedTime === suggestion.time
                                            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500'
                                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-blue-300'
                                        }`}
                                >
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {suggestion.label}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${suggestion.engagement === 'Peak'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                            : suggestion.engagement === 'High'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400'
                                        }`}>
                                        {suggestion.engagement}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSchedule}
                        disabled={isScheduling}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isScheduling ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Scheduling...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Schedule Post
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
