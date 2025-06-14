import React from 'react';
import { Shield, Eye, Database, Lock, Users, Globe } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed">
              Your privacy is important to us. Learn how we protect your data.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-primary-600" />
              1. Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              At Krib, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p className="text-gray-600 leading-relaxed">
              This policy applies to all users of Krib, including guests, hosts, and visitors to our website and mobile applications.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Database className="w-8 h-8 mr-3 text-primary-600" />
              2. Information We Collect
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <ul className="space-y-2 text-gray-600">
                    <li>• <strong>Account Information:</strong> Name, email address, phone number, date of birth</li>
                    <li>• <strong>Profile Information:</strong> Profile photo, bio, emergency contacts</li>
                    <li>• <strong>Identity Verification:</strong> Government-issued ID, passport information</li>
                    <li>• <strong>Payment Information:</strong> Credit card details, billing address, transaction history</li>
                    <li>• <strong>Communication Data:</strong> Messages between users, support communications</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Information (Hosts)</h3>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <ul className="space-y-2 text-gray-600">
                    <li>• Property details, photos, and descriptions</li>
                    <li>• Location and address information</li>
                    <li>• Pricing and availability data</li>
                    <li>• Property licensing and permits</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Information</h3>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <ul className="space-y-2 text-gray-600">
                    <li>• Device information (IP address, browser type, operating system)</li>
                    <li>• Usage data (pages visited, time spent, search queries)</li>
                    <li>• Location data (with your permission)</li>
                    <li>• Cookies and tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Eye className="w-8 h-8 mr-3 text-primary-600" />
              3. How We Use Your Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Operations</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Process bookings and payments</li>
                  <li>• Verify user identities</li>
                  <li>• Facilitate communication between users</li>
                  <li>• Provide customer support</li>
                  <li>• Maintain platform security</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Improvements & Marketing</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Improve our services and user experience</li>
                  <li>• Send relevant marketing communications</li>
                  <li>• Personalize content and recommendations</li>
                  <li>• Conduct research and analytics</li>
                  <li>• Comply with legal requirements</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="w-8 h-8 mr-3 text-primary-600" />
              4. Information Sharing
            </h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">With Other Users</h3>
                <p className="text-gray-600">
                  We share necessary information between guests and hosts to facilitate bookings, 
                  including contact details, profile information, and booking-related data.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">With Service Providers</h3>
                <p className="text-gray-600">
                  We work with trusted third parties for payment processing, identity verification, 
                  customer support, and other business operations. These partners are bound by strict 
                  confidentiality agreements.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Requirements</h3>
                <p className="text-gray-600">
                  We may disclose information when required by law, legal process, or to protect 
                  the rights, property, and safety of Krib, our users, or others.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Lock className="w-8 h-8 mr-3 text-primary-600" />
              5. Data Security
            </h2>
            
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-8 rounded-2xl">
              <p className="text-gray-700 mb-6">
                We implement industry-standard security measures to protect your personal information:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Technical Safeguards</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• SSL encryption for data transmission</li>
                    <li>• Secure data storage and backup systems</li>
                    <li>• Regular security audits and testing</li>
                    <li>• Access controls and authentication</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Operational Safeguards</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Employee training on data protection</li>
                    <li>• Limited access on need-to-know basis</li>
                    <li>• Incident response procedures</li>
                    <li>• Regular policy reviews and updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <Globe className="w-8 h-8 mr-3 text-primary-600" />
              6. Your Privacy Rights
            </h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access & Portability</h3>
                <p className="text-gray-600">Request a copy of your personal data and receive it in a portable format.</p>
              </div>
              
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Correction & Updates</h3>
                <p className="text-gray-600">Update or correct your personal information through your account settings.</p>
              </div>
              
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Deletion</h3>
                <p className="text-gray-600">Request deletion of your account and associated data (subject to legal requirements).</p>
              </div>
              
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Opt-out</h3>
                <p className="text-gray-600">Unsubscribe from marketing communications at any time.</p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• Account information: Retained while your account is active</li>
              <li>• Transaction records: 7 years for tax and legal compliance</li>
              <li>• Communication data: 3 years for support and safety purposes</li>
              <li>• Usage analytics: Anonymized after 2 years</li>
            </ul>
          </section>

          {/* International Transfers */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. International Data Transfers</h2>
            <p className="text-gray-600 leading-relaxed">
              Your information may be transferred to and processed in countries other than the UAE. 
              We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy 
              and applicable data protection laws.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">9. Children's Privacy</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <p className="text-gray-700">
                Krib is not intended for users under 18 years of age. We do not knowingly collect personal 
                information from children under 18. If you become aware that a child has provided us with 
                personal information, please contact us immediately.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12 bg-gray-50 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">11. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> privacy@krib.ae</p>
              <p><strong>Phone:</strong> +971 4 123 4567</p>
              <p><strong>Address:</strong> DIFC, Level 15, Emirates Financial Towers, Dubai, UAE</p>
              <p><strong>Data Protection Officer:</strong> dpo@krib.ae</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage; 