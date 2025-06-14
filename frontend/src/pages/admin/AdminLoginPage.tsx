import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<AdminLoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<AdminLoginForm & { general: string }>>({});

  const handleInputChange = (field: keyof AdminLoginForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AdminLoginForm & { general: string }> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Admin login should always go to admin dashboard
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (error) {
      setErrors({ general: 'Invalid admin credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Secure access for system administrators
          </p>
        </div>

        <Card padding="lg" shadow="xl" className="bg-white/10 backdrop-blur-sm border border-white/20">
          {/* Security Notice */}
          <div className="mb-6 p-4 bg-amber-50/10 border border-amber-200/20 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-200 font-medium">
                  Authorized Personnel Only
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  This login is for system administrators only. All access is logged and monitored.
                </p>
              </div>
            </div>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50/10 border border-red-200/20 rounded-lg">
              <p className="text-sm text-red-300">{errors.general}</p>
            </div>
          )}

          {/* Admin Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Admin Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email}
                placeholder="admin@krib.ae"
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder-gray-300"
              />
            </div>

            <div>
              <Input
                label="Admin Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password}
                placeholder="Enter admin password"
                autoComplete="current-password"
                className="bg-white/10 border-white/20 text-white placeholder-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white/10"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Keep me signed in
                </label>
              </div>

              <div className="text-sm">
                <Link to="/admin/forgot-password" className="font-medium text-blue-400 hover:text-blue-300">
                  Reset Password
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                className="py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                {loading ? 'Authenticating...' : 'Access Admin Portal'}
              </Button>
            </div>
          </form>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Having trouble accessing your account?{' '}
              <a href="mailto:support@krib.ae" className="text-blue-400 hover:text-blue-300">
                Contact Support
              </a>
            </p>
          </div>
        </Card>

        {/* Back to Main Site */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
          >
            ← Back to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 