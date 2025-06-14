import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Home, 
  Building, 
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Shield,
  Users
} from 'lucide-react';

const ListWithUsPage: React.FC = () => {
  const navigate = useNavigate();

  const providerTypes = [
    {
      id: 'host',
      title: 'Property Host',
      subtitle: 'Short-term Vacation Rentals',
      description: 'List your properties for tourists and short-term stays',
      icon: Home,
      color: 'green',
      features: [
        'List vacation rental properties',
        'Manage short-term bookings',
        'Set nightly pricing',
        'Earn from tourism rentals',
        'Professional photography support',
        'Marketing on multiple platforms'
      ],
      benefits: [
        'Up to 30% higher income than traditional rentals',
        'Flexible hosting schedule',
        'Professional guest screening',
        '24/7 customer support'
      ],
      cta: 'Start Hosting',
      popular: true
    },
    {
      id: 'agent',
      title: 'Real Estate Agent',
      subtitle: 'Long-term Rental Management',
      description: 'Professional agent managing long-term rental properties for clients',
      icon: Building,
      color: 'purple',
      features: [
        'Manage long-term rental properties',
        'Handle tenant applications',
        'Process lease agreements',
        'Earn commission on deals',
        'Client portfolio management',
        'Legal document support'
      ],
      benefits: [
        'Competitive commission structure',
        'Lead generation support',
        'Professional tools and CRM',
        'Training and certification'
      ],
      cta: 'Join as a Company',
      popular: false
    }
  ];

  const handleGetStarted = (type: 'host' | 'agent') => {
    if (type === 'agent') {
      // Direct agents to their separate listers registration system
      navigate('/listers/register');
    } else {
      // Direct hosts to main registration with type parameter
      navigate(`/register?type=${type}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Hero Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            List with <span className="text-primary-600">Krib</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join the UAE's premier rental platform and start earning from your properties. 
            Whether you're hosting vacation rentals or managing long-term properties, we have the right solution for you.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">10,000+</div>
              <div className="text-gray-600">Active Properties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">95%</div>
              <div className="text-gray-600">Host Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">AED 50M+</div>
              <div className="text-gray-600">Host Earnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Types */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Path
            </h2>
            <p className="text-lg text-gray-600">
              Select the option that best describes your property management goals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {providerTypes.map((type) => {
              const Icon = type.icon;
              
              return (
                <Card 
                  key={type.id} 
                  padding="none" 
                  className={`relative overflow-hidden border-2 transition-all duration-200 hover:shadow-xl ${
                    type.popular ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {type.popular && (
                    <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start space-x-4 mb-6">
                      <div className={`p-3 rounded-lg bg-${type.color}-100`}>
                        <Icon className={`w-8 h-8 text-${type.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {type.title}
                        </h3>
                        <p className={`text-sm font-medium text-${type.color}-600 mb-2`}>
                          {type.subtitle}
                        </p>
                        <p className="text-gray-600">
                          {type.description}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">What you can do:</h4>
                      <ul className="space-y-2">
                        {type.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Benefits */}
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-3">Key benefits:</h4>
                      <ul className="space-y-2">
                        {type.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500 mr-3 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => handleGetStarted(type.id as 'host' | 'agent')}
                      size="lg"
                      className={`w-full ${
                        type.popular 
                          ? 'bg-primary-600 hover:bg-primary-700' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {type.cta}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Why Choose Krib */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Krib?
            </h2>
            <p className="text-lg text-gray-600">
              We provide everything you need to succeed in the UAE rental market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Maximize Earnings
              </h3>
              <p className="text-gray-600">
                Our dynamic pricing and marketing tools help you earn up to 30% more than traditional rentals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Protected
              </h3>
              <p className="text-gray-600">
                Comprehensive insurance coverage, verified guests, and secure payment processing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Expert Support
              </h3>
              <p className="text-gray-600">
                24/7 customer support, professional photography, and dedicated account management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of successful property owners and agents on Krib
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => handleGetStarted('host')}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700"
            >
              Start as Host
            </Button>
            <Button
              onClick={() => handleGetStarted('agent')}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              Join as a Company
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListWithUsPage; 