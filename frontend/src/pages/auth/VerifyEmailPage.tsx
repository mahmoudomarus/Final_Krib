import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { 
  Mail, 
  CheckCircle, 
  RefreshCw, 
  ArrowLeft,
  Clock,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../../services/api';
import { ApiResponse, VerificationResponse, ResendVerificationResponse } from '../../types/api';

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from registration redirect
  const { email, role, message } = location.state || {};
  
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check URL for verification token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      handleVerifyToken(token);
    }
  }, []);

  const handleVerifyToken = async (token: string) => {
    setIsVerifying(true);
    
    try {
      const response = await apiService.post('/auth/verify-email', { token }) as ApiResponse<VerificationResponse>;
      
      if (response.success) {
        // Store token if provided
        if (response.data?.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        // Redirect based on role
        const redirectPath = getRedirectPath(role);
        navigate(redirectPath, { 
          state: { 
            message: 'Email verified successfully! Welcome to Krib.',
            verified: true 
          } 
        });
      } else {
        throw new Error(response.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Email verification failed:', error);
      setResendMessage('Verification failed. Please try again or request a new verification email.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getRedirectPath = (userRole: string) => {
    switch (userRole) {
      case 'host':
        return '/host/dashboard';
      case 'agent':
        return '/agent/dashboard';
      case 'guest':
      default:
        return '/';
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      const response = await apiService.post('/auth/resend-verification', { email }) as ApiResponse<ResendVerificationResponse>;
      
      if (response.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
        setCountdown(60); // 60 second cooldown
      } else {
        throw new Error(response.error || 'Failed to resend email');
      }
    } catch (error: any) {
      console.error('Resend failed:', error);
      setResendMessage('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getRoleDisplayName = (userRole: string) => {
    switch (userRole) {
      case 'host':
        return 'Host (Property Owner)';
      case 'agent':
        return 'Real Estate Agent';
      case 'guest':
      default:
        return 'Guest (Tenant)';
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card padding="lg" className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          <p className="text-gray-600 mt-2">We've sent you a verification link</p>
        </div>

        <Card padding="lg">
          <div className="text-center space-y-6">
            {/* Email Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Success Message */}
            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 text-sm">{message}</p>
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Almost there!
              </h2>
              <div className="text-gray-600 space-y-2">
                <p>
                  We've sent a verification email to:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
                {role && (
                  <p className="text-sm">
                    Account type: <span className="font-medium">{getRoleDisplayName(role)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h3 className="font-medium text-gray-900 mb-2">Next steps:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>You'll be automatically signed in to your account</li>
              </ol>
            </div>

            {/* Resend Section */}
            <div className="space-y-4">
              {resendMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resendMessage.includes('sent') || resendMessage.includes('successfully')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {resendMessage.includes('sent') || resendMessage.includes('successfully') ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{resendMessage}</span>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Didn't receive the email?
                </p>
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={isResending || countdown > 0}
                  leftIcon={
                    isResending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : countdown > 0 ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )
                  }
                >
                  {isResending 
                    ? 'Sending...' 
                    : countdown > 0 
                      ? `Resend in ${countdown}s`
                      : 'Resend Email'
                  }
                </Button>
              </div>
            </div>

            {/* Help Section */}
            <div className="border-t pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Still having trouble?
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/contact')}
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <Link 
            to="/login" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Additional Info */}
        <Card padding="md" className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Email Verification Required</p>
              <p>
                For security reasons, you must verify your email address before accessing your account. 
                The verification link will expire in 24 hours.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 