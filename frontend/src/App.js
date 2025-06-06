import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Authentication routes (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordPage />} />
          
          {/* URL Redirection route */}
          <Route path="/s/:shortCode" element={<RedirectPage />} />
          
          {/* Routes with layout */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
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
  );
}

export default App;
