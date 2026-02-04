import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthButton } from '../components/auth/AuthButton';

type AuthMode = 'signin' | 'signup' | 'forgot_password';

export default function Login() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

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
        if (mode === 'signup' && !fullName) {
            setError('Por favor, insira seu nome completo.');
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
            } else if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;

                // For a seamless experience if email verification is off or if you want to inform they can login
                setSuccessMessage('Conta criada com sucesso! Redirecionando...');

                // Attempt automatic login after signup for maximum fluidity
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) {
                    setSuccessMessage('Conta criada! Você já pode entrar.');
                    setMode('signin');
                }
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
            case 'signup': return 'Crie sua conta';
            case 'forgot_password': return 'Recuperar senha';
        }
    };

    const getSubtitle = () => {
        switch (mode) {
            case 'signin': return 'Insira suas credenciais para acessar sua conta';
            case 'signup': return 'Comece a gerenciar seu estoque hoje mesmo';
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
                    {mode === 'signup' && (
                        <AuthInput
                            label="Nome Completo"
                            type="text"
                            placeholder="João Silva"
                            icon={User}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    )}

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
                        {mode === 'signup' && 'Criar Conta'}
                        {mode === 'forgot_password' && 'Enviar Link de Recuperação'}
                    </AuthButton>
                </form>

                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
                            <span className="px-3 bg-[#11141A] text-gray-500">
                                {mode === 'signin' ? "Novo por aqui?" : "Bem-vindo de volta"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        {mode === 'forgot_password' ? (
                            <button
                                type="button"
                                onClick={() => handleModeChange('signin')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors group"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Voltar para o login
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleModeChange(mode === 'signin' ? 'signup' : 'signin')}
                                className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                {mode === 'signin' ? 'Criar uma conta gratuita' : 'Acessar sua conta'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
