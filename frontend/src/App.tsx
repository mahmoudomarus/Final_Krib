import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

// Import i18n configuration
import './lib/i18n'

// Auth components
import { AuthProvider } from './contexts/AuthContext'
import { SearchProvider } from './contexts/SearchContext'
import { PrivateRoute } from './components/auth/PrivateRoute'

// Layout components
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Page components
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ListWithUsPage from './pages/ListWithUsPage'
import ProfilePage from './pages/ProfilePage'
import KYCVerificationPage from './pages/KYCVerificationPage'
import BookingsPage from './pages/BookingsPage'
import HostDashboardPage from './pages/host/HostDashboardPage'
import AddPropertyPage from './pages/host/AddPropertyPage'
import CalendarManagementPage from './pages/host/CalendarManagementPage'
import HostMessagesPage from './pages/host/MessagesPage'
import MessagesPage from './pages/MessagesPage'
import PaymentPage from './pages/PaymentPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminNotificationCenter from './pages/admin/AdminNotificationCenter'
import TestApiPage from './pages/TestApiPage'
import TestReviewsPage from './pages/TestReviewsPage'
import TestBookingPage from './pages/TestBookingPage'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'

// Admin components
import AdminLoginPage from './pages/admin/AdminLoginPage'

// Agent components
import AgentDashboard from './pages/agent/AgentDashboard'

// Listers components (separate authentication system for agents)
import ListersLoginPage from './pages/listers/ListersLoginPage'
import ListersRegisterPage from './pages/listers/ListersRegisterPage'

// Static pages
import AboutPage from './pages/static/AboutPage'
import ContactPage from './pages/static/ContactPage'
import HowItWorksPage from './pages/static/HowItWorksPage'
import PrivacyPage from './pages/static/PrivacyPage'
import TermsPage from './pages/static/TermsPage'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Component to conditionally render header and footer
const AppContent: React.FC = () => {
  const location = useLocation()
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  
  // Don't show public header/footer for admin routes and listers (agent) routes
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isListerRoute = location.pathname.startsWith('/listers')

  React.useEffect(() => {
    // Set document direction based on language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [isRTL, i18n.language])

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'font-arabic' : 'font-english'}`}>
      {!isAdminRoute && !isListerRoute && <Header />}
      
      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          
          {/* Static pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/list-with-us" element={<ListWithUsPage />} />
          
          {/* Admin routes - separate from regular user flow */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={
            <PrivateRoute requireSuperAdmin>
              <SuperAdminDashboard />
            </PrivateRoute>
          } />
          
          {/* Listers routes - dedicated agent dashboard without main site header/footer */}
          <Route path="/listers" element={
            <PrivateRoute requireAgent={true}>
              <AgentDashboard />
            </PrivateRoute>
          } />
          <Route path="/listers/dashboard" element={
            <PrivateRoute requireAgent={true}>
              <AgentDashboard />
            </PrivateRoute>
          } />
          
          {/* Protected routes - require authentication */}
          <Route path="/book/:propertyId" element={
            <PrivateRoute>
              <BookingPage />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />
          <Route path="/kyc-verification" element={
            <PrivateRoute>
              <KYCVerificationPage />
            </PrivateRoute>
          } />
          <Route path="/bookings" element={
            <PrivateRoute>
              <BookingsPage />
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          } />
          <Route path="/messages" element={
            <PrivateRoute>
              <MessagesPage />
            </PrivateRoute>
          } />
          
          {/* Host routes - require authentication AND host status */}
          <Route path="/host" element={
            <PrivateRoute requireHost={true}>
              <HostDashboardPage />
            </PrivateRoute>
          } />
          <Route path="/host/dashboard" element={
            <PrivateRoute requireHost={true}>
              <HostDashboardPage />
            </PrivateRoute>
          } />
          <Route path="/host/properties/new" element={
            <PrivateRoute requireHost={true}>
              <AddPropertyPage />
            </PrivateRoute>
          } />
          <Route path="/host/calendar" element={
            <PrivateRoute requireHost={true}>
              <CalendarManagementPage />
            </PrivateRoute>
          } />
          <Route path="/host/messages" element={
            <PrivateRoute requireHost={true}>
              <HostMessagesPage />
            </PrivateRoute>
          } />
          
          {/* Agent routes - require authentication AND agent status */}
          <Route path="/agent" element={
            <PrivateRoute requireAgent={true}>
              <AgentDashboard />
            </PrivateRoute>
          } />
          <Route path="/agent/dashboard" element={
            <PrivateRoute requireAgent={true}>
              <AgentDashboard />
            </PrivateRoute>
          } />
          
          {/* Admin routes - require authentication AND admin status */}
          <Route path="/admin/notifications" element={
            <PrivateRoute requireAdmin>
              <AdminNotificationCenter />
            </PrivateRoute>
          } />
          
          {/* Payment routes - require authentication */}
          <Route path="/payments" element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          } />
          <Route path="/payments/:bookingId" element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          } />
          
          {/* Test routes - for development only */}
          <Route path="/test-api" element={<TestApiPage />} />
          <Route path="/test-reviews" element={<TestReviewsPage />} />
          <Route path="/test-booking" element={<TestBookingPage />} />

          {/* Listers routes - separate from main site */}
          <Route path="/listers/login" element={<ListersLoginPage />} />
          <Route path="/listers/register" element={<ListersRegisterPage />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      
      {!isAdminRoute && !isListerRoute && <Footer />}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SearchProvider>
            <AppContent />
          </SearchProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Simple 404 page component
const NotFoundPage: React.FC = () => {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">404</h1>
        <p className="text-neutral-600 mb-8">{t('errors.notFound', 'Page not found')}</p>
        <a 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('nav.home', 'Go Home')}
        </a>
      </div>
    </div>
  )
}

export default App
