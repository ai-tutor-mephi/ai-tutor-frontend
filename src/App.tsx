import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout/Layout';
import NotFound from './pages/NotFound/NotFound';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import { AuthPage } from './pages/Auth/AuthPage';
import { User } from "./types/user";
import * as api from "./services/api";
import { PrivateRoute } from './components/PrivateRoute';
import Upload from "./pages/Upload/Upload";
import LoadingPage from "./pages/Loading/LoadingPage";
import './App.css';



function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home user={user} />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<AuthPage onAuthSuccess={fetchMe} />} />
          {/* защищённый маршрут */}
          <Route 
            path="/upload" 
            element={
              <PrivateRoute user={user}>
                <Upload onLogout={() => setUser(null)} />
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
