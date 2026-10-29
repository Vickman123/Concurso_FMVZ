import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ContestProvider } from './context/ContestContext';

// Components
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { QrCodeModal } from './components/QrCodeModal';
import { LiveAnnouncementModal } from './components/LiveAnnouncementModal';

// Public Pages
import { Home } from './pages/Home';
import { Gallery } from './pages/Gallery';
import { ParticipantDetail } from './pages/ParticipantDetail';
import { Register } from './pages/Register';
import { CheckStatus } from './pages/CheckStatus';
import { VoteIdentify } from './pages/VoteIdentify';
import { VoteConfirm } from './pages/VoteConfirm';
import { VoteConfirmed } from './pages/VoteConfirmed';
import { Faq } from './pages/Faq';
import { PrivacyNotice } from './pages/PrivacyNotice';
import { LogoShowcase } from './pages/LogoShowcase';
import { LiveProjector } from './pages/LiveProjector';
import { LiveVoter } from './pages/LiveVoter';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminParticipants } from './pages/admin/AdminParticipants';
import { AdminPhotos } from './pages/admin/AdminPhotos';
import { AdminVotes } from './pages/admin/AdminVotes';
import { AdminResults } from './pages/admin/AdminResults';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAudit } from './pages/admin/AdminAudit';
import { AdminLiveControl } from './pages/admin/AdminLiveControl';

// Protected Route Guard for Admin
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090B14]">
        <div className="w-10 h-10 rounded-full border-4 border-halloween-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Main Layout Controller for Public vs Admin
const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isProjectorRoute = location.pathname.startsWith('/en-vivo') || location.pathname.startsWith('/proyector');
  const [qrModalOpen, setQrModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-halloween-white">
      {/* Public Navbar (hidden on admin pages and projector visor) */}
      {!isAdminRoute && !isProjectorRoute && <Navbar onOpenQr={() => setQrModalOpen(true)} />}

      <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/participantes" element={<Gallery />} />
          <Route path="/participantes/:number" element={<ParticipantDetail />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/registro/estado" element={<CheckStatus />} />
          <Route path="/votar" element={<VoteIdentify />} />
          <Route path="/votar/confirmar/:numero" element={<VoteConfirm />} />
          <Route path="/voto/confirmado" element={<VoteConfirmed />} />
          <Route path="/premios" element={<Navigate to="/" replace />} />
          <Route path="/preguntas-frecuentes" element={<Faq />} />
          <Route path="/aviso-de-privacidad" element={<PrivacyNotice />} />
          <Route path="/logos" element={<LogoShowcase />} />

          {/* Kahoot Live Contest & Auditorium Projector */}
          <Route path="/en-vivo" element={<LiveProjector />} />
          <Route path="/proyector" element={<LiveProjector />} />
          <Route path="/votar/en-vivo" element={<LiveVoter />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="en-vivo" element={<AdminLiveControl />} />
            <Route path="participantes" element={<AdminParticipants />} />
            <Route path="fotografias" element={<AdminPhotos />} />
            <Route path="votos" element={<AdminVotes />} />
            <Route path="resultados" element={<AdminResults />} />
            <Route path="premios" element={<Navigate to="/admin" replace />} />
            <Route path="configuracion" element={<AdminSettings />} />
            <Route path="auditoria" element={<AdminAudit />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Public Footer & Mobile Bottom Navigation (hidden on admin and projector visor) */}
      {!isAdminRoute && !isProjectorRoute && (
        <>
          <Footer />
          <BottomNav />
        </>
      )}

      {/* QR Code Modal */}
      <QrCodeModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />

      {/* Live Stage Auditorium Announcement Modal */}
      <LiveAnnouncementModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ContestProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ContestProvider>
    </AuthProvider>
  );
};

export default App;
