import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import Assets from './pages/Assets'
import Vulnerabilities from './pages/Vulnerabilities'
import Risks from './pages/Risks'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Organizations from './pages/Organizations'
import ChangeLog from './pages/ChangeLog'
import Scans from './pages/Scans'
import AssetDiscovery from './pages/AssetDiscovery'
import SecurityScans from './pages/SecurityScans'
import MFAVerify from './pages/common/MFAVerify'
import MFASetup from './pages/common/MFASetup'
import Profile from './pages/common/Profile'
import Notifications from './pages/Notifications'
import OrgDashboard from './pages/org/OrgDashboard'
import AssetDetail from './pages/org/AssetDetail'
import VulnerabilityDetail from './pages/org/VulnerabilityDetail'
import OrganizationSettings from './pages/org/settings/OrganizationSettings'
import SecuritySettings from './pages/org/settings/SecuritySettings'
import ViewerDashboard from './pages/viewer/ViewerDashboard'
import ViewerAssets from './pages/viewer/ViewerAssets'
import ViewerRiskSummary from './pages/viewer/ViewerRiskSummary'
import AppDashboard from './pages/app/AppDashboard'
import AppAssets from './pages/app/AppAssets'
import AppVulnerabilities from './pages/app/AppVulnerabilities'
import AppRisks from './pages/app/AppRisks'
import AppReports from './pages/app/AppReports'
import ProtectedRoute from './components/ProtectedRoute'
import InviteAccept from './pages/InviteAccept'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Common Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/mfa/verify" element={<MFAVerify />} />
          <Route
            path="/mfa/setup"
            element={
              <ProtectedRoute>
                <MFASetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Organizations />
              </ProtectedRoute>
            }
          />

          {/* Organization Admin/User Routes - Using /org prefix */}
          <Route
            path="/org/dashboard"
            element={
              <ProtectedRoute>
                <OrgDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <OrgDashboard />
              </ProtectedRoute>
            }
          />
          {/* Organization Routes - Assets */}
          <Route
            path="/org/assets/inventory"
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/assets/changes"
            element={
              <ProtectedRoute>
                <ChangeLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/changes"
            element={
              <ProtectedRoute>
                <ChangeLog />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Vulnerabilities */}
          <Route
            path="/org/vulnerabilities/all"
            element={
              <ProtectedRoute>
                <Vulnerabilities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vulnerabilities"
            element={
              <ProtectedRoute>
                <Vulnerabilities />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Risks */}
          <Route
            path="/org/risk/prioritization"
            element={
              <ProtectedRoute>
                <Risks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/risks"
            element={
              <ProtectedRoute>
                <Risks />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Reports */}
          <Route
            path="/org/reports/generate"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Users (Admin only) */}
          <Route
            path="/org/users/list"
            element={
              <ProtectedRoute requiredRole="org_admin">
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRole="org_admin">
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Asset Discovery */}
          <Route
            path="/org/asset-discovery"
            element={
              <ProtectedRoute>
                <AssetDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/asset-discovery"
            element={
              <ProtectedRoute>
                <AssetDiscovery />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Security Scans */}
          <Route
            path="/org/security-scans"
            element={
              <ProtectedRoute>
                <SecurityScans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security-scans"
            element={
              <ProtectedRoute>
                <SecurityScans />
              </ProtectedRoute>
            }
          />

          {/* Legacy Scans Route (redirects to discovery) */}
          <Route
            path="/org/scans"
            element={
              <ProtectedRoute>
                <AssetDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scans"
            element={
              <ProtectedRoute>
                <AssetDiscovery />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Detail Pages */}
          <Route
            path="/org/assets/:asset_id"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/vulnerabilities/:vuln_id"
            element={
              <ProtectedRoute>
                <VulnerabilityDetail />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes - Settings (Admin Only) */}
          <Route
            path="/org/settings/organization"
            element={
              <ProtectedRoute requiredRole="org_admin">
                <OrganizationSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/settings/security"
            element={
              <ProtectedRoute requiredRole="org_admin">
                <SecuritySettings />
              </ProtectedRoute>
            }
          />

          {/* Organization User Routes (/app/*) */}
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <AppDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/assets/inventory"
            element={
              <ProtectedRoute>
                <AppAssets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/assets/:asset_id"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/vulnerabilities/all"
            element={
              <ProtectedRoute>
                <AppVulnerabilities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/vulnerabilities/:vuln_id"
            element={
              <ProtectedRoute>
                <VulnerabilityDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/risk/prioritization"
            element={
              <ProtectedRoute>
                <AppRisks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports/generate"
            element={
              <ProtectedRoute>
                <AppReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Viewer Routes - Read-Only */}
          <Route
            path="/viewer/dashboard"
            element={
              <ProtectedRoute requiredRole="viewer">
                <ViewerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer/assets/inventory"
            element={
              <ProtectedRoute requiredRole="viewer">
                <ViewerAssets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer/risk/summary"
            element={
              <ProtectedRoute requiredRole="viewer">
                <ViewerRiskSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer/reports/generate"
            element={
              <ProtectedRoute requiredRole="viewer">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer/profile"
            element={
              <ProtectedRoute requiredRole="viewer">
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

