import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Settings() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    linkedin_client_id: '',
    linkedin_client_secret: '',
    groq_api_key: '',
    github_username: '',
    unsplash_access_key: ''
  });

  useEffect(() => {
    // Generate or get user ID
    let storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      storedUserId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('user_id', storedUserId);
    }
    setUserId(storedUserId);

    // Load existing settings if any
    loadSettings(storedUserId);
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'linkedin_client_id':
        if (!value || value.trim().length === 0) {
          return 'LinkedIn Client ID is required';
        }
        if (value.length < 10) {
          return 'Client ID seems too short';
        }
        break;
      case 'linkedin_client_secret':
        if (!value || value.trim().length === 0) {
          return 'LinkedIn Client Secret is required';
        }
        if (value.length < 20) {
          return 'Client Secret seems too short';
        }
        break;
      case 'groq_api_key':
        if (!value || value.trim().length === 0) {
          return 'Groq API Key is required';
        }
        if (!value.startsWith('gsk_')) {
          return 'Groq API keys typically start with "gsk_"';
        }
        break;
      case 'github_username':
        if (!value || value.trim().length === 0) {
          return 'GitHub username is required';
        }
        if (!/^[a-zA-Z0-9-]+$/.test(value)) {
          return 'GitHub username can only contain letters, numbers, and hyphens';
        }
        break;
      case 'unsplash_access_key':
        // Optional field
        if (value && value.length > 0 && value.length < 20) {
          return 'Unsplash Access Key seems too short';
        }
        break;
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    newErrors.linkedin_client_id = validateField('linkedin_client_id', formData.linkedin_client_id);
    newErrors.linkedin_client_secret = validateField('linkedin_client_secret', formData.linkedin_client_secret);
    newErrors.groq_api_key = validateField('groq_api_key', formData.groq_api_key);
    newErrors.github_username = validateField('github_username', formData.github_username);
    newErrors.unsplash_access_key = validateField('unsplash_access_key', formData.unsplash_access_key);
    
    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadSettings = async (uid: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/settings/${uid}`);
      if (response.data) {
        setFormData({
          linkedin_client_id: response.data.linkedin_client_id || '',
          linkedin_client_secret: response.data.linkedin_client_secret || '',
          groq_api_key: response.data.groq_api_key || '',
          github_username: response.data.github_username || '',
          unsplash_access_key: response.data.unsplash_access_key || ''
        });
      }
    } catch (error) {
      // No settings yet - that's fine
      console.log('No existing settings');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Validate on blur for better UX
    if (value.length > 0) {
      const error = validateField(name, value);
      if (error) {
        setErrors({
          ...errors,
          [name]: error
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showToast.error('Please fix the errors before saving');
      return;
    }
    
    setSaving(true);
    setMessage('');

    const toastId = showToast.loading('Saving settings...');
    try {
      await axios.post(`${API_BASE}/api/settings`, {
        user_id: userId,
        ...formData
      });
      
      showToast.dismiss(toastId);
      showToast.success('Settings saved successfully!');
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      showToast.dismiss(toastId);
      showToast.error('Failed to save settings. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Settings - LinkedIn Post Bot"
        description="Configure your API credentials and integrations"
      />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your API Credentials</h2>
            <p className="text-gray-600">
              Enter your credentials to enable AI post generation and LinkedIn integration
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* LinkedIn Credentials */}
            <div className="space-y-4 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn Developer App
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  name="linkedin_client_id"
                  value={formData.linkedin_client_id}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.linkedin_client_id 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your LinkedIn Client ID"
                />
                {errors.linkedin_client_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.linkedin_client_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  name="linkedin_client_secret"
                  value={formData.linkedin_client_secret}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.linkedin_client_secret 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your LinkedIn Client Secret"
                />
                {errors.linkedin_client_secret && (
                  <p className="text-red-500 text-sm mt-1">{errors.linkedin_client_secret}</p>
                )}
              </div>
            </div>

            {/* Groq API Key */}
            <div className="space-y-4 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Groq AI
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  name="groq_api_key"
                  value={formData.groq_api_key}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.groq_api_key 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                  placeholder="Enter your Groq API Key"
                />
                {errors.groq_api_key && (
                  <p className="text-red-500 text-sm mt-1">{errors.groq_api_key}</p>
                )}
              </div>
            </div>

            {/* GitHub Username */}
            <div className="space-y-4 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="github_username"
                  value={formData.github_username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.github_username 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-gray-500'
                  }`}
                  placeholder="Enter your GitHub username"
                />
                {errors.github_username && (
                  <p className="text-red-500 text-sm mt-1">{errors.github_username}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  We'll track your activity and generate posts about your projects
                </p>
              </div>
            </div>

            {/* Unsplash (Optional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Unsplash (Optional)
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Key
                </label>
                <input
                  type="password"
                  name="unsplash_access_key"
                  value={formData.unsplash_access_key}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.unsplash_access_key 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-orange-500'
                  }`}
                  placeholder="Enter your Unsplash Access Key (optional)"
                />
                {errors.unsplash_access_key && (
                  <p className="text-red-500 text-sm mt-1">{errors.unsplash_access_key}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Add images to your posts automatically. Leave empty for text-only posts.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              {message && (
                <div className={`mb-4 p-4 rounded-lg ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={saving || Object.keys(errors).some(key => errors[key])}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings & Continue'}
              </button>
            </div>
          </form>

          {/* Help Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Need help getting your API keys?</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/onboarding')}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                View Setup Guide
              </button>
              <span className="text-gray-300">|</span>
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                LinkedIn Developers
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Groq Console
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
