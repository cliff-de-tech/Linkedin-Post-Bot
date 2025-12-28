import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { showToast } from '@/lib/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Persona options
const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional', icon: '👔', desc: 'Polished and industry-focused' },
    { value: 'casual', label: 'Casual', icon: '☕', desc: 'Friendly and conversational' },
    { value: 'witty', label: 'Witty', icon: '😄', desc: 'Clever with wordplay and humor' },
    { value: 'inspirational', label: 'Inspirational', icon: '✨', desc: 'Motivational and uplifting' },
];

const EMOJI_OPTIONS = [
    { value: 'none', label: 'None', desc: 'No emojis at all' },
    { value: 'minimal', label: 'Minimal', desc: '1-2 emojis if any' },
    { value: 'moderate', label: 'Moderate', desc: 'A few well-placed emojis' },
    { value: 'heavy', label: 'Heavy', desc: 'Lots of emojis throughout' },
];

const TOPIC_SUGGESTIONS = [
    'AI', 'Frontend', 'Backend', 'DevOps', 'Career', 'Startups',
    'React', 'Python', 'JavaScript', 'Cloud', 'Open Source', 'Learning',
    'Leadership', 'Productivity', 'Design', 'Mobile', 'Data Science', 'Web3'
];

interface PersonaData {
    tone: string;
    topics: string[];
    signature_style: string;
    emoji_usage: string;
    bio: string;
}

const DEFAULT_PERSONA: PersonaData = {
    tone: 'professional',
    topics: [],
    signature_style: '',
    emoji_usage: 'moderate',
    bio: '',
};

export default function PersonaSettings() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [persona, setPersona] = useState<PersonaData>(DEFAULT_PERSONA);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newTopic, setNewTopic] = useState('');

    useEffect(() => {
        if (user?.id) {
            loadPersona();
        }
    }, [user?.id]);

    const loadPersona = async () => {
        try {
            const token = await getToken();
            const response = await axios.get(`${API_BASE}/api/settings/${user?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.persona) {
                setPersona({ ...DEFAULT_PERSONA, ...response.data.persona });
            }
        } catch (error) {
            console.error('Failed to load persona:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePersona = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            await axios.post(`${API_BASE}/api/settings/${user?.id}`,
                { persona },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast.success('Persona saved! Your posts will now match your voice.');
        } catch (error) {
            showToast.error('Failed to save persona');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const addTopic = (topic: string) => {
        if (topic && !persona.topics.includes(topic)) {
            setPersona(prev => ({ ...prev, topics: [...prev.topics, topic] }));
            setNewTopic('');
        }
    };

    const removeTopic = (topic: string) => {
        setPersona(prev => ({
            ...prev,
            topics: prev.topics.filter(t => t !== topic)
        }));
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🎭</span>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Your Writing Persona
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Customize how AI generates posts in your unique voice
                    </p>
                </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    About You (Bio)
                </label>
                <textarea
                    value={persona.bio}
                    onChange={(e) => setPersona(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="e.g., Frontend developer passionate about React and design systems..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-400 resize-none"
                    rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                    AI will write posts as this person
                </p>
            </div>

            {/* Tone */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Writing Tone
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {TONE_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setPersona(prev => ({ ...prev, tone: option.value }))}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${persona.tone === option.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{option.icon}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Topics */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Core Topics
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {persona.topics.map(topic => (
                        <span
                            key={topic}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 
                         text-blue-700 dark:text-blue-300 rounded-full text-sm"
                        >
                            {topic}
                            <button
                                onClick={() => removeTopic(topic)}
                                className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTopic(newTopic)}
                        placeholder="Add topic..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                        onClick={() => addTopic(newTopic)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                    {TOPIC_SUGGESTIONS.filter(t => !persona.topics.includes(t)).slice(0, 6).map(topic => (
                        <button
                            key={topic}
                            onClick={() => addTopic(topic)}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 
                         dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            + {topic}
                        </button>
                    ))}
                </div>
            </div>

            {/* Signature Style */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Signature Style
                </label>
                <input
                    type="text"
                    value={persona.signature_style}
                    onChange={(e) => setPersona(prev => ({ ...prev, signature_style: e.target.value }))}
                    placeholder="e.g., I always end with a question, I use analogies..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            {/* Emoji Usage */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emoji Usage
                </label>
                <div className="flex gap-2">
                    {EMOJI_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setPersona(prev => ({ ...prev, emoji_usage: option.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all ${persona.emoji_usage === option.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={savePersona}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white 
                   rounded-lg font-medium hover:from-blue-600 hover:to-purple-700
                   disabled:opacity-50 transition-all"
            >
                {saving ? 'Saving...' : '💾 Save Persona'}
            </button>
        </div>
    );
}
