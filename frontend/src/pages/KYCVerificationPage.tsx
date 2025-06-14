import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  FileText, 
  Camera, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Shield,
  CreditCard,
  MapPin,
  User,
  Calendar,
  Globe,
  Phone,
  Mail,
  FileImage,
  Home,
  Download,
  RefreshCw
} from 'lucide-react';
import { DocumentType, KYCStatus, Language } from '../types';
import { validateEmiratesId, validateUAEPhone } from '../lib/utils';

interface DocumentUpload {
  id: string;
  type: DocumentType;
  file: File | null;
  url?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedAt?: Date;
  verifiedAt?: Date;
}

interface PersonalInfo {
  emiratesId: string;
  passportNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    building: string;
    area: string;
    city: string;
    emirate: string;
    poBox?: string;
  };
}

interface KYCStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'rejected';
  required: boolean;
}

const KYCVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [kycStatus, setKycStatus] = useState<KYCStatus>(KYCStatus.PENDING);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    emiratesId: '',
    passportNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: 'AE',
    phoneNumber: '',
    email: '',
    address: {
      street: '',
      building: '',
      area: '',
      city: '',
      emirate: 'Dubai',
      poBox: ''
    }
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      id: '1',
      type: DocumentType.EMIRATES_ID,
      file: null,
      status: 'pending'
    },
    {
      id: '2',
      type: DocumentType.PASSPORT,
      file: null,
      status: 'pending'
    },
    {
      id: '3',
      type: DocumentType.UTILITY_BILL,
      file: null,
      status: 'pending'
    },
    {
      id: '4',
      type: DocumentType.SALARY_CERTIFICATE,
      file: null,
      status: 'pending'
    }
  ]);

  const steps: KYCStep[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Provide your basic personal details',
      status: 'current',
      required: true
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload required identity documents',
      status: 'pending',
      required: true
    },
    {
      id: 'verification',
      title: 'Document Verification',
      description: 'Wait for document verification',
      status: 'pending',
      required: true
    },
    {
      id: 'complete',
      title: 'Verification Complete',
      description: 'Your account is fully verified',
      status: 'pending',
      required: true
    }
  ];

  useEffect(() => {
    // Simulate loading existing data
    const loadKYCData = async () => {
      setLoading(true);
      setTimeout(() => {
        // Mock existing data
        setPersonalInfo({
          emiratesId: '784199012345678',
          passportNumber: 'A12345678',
          firstName: 'Ahmed',
          lastName: 'Al Mansoori',
          dateOfBirth: '1990-05-15',
          nationality: 'AE',
          phoneNumber: '+971501234567',
          email: 'ahmed@example.com',
          address: {
            street: 'Sheikh Zayed Road',
            building: 'Burj Khalifa',
            area: 'Downtown Dubai',
            city: 'Dubai',
            emirate: 'Dubai',
            poBox: '12345'
          }
        });
        setLoading(false);
      }, 1000);
    };

    loadKYCData();
  }, []);

  const handlePersonalInfoChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'address') {
        setPersonalInfo(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      }
    } else {
      setPersonalInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileUpload = useCallback((documentId: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, file, status: 'uploaded' as const, uploadedAt: new Date() }
        : doc
    ));

    // Simulate upload process
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'verified' as const, verifiedAt: new Date() }
          : doc
      ));
    }, 2000);
  }, []);

  const validatePersonalInfo = (): boolean => {
    if (!personalInfo.emiratesId || !validateEmiratesId(personalInfo.emiratesId)) {
      alert('Please enter a valid Emirates ID');
      return false;
    }

    if (!personalInfo.firstName || !personalInfo.lastName) {
      alert('Please enter your full name');
      return false;
    }

    if (!personalInfo.phoneNumber || !personalInfo.email) {
      alert('Please enter valid contact information');
      return false;
    }

    return true;
  };

  const validateDocuments = (): boolean => {
    const requiredDocs = [DocumentType.EMIRATES_ID, DocumentType.PASSPORT, DocumentType.UTILITY_BILL];
    const uploadedRequiredDocs = documents.filter(doc => 
      requiredDocs.includes(doc.type) && 
      (doc.status === 'uploaded' || doc.status === 'verified')
    );

    if (uploadedRequiredDocs.length < requiredDocs.length) {
      alert('Please upload all required documents');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 0 && !validatePersonalInfo()) return;
    if (currentStep === 1 && !validateDocuments()) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitKYC = async () => {
    setSubmitting(true);
    try {
      // Simulate API submission
      setTimeout(() => {
        setKycStatus(KYCStatus.IN_REVIEW);
        setCurrentStep(2);
        setSubmitting(false);
        alert('KYC documents submitted successfully! We will review and get back to you within 24-48 hours.');
      }, 2000);
    } catch (error) {
      console.error('Error submitting KYC:', error);
      setSubmitting(false);
    }
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case DocumentType.EMIRATES_ID:
        return <CreditCard className="w-6 h-6" />;
      case DocumentType.PASSPORT:
        return <Globe className="w-6 h-6" />;
      case DocumentType.UTILITY_BILL:
        return <Home className="w-6 h-6" />;
      case DocumentType.SALARY_CERTIFICATE:
        return <FileText className="w-6 h-6" />;
      default:
        return <FileImage className="w-6 h-6" />;
    }
  };

  const getDocumentTitle = (type: DocumentType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success"><Check className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'uploaded':
        return <Badge variant="primary"><Upload className="w-3 h-3 mr-1" />Uploaded</Badge>;
      case 'uploading':
        return <Badge variant="primary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'rejected':
        return <Badge variant="error"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C5A572] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
          <p className="text-gray-600 mt-2">Complete your KYC verification to access all platform features</p>
        </div>

        {/* Progress Steps */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep ? 'bg-[#C5A572] text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-20 mx-4 ${
                    index < currentStep ? 'bg-[#C5A572]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">{steps[currentStep]?.title}</h3>
            <p className="text-gray-600 text-sm">{steps[currentStep]?.description}</p>
          </div>
        </Card>

        {/* Step Content */}
        <Card className="p-6">
          {/* Step 1: Personal Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emirates ID *
                  </label>
                  <Input
                    value={personalInfo.emiratesId}
                    onChange={(e) => handlePersonalInfoChange('emiratesId', e.target.value)}
                    placeholder="784-YYYY-XXXXXXX-X"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passport Number *
                  </label>
                  <Input
                    value={personalInfo.passportNumber}
                    onChange={(e) => handlePersonalInfoChange('passportNumber', e.target.value)}
                    placeholder="A12345678"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    value={personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    value={personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <Input
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality *
                  </label>
                  <select
                    value={personalInfo.nationality}
                    onChange={(e) => handlePersonalInfoChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                  >
                    <option value="AE">United Arab Emirates</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="IN">India</option>
                    <option value="PK">Pakistan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    value={personalInfo.phoneNumber}
                    onChange={(e) => handlePersonalInfoChange('phoneNumber', e.target.value)}
                    placeholder="+971501234567"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <Input
                      value={personalInfo.address.street}
                      onChange={(e) => handlePersonalInfoChange('address.street', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Building/Villa *
                    </label>
                    <Input
                      value={personalInfo.address.building}
                      onChange={(e) => handlePersonalInfoChange('address.building', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area *
                    </label>
                    <Input
                      value={personalInfo.address.area}
                      onChange={(e) => handlePersonalInfoChange('address.area', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <Input
                      value={personalInfo.address.city}
                      onChange={(e) => handlePersonalInfoChange('address.city', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emirate *
                    </label>
                    <select
                      value={personalInfo.address.emirate}
                      onChange={(e) => handlePersonalInfoChange('address.emirate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A572] focus:border-transparent"
                    >
                      <option value="Dubai">Dubai</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      P.O. Box
                    </label>
                    <Input
                      value={personalInfo.address.poBox}
                      onChange={(e) => handlePersonalInfoChange('address.poBox', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Document Upload</h2>
              
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getDocumentIcon(doc.type)}
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900">{getDocumentTitle(doc.type)}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.type === DocumentType.EMIRATES_ID && 'Front and back sides required'}
                            {doc.type === DocumentType.PASSPORT && 'Photo page required'}
                            {doc.type === DocumentType.UTILITY_BILL && 'Recent bill (within 3 months)'}
                            {doc.type === DocumentType.SALARY_CERTIFICATE && 'Latest salary certificate'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {doc.status === 'pending' ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(doc.id, file);
                            }
                          }}
                          className="hidden"
                          id={`file-${doc.id}`}
                        />
                        <label
                          htmlFor={`file-${doc.id}`}
                          className="cursor-pointer"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, PDF up to 10MB
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">{doc.file?.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Replace
                            </Button>
                          </div>
                        </div>
                        {doc.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-700">{doc.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Document Guidelines</h3>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Ensure all documents are clear and readable</li>
                      <li>• Documents should be in color (not black and white)</li>
                      <li>• All corners of the document should be visible</li>
                      <li>• File size should not exceed 10MB</li>
                      <li>• Accepted formats: PNG, JPG, PDF</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Verification Status */}
          {currentStep === 2 && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verification in Progress</h2>
                <p className="text-gray-600">
                  We are reviewing your documents. This process typically takes 24-48 hours.
                </p>
              </div>
              
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <div className="text-left">
                    <h3 className="font-medium text-yellow-900">What happens next?</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Our verification team will review your documents and contact you if additional information is needed.
                      You'll receive an email notification once the verification is complete.
                    </p>
                  </div>
                </div>
              </Card>

              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="mt-4"
              >
                Return to Profile
              </Button>
            </div>
          )}

          {/* Step 4: Verification Complete */}
          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verification Complete!</h2>
                <p className="text-gray-600">
                  Your identity has been verified successfully. You now have access to all platform features.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="p-4">
                  <Home className="w-8 h-8 text-[#C5A572] mx-auto mb-2" />
                  <h3 className="font-medium">Book Properties</h3>
                  <p className="text-sm text-gray-600">Make instant bookings</p>
                </Card>
                <Card className="p-4">
                  <User className="w-8 h-8 text-[#C5A572] mx-auto mb-2" />
                  <h3 className="font-medium">Become a Host</h3>
                  <p className="text-sm text-gray-600">List your properties</p>
                </Card>
                <Card className="p-4">
                  <Shield className="w-8 h-8 text-[#C5A572] mx-auto mb-2" />
                  <h3 className="font-medium">Enhanced Security</h3>
                  <p className="text-sm text-gray-600">Secure transactions</p>
                </Card>
              </div>

              <Button
                onClick={() => navigate('/')}
                className="mt-6"
              >
                Continue to Platform
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 2 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === 1 ? (
                <Button
                  onClick={handleSubmitKYC}
                  disabled={submitting}
                  className="flex items-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit for Verification
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default KYCVerificationPage; 