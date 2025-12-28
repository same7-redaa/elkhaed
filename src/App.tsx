import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from './components/UIComponents';
import { POSPage } from './pages/POSPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { SalesPage } from './pages/SalesPage';


import { PromotionsPage } from './pages/PromotionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomersPage } from './pages/CustomersPage';
import { StaffPage } from './pages/StaffPage';
import { ReceiptPrintPage } from './pages/ReceiptPrintPage';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AIAssistant } from './components/AIAssistant';
import { useStore } from './store/useStore';
import { restoreDirectoryHandle } from './utils/fileSystem';

import { useAutoSave } from './hooks/useAutoSave';
import { MobileApp } from './pages/MobileApp'; // Import Mobile App

// Setup Protection Wrapper
const SetupGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSystemSetup } = useStore();
  const location = useLocation();

  if (!isSystemSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  if (isSystemSetup && location.pathname === '/setup') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { checkDebtStatus, currentUser } = useStore();

  // Initialize auto-save
  useAutoSave();

  useEffect(() => {
    checkDebtStatus();
    // استرجاع المجلد المحفوظ
    restoreDirectoryHandle().then((restored) => {
      if (restored) {
        useStore.getState().loadDataFromFiles();
      }
    });
  }, [checkDebtStatus]);

  return (
    <Router>
      <SetupGuard>
        <ToastContainer />

        {/* Show AI Assistant only if logged in */}
        {currentUser && <AIAssistant />}

        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout><DashboardPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/pos" element={
            <ProtectedRoute>
              <DashboardLayout><POSPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute>
              <DashboardLayout><ProductsPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Create Product Route */}
          <Route path="/products/new" element={
            <ProtectedRoute>
              <DashboardLayout><ProductFormPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Edit Product Route */}
          <Route path="/products/edit/:id" element={
            <ProtectedRoute>
              <DashboardLayout><ProductFormPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/sales" element={
            <ProtectedRoute>
              <DashboardLayout><SalesPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute>
              <DashboardLayout><CustomersPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/promotions" element={
            <ProtectedRoute>
              <DashboardLayout><PromotionsPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout><SettingsPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/staff" element={
            <ProtectedRoute>
              <DashboardLayout><StaffPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute>
              <DashboardLayout><ExpensesPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <DashboardLayout><ReportsPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/suppliers" element={
            <ProtectedRoute>
              <DashboardLayout><SuppliersPage /></DashboardLayout>
            </ProtectedRoute>
          } />


          {/* Mobile App View - STANDALONE */}
          <Route path="/mobile" element={<MobileApp />} />

          {/* Print Receipt Route - STANDALONE, No Layout */}
          <Route path="/print-receipt/:orderId" element={<ReceiptPrintPage />} />


          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SetupGuard>
    </Router>
  )
}

export default App
