import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout/Layout";
import NotFound from "./pages/NotFound/NotFound";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import { AuthPage } from "./pages/Auth/AuthPage";
import * as api from "./services/api";
import { PrivateRoute } from "./components/PrivateRoute";
import Upload from "./pages/Upload/Upload";
import TestPage from "./pages/Test/TestPage";
import LoadingPage from "./pages/Loading/LoadingPage";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const authenticated = api.isAuthenticated();
    setIsAuthenticated(authenticated);
    setLoading(false);
  }, []);

  const handleLogout = useCallback(() => {
    api.clearTokens();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener(api.AUTH_STATE_CHANGED_EVENT, checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener(api.AUTH_STATE_CHANGED_EVENT, checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [checkAuth]);

  if (loading) return <LoadingPage />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout
              isAuthenticated={isAuthenticated}
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={<Home isAuthenticated={isAuthenticated} />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<AuthPage onAuthSuccess={checkAuth} />} />
          {/* Приватный маршрут — закрываем загрузку без авторизации */}
          <Route
            path="/upload"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Upload onLogout={handleLogout} />
              </PrivateRoute>
            }
          />
          <Route
            path="/dialogs"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Upload onLogout={handleLogout} />
              </PrivateRoute>
            }
          />
          <Route
            path="/dialogs/:dialogId/tests/:testId"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <TestPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
