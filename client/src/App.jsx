import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './homepage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đường dẫn mặc định "/" sẽ hiện trang homepage*/}
        <Route path="/" element={<Homepage />} />
        
        {/* Đường dẫn "/welcome" sẽ hiện trang Welcome
        <Route path="/welcome" element={<Welcome />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App
