import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        inquiryType: 'general'
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      details: ["+971 4 123 4567", "+971 50 123 4567"],
      description: "Available 24/7 for urgent matters"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      details: ["support@krib.ae", "hello@krib.ae"],
      description: "We'll respond within 2 hours"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Office Location",
      details: ["DIFC, Level 15", "Dubai, UAE"],
      description: "Monday - Friday, 9 AM - 6 PM"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      details: ["Available on website", "24/7 Support"],
      description: "Instant assistance when you need it"
    }
  ];

  const officeLocations = [
    {
      city: "Dubai",
      address: "Dubai International Financial Centre (DIFC), Level 15, Emirates Financial Towers",
      phone: "+971 4 123 4567",
      hours: "Sunday - Thursday: 9 AM - 6 PM"
    },
    {
      city: "Abu Dhabi",
      address: "World Trade Center, Tower 2, Level 10, Abu Dhabi Global Market",
      phone: "+971 2 123 4567",
      hours: "Sunday - Thursday: 9 AM - 6 PM"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed">
              We're here to help! Get in touch with our friendly support team
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-xl text-gray-600">
                Multiple ways to reach us for any questions or support
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactInfo.map((info, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-primary-600">
                      {info.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{info.title}</h3>
                  <div className="space-y-2 mb-4">
                    {info.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-gray-700 font-medium">{detail}</p>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                <p className="text-gray-600 mb-8">
                  Have a question or need assistance? Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {isSubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                    <p className="text-green-600">
                      Thank you for contacting us. We'll get back to you within 2 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="inquiryType" className="block text-sm font-semibold text-gray-900 mb-2">
                        Inquiry Type
                      </label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="booking">Booking Support</option>
                        <option value="host">Host Support</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing Question</option>
                        <option value="partnership">Partnership</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Tell us more about your question or concern..."
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </div>

              {/* Office Locations */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Offices</h2>
                <p className="text-gray-600 mb-8">
                  Visit us at one of our office locations across the UAE for in-person assistance.
                </p>

                <div className="space-y-8">
                  {officeLocations.map((office, index) => (
                    <div key={index} className="bg-gray-50 p-8 rounded-2xl">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                        {office.city} Office
                      </h3>
                      <div className="space-y-3">
                        <p className="text-gray-600">{office.address}</p>
                        <p className="text-gray-600 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-primary-600" />
                          {office.phone}
                        </p>
                        <p className="text-gray-600 flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-primary-600" />
                          {office.hours}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FAQ Quick Links */}
                <div className="mt-12 bg-primary-50 p-8 rounded-2xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Need Quick Answers?</h3>
                  <p className="text-gray-600 mb-6">
                    Check out our FAQ section for instant answers to common questions.
                  </p>
                  <div className="space-y-3">
                    <a href="#" className="block text-primary-600 hover:text-primary-700 font-medium transition-colors">
                      → How do I cancel my booking?
                    </a>
                    <a href="#" className="block text-primary-600 hover:text-primary-700 font-medium transition-colors">
                      → What payment methods do you accept?
                    </a>
                    <a href="#" className="block text-primary-600 hover:text-primary-700 font-medium transition-colors">
                      → How do I list my property?
                    </a>
                    <a href="#" className="block text-primary-600 hover:text-primary-700 font-medium transition-colors">
                      → What if I have issues during my stay?
                    </a>
                  </div>
                  <Button variant="outline" className="mt-6 w-full">
                    View All FAQs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-16 bg-red-50 border-t border-red-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Emergency Contact</h2>
            <p className="text-red-600 mb-6">
              For urgent matters during your stay or immediate assistance needed
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                <Phone className="w-5 h-5 mr-2" />
                Emergency: +971 50 911 0000
              </Button>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                <MessageSquare className="w-5 h-5 mr-2" />
                24/7 Live Chat
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage; 