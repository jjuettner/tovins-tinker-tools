import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { CharactersPage } from "../pages/Characters";
import { PlayPage } from "../pages/Play";

const rawBase = import.meta.env.BASE_URL;
const routerBasename = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");

export function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<CharactersPage />} />
          <Route path="play" element={<PlayPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

