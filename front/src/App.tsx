import { Navigate, Route, Routes } from "react-router";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import JournalPage from "./pages/JournalPage";
import VoiceJournalPage from "./pages/VoiceJournalPage";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/voice" element={<ProtectedRoute><VoiceJournalPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
export default App;
