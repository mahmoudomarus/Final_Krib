import React from 'react';
import { Calendar, Shield, CreditCard, AlertCircle } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed">
              Please read these terms carefully before using our platform
            </p>
            <p className="text-primary-200 mt-4">
              Last updated: January 2024
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Welcome to Krib ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our platform 
              and services that connect guests with hosts for short-term and long-term accommodation rentals in the UAE.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using our platform, you agree to be bound by these Terms. If you disagree with any part 
              of these terms, then you may not access our service.
            </p>
          </section>

          {/* Key Terms */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. Key Terms & Definitions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">"Platform"</h3>
                <p className="text-gray-600">Refers to Krib's website, mobile applications, and related services.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">"Host"</h3>
                <p className="text-gray-600">A member who lists accommodation on our platform.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">"Guest"</h3>
                <p className="text-gray-600">A member who books accommodation through our platform.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">"Listing"</h3>
                <p className="text-gray-600">An accommodation offered by a Host on our platform.</p>
              </div>
            </div>
          </section>

          {/* Booking & Payments */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <CreditCard className="w-8 h-8 mr-3 text-primary-600" />
              3. Booking & Payments
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Booking Process</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• All bookings are subject to Host acceptance and availability</li>
                  <li>• Payment is processed at the time of booking confirmation</li>
                  <li>• Booking fees and service charges are non-refundable unless specified</li>
                  <li>• Guests must be 18 years or older to make a booking</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Terms</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Payments are processed in UAE Dirhams (AED)</li>
                  <li>• We accept major credit cards, debit cards, and digital payment methods</li>
                  <li>• Host payouts are processed within 24 hours of guest check-in</li>
                  <li>• All prices include applicable VAT as per UAE regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-8 h-8 mr-3 text-primary-600" />
              4. Cancellation Policy
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Guest Cancellations</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Flexible:</strong> Full refund if cancelled 24 hours before check-in</li>
                  <li>• <strong>Moderate:</strong> Full refund if cancelled 5 days before check-in</li>
                  <li>• <strong>Strict:</strong> 50% refund if cancelled 14 days before check-in</li>
                  <li>• Service fees are non-refundable except in specific circumstances</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Host Cancellations</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Hosts may face penalties for cancelling confirmed bookings</li>
                  <li>• Guests receive full refunds for Host-initiated cancellations</li>
                  <li>• Emergency cancellations due to force majeure are evaluated case-by-case</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-primary-600" />
              5. User Responsibilities
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Guest Responsibilities</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Provide accurate information during booking</li>
                  <li>• Respect the property and follow house rules</li>
                  <li>• Communicate any issues promptly</li>
                  <li>• Comply with local laws and regulations</li>
                  <li>• Report damages or incidents immediately</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Host Responsibilities</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Provide accurate listing information</li>
                  <li>• Maintain property in good condition</li>
                  <li>• Respond to guest inquiries promptly</li>
                  <li>• Comply with UAE licensing requirements</li>
                  <li>• Ensure guest safety and security</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="w-8 h-8 mr-3 text-red-600" />
              6. Prohibited Activities
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">The following activities are strictly prohibited:</p>
              <ul className="space-y-2 text-gray-600">
                <li>• Using the platform for illegal activities</li>
                <li>• Hosting events without proper permissions</li>
                <li>• Discriminating against guests or hosts</li>
                <li>• Providing false information or fraudulent bookings</li>
                <li>• Circumventing our platform for payments</li>
                <li>• Violating UAE laws or local regulations</li>
                <li>• Damaging property or disturbing neighbors</li>
                <li>• Using the platform for commercial purposes without authorization</li>
              </ul>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Dispute Resolution</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We encourage users to resolve disputes directly through our platform's messaging system. 
              If direct resolution fails, our support team will mediate disputes fairly.
            </p>
            <p className="text-gray-600 leading-relaxed">
              For legal disputes, these Terms shall be governed by the laws of the United Arab Emirates, 
              and any disputes shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Krib acts as an intermediary platform. We are not responsible for the conduct of Hosts or Guests, 
              the condition of properties, or any disputes that may arise between users.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our liability is limited to the extent permitted by UAE law. We provide our service "as is" 
              and make no warranties regarding availability, accuracy, or reliability.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">9. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be posted on this page 
              with an updated effective date. Continued use of our platform after changes constitutes acceptance 
              of the modified Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12 bg-gray-50 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> legal@krib.ae</p>
              <p><strong>Phone:</strong> +971 4 123 4567</p>
              <p><strong>Address:</strong> DIFC, Level 15, Emirates Financial Towers, Dubai, UAE</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage; 