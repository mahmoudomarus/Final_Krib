import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Globe, 
  Shield,
  CheckCircle,
  XCircle,
  Home,
  Building,
  Users,
  UserCheck
} from 'lucide-react';
import { RegisterForm } from '../../types';
import { validateEmiratesId, validateUAEPhone } from '../../lib/utils';
import { apiService } from '../../services/api';
import { ApiResponse, AuthResponse } from '../../types/api';

type UserRole = 'guest' | 'host' | 'agent';

interface ExtendedRegisterForm extends RegisterForm {
  role: UserRole;
  emiratesId?: string;
  companyName?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if this is a host/agent registration from URL params
  const urlParams = new URLSearchParams(location.search);
  const registrationType = urlParams.get('type'); // 'host' or 'agent'
  const isProviderRegistration = registrationType === 'host' || registrationType === 'agent';
  
  const [step, setStep] = useState<'role' | 'details'>(isProviderRegistration ? 'details' : 'details');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    registrationType === 'host' ? 'host' : 
    registrationType === 'agent' ? 'agent' : 
    'guest'
  );
  
  const [form, setForm] = useState<ExtendedRegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    nationality: 'AE',
    acceptTerms: false,
    role: registrationType === 'host' ? 'host' : registrationType === 'agent' ? 'agent' : 'guest'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ExtendedRegisterForm, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emiratesId, setEmiratesId] = useState('');
  const [emiratesIdValid, setEmiratesIdValid] = useState<boolean | null>(null);

  const roleOptions = [
    {
      id: 'host' as UserRole,
      title: 'Property Host',
      description: 'List your properties for short-term vacation rentals',
      icon: Home,
      color: 'green',
      features: [
        'List vacation rental properties',
        'Manage short-term bookings',
        'Set nightly pricing',
        'Earn from tourism rentals'
      ]
    },
    {
      id: 'agent' as UserRole,
      title: 'Real Estate Agent',
      description: 'Professional agent managing long-term rental properties',
      icon: Building,
      color: 'purple',
      features: [
        'Manage long-term rental properties',
        'Handle tenant applications',
        'Process lease agreements',
        'Earn commission on deals'
      ]
    }
  ];

  const handleInputChange = (field: keyof ExtendedRegisterForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmiratesIdChange = (value: string) => {
    setEmiratesId(value);
    if (value.length >= 15) {
      const isValid = validateEmiratesId(value);
      setEmiratesIdValid(isValid);
    } else {
      setEmiratesIdValid(null);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setForm(prev => ({ ...prev, role }));
  };

  const handleContinueToDetails = () => {
    if (!selectedRole) {
      alert('Please select your account type');
      return;
    }
    setStep('details');
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExtendedRegisterForm, string>> = {};

    // Role validation (only for provider registration)
    if (isProviderRegistration && !form.role) {
      newErrors.role = 'Please select your account type';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Phone validation
    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateUAEPhone(form.phone)) {
      newErrors.phone = 'Please enter a valid UAE phone number';
    }

    // Company name validation for agents
    if (form.role === 'agent' && !form.companyName?.trim()) {
      newErrors.companyName = 'Company name is required for real estate agents';
    }

    // Terms validation
    if (!form.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare registration data
      const registrationData = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        nationality: form.nationality,
        acceptTerms: form.acceptTerms,
        role: form.role,
        emiratesId: emiratesId || undefined,
        companyName: form.companyName || undefined,
        isHost: form.role === 'host',
        isAgent: form.role === 'agent'
      };

      console.log('Registering user:', registrationData);

      // Call the registration API
      const response = await apiService.post('/auth/register', registrationData) as ApiResponse<AuthResponse>;

      if (response.success) {
        // Store token if provided
        if (response.data?.token) {
          localStorage.setItem('token', response.data.token);
        }

        // Redirect based on role
        if (form.role === 'host') {
          navigate('/host/dashboard', { 
            state: { 
              message: `Welcome! Your host account has been created successfully.`,
              user: response.data?.user
            } 
          });
        } else if (form.role === 'agent') {
          navigate('/listers', { 
            state: { 
              message: `Welcome! Your company account has been created successfully.`,
              user: response.data?.user
            } 
          });
        } else {
          navigate('/', { 
            state: { 
              message: 'Welcome! Your account has been created successfully.',
              user: response.data?.user
            } 
          });
        }
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error to user
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUAEPassRegister = () => {
    // Integrate with UAE PASS
    console.log('UAE PASS registration');
    alert('UAE PASS integration coming soon!');
  };

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true);
      
      // Initialize Google Auth if not already done
      const GoogleAuth = (await import('../../utils/googleAuth')).default;
      const googleAuth = GoogleAuth.getInstance();
      
      await googleAuth.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '574961035006-g7oebfp5st5lt5mtksaq5ane3d197re9.apps.googleusercontent.com',
        callback: async (response: any) => {
          try {
            console.log('Google OAuth response:', response);
            
            // Send the credential to our backend
            const apiResponse = await apiService.post('/auth/google', {
              token: response.credential,
              role: form.role // Include the selected role
            }) as ApiResponse<AuthResponse>;

            if (apiResponse.success && apiResponse.data) {
              // Store token
              if (apiResponse.data.token) {
                localStorage.setItem('token', apiResponse.data.token);
              }

              // Redirect based on role
              if (form.role === 'host') {
                navigate('/host/dashboard', { 
                  state: { 
                    message: `Welcome! Your host account has been created successfully.`,
                    user: apiResponse.data.user
                  } 
                });
              } else if (form.role === 'agent') {
                navigate('/listers', { 
                  state: { 
                    message: `Welcome! Your company account has been created successfully.`,
                    user: apiResponse.data.user
                  } 
                });
              } else {
                navigate('/', { 
                  state: { 
                    message: 'Welcome! Your account has been created successfully.',
                    user: apiResponse.data.user
                  } 
                });
              }
            } else {
              throw new Error(apiResponse.error || 'Google registration failed');
            }
          } catch (error: any) {
            console.error('Google OAuth backend error:', error);
            alert(error.message || 'Google registration failed. Please try again.');
          } finally {
            setIsLoading(false);
          }
        }
      });

      // Show Google One Tap prompt
      googleAuth.prompt();
      
    } catch (error: any) {
      console.error('Google OAuth initialization error:', error);
      alert('Google registration is temporarily unavailable. Please try email registration.');
      setIsLoading(false);
    }
  };

  const handleAppleRegister = () => {
    // Integrate with Apple Sign-In
    console.log('Apple registration');
    alert('Apple registration coming soon!');
  };

  const getPasswordStrength = () => {
    if (!form.password) return 0;
    let strength = 0;
    if (form.password.length >= 8) strength++;
    if (/[a-z]/.test(form.password)) strength++;
    if (/[A-Z]/.test(form.password)) strength++;
    if (/\d/.test(form.password)) strength++;
    if (/[^a-zA-Z\d]/.test(form.password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  const getRoleColor = (role: UserRole) => {
    const option = roleOptions.find(opt => opt.id === role);
    return option?.color || 'blue';
  };

  const getPageTitle = () => {
    if (isProviderRegistration) {
      return step === 'role' ? 'Choose Your Service Type' : 'Complete Your Provider Profile';
    }
    return 'Create Your Guest Account';
  };

  const getPageSubtitle = () => {
    if (isProviderRegistration) {
      return step === 'role' ? 'Select how you want to list properties with us' : 'Join our network of property providers';
    }
    return 'Start finding your perfect stay in the UAE';
  };

  const renderRoleSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Service Type</h2>
        <p className="text-gray-600">Select how you want to list properties with Krib</p>
      </div>

      <div className="space-y-4">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedRole === option.id;
          
          return (
            <div
              key={option.id}
              onClick={() => handleRoleSelect(option.id)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? `border-${option.color}-500 bg-${option.color}-50`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  isSelected 
                    ? `bg-${option.color}-100` 
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected 
                      ? `text-${option.color}-600` 
                      : 'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                    {isSelected && (
                      <CheckCircle className={`w-5 h-5 text-${option.color}-600`} />
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{option.description}</p>
                  
                  <ul className="space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={handleContinueToDetails}
        size="lg"
        className="w-full"
        disabled={!selectedRole}
      >
        Continue as {selectedRole ? roleOptions.find(r => r.id === selectedRole)?.title : 'Selection'}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          You can change your account type later in settings
        </p>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-6">
      {/* Header with selected role */}
      {isProviderRegistration && (
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('role')}
              className="mr-4"
            >
              ← Back
            </Button>
            <div className={`p-2 rounded-lg bg-${getRoleColor(form.role)}-100`}>
              {React.createElement(roleOptions.find(r => r.id === form.role)?.icon || User, {
                className: `w-5 h-5 text-${getRoleColor(form.role)}-600`
              })}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Provider Profile</h2>
          <p className="text-gray-600">
            Creating {roleOptions.find(r => r.id === form.role)?.title} account
          </p>
        </div>
      )}

      {/* UAE PASS Registration */}
      <Button
        variant="outline"
        size="lg"
        className="w-full border-accent-200 hover:border-accent-300"
        onClick={handleUAEPassRegister}
        leftIcon={<Shield className="w-5 h-5 text-accent-600" />}
      >
        Continue with UAE PASS
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="First name"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Last name"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Company Name for Agents */}
        {form.role === 'agent' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.companyName || ''}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Real estate company name"
              />
            </div>
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+971 50 123 4567"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Emirates ID (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emirates ID (Optional)
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={emiratesId}
              onChange={(e) => handleEmiratesIdChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="784-YYYY-XXXXXXX-X"
              maxLength={18}
            />
            {emiratesIdValid !== null && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {emiratesIdValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Providing your Emirates ID helps with faster verification
          </p>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nationality *
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={form.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="AE">United Arab Emirates</option>
              <option value="SA">Saudi Arabia</option>
              <option value="EG">Egypt</option>
              <option value="JO">Jordan</option>
              <option value="LB">Lebanon</option>
              <option value="IN">India</option>
              <option value="PK">Pakistan</option>
              <option value="BD">Bangladesh</option>
              <option value="PH">Philippines</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {form.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${(getPasswordStrength() / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{getPasswordStrengthText()}</span>
              </div>
            </div>
          )}
          
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className={`mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                errors.acceptTerms ? 'border-red-500' : ''
              }`}
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700 underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>

        {/* Alternative Registration */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or register with</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {/* Google Registration - Only show for guests and hosts */}
            {form.role !== 'agent' && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogleRegister}
                leftIcon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
              >
                Continue with Google
              </Button>
            )}

            {/* Show notice for agents */}
            {form.role === 'agent' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Company Registration Notice</p>
                    <p>
                      Real estate companies must register with email verification for compliance purposes. 
                      Third-party logins are not available for business accounts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Apple Registration - Only show for guests and hosts */}
            {form.role !== 'agent' && (
              <Button
                type="button"
                size="lg"
                className="w-full bg-black text-white hover:bg-gray-800 border-black"
                onClick={handleAppleRegister}
                leftIcon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                }
              >
                Continue with Apple
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 mt-2">
            {getPageSubtitle()}
          </p>
        </div>

        <Card padding="lg">
          {step === 'role' ? renderRoleSelection() : renderDetailsForm()}
        </Card>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {step === 'details' && (
          <>
            {/* Verification Notice */}
            <Card padding="md" className="mt-6 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Account Verification Required</p>
                  <p>
                    After registration, you'll need to verify your email and complete KYC verification 
                    to access all platform features. UAE residents can use Emirates ID for faster verification.
                  </p>
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Why join Krib?
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Verified properties and hosts</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700">UAE PASS integration for security</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                    <span className="text-accent-600 font-bold text-sm">AED</span>
                  </div>
                  <span className="text-gray-700">Local payments in AED</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage; 