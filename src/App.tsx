import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Settings from './pages/Settings';
import SalesHistory from './pages/SalesHistory';
import UpdatePassword from './pages/UpdatePassword';
import Layout from './components/Layout';
import type { Session } from '@supabase/supabase-js';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const lastLogin = localStorage.getItem('stokly_last_login');
        if (lastLogin) {
          const hoursSinceLogin = (Date.now() - parseInt(lastLogin)) / (1000 * 60 * 60);
          if (hoursSinceLogin >= 24) {
            // Sessão expirada (mais de 24h)
            localStorage.removeItem('stokly_last_login');
            await supabase.auth.signOut();
            setSession(null);
            setLoading(false);
            return;
          }
        } else {
          // Se não tiver o registro do horário, assume que precisa logar de novo por segurança
          await supabase.auth.signOut();
          setSession(null);
          setLoading(false);
          return;
        }
      }

      setSession(session);
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0C10]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 animate-pulse" />
          </div>
        </div>
        <span className="mt-6 text-gray-400 text-sm font-medium tracking-widest uppercase animate-pulse">
          Inicializando Sistema
        </span>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={!session ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/update-password"
            element={<UpdatePassword />}
          />

          {/* Protected Routes Wrapper */}
          <Route element={session ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales-history" element={<SalesHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
