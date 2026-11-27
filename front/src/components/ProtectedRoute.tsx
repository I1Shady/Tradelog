import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F4F6FA] dark:bg-[#111c30]">
        <div className="size-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600 dark:border-white/10 dark:border-t-blue-400" />
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
