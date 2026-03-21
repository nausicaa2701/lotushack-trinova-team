/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';
import Landing from './screens/Landing';
import Login from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { Bookings } from './screens/Bookings';
import { Explore } from './screens/Explore';
import { SearchResults } from './screens/SearchResults';
import { Vehicles } from './screens/Vehicles';
import { Analytics } from './screens/Analytics';
import { ProviderDashboard } from './screens/provider/ProviderDashboard';
import { ProviderBookings } from './screens/provider/ProviderBookings';
import { ProviderCampaigns } from './screens/provider/ProviderCampaigns';
import { AdminMerchants } from './screens/admin/AdminMerchants';
import { AdminCampaigns } from './screens/admin/AdminCampaigns';
import { AdminDisputes } from './screens/admin/AdminDisputes';
import { AdminAIRollout } from './screens/admin/AdminAIRollout';

// PrimeReact Styles
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/bookings"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/explore"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Explore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/vehicles"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route path="/search" element={<SearchResults />} />

            <Route
              path="/provider/dashboard"
              element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider/bookings"
              element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider/campaigns"
              element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderCampaigns />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/merchants"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMerchants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/disputes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDisputes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ai-rollout"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAIRollout />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="/bookings" element={<Navigate to="/owner/bookings" replace />} />
          <Route path="/explore" element={<Navigate to="/owner/explore" replace />} />
          <Route path="/vehicles" element={<Navigate to="/owner/vehicles" replace />} />
          <Route path="/analytics" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

