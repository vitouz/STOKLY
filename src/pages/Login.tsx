import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthButton } from '../components/auth/AuthButton';

type AuthMode = 'signin' | 'forgot_password';

export default function Login() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const resetState = () => {
        setError(null);
        setSuccessMessage(null);
        setPassword('');
    };

    const handleModeChange = (newMode: AuthMode) => {
        setMode(newMode);
        resetState();
    };

    const validateForm = () => {
        if (!email || !email.includes('@')) {
            setError('Por favor, insira um endereço de e-mail válido.');
            return false;
        }
        if (mode !== 'forgot_password' && password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (mode === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Salva o horário do login para controle de sessão diária
                localStorage.setItem('stokly_last_login', Date.now().toString());
            } else if (mode === 'forgot_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/update-password`,
                });
                if (error) throw error;
                setSuccessMessage('Verifique seu e-mail para o link de recuperação.');
                setTimeout(() => setMode('signin'), 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'signin': return 'Bem-vindo de volta';
            case 'forgot_password': return 'Recuperar senha';
        }
    };

    const getSubtitle = () => {
        switch (mode) {
            case 'signin': return 'Insira suas credenciais para acessar sua conta';
            case 'forgot_password': return 'Insira seu e-mail para receber um link de recuperação';
        }
    };

    return (
        <AuthLayout title={getTitle()} subtitle={getSubtitle()}>
            <div className="space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {successMessage}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <AuthInput
                        label="Endereço de E-mail"
                        type="email"
                        placeholder="seu@exemplo.com"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />

                    {mode !== 'forgot_password' && (
                        <div>
                            <AuthInput
                                label="Senha"
                                type="password"
                                placeholder="••••••••"
                                icon={Lock}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                            />
                            {mode === 'signin' && (
                                <div className="flex justify-end mt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleModeChange('forgot_password')}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                    >
                                        Esqueceu a senha?
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <AuthButton loading={loading}>
                        {mode === 'signin' && (
                            <span className="flex items-center gap-2">
                                Entrar <ArrowRight className="h-4 w-4" />
                            </span>
                        )}
                        {mode === 'forgot_password' && 'Enviar Link de Recuperação'}
                    </AuthButton>
                </form>

                {mode === 'forgot_password' && (
                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => setMode('signin')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Voltar para o login
                        </button>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}

