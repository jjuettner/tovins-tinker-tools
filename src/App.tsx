import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AboutRoute } from "./routes/AboutRoute";
import { HomeRoute } from "./routes/HomeRoute";
import { StorageRoute } from "./routes/StorageRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path="/storage" element={<StorageRoute />} />
          <Route path="/about" element={<AboutRoute />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
