import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { PublicationDetailPage } from './pages/PublicationDetailPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';

// Category Pages
import { ActivationKeysPage } from './pages/categories/ActivationKeysPage';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PublicationDetailPage />} />
            <Route path="/publication/:id" element={<PublicationDetailPage />} />
            
            {/* Category Pages */}
            <Route path="/category/activation-keys" element={<ActivationKeysPage />} />
            
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </LanguageProvider>
  );
}

export default App;