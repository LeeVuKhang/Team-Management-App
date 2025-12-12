import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { acceptInvitation } from './services/projectApi';
import { CheckCircle2, XCircle, Loader2, Home } from 'lucide-react';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [teamInfo, setTeamInfo] = useState(null);

  const acceptMutation = useMutation({
    mutationFn: (token) => acceptInvitation(token),
    onSuccess: (data) => {
      setStatus('success');
      setMessage(data.message || 'Successfully joined the team!');
      setTeamInfo(data.data);
      
      // Redirect to team dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/teams/${data.data.teamId}`);
      }, 2000);
    },
    onError: (error) => {
      setStatus('error');
      setMessage(error.message || 'Failed to accept invitation');
    },
  });

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link - missing token');
      return;
    }

    // Automatically accept the invitation on mount
    acceptMutation.mutate(token);
  }, [searchParams]);

  const isDarkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-[rgb(15,20,15)]' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-8 text-center ${
        isDarkMode ? 'bg-[rgb(30,36,30)] border border-[rgb(45,52,45)]' : 'bg-white border border-gray-200'
      }`}>
        {/* Loading State */}
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="animate-spin text-[rgb(119,136,115)]" size={64} />
            </div>
            <h1 className={`text-2xl font-bold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Joining Team...
            </h1>
            <p className={`text-sm ${
              isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-gray-600'
            }`}>
              Please wait while we process your invitation
            </p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="text-green-500" size={48} />
              </div>
            </div>
            <h1 className={`text-2xl font-bold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to {teamInfo?.teamName || 'the team'}!
            </h1>
            <p className={`text-sm mb-6 ${
              isDarkMode ? 'text-[rgb(161,188,152)]' : 'text-gray-600'
            }`}>
              {message}
            </p>
            <div className={`inline-flex items-center gap-2 text-xs ${
              isDarkMode ? 'text-[rgb(119,136,115)]' : 'text-gray-500'
            }`}>
              <Loader2 className="animate-spin" size={14} />
              <span>Redirecting to team dashboard...</span>
            </div>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="text-red-500" size={48} />
              </div>
            </div>
            <h1 className={`text-2xl font-bold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Unable to Join Team
            </h1>
            <p className={`text-sm mb-6 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              {message}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/80 text-white' 
                    : 'bg-[rgb(119,136,115)] hover:bg-[rgb(119,136,115)]/90 text-white'
                }`}
              >
                <Home size={18} />
                Go to Dashboard
              </button>
              <p className={`text-xs ${
                isDarkMode ? 'text-[rgb(119,136,115)]' : 'text-gray-500'
              }`}>
                Common issues: Invitation expired, already used, or sent to different email
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
