import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage.jsx';
import Login from './Login.jsx';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import TeamPage from './TeamPage.jsx';
import ProjectPage from './ProjectPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
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
