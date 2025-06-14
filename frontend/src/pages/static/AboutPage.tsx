import React from 'react';
import { Shield, Award, Heart, Users, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Krib
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed">
              Connecting travelers and residents with exceptional accommodation experiences across the UAE
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                To make finding and booking quality accommodation in the UAE as seamless as possible, 
                whether you're visiting for a few days or looking for a long-term home.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop&q=80"
                  alt="Dubai skyline" 
                  className="rounded-xl shadow-lg w-full"
                />
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Redefining Hospitality in the UAE</h3>
                <p className="text-gray-600 leading-relaxed">
                  Founded in 2024, Krib emerged from a simple observation: finding quality, 
                  verified accommodation in the UAE shouldn't be complicated or stressful. 
                  We've built a platform that prioritizes trust, transparency, and exceptional experiences.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  From luxury apartments in Dubai Marina to family homes in Abu Dhabi, 
                  we connect you with hosts who care about providing authentic UAE experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Krib Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Krib?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the best of UAE hospitality with our verified properties and trusted hosts
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center p-6 lg:p-8">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 lg:w-10 lg:h-10 text-primary-600" />
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                  Verified Properties
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  All properties are verified and comply with UAE regulations and safety standards. 
                  We conduct thorough inspections to ensure quality and authenticity.
                </p>
              </div>
              
              <div className="text-center p-6 lg:p-8">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 lg:w-10 lg:h-10 text-gold-600" />
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                  Trusted Hosts
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with verified hosts who provide exceptional hospitality and local insights. 
                  Each host is background-checked and committed to excellence.
                </p>
              </div>
              
              <div className="text-center p-6 lg:p-8">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 lg:w-10 lg:h-10 text-success-600" />
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                  24/7 Support
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Round-the-clock customer support in Arabic and English for all your needs. 
                  Our dedicated team is always ready to assist you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
              <p className="text-xl text-gray-600">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Trust & Safety</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every property and host is verified. We implement comprehensive safety measures 
                  to ensure secure transactions and reliable accommodations.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Exceptional Service</h3>
                <p className="text-gray-600 leading-relaxed">
                  We go beyond just bookings. Our team provides 24/7 support in Arabic and English 
                  to ensure every experience exceeds expectations.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quality First</h3>
                <p className="text-gray-600 leading-relaxed">
                  We curate only the finest properties that meet our high standards for 
                  comfort, cleanliness, and authentic UAE hospitality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Krib by the Numbers</h2>
              <p className="text-xl text-primary-100">
                Building trust through transparency
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">2,500+</div>
                <div className="text-primary-100">Verified Properties</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">7</div>
                <div className="text-primary-100">Emirates Covered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">15,000+</div>
                <div className="text-primary-100">Happy Guests</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">4.8★</div>
                <div className="text-primary-100">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
              <p className="text-xl text-gray-600">
                The passionate people behind Krib
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80"
                  alt="Mohammed Sahal" 
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mohammed Sahal</h3>
                <p className="text-primary-600 font-medium mb-3">CEO & Founder</p>
                <p className="text-gray-600 text-sm">
                  Former hospitality executive with 15+ years of experience in UAE tourism industry.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&q=80"
                  alt="Shazib Sahal" 
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Shazib Sahal</h3>
                <p className="text-primary-600 font-medium mb-3">CTO</p>
                <p className="text-gray-600 text-sm">
                  Tech innovator passionate about creating seamless digital experiences for travelers.
                </p>
              </div>

              <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80"
                  alt="Ahmed Sahal" 
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ahmed Sahal</h3>
                <p className="text-primary-600 font-medium mb-3">Head of Operations</p>
                <p className="text-gray-600 text-sm">
                  Operations expert ensuring every property meets our high standards for quality and safety.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Experience UAE Hospitality?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of travelers who trust Krib for their UAE accommodation needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4">
                <MapPin className="w-5 h-5 mr-2" />
                Find Your Stay
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Users className="w-5 h-5 mr-2" />
                List with Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage; 