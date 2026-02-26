import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import AxisDetails from '@/pages/AxisDetails';
import DataEntry from '@/pages/DataEntry';
import ManageData from '@/pages/ManageData';
import Targets from '@/pages/Targets';
import Indicators from '@/pages/Indicators';
import Reports from '@/pages/Reports';
import Users from '@/pages/Users';
import Layout from '@/components/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="axis/:axisId" element={<AxisDetails />} />
              <Route path="data-entry" element={<DataEntry />} />
              <Route path="targets" element={<Targets />} />
              <Route path="indicators" element={<Indicators />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors dir="rtl" />
      </AuthProvider>
    </div>
  );
}

export default App;
