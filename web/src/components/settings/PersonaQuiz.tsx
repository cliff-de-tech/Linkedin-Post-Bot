import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { showToast } from '@/lib/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Quiz options matching PersonaSettings
const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional', icon: '👔', desc: 'Polished and industry-focused' },
    { value: 'casual', label: 'Casual', icon: '☕', desc: 'Friendly and conversational' },
    { value: 'witty', label: 'Witty', icon: '😄', desc: 'Clever with humor and wordplay' },
    { value: 'inspirational', label: 'Inspirational', icon: '✨', desc: 'Motivational and uplifting' },
];

const EMOJI_OPTIONS = [
    { value: 'none', label: 'None', desc: 'No emojis' },
    { value: 'minimal', label: 'Minimal', desc: '1-2 emojis' },
    { value: 'moderate', label: 'Moderate', desc: 'A few emojis' },
    { value: 'heavy', label: 'Heavy', desc: 'Lots of emojis!' },
];

const TOPIC_SUGGESTIONS = [
    'AI', 'Frontend', 'Backend', 'DevOps', 'Career', 'Startups',
    'React', 'Python', 'JavaScript', 'Cloud', 'Open Source', 'Learning',
    'Leadership', 'Productivity', 'Design', 'Mobile'
];

interface PersonaQuizProps {
    onComplete: () => void;
    onSkip?: () => void;
}

interface PersonaData {
    tone: string;
    topics: string[];
    signature_style: string;
    emoji_usage: string;
    bio: string;
}

export default function PersonaQuiz({ onComplete, onSkip }: PersonaQuizProps) {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [persona, setPersona] = useState<PersonaData>({
        tone: '',
        topics: [],
        signature_style: '',
        emoji_usage: 'moderate',
        bio: '',
    });

    const totalSteps = 4;

    const savePersona = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            await axios.post(`${API_BASE}/api/settings/${user?.id}`,
                { persona },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast.success('Persona saved! AI will write in your voice now.');
            onComplete();
        } catch (error) {
            showToast.error('Failed to save persona');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const toggleTopic = (topic: string) => {
        setPersona(prev => ({
            ...prev,
            topics: prev.topics.includes(topic)
                ? prev.topics.filter(t => t !== topic)
                : [...prev.topics, topic]
        }));
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Step {step} of {totalSteps}</span>
                    <span>{Math.round((step / totalSteps) * 100)}% complete</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">

                {/* Step 1: Bio */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <span className="text-4xl mb-4 block">🎭</span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Let's Create Your Writing Persona
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Tell us about yourself so AI can write in your voice
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Who are you? (Your professional identity)
                            </label>
                            <textarea
                                value={persona.bio}
                                onChange={(e) => setPersona(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="e.g., Frontend developer passionate about React and building beautiful UIs. Currently learning about AI integration..."
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-400 resize-none"
                                rows={4}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Tone */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <span className="text-4xl mb-4 block">🎵</span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Choose Your Tone
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                How do you want to come across on LinkedIn?
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {TONE_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setPersona(prev => ({ ...prev, tone: option.value }))}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${persona.tone === option.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:scale-102'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{option.icon}</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Topics */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <span className="text-4xl mb-4 block">🎯</span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                What Do You Talk About?
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Select topics you focus on (pick 3-5)
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center">
                            {TOPIC_SUGGESTIONS.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => toggleTopic(topic)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${persona.topics.includes(topic)
                                            ? 'bg-blue-500 text-white scale-105'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {persona.topics.includes(topic) && '✓ '}
                                    {topic}
                                </button>
                            ))}
                        </div>

                        <p className="text-center text-sm text-gray-500">
                            Selected: {persona.topics.length} topic{persona.topics.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                {/* Step 4: Emoji + Review */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <span className="text-4xl mb-4 block">✅</span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Almost Done!
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                One last thing: how much do you use emojis?
                            </p>
                        </div>

                        <div className="flex gap-3 justify-center mb-8">
                            {EMOJI_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setPersona(prev => ({ ...prev, emoji_usage: option.value }))}
                                    className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${persona.emoji_usage === option.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Persona</h3>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p><span className="font-medium">Bio:</span> {persona.bio || '(not set)'}</p>
                                <p><span className="font-medium">Tone:</span> {persona.tone || '(not set)'}</p>
                                <p><span className="font-medium">Topics:</span> {persona.topics.join(', ') || '(none)'}</p>
                                <p><span className="font-medium">Emojis:</span> {persona.emoji_usage}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div>
                        {step > 1 ? (
                            <button
                                onClick={prevStep}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900"
                            >
                                ← Back
                            </button>
                        ) : (
                            onSkip && (
                                <button
                                    onClick={onSkip}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                                >
                                    Skip for now
                                </button>
                            )
                        )}
                    </div>

                    <div>
                        {step < totalSteps ? (
                            <button
                                onClick={nextStep}
                                disabled={step === 1 && !persona.bio}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                           disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                onClick={savePersona}
                                disabled={saving}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white 
                           rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : '🎉 Complete Setup'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
