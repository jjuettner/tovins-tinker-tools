import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/app/AppLayout";
import { CharactersPage } from "@/pages/Characters";
import { PlayPage } from "@/pages/Play";
import { AuthGate } from "@/components/features/auth/AuthGate";
import { CampaignsPage } from "@/pages/Campaigns";
import { ResetPasswordPage } from "@/pages/ResetPassword";

const rawBase = import.meta.env.BASE_URL;
const routerBasename = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");

export function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route
            index
            element={
              <AuthGate>
                <CharactersPage />
              </AuthGate>
            }
          />
          <Route
            path="play"
            element={
              <AuthGate>
                <PlayPage />
              </AuthGate>
            }
          />
          <Route
            path="campaigns"
            element={
              <AuthGate>
                <CampaignsPage />
              </AuthGate>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

