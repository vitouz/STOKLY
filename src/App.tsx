import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UpdatePassword from './pages/UpdatePassword';
import type { Session } from '@supabase/supabase-js';


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App: Initializing session check...');

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: Session retrieved', session ? 'Found Session' : 'No Session');
      setSession(session);
    }).catch((err) => {
      console.error('App: Error getting session:', err);
    }).finally(() => {
      console.log('App: Loading finished');
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App: Auth state changed:', _event);
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
        <Route
          path="/"
          element={session ? <Dashboard /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
