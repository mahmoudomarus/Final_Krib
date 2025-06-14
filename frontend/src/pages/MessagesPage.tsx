import React from 'react';
import MessagingSystem from '../components/MessagingSystem';

const MessagesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">
            Connect with hosts, guests, and agents. Manage all your conversations in one place.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          <MessagingSystem />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 