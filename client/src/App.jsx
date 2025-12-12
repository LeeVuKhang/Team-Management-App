import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './LandingPage.jsx';
import Login from './Login.jsx';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import TeamPage from './TeamPage.jsx';
import ProjectPage from './ProjectPage.jsx';
import AcceptInvitePage from './AcceptInvitePage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#77885f',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/teams/:teamId" element={<TeamPage />} />
          <Route path="/teams/:teamId/projects/:projectId" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
