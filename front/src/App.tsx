import { Routes, Route } from 'react-router';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import JournalPage from './pages/JournalPage'; // مطمئن شو مسیر درسته

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/journal" element={<JournalPage />} />
      </Routes>
    </>
  );
}

export default App;