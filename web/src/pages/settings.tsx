/**
 * Settings Page - User configuration for LinkedIn, Groq, GitHub, and Unsplash
 * 
 * API TYPES: Uses types from @/types/dashboard (generated from shared/contracts)
 * TO REGENERATE when backend changes: npm run generate:types
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';
import ThemeToggle from '@/components/ThemeToggle';
import PasswordInput from '@/components/ui/PasswordInput';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Settings() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Use Clerk user ID instead of localStorage
  const userId = user?.id || '';

  const [formData, setFormData] = useState({
    linkedin_client_id: '',
    linkedin_client_secret: '',
    groq_api_key: '',
    github_username: '',
    unsplash_access_key: ''
  });

  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [linkedinUrn, setLinkedinUrn] = useState('');

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    setMounted(true);

    const urn = localStorage.getItem('linkedin_user_urn');
    if (urn) {
      setLinkedinConnected(true);
      setLinkedinUrn(urn);
      setActiveStep(2);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const linkedinSuccess = urlParams.get('linkedin_success');
    const linkedinUrnParam = urlParams.get('linkedin_urn');

    if (linkedinSuccess === 'true' && linkedinUrnParam) {
      localStorage.setItem('linkedin_user_urn', linkedinUrnParam);
      setLinkedinConnected(true);
      setLinkedinUrn(linkedinUrnParam);
      setActiveStep(2);
      showToast.success('LinkedIn connected successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (linkedinSuccess === 'false') {
      const error = urlParams.get('error') || 'Unknown error';
      showToast.error(`LinkedIn connection failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    loadSettings(userId);
  }, [isLoaded, userId]);

  useEffect(() => {
    if (linkedinConnected && formData.groq_api_key) setActiveStep(3);
    else if (linkedinConnected) setActiveStep(2);
    else setActiveStep(1);
  }, [linkedinConnected, formData.groq_api_key]);

  const validateField = (name: string, value: string): string => {
    if (linkedinConnected && (name === 'linkedin_client_id' || name === 'linkedin_client_secret')) {
      return '';
    }
    switch (name) {
      case 'groq_api_key':
        if (!value || value.trim().length === 0) return 'Groq API Key is required';
        if (!value.startsWith('gsk_')) return 'Groq API keys start with "gsk_"';
        break;
      case 'github_username':
        if (!value || value.trim().length === 0) return 'GitHub username is required';
        if (!/^[a-zA-Z0-9-]+$/.test(value)) return 'Invalid username format';
        break;
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    newErrors.groq_api_key = validateField('groq_api_key', formData.groq_api_key);
    newErrors.github_username = validateField('github_username', formData.github_username);
    Object.keys(newErrors).forEach(key => { if (!newErrors[key]) delete newErrors[key]; });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Track which fields are saved in DB
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});

  const loadSettings = async (uid: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/settings/${uid}`);
      console.log('Loaded settings:', response.data);
      if (response.data && !response.data.error) {
        setFormData(prev => ({
          ...prev,
          linkedin_client_id: response.data.linkedin_client_id || '',
          linkedin_client_secret: response.data.linkedin_client_secret || '',
          groq_api_key: response.data.groq_api_key || '',
          github_username: response.data.github_username || '',
          unsplash_access_key: response.data.unsplash_access_key || ''
        }));
        // Mark fields that exist in DB as saved
        setSavedFields({
          groq_api_key: !!response.data.groq_api_key,
          github_username: !!response.data.github_username,
          unsplash_access_key: !!response.data.unsplash_access_key
        });
      }
    } catch (error) {
      console.log('No existing settings or error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    const error = validateField(name, value);
    if (error) {
      setErrors({ ...errors, [name]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!formData.linkedin_client_id || !formData.linkedin_client_secret) {
      showToast.error('Please enter LinkedIn Client ID and Secret first');
      return;
    }

    if (!userId) {
      showToast.error('User not authenticated');
      return;
    }

    const toastId = showToast.loading('Saving credentials & connecting...');
    try {
      // First save credentials to backend
      await axios.post(`${API_BASE}/api/settings`, {
        user_id: userId,
        linkedin_client_id: formData.linkedin_client_id,
        linkedin_client_secret: formData.linkedin_client_secret,
        groq_api_key: formData.groq_api_key || '',
        github_username: formData.github_username || '',
        unsplash_access_key: formData.unsplash_access_key || ''
      });

      // Check if backend is reachable
      await axios.get(`${API_BASE}/health`, { timeout: 2000 });
      showToast.dismiss(toastId);

      // Redirect to OAuth with user_id
      const redirectUri = `${window.location.origin}/auth/callback`;
      window.location.href = `${API_BASE}/auth/linkedin/start?redirect_uri=${encodeURIComponent(redirectUri)}&user_id=${encodeURIComponent(userId)}`;
    } catch (error) {
      showToast.dismiss(toastId);
      console.error('Backend connection failed:', error);
      showToast.error('Backend server is unreachable. Please ensure the Python server is running on port 8000.');
    }
  };

  const handleDisconnectLinkedIn = () => {
    localStorage.removeItem('linkedin_user_urn');
    setLinkedinConnected(false);
    setLinkedinUrn('');
    setActiveStep(1);
    showToast.success('LinkedIn disconnected');
  };

  // New: Save individual field
  const [savingField, setSavingField] = useState<string | null>(null);

  const handleSaveField = async (fieldName: string) => {
    if (!userId) {
      showToast.error('User not authenticated');
      return;
    }

    setSavingField(fieldName);

    try {
      // Build payload with just the field being saved
      const payload: Record<string, string> = { user_id: userId };

      // Include current field value
      payload[fieldName] = formData[fieldName as keyof typeof formData];

      // Also include existing values so we don't overwrite them
      if (fieldName !== 'groq_api_key' && formData.groq_api_key) {
        payload.groq_api_key = formData.groq_api_key;
      }
      if (fieldName !== 'github_username' && formData.github_username) {
        payload.github_username = formData.github_username;
      }
      if (fieldName !== 'unsplash_access_key' && formData.unsplash_access_key) {
        payload.unsplash_access_key = formData.unsplash_access_key;
      }
      if (linkedinUrn) {
        payload.linkedin_user_urn = linkedinUrn;
      }

      const response = await axios.post(`${API_BASE}/api/settings`, payload);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Mark field as saved
      setSavedFields(prev => ({ ...prev, [fieldName]: true }));

      const fieldLabels: Record<string, string> = {
        groq_api_key: 'Groq API Key',
        github_username: 'GitHub Username',
        unsplash_access_key: 'Unsplash Key'
      };

      showToast.success(`${fieldLabels[fieldName] || fieldName} saved!`);
    } catch (error: any) {
      showToast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingField(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { showToast.error('Please fix the errors before saving'); return; }
    if (!linkedinConnected) { showToast.error('Please connect your LinkedIn account first'); return; }

    setSaving(true);
    const toastId = showToast.loading('Saving your settings...');
    try {
      const response = await axios.post(`${API_BASE}/api/settings`, {
        user_id: userId,
        groq_api_key: formData.groq_api_key,
        github_username: formData.github_username,
        unsplash_access_key: formData.unsplash_access_key || '',
        linkedin_user_urn: linkedinUrn
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      showToast.dismiss(toastId);
      showToast.success('Settings saved successfully!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error: any) {
      showToast.dismiss(toastId);
      showToast.error(error.message || 'Failed to save settings');
      setSaving(false);
    }
  };

  const isFormComplete = () => linkedinConnected && formData.groq_api_key && formData.github_username;

  const steps = [
    { id: 1, title: 'LinkedIn', icon: '🔗', complete: linkedinConnected },
    { id: 2, title: 'Groq AI', icon: '🤖', complete: !!formData.groq_api_key },
    { id: 3, title: 'GitHub', icon: '🐙', complete: !!formData.github_username },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-primary text-text-primary transition-colors duration-300">
      <SEOHead title="Settings - LinkedIn Post Bot" description="Configure your credentials" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/10 dark:bg-white/5 backdrop-blur-lg border-b border-white/10 dark:border-white/10 border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse-slow">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-xs text-gray-600 dark:text-purple-200">Configure your integrations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="group flex items-center px-4 py-2 text-gray-700 dark:text-purple-200 hover:text-blue-600 dark:hover:text-white bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-lg transition-all duration-300 border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20"
            >
              <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className={`relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 transform hover:scale-110 ${step.complete
                  ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30'
                  : activeStep === step.id
                    ? 'bg-gradient-to-br from-blue-400 to-purple-600 shadow-lg shadow-purple-500/30 animate-pulse-slow'
                    : 'bg-white/10 border border-white/20'
                  }`}>
                  {step.complete ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-2xl">{step.icon}</span>
                  )}
                  <span className="absolute -bottom-6 text-xs font-medium text-gray-600 dark:text-purple-200 min-w-max transform -translate-x-1/2 left-1/2">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-500 ${step.complete ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-white/10'
                    }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden text-card-foreground">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 px-8 py-6 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Setup Your Account</h2>
            <p className="text-gray-600 dark:text-purple-200">Connect your accounts to start generating LinkedIn posts</p>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-8">
            {/* Step 1: LinkedIn */}
            <div className={`transition-all duration-500 ${activeStep === 1 ? 'opacity-100' : 'opacity-70'}`}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Step 1: Connect LinkedIn</h3>
                  <p className="text-sm text-purple-200">Required for posting</p>
                </div>
              </div>

              {linkedinConnected ? (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-emerald-300 font-semibold">LinkedIn Connected!</p>
                        <p className="text-emerald-400/70 text-sm">Account ID: {linkedinUrn.slice(0, 20)}...</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectLinkedIn}
                      className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-purple-200 text-sm">
                    Enter your LinkedIn Developer App credentials.{' '}
                    <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                      Get credentials →
                    </a>
                  </p>
                  <div className="grid gap-4">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-purple-200 mb-2">Client ID</label>
                      <input
                        type="text"
                        name="linkedin_client_id"
                        value={formData.linkedin_client_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 dark:bg-white/5 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-white/20"
                        placeholder="e.g., 77abc1234xyz"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-purple-200 mb-2">Client Secret</label>
                      <input
                        type="password"
                        name="linkedin_client_secret"
                        value={formData.linkedin_client_secret}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 dark:bg-white/5 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-white/20"
                        placeholder="e.g., WPL_AP1.xxxxx"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectLinkedIn}
                    disabled={!formData.linkedin_client_id || !formData.linkedin_client_secret}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center group"
                  >
                    <svg className="w-5 h-5 mr-2 transform group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    Connect LinkedIn Account
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10"></div>

            {/* Step 2: Groq API */}
            <div className={`transition-all duration-500 ${activeStep === 2 ? 'opacity-100' : activeStep > 2 ? 'opacity-70' : 'opacity-50'}`}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Step 2: Groq AI API Key</h3>
                  <p className="text-sm text-purple-200">Powers AI generation</p>
                </div>
                {formData.groq_api_key && (
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">✓ Added</span>
                  </div>
                )}
              </div>
              <p className="text-purple-200 text-sm mb-4">
                Groq provides lightning-fast AI.{' '}
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                  Get free API key →
                </a>
              </p>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-purple-200 mb-2">API Key</label>
                <input
                  type="password"
                  name="groq_api_key"
                  value={formData.groq_api_key}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border dark:bg-white/5 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:ring-2 focus:border-transparent transition-all duration-300 group-hover:border-purple-400 dark:group-hover:border-white/20 ${errors.groq_api_key ? 'border-red-500/50 focus:ring-red-500' : 'border-gray-300 dark:border-white/10 focus:ring-purple-500'
                    }`}
                  placeholder="gsk_xxxxxxxxxxxxxxxxx"
                />
                {errors.groq_api_key && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.groq_api_key}
                  </p>
                )}
                {/* Save Button */}
                <button
                  type="button"
                  onClick={() => handleSaveField('groq_api_key')}
                  disabled={!formData.groq_api_key || !!errors.groq_api_key || savingField === 'groq_api_key'}
                  className={`mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${savedFields.groq_api_key
                    ? 'bg-gray-500 hover:bg-gray-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                    } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                >
                  {savingField === 'groq_api_key' ? (
                    <><span className="animate-spin">⏳</span> Saving...</>
                  ) : savedFields.groq_api_key ? (
                    <><span>✓</span> Saved</>
                  ) : (
                    <><span>💾</span> Save Groq API Key</>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10"></div>

            {/* Step 3: GitHub */}
            <div className={`transition-all duration-500 ${activeStep === 3 ? 'opacity-100' : 'opacity-50'}`}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Step 3: GitHub Username</h3>
                  <p className="text-sm text-purple-200">Track your coding activity</p>
                </div>
                {formData.github_username && (
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">✓ Added</span>
                  </div>
                )}
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-purple-200 mb-2">Username</label>
                <input
                  type="text"
                  name="github_username"
                  value={formData.github_username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border dark:bg-white/5 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:ring-2 focus:border-transparent transition-all duration-300 group-hover:border-gray-400 dark:group-hover:border-white/20 ${errors.github_username ? 'border-red-500/50 focus:ring-red-500' : 'border-gray-300 dark:border-white/10 focus:ring-gray-500'
                    }`}
                  placeholder="your-github-username"
                />
                {errors.github_username && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.github_username}
                  </p>
                )}
                {/* Save Button */}
                <button
                  type="button"
                  onClick={() => handleSaveField('github_username')}
                  disabled={!formData.github_username || !!errors.github_username || savingField === 'github_username'}
                  className={`mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${savedFields.github_username
                    ? 'bg-gray-500 hover:bg-gray-600'
                    : 'bg-gray-600 hover:bg-gray-500'
                    } disabled:bg-gray-700 disabled:cursor-not-allowed`}
                >
                  {savingField === 'github_username' ? (
                    <><span className="animate-spin">⏳</span> Saving...</>
                  ) : savedFields.github_username ? (
                    <><span>✓</span> Saved</>
                  ) : (
                    <><span>💾</span> Save GitHub Username</>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10"></div>

            {/* Optional: Unsplash */}
            <div className="opacity-70 hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Optional: Unsplash Images</h3>
                  <p className="text-sm text-purple-200">Add images to posts</p>
                </div>
                <span className="ml-auto px-3 py-1 bg-white/5 text-purple-300 text-xs font-medium rounded-full border border-white/10">Optional</span>
              </div>
              <p className="text-purple-200 text-sm mb-4">
                <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline">
                  Get free access key →
                </a>
              </p>
              <div className="group">
                <input
                  type="password"
                  name="unsplash_access_key"
                  value={formData.unsplash_access_key}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 dark:bg-white/5 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 group-hover:border-orange-300 dark:group-hover:border-white/20"
                  placeholder="Leave empty for text-only posts"
                />
                {/* Save Button */}
                <button
                  type="button"
                  onClick={() => handleSaveField('unsplash_access_key')}
                  disabled={!formData.unsplash_access_key || savingField === 'unsplash_access_key'}
                  className={`mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${savedFields.unsplash_access_key
                    ? 'bg-gray-500 hover:bg-gray-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                    } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                >
                  {savingField === 'unsplash_access_key' ? (
                    <><span className="animate-spin">⏳</span> Saving...</>
                  ) : savedFields.unsplash_access_key ? (
                    <><span>✓</span> Saved</>
                  ) : (
                    <><span>💾</span> Save Unsplash Key</>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving || !isFormComplete()}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/25 flex items-center justify-center group"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : isFormComplete() ? (
                  <>
                    Save & Go to Dashboard
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                ) : (
                  'Complete all steps above'
                )}
              </button>
              {!isFormComplete() && (
                <p className="text-purple-300/70 text-sm text-center mt-3">
                  {!linkedinConnected && '🔗 Connect LinkedIn  '}
                  {!formData.groq_api_key && '🤖 Add Groq API Key  '}
                  {!formData.github_username && '🐙 Add GitHub Username'}
                </p>
              )}
            </div>
          </form>
        </div>
      </main>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
