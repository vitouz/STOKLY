import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthButton } from '../components/auth/AuthButton';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccessMessage('Senha atualizada com sucesso! Redirecionando...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Falha ao atualizar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Definir nova senha"
            subtitle="Por favor, escolha uma senha forte para sua conta."
        >
            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm animate-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm animate-in slide-in-from-top-2">
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
                <AuthInput
                    label="Nova Senha"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                />

                <AuthButton loading={loading}>
                    Atualizar Senha
                </AuthButton>
            </form>
        </AuthLayout>
    );
}
