import React, { useState } from 'react';
import { Search, Calendar, Key, Star, Camera, Users, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const HowItWorksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guest' | 'host'>('guest');

  const guestSteps = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Search & Discover",
      description: "Browse thousands of verified properties across all seven Emirates. Use our advanced filters to find exactly what you're looking for.",
      details: [
        "Filter by location, price, amenities, and property type",
        "View high-quality photos and detailed descriptions",
        "Read genuine reviews from previous guests",
        "Compare prices and availability instantly"
      ]
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Book with Confidence",
      description: "Reserve your perfect stay with our secure booking system. Choose from instant bookings or send requests to hosts.",
      details: [
        "Secure payment processing with multiple options",
        "Instant confirmation for most properties",
        "Flexible cancellation policies",
        "24/7 customer support in Arabic and English"
      ]
    },
    {
      icon: <Key className="w-8 h-8" />,
      title: "Check-in & Enjoy",
      description: "Arrive at your destination and enjoy a seamless check-in experience with your verified host.",
      details: [
        "Digital check-in instructions sent to your phone",
        "Meet your host or follow self-check-in procedures",
        "Access to local recommendations and support",
        "Emergency contact available 24/7"
      ]
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Share Your Experience",
      description: "After your stay, share your experience to help future guests and maintain our quality standards.",
      details: [
        "Rate your stay and leave detailed reviews",
        "Upload photos of your experience",
        "Provide feedback to help hosts improve",
        "Build your traveler reputation on Krib"
      ]
    }
  ];

  const hostSteps = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "List Your Property",
      description: "Create an attractive listing with professional photos and detailed descriptions to showcase your space.",
      details: [
        "Professional photography tips and guidelines",
        "Detailed listing optimization support",
        "Pricing recommendations based on market data",
        "Help with writing compelling descriptions"
      ]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Welcome Guests",
      description: "Receive booking requests and communicate with potential guests to ensure the perfect match.",
      details: [
        "Smart calendar management system",
        "Guest screening and verification process",
        "Messaging system for seamless communication",
        "Automated booking confirmations and reminders"
      ]
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Earn & Get Paid",
      description: "Set your own prices and receive secure payments directly to your bank account.",
      details: [
        "Flexible pricing controls and dynamic pricing tools",
        "Secure payment processing and protection",
        "Fast payouts within 24 hours",
        "Detailed earnings tracking and reporting"
      ]
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Build Your Reputation",
      description: "Provide excellent service to build positive reviews and become a Superhost on our platform.",
      details: [
        "Guest review system to build trust",
        "Superhost program with exclusive benefits",
        "Performance insights and improvement tips",
        "Access to host community and resources"
      ]
    }
  ];

  const currentSteps = activeTab === 'guest' ? guestSteps : hostSteps;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              How Krib Works
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed">
              Your complete guide to booking amazing stays or hosting guests in the UAE
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="flex bg-gray-100 rounded-full p-1 my-6">
              <button
                onClick={() => setActiveTab('guest')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 ${
                  activeTab === 'guest'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Guests
              </button>
              <button
                onClick={() => setActiveTab('host')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 ${
                  activeTab === 'host'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Hosts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {activeTab === 'guest' ? 'Book Your Perfect Stay' : 'Start Hosting Today'}
              </h2>
              <p className="text-xl text-gray-600">
                {activeTab === 'guest' 
                  ? 'Follow these simple steps to find and book amazing accommodation in the UAE'
                  : 'Turn your property into a profitable hospitality business with our platform'
                }
              </p>
            </div>

            <div className="space-y-16">
              {currentSteps.map((step, index) => (
                <div key={index} className="flex flex-col lg:flex-row items-center gap-12">
                  {index % 2 === 0 ? (
                    <>
                      {/* Content */}
                      <div className="lg:w-1/2">
                        <div className="flex items-center mb-6">
                          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white mr-6">
                            {step.icon}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-primary-600 mb-1">
                              Step {index + 1}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                          </div>
                        </div>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                          {step.description}
                        </p>
                        <ul className="space-y-3">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start">
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Image */}
                      <div className="lg:w-1/2">
                        <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-8 h-80 flex items-center justify-center">
                          <div className="text-primary-600 text-6xl">
                            {step.icon}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Image */}
                      <div className="lg:w-1/2 order-2 lg:order-1">
                        <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-8 h-80 flex items-center justify-center">
                          <div className="text-primary-600 text-6xl">
                            {step.icon}
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="lg:w-1/2 order-1 lg:order-2">
                        <div className="flex items-center mb-6">
                          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white mr-6">
                            {step.icon}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-primary-600 mb-1">
                              Step {index + 1}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                          </div>
                        </div>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                          {step.description}
                        </p>
                        <ul className="space-y-3">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start">
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose Krib?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verified & Secure</h3>
                <p className="text-gray-600">
                  All properties and users are verified. Secure payments and comprehensive insurance coverage.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Guaranteed</h3>
                <p className="text-gray-600">
                  Curated properties that meet our high standards. Professional cleaning and maintenance included.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Support</h3>
                <p className="text-gray-600">
                  Round-the-clock customer support in Arabic and English. Local assistance whenever you need it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Host Benefits Section - Only show when host tab is active */}
      {activeTab === 'host' && (
        <section className="py-20 bg-gradient-to-br from-gold-50 to-gold-100">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Ready to Start Hosting?
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Join thousands of hosts earning extra income by sharing their properties with travelers
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Earn Extra Income</h3>
                  <p className="text-gray-600 mb-4">
                    Average hosts earn AED 3,500-8,000 per month by renting out their spare room or property.
                  </p>
                  <div className="text-2xl font-bold text-green-600">AED 5,750</div>
                  <div className="text-sm text-gray-500">Average monthly earnings</div>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Meet New People</h3>
                  <p className="text-gray-600 mb-4">
                    Connect with travelers from around the world and share your local knowledge of the UAE.
                  </p>
                  <div className="text-2xl font-bold text-blue-600">190+</div>
                  <div className="text-sm text-gray-500">Countries represented</div>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center md:col-span-2 lg:col-span-1">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Full Support</h3>
                  <p className="text-gray-600 mb-4">
                    We provide 24/7 support, secure payments, and comprehensive host protection coverage.
                  </p>
                  <div className="text-2xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-gray-500">Support available</div>
                </div>
              </div>
              
              <div className="text-center">
                <Button size="lg" className="text-lg px-8 py-4">
                  Start Hosting Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-sm text-gray-600 mt-4">
                  It takes less than 10 minutes to create your first listing
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {activeTab === 'guest' ? 'Ready to Book Your Stay?' : 'Ready to Start Hosting?'}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {activeTab === 'guest' 
                ? 'Join thousands of travelers who trust Krib for their UAE accommodation'
                : 'Join our community of successful hosts earning extra income'
              }
            </p>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4">
              {activeTab === 'guest' ? 'Start Searching' : 'List Your Property'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage; 