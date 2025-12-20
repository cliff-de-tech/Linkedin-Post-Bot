import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { handleLinkedInCallback } from '@/lib/api';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const { code } = router.query;
    
    if (code && typeof code === 'string') {
      const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/auth/callback';
      
      handleLinkedInCallback(code, redirectUri)
        .then((data) => {
          if (data.status === 'ok') {
            setStatus('Success! Redirecting to dashboard...');
            localStorage.setItem('linkedin_urn', data.result.linkedin_user_urn);
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setStatus('Error: ' + JSON.stringify(data.error || data || 'Unknown error'));
          }
        })
        .catch((err) => {
          setStatus('Error: ' + (err.response?.data?.error || err.message || JSON.stringify(err)));
        });
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">LinkedIn Authentication</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
