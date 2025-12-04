import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout.jsx';
import Homepage from './homepage.jsx';
import ProjectPage from './ProjectPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Homepage />} />
          <Route path="project" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
