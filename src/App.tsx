import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './components/auth/LoginPage';
import { StandalonePrintView } from './components/common/StandalonePrintView';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (
    typeof window !== 'undefined' &&
    (window.location.search.includes('printMode=') ||
      window.location.hash.startsWith('#printData='))
  ) {
    return <StandalonePrintView />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Layout />;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
