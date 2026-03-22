import { Routes, Route } from 'react-router-dom';
import Shell   from './components/Shell';
import Home    from './pages/Home';
import Contact from './pages/Contact';
import Notepad from './pages/Notepad';

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/"        element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/notepad" element={<Notepad />} />
        <Route path="*"        element={<Home />} />
      </Route>
    </Routes>
  );
}
