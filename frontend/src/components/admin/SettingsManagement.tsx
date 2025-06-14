import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  Shield, 
  Bell,
  CreditCard,
  Mail,
  Smartphone,
  Database,
  Key,
  Users,
  Building,
  Calendar,
  DollarSign,
  Eye,
  Lock,
  Wifi,
  Server,
  Monitor,
  Palette,
  Languages,
  Clock,
  MapPin,
  FileText,
  Download,
  Upload,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Camera,
  Image,
  Video,
  Music,
  Archive,
  Trash2,
  Edit,
  Plus,
  Minus,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate } from '../../lib/utils';

interface PlatformSettings {
  general: {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    supportPhone: string;
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireUppercase: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorRequired: boolean;
    ipWhitelist: string[];
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    userWelcomeEmail: boolean;
    bookingConfirmations: boolean;
    paymentNotifications: boolean;
    maintenanceAlerts: boolean;
    securityAlerts: boolean;
  };
  payments: {
    stripeEnabled: boolean;
    paypalEnabled: boolean;
    bankTransferEnabled: boolean;
    cryptoEnabled: boolean;
    platformCommission: number;
    hostCommission: number;
    agentCommission: number;
    minimumPayout: number;
    payoutSchedule: string;
    refundPolicy: string;
    cancellationFee: number;
  };
  booking: {
    instantBooking: boolean;
    requireApproval: boolean;
    maxAdvanceBooking: number;
    minBookingDuration: number;
    maxBookingDuration: number;
    cancellationWindow: number;
    modificationWindow: number;
    autoConfirmation: boolean;
    guestVerificationRequired: boolean;
    hostVerificationRequired: boolean;
  };
  content: {
    maxPropertyImages: number;
    imageQuality: string;
    videoUploadsEnabled: boolean;
    maxVideoSize: number;
    contentModeration: boolean;
    autoTranslation: boolean;
    seoOptimization: boolean;
    analyticsEnabled: boolean;
    chatbotEnabled: boolean;
    reviewsEnabled: boolean;
  };
  api: {
    rateLimitEnabled: boolean;
    requestsPerMinute: number;
    apiKeyRequired: boolean;
    webhooksEnabled: boolean;
    corsEnabled: boolean;
    allowedOrigins: string[];
    apiVersioning: boolean;
    documentationPublic: boolean;
    sandboxMode: boolean;
  };
  integrations: {
    googleMapsEnabled: boolean;
    googleAnalyticsId: string;
    facebookPixelId: string;
    intercomEnabled: boolean;
    slackWebhook: string;
    zapierEnabled: boolean;
    mailchimpEnabled: boolean;
    twilioEnabled: boolean;
    awsS3Enabled: boolean;
    cloudinaryEnabled: boolean;
  };
}

const SettingsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'payments' | 'booking' | 'content' | 'api' | 'integrations'>('general');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/super-admin/settings') as { data: PlatformSettings };
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Set default settings for demonstration
      setSettings({
        general: {
          platformName: 'Krib',
          platformDescription: 'Premier rental platform for the UAE market',
          supportEmail: 'support@krib.ae',
          supportPhone: '+971-4-123-4567',
          timezone: 'Asia/Dubai',
          language: 'en',
          currency: 'AED',
          dateFormat: 'DD/MM/YYYY',
          maintenanceMode: false,
          registrationEnabled: true
        },
        security: {
          passwordMinLength: 8,
          passwordRequireSpecialChars: true,
          passwordRequireNumbers: true,
          passwordRequireUppercase: true,
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          lockoutDuration: 900,
          twoFactorRequired: false,
          ipWhitelist: [],
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
          maxFileSize: 10485760 // 10MB
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          adminAlerts: true,
          userWelcomeEmail: true,
          bookingConfirmations: true,
          paymentNotifications: true,
          maintenanceAlerts: true,
          securityAlerts: true
        },
        payments: {
          stripeEnabled: true,
          paypalEnabled: true,
          bankTransferEnabled: true,
          cryptoEnabled: false,
          platformCommission: 10,
          hostCommission: 85,
          agentCommission: 5,
          minimumPayout: 100,
          payoutSchedule: 'weekly',
          refundPolicy: 'flexible',
          cancellationFee: 50
        },
        booking: {
          instantBooking: true,
          requireApproval: false,
          maxAdvanceBooking: 365,
          minBookingDuration: 1,
          maxBookingDuration: 30,
          cancellationWindow: 24,
          modificationWindow: 12,
          autoConfirmation: true,
          guestVerificationRequired: true,
          hostVerificationRequired: true
        },
        content: {
          maxPropertyImages: 20,
          imageQuality: 'high',
          videoUploadsEnabled: true,
          maxVideoSize: 104857600, // 100MB
          contentModeration: true,
          autoTranslation: false,
          seoOptimization: true,
          analyticsEnabled: true,
          chatbotEnabled: false,
          reviewsEnabled: true
        },
        api: {
          rateLimitEnabled: true,
          requestsPerMinute: 100,
          apiKeyRequired: true,
          webhooksEnabled: true,
          corsEnabled: true,
          allowedOrigins: ['https://krib.ae', 'https://www.krib.ae'],
          apiVersioning: true,
          documentationPublic: false,
          sandboxMode: false
        },
        integrations: {
          googleMapsEnabled: true,
          googleAnalyticsId: 'GA-XXXXXXXXX',
          facebookPixelId: '',
          intercomEnabled: false,
          slackWebhook: '',
          zapierEnabled: false,
          mailchimpEnabled: false,
          twilioEnabled: true,
          awsS3Enabled: true,
          cloudinaryEnabled: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category: keyof PlatformSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await apiService.put('/super-admin/settings', settings);
      setHasChanges(false);
      // Show success message
    } catch (error) {
      console.error('Error saving settings:', error);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      await fetchSettings();
      setHasChanges(false);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
            <input
              type="text"
              value={settings?.general.platformName || ''}
              onChange={(e) => handleSettingChange('general', 'platformName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
            <input
              type="email"
              value={settings?.general.supportEmail || ''}
              onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
            <input
              type="tel"
              value={settings?.general.supportPhone || ''}
              onChange={(e) => handleSettingChange('general', 'supportPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={settings?.general.timezone || ''}
              onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              <option value="UTC">UTC (GMT+0)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
            <select
              value={settings?.general.language || ''}
              onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={settings?.general.currency || ''}
              onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="AED">AED (UAE Dirham)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform Description</label>
          <textarea
            value={settings?.general.platformDescription || ''}
            onChange={(e) => handleSettingChange('general', 'platformDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
              <p className="text-sm text-gray-500">Temporarily disable public access to the platform</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.general.maintenanceMode || false}
                onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">User Registration</h4>
              <p className="text-sm text-gray-500">Allow new users to register on the platform</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.general.registrationEnabled || false}
                onChange={(e) => handleSettingChange('general', 'registrationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Length</label>
            <input
              type="number"
              min="6"
              max="32"
              value={settings?.security.passwordMinLength || 8}
              onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (seconds)</label>
            <input
              type="number"
              min="300"
              max="86400"
              value={settings?.security.sessionTimeout || 3600}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
            <input
              type="number"
              min="3"
              max="10"
              value={settings?.security.maxLoginAttempts || 5}
              onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (seconds)</label>
            <input
              type="number"
              min="60"
              max="3600"
              value={settings?.security.lockoutDuration || 900}
              onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Require Special Characters</h4>
              <p className="text-sm text-gray-500">Passwords must contain special characters (!@#$%^&*)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.security.passwordRequireSpecialChars || false}
                onChange={(e) => handleSettingChange('security', 'passwordRequireSpecialChars', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Require Numbers</h4>
              <p className="text-sm text-gray-500">Passwords must contain at least one number</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.security.passwordRequireNumbers || false}
                onChange={(e) => handleSettingChange('security', 'passwordRequireNumbers', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.security.twoFactorRequired || false}
                onChange={(e) => handleSettingChange('security', 'twoFactorRequired', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Upload Security</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum File Size</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="100"
                value={Math.round((settings?.security.maxFileSize || 10485760) / 1048576)}
                onChange={(e) => handleSettingChange('security', 'maxFileSize', parseInt(e.target.value) * 1048576)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">MB</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
            <div className="flex flex-wrap gap-2">
              {['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mov'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings?.security.allowedFileTypes.includes(type) || false}
                    onChange={(e) => {
                      const currentTypes = settings?.security.allowedFileTypes || [];
                      if (e.target.checked) {
                        handleSettingChange('security', 'allowedFileTypes', [...currentTypes, type]);
                      } else {
                        handleSettingChange('security', 'allowedFileTypes', currentTypes.filter(t => t !== type));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">.{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-4">
          {[
            { key: 'stripeEnabled', label: 'Stripe', icon: CreditCard },
            { key: 'paypalEnabled', label: 'PayPal', icon: DollarSign },
            { key: 'bankTransferEnabled', label: 'Bank Transfer', icon: Building },
            { key: 'cryptoEnabled', label: 'Cryptocurrency', icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                  <p className="text-sm text-gray-500">Enable {label.toLowerCase()} payments</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.payments[key as keyof typeof settings.payments] as boolean || false}
                  onChange={(e) => handleSettingChange('payments', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Commission (%)</label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={settings?.payments.platformCommission || 10}
              onChange={(e) => handleSettingChange('payments', 'platformCommission', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Host Commission (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              step="0.1"
              value={settings?.payments.hostCommission || 85}
              onChange={(e) => handleSettingChange('payments', 'hostCommission', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agent Commission (%)</label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={settings?.payments.agentCommission || 5}
              onChange={(e) => handleSettingChange('payments', 'agentCommission', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Payout (AED)</label>
            <input
              type="number"
              min="50"
              max="1000"
              value={settings?.payments.minimumPayout || 100}
              onChange={(e) => handleSettingChange('payments', 'minimumPayout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payout Schedule</label>
            <select
              value={settings?.payments.payoutSchedule || 'weekly'}
              onChange={(e) => handleSettingChange('payments', 'payoutSchedule', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge variant="warning">Unsaved Changes</Badge>
          )}
          <Button onClick={handleResetSettings} variant="outline" disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={!hasChanges || saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search settings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'booking', label: 'Booking', icon: Calendar },
            { id: 'content', label: 'Content', icon: FileText },
            { id: 'api', label: 'API', icon: Database },
            { id: 'integrations', label: 'Integrations', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'payments' && renderPaymentsTab()}
          {activeTab === 'notifications' && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Settings</h3>
              <p className="text-gray-600">Configure email, SMS, and push notification preferences</p>
            </div>
          )}
          {activeTab === 'booking' && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Settings</h3>
              <p className="text-gray-600">Configure booking rules, policies, and requirements</p>
            </div>
          )}
          {activeTab === 'content' && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content Settings</h3>
              <p className="text-gray-600">Manage content policies, uploads, and moderation</p>
            </div>
          )}
          {activeTab === 'api' && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">API Settings</h3>
              <p className="text-gray-600">Configure API access, rate limits, and documentation</p>
            </div>
          )}
          {activeTab === 'integrations' && (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Integrations</h3>
              <p className="text-gray-600">Manage third-party integrations and API keys</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsManagement; 