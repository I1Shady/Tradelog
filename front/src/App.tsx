
import { Routes, Route } from "react-router";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import JournalPage from "./pages/JournalPage";
import VoiceJournalPage from "./pages/VoiceJournalPage";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/voice" element={<VoiceJournalPage />} />
      </Routes>
    </>
  );
}

export default App;
