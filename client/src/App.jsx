import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout.jsx';
import TeamPage from './TeamPage.jsx';
import ProjectPage from './ProjectPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/teams/1" replace />} />
          <Route path="teams/:teamId" element={<TeamPage />} />
          <Route path="teams/:teamId/projects/:projectId" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
