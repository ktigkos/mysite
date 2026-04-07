import { Routes, Route } from 'react-router-dom';
import Shell   from './components/Shell';
import Home    from './pages/Home';
import Contact from './pages/Contact';
import Notepad from './pages/Notepad';

const Weather = () => (
  <iframe 
    src="/weather.html" 
    style={{ width: '100%', height: '90vh', border: 'none' }} 
    title="Weather Page"
  />
);

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/"        element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/notepad" element={<Notepad />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="*"        element={<Home />} />
      </Route>
    </Routes>
  );
}
