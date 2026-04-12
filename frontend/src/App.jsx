import { Routes, Route } from 'react-router-dom';
import Shell   from './components/Shell';
import Cursor  from './components/Cursor';
import Home    from './pages/Home';
import Contact from './pages/Contact';
import Notepad from './pages/Notepad';
import Gallery from './pages/Gallery';

const Weather = () => (
  <iframe 
    src="/weather.html" 
    style={{ width: '100%', height: '90vh', border: 'none' }} 
    title="Weather Page"
  />
);

export default function App() {
  return (
    <>
      <Cursor />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/"        element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/notepad" element={<Notepad />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="*"        element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}
