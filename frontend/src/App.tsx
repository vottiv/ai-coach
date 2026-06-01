import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { Feelings } from "@/pages/Feelings";
import { Health } from "@/pages/Health";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Nutrition } from "@/pages/Nutrition";
import { Onboarding } from "@/pages/Onboarding";
import { Profile } from "@/pages/Profile";
import { Workouts } from "@/pages/Workouts";
import { useAuthStore } from "@/store/auth";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { access, user } = useAuthStore();
  if (!access) return <Navigate to="/login" replace />;
  if (user && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  const access = useAuthStore((s) => s.access);

  return (
    <Routes>
      <Route path="/login" element={access ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/onboarding"
        element={access ? <Onboarding /> : <Navigate to="/login" replace />}
      />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/feelings" element={<Feelings />} />
        <Route path="/health" element={<Health />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
