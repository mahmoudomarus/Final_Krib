import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Shield, 
  CreditCard, 
  Upload, 
  Check, 
  X, 
  Edit3, 
  Save, 
  AlertCircle,
  FileText,
  Globe,
  Building,
  Star,
  Plus,
  Trash2,
  Clock,
  RefreshCw,
  DollarSign,
  Users,
  Eye,
  MessageCircle
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  nationality?: string;
  avatar?: string;
  date_of_birth?: string;
  gender?: string;
  occupation?: string;
  address?: string;
  city?: string;
  emirate?: string;
  country?: string;
  emirates_id?: string;
  passport_number?: string;
  visa_status?: string;
  is_verified: boolean;
  verification_level?: string;
  kyc_status?: string;
  created_at: string;
  profile_type?: 'guest' | 'host' | 'agent';
  is_host?: boolean;
  is_agent?: boolean;
  
  // Agent/Company specific fields
  company_name?: string;
  company_registration_number?: string;
  business_license?: string;
  company_address?: string;
  company_phone?: string;
  company_website?: string;
  agent_license_number?: string;
  years_experience?: number;
  specializations?: string[];
  company_logo?: string;
  
  // Host specific fields
  host_description?: string;
  host_response_rate?: number;
  host_response_time?: string;
  host_languages?: string[];
  
  // Guest specific fields
  guest_preferences?: any;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer';
  last_four?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  bank_name?: string;
  account_number?: string;
  is_default: boolean;
  created_at: string;
}

interface WishlistItem {
  id: string;
  property_id: string;
  property_title: string;
  property_image?: string;
  property_price?: number;
  property_location?: string;
  property_type?: string;
  notes?: string;
  added_at: string;
}

interface RecentlyViewedItem {
  id: string;
  property_id: string;
  property_title: string;
  property_image?: string;
  property_price?: number;
  property_location?: string;
  property_type?: string;
  viewed_at: string;
  view_count: number;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'personal' | 'verification' | 'payment' | 'bookings' | 'security'>('bookings');
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPaymentMethods();
    fetchWishlist();
    fetchRecentlyViewed();
    fetchBookings();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setEditedProfile(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/methods', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentMethods(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setEditMode(false);
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const uploadDocument = async (file: File, documentType: 'emirates_id' | 'passport') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        await fetchProfile();
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setWishlist(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  };

  const fetchRecentlyViewed = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wishlist/recently-viewed?limit=6', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setRecentlyViewed(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch recently viewed:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setBookings(result.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const removeFromWishlist = async (propertyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/wishlist/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setWishlist(wishlist.filter(item => item.property_id !== propertyId));
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const addPaymentMethod = async (paymentData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        await fetchPaymentMethods();
        setShowAddPayment(false);
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getVerificationStatus = () => {
    if (profile.is_verified && profile.verification_level === 'full') {
      return { status: 'verified', color: 'text-green-600 bg-green-50', icon: Check };
    } else if (profile.kyc_status === 'pending') {
      return { status: 'pending', color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle };
    } else {
      return { status: 'unverified', color: 'text-red-600 bg-red-50', icon: X };
    }
  };

  const verification = getVerificationStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h1>
                <div className="flex items-center mt-1">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">{profile.email}</span>
                  <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${verification.color} flex items-center`}>
                    <verification.icon className="w-3 h-3 mr-1" />
                    {verification.status === 'verified' ? 'Verified' : 
                     verification.status === 'pending' ? 'Verification Pending' : 'Unverified'}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => editMode ? updateProfile() : setEditMode(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editMode ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {editMode ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'bookings', label: 'My Bookings', icon: Calendar },
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'verification', label: 'Verification', icon: Shield },
            { id: 'payment', label: 'Payment Methods', icon: CreditCard },
            { id: 'security', label: 'Security', icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={editMode ? editedProfile.first_name || '' : profile.first_name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editMode ? editedProfile.last_name || '' : profile.last_name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editMode ? editedProfile.phone || '' : profile.phone || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    disabled={!editMode}
                    placeholder="Not provided"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={editMode ? editedProfile.date_of_birth || '' : profile.date_of_birth || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                  <input
                    type="text"
                    value={editMode ? editedProfile.nationality || '' : profile.nationality || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, nationality: e.target.value })}
                    disabled={!editMode}
                    placeholder="Not provided"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                  <input
                    type="text"
                    value={editMode ? editedProfile.occupation || '' : profile.occupation || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, occupation: e.target.value })}
                    disabled={!editMode}
                    placeholder="Not provided"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editMode ? editedProfile.address || '' : profile.address || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                    disabled={!editMode}
                    placeholder="Not provided"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={editMode ? editedProfile.city || '' : profile.city || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                    disabled={!editMode}
                    placeholder="Not provided"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emirate</label>
                  <select
                    value={editMode ? editedProfile.emirate || '' : profile.emirate || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, emirate: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select Emirate</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                </div>
              </div>

              {/* Role-specific sections */}
              {profile.is_agent && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={editMode ? editedProfile.company_name || '' : profile.company_name || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, company_name: e.target.value })}
                        disabled={!editMode}
                        placeholder="Your company name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Agent License Number</label>
                      <input
                        type="text"
                        value={editMode ? editedProfile.agent_license_number || '' : profile.agent_license_number || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, agent_license_number: e.target.value })}
                        disabled={!editMode}
                        placeholder="Real estate license number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={editMode ? editedProfile.years_experience || '' : profile.years_experience || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, years_experience: parseInt(e.target.value) || 0 })}
                        disabled={!editMode}
                        placeholder="Years in real estate"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
                      <input
                        type="tel"
                        value={editMode ? editedProfile.company_phone || '' : profile.company_phone || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, company_phone: e.target.value })}
                        disabled={!editMode}
                        placeholder="Company phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Website</label>
                      <input
                        type="url"
                        value={editMode ? editedProfile.company_website || '' : profile.company_website || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, company_website: e.target.value })}
                        disabled={!editMode}
                        placeholder="https://yourcompany.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={editMode ? editedProfile.company_registration_number || '' : profile.company_registration_number || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, company_registration_number: e.target.value })}
                        disabled={!editMode}
                        placeholder="Company registration number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                      <textarea
                        value={editMode ? editedProfile.company_address || '' : profile.company_address || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, company_address: e.target.value })}
                        disabled={!editMode}
                        placeholder="Company address"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {profile.is_host && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Host Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Host Description</label>
                      <textarea
                        value={editMode ? editedProfile.host_description || '' : profile.host_description || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, host_description: e.target.value })}
                        disabled={!editMode}
                        placeholder="Tell guests about yourself and your hosting style"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Response Time</label>
                      <select
                        value={editMode ? editedProfile.host_response_time || '' : profile.host_response_time || ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, host_response_time: e.target.value })}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      >
                        <option value="">Select response time</option>
                        <option value="within an hour">Within an hour</option>
                        <option value="within a few hours">Within a few hours</option>
                        <option value="within a day">Within a day</option>
                        <option value="within a few days">Within a few days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                      <input
                        type="text"
                        value={editMode ? (editedProfile.host_languages || []).join(', ') : (profile.host_languages || []).join(', ')}
                        onChange={(e) => setEditedProfile({ ...editedProfile, host_languages: e.target.value.split(', ').filter(l => l.trim()) })}
                        disabled={!editMode}
                        placeholder="English, Arabic, Hindi"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!profile.is_host && !profile.is_agent && (
                <>
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <User className="w-5 h-5 mr-2 text-green-600" />
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                        <input
                          type="text"
                          value={editMode ? editedProfile.emergency_contact_name || '' : profile.emergency_contact_name || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, emergency_contact_name: e.target.value })}
                          disabled={!editMode}
                          placeholder="Full name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          value={editMode ? editedProfile.emergency_contact_phone || '' : profile.emergency_contact_phone || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, emergency_contact_phone: e.target.value })}
                          disabled={!editMode}
                          placeholder="+971501234567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                        <select
                          value={editMode ? editedProfile.emergency_contact_relationship || '' : profile.emergency_contact_relationship || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, emergency_contact_relationship: e.target.value })}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        >
                          <option value="">Select relationship</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                          <option value="child">Child</option>
                          <option value="friend">Friend</option>
                          <option value="colleague">Colleague</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Wishlist Section */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-pink-600" />
                      My Wishlist ({wishlist.length})
                    </h3>
                    {wishlist.length === 0 ? (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Properties in Wishlist</h4>
                        <p className="text-gray-600 mb-4">Start browsing properties and add them to your wishlist to see them here</p>
                        <button className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                          Browse Properties
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlist.slice(0, 6).map((item) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{item.property_title}</h4>
                              <button
                                onClick={() => removeFromWishlist(item.property_id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {item.property_location && (
                              <div className="flex items-center text-xs text-gray-600 mb-2">
                                <MapPin className="w-3 h-3 mr-1" />
                                {item.property_location}
                              </div>
                            )}
                            {item.property_price && (
                              <div className="text-sm font-semibold text-green-600 mb-2">
                                AED {item.property_price.toLocaleString()}/month
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-xs text-gray-600 italic">"{item.notes}"</p>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              Added {new Date(item.added_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recently Viewed Section */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-purple-600" />
                      Recently Viewed ({recentlyViewed.length})
                    </h3>
                    {recentlyViewed.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Recently Viewed Properties</h4>
                        <p className="text-gray-600">Properties you view will appear here for easy access</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentlyViewed.map((item) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h4 className="font-medium text-gray-900 text-sm mb-2">{item.property_title}</h4>
                            {item.property_location && (
                              <div className="flex items-center text-xs text-gray-600 mb-2">
                                <MapPin className="w-3 h-3 mr-1" />
                                {item.property_location}
                              </div>
                            )}
                            {item.property_price && (
                              <div className="text-sm font-semibold text-green-600 mb-2">
                                AED {item.property_price.toLocaleString()}/month
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>Viewed {item.view_count} time{item.view_count !== 1 ? 's' : ''}</span>
                              <span>{new Date(item.viewed_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Identity Verification</h2>
              
              {/* Verification Status */}
              <div className={`p-4 rounded-lg mb-6 ${verification.color} border`}>
                <div className="flex items-center">
                  <verification.icon className="w-5 h-5 mr-3" />
                  <div>
                    <h3 className="font-medium">
                      {verification.status === 'verified' ? 'Identity Verified' : 
                       verification.status === 'pending' ? 'Verification Pending' : 'Identity Not Verified'}
                    </h3>
                    <p className="text-sm mt-1">
                      {verification.status === 'verified' ? 'Your identity has been successfully verified.' : 
                       verification.status === 'pending' ? 'Your documents are being reviewed. This usually takes 24-48 hours.' : 
                       'Please upload your documents to verify your identity.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
                  
                  {/* Emirates ID */}
                  <div className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-900">Emirates ID</h4>
                          <p className="text-sm text-gray-600">Upload both sides of your Emirates ID</p>
                        </div>
                      </div>
                      {profile.emirates_id ? (
                        <div className="flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          <span className="text-sm">Uploaded</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Optional</span>
                      )}
                    </div>
                    {!profile.emirates_id && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload Emirates ID</p>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && uploadDocument(e.target.files[0], 'emirates_id')}
                          className="hidden"
                          id="emirates-id-upload"
                        />
                        <label
                          htmlFor="emirates-id-upload"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Passport */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Globe className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-900">Passport</h4>
                          <p className="text-sm text-gray-600">Upload your passport photo page</p>
                        </div>
                      </div>
                      {profile.passport_number ? (
                        <div className="flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          <span className="text-sm">Uploaded</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Optional</span>
                      )}
                    </div>
                    {!profile.passport_number && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload Passport</p>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && uploadDocument(e.target.files[0], 'passport')}
                          className="hidden"
                          id="passport-upload"
                        />
                        <label
                          htmlFor="passport-upload"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </button>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
                  <p className="text-gray-600 mb-4">Add a payment method to start booking properties</p>
                  <button
                    onClick={() => setShowAddPayment(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="w-6 h-6 text-gray-400 mr-3" />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {method.type === 'card' ? `•••• •••• •••• ${method.last_four}` : method.bank_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {method.type === 'card' ? 
                                `${method.brand} • Expires ${method.exp_month}/${method.exp_year}` : 
                                `Account •••• ${method.account_number?.slice(-4)}`
                              }
                            </p>
                          </div>
                          {method.is_default && (
                            <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Payment Method Modal */}
              {showAddPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment Method</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="set-default" className="mr-2" />
                        <label htmlFor="set-default" className="text-sm text-gray-700">Set as default payment method</label>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddPayment(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          // Add payment method logic here
                          setShowAddPayment(false);
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Card
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Bookings</h2>
                <button
                  onClick={fetchBookings}
                  disabled={bookingsLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${bookingsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 mb-4">You haven't made any bookings yet. Start exploring properties!</p>
                  <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Browse Properties
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col space-y-4">
                        {/* Header with property title and status */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {booking.property?.title || 'Property'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {booking.property?.area}, {booking.property?.city}, {booking.property?.emirate}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>

                        {/* Booking details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Check-in</p>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.checkIn).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Check-out</p>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.checkOut).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Guests</p>
                              <p className="text-sm text-gray-600">{booking.guests}</p>
                            </div>
                          </div>
                        </div>

                        {/* Total amount and actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-lg font-semibold text-gray-900">
                              AED {booking.totalAmount?.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </button>
                            {booking.status === 'CONFIRMED' && (
                              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Contact Host
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Password</h3>
                  <p className="text-sm text-gray-600 mb-4">Update your password to keep your account secure</p>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Change Password
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Enable 2FA
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Account Deletion</h3>
                  <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all data</p>
                  <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 