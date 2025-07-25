import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import VerificationRequiredPage from './pages/VerificationRequiredPage';

// Main pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import URLAnalyticsPage from './pages/URLAnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import RedirectPage from './pages/RedirectPage';
import ABTestingPage from './pages/ABTestingPage';
import OrganizePage from './pages/OrganizePage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import URLPreviewPage from './pages/URLPreviewPage';
import AboutPage from './pages/AboutPage';
import TempMailPage from './pages/TempMailPage';
import LearnMorePage from './pages/LearnMorePage';
import MalwareDetectionPage from './pages/MalwareDetectionPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Authentication routes (no layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordPage />} />
            
            {/* Email verification routes */}
            <Route path="/verify-email/:token/:email" element={<EmailVerificationPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />
            <Route path="/verification-required" element={<VerificationRequiredPage />} />
            
            {/* URL Redirection route */}
            <Route path="/s/:shortCode" element={<RedirectPage />} />
            
            {/* URL Preview route */}
            <Route path="/preview/:shortCode" element={<URLPreviewPage />} />
            
            {/* Routes with layout */}
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            
            {/* About and Learn More pages */}
            <Route
              path="/about"
              element={
                <Layout>
                  <AboutPage />
                </Layout>
              }
            />
            
            <Route
              path="/learn-more"
              element={
                <Layout>
                  <LearnMorePage />
                </Layout>
              }
            />
            
            {/* Temporary Email page */}
            <Route
              path="/tempmail"
              element={
                <Layout>
                  <TempMailPage />
                </Layout>
              }
            />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <URLAnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/ab-testing"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ABTestingPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/organize"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrganizePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/security"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SecuritySettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Add Malware Detection route */}
            <Route path="/security/malware" element={
              <ProtectedRoute>
                <Layout>
                  <MalwareDetectionPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route for 404 */}
            <Route
              path="*"
              element={
                <Layout>
                  <NotFoundPage />
                </Layout>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
