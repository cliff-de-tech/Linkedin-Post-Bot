/**
 * FeedbackModal Component
 * 
 * Beautiful feedback popup with onboarding-style theme.
 * Auto-appears after 2 publishes, auto-dismisses after 35 seconds.
 * Can also be triggered manually via "Give Feedback" button.
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { showToast } from '@/lib/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    autoTriggered?: boolean;  // True if auto-triggered (enables auto-dismiss)
    autoDismissSeconds?: number;  // Default 35 seconds
}

export function FeedbackModal({
    isOpen,
    onClose,
    userId,
    autoTriggered = false,
    autoDismissSeconds = 35
}: FeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [liked, setLiked] = useState('');
    const [improvements, setImprovements] = useState('');
    const [suggestions, setSuggestions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(autoDismissSeconds);
    const [isPaused, setIsPaused] = useState(false);  // Pause countdown when user interacts

    // Auto-dismiss countdown for auto-triggered popups
    useEffect(() => {
        if (!isOpen || !autoTriggered || isPaused) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    onClose();
                    return autoDismissSeconds;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, autoTriggered, isPaused, autoDismissSeconds, onClose]);

    // Reset countdown when modal opens
    useEffect(() => {
        if (isOpen) {
            setCountdown(autoDismissSeconds);
            setIsPaused(false);
        }
    }, [isOpen, autoDismissSeconds]);

    // Pause countdown when user starts interacting
    const handleInteraction = useCallback(() => {
        if (autoTriggered && !isPaused) {
            setIsPaused(true);
        }
    }, [autoTriggered, isPaused]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            showToast.error('Please select a rating');
            return;
        }
        if (!improvements.trim()) {
            showToast.error('Please tell us what could be improved');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${API_BASE}/api/feedback/submit`, {
                user_id: userId,
                rating,
                liked,
                improvements,
                suggestions
            });

            if (response.data.success) {
                showToast.success('Thank you for your feedback! 🎉');
                localStorage.setItem('hasSubmittedFeedback', 'true');
                onClose();
            } else {
                showToast.error(response.data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            showToast.error('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal - Compact and scrollable */}
            <div
                className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                onClick={handleInteraction}
            >
                {/* Decorative gradient orbs */}
                <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                {/* Close button - prominent */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                    aria-label="Close feedback form"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Auto-dismiss countdown */}
                {autoTriggered && !isPaused && (
                    <div className="absolute top-3 left-3 text-white/40 text-xs flex items-center gap-1 z-10">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {countdown}s
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="relative p-6 max-h-[85vh] overflow-y-auto">
                    {/* Header - Compact */}
                    <div className="text-center mb-5">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-3 shadow-lg shadow-purple-500/30">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            Quick Feedback
                        </h2>
                        <p className="text-white/50 text-xs">
                            Help us improve • Takes 30 seconds
                        </p>
                    </div>

                    {/* Feedback Form - Compact */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Star Rating */}
                        <div>
                            <label className="block text-white/70 text-xs font-medium mb-2">
                                Rate your experience *
                            </label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="text-3xl transition-transform hover:scale-110"
                                    >
                                        {star <= (hoverRating || rating) ? '⭐' : '☆'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* What you liked */}
                        <div>
                            <label className="block text-white/70 text-xs font-medium mb-1">
                                What do you like? (optional)
                            </label>
                            <textarea
                                value={liked}
                                onChange={(e) => setLiked(e.target.value)}
                                onFocus={handleInteraction}
                                placeholder="AI posts, design, ease of use..."
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                            />
                        </div>

                        {/* Improvements */}
                        <div>
                            <label className="block text-white/70 text-xs font-medium mb-1">
                                What could be improved? *
                            </label>
                            <textarea
                                value={improvements}
                                onChange={(e) => setImprovements(e.target.value)}
                                onFocus={handleInteraction}
                                placeholder="Bugs, missing features, confusing parts..."
                                rows={2}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                            />
                        </div>

                        {/* Suggestions */}
                        <div>
                            <label className="block text-white/70 text-xs font-medium mb-1">
                                Other suggestions? (optional)
                            </label>
                            <textarea
                                value={suggestions}
                                onChange={(e) => setSuggestions(e.target.value)}
                                onFocus={handleInteraction}
                                placeholder="Feature ideas..."
                                rows={1}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                            />
                        </div>

                        {/* Submit Button - Compact */}
                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0 || !improvements.trim()}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span>📨</span>
                                    Send Feedback
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default FeedbackModal;
