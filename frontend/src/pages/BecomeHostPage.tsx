import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { 
  Home, 
  DollarSign, 
  Calendar, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Star,
  Users,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const BecomeHostPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [formData, setFormData] = useState({
    propertyType: '',
    propertyLocation: '',
    expectedEarnings: '',
    hostingExperience: '',
    motivation: ''
  });

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Extra Income',
      description: 'Generate revenue from your property with competitive rates in the UAE market'
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Set your own availability and manage bookings on your terms'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Protected payments, verified guests, and comprehensive insurance coverage'
    },
    {
      icon: Users,
      title: 'Global Reach',
      description: 'Connect with travelers from around the world visiting the UAE'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Upgrade Account',
      description: 'Complete your host profile and verification'
    },
    {
      number: 2,
      title: 'List Property',
      description: 'Add photos, amenities, and pricing details'
    },
    {
      number: 3,
      title: 'Start Hosting',
      description: 'Receive bookings and welcome guests'
    }
  ];

  const handleUpgradeToHost = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiService.post('/auth/upgrade-role', {
        targetRole: 'host',
        additionalInfo: formData
      }) as { success: boolean; error?: string };

      if (response.success) {
        await refreshUser();
        setStep('success');
      } else {
        throw new Error(response.error || 'Failed to upgrade account');
      }
    } catch (error: any) {
      console.error('Account upgrade failed:', error);
      alert(error.message || 'Failed to upgrade account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (user?.is_host) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Already a Host!</h2>
          <p className="text-gray-600 mb-6">
            Your account is already set up for hosting. Start managing your properties.
          </p>
          <Button onClick={() => navigate('/host/dashboard')} className="w-full">
            Go to Host Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Hosting!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been upgraded successfully. You can now start listing your properties.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/host/dashboard')} className="w-full">
              Go to Host Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/host/properties/new')} 
              className="w-full"
            >
              Add Your First Property
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Host Profile</h1>
            <p className="text-gray-600">Help us understand your hosting goals</p>
          </div>

          <Card padding="lg">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of property do you want to host?
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select property type</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="studio">Studio</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>

              <div>
                <Input
                  label="Property Location (Emirate/Area)"
                  value={formData.propertyLocation}
                  onChange={(e) => handleInputChange('propertyLocation', e.target.value)}
                  placeholder="e.g., Dubai Marina, Abu Dhabi Downtown"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected monthly earnings (AED)
                </label>
                <select
                  value={formData.expectedEarnings}
                  onChange={(e) => handleInputChange('expectedEarnings', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select range</option>
                  <option value="5000-10000">5,000 - 10,000 AED</option>
                  <option value="10000-20000">10,000 - 20,000 AED</option>
                  <option value="20000-30000">20,000 - 30,000 AED</option>
                  <option value="30000+">30,000+ AED</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hosting experience
                </label>
                <select
                  value={formData.hostingExperience}
                  onChange={(e) => handleInputChange('hostingExperience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select experience level</option>
                  <option value="new">New to hosting</option>
                  <option value="some">Some experience</option>
                  <option value="experienced">Experienced host</option>
                  <option value="professional">Professional property manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What motivates you to become a host?
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us about your hosting goals..."
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleUpgradeToHost}
                  disabled={isLoading || !formData.propertyType || !formData.propertyLocation}
                  className="flex-1"
                >
                  {isLoading ? 'Upgrading...' : 'Become a Host'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Hero Section */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Become a Host and Start Earning
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Turn your property into a source of income. Join thousands of hosts in the UAE 
            who are earning money by sharing their spaces with travelers.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="ml-2 text-gray-600">4.9/5 from 2,000+ hosts</span>
            </div>
          </div>
          <Button 
            size="lg" 
            onClick={() => setStep('form')}
            className="px-8 py-4 text-lg"
          >
            Start Hosting Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Host with Krib?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} padding="lg" className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Potential */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Earning Potential in the UAE
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">15,000 AED</div>
              <div className="text-sm text-gray-600">Average monthly earnings</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Home className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600">Average occupancy rate</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">450 AED</div>
              <div className="text-sm text-gray-600">Average nightly rate</div>
            </div>
          </div>
          <Button 
            size="lg" 
            onClick={() => setStep('form')}
            className="px-8 py-4"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BecomeHostPage; 