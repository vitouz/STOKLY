import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Shield,
    Database,
    Palette,
    ChevronLeft,
    Check,
    Loader2,
    Moon,
    Sun,
    Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
}

export default function Settings() {
    const { theme, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const sections = [
        { id: 'profile', label: 'Meu Perfil', icon: User, desc: 'Gerencie suas informações pessoais e senha.' },
        { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Configure alertas de estoque e vendas.' },
        { id: 'security', label: 'Segurança', icon: Shield, desc: 'Controle de acesso e sessões ativas.' },
        { id: 'data', label: 'Dados', icon: Database, desc: 'Exportação de relatórios e backup do sistema.' },
        { id: 'appearance', label: 'Aparência', icon: Palette, desc: 'Personalize cores e modo escuro.' },
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setProfile(data);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    }

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: profile.full_name })
                .eq('id', profile.id);

            if (error) throw error;
            setSuccessMessage('Perfil atualizado com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    }

    const exportData = async () => {
        setSaving(true);
        try {
            // Simulated export: in a real app, this would fetch tables and convert to CSV
            const { data: products } = await supabase.from('products').select('*');
            const csv = [
                ['ID', 'Nome', 'Preço', 'Estoque'],
                ...(products?.map(p => [p.id, p.name, p.price, p.stock_quantity]) || [])
            ].map(e => e.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'stokly_produtos.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setSuccessMessage('Dados exportados com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Export error:', err);
        } finally {
            setSaving(false);
        }
    };

    if (activeSection) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-6 animate-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => setActiveSection(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold mb-8 transition-colors group"
                >
                    <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </button>

                <div className="flex items-center gap-4 mb-12">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white">
                        {(() => {
                            const section = sections.find(s => s.id === activeSection);
                            const Icon = section?.icon || SettingsIcon;
                            return <Icon className="h-6 w-6" />;
                        })()}
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {sections.find(s => s.id === activeSection)?.label}
                    </h2>
                </div>

                <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-[32px] p-8 shadow-sm">
                    {activeSection === 'profile' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Nome Completo</label>
                                <input
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold dark:text-white"
                                    value={profile?.full_name || ''}
                                    onChange={e => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 opacity-50">E-mail (Não editável)</label>
                                <input
                                    className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-900/20 border-2 border-transparent rounded-2xl outline-none font-bold text-gray-400 cursor-not-allowed"
                                    value={profile?.email || ''}
                                    disabled
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Alterações'}
                            </button>
                        </form>
                    )}

                    {activeSection === 'appearance' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {theme === 'dark' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Modo Escuro</h4>
                                        <p className="text-sm text-gray-500">Alternar entre tema claro e escuro.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeSection === 'data' && (
                        <div className="space-y-6">
                            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                                <h4 className="font-bold text-amber-900 dark:text-amber-500 mb-2">Exportar Inventário</h4>
                                <p className="text-sm text-amber-700 dark:text-amber-600 mb-4">Gere um arquivo CSV com todos os seus produtos e preços atuais.</p>
                                <button
                                    onClick={exportData}
                                    className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                                >
                                    <Download className="h-4 w-4" /> Baixar CSV
                                </button>
                            </div>
                        </div>
                    )}

                    {(activeSection === 'notifications' || activeSection === 'security') && (
                        <div className="py-12 text-center text-gray-400 space-y-4">
                            <Shield className="h-12 w-12 mx-auto opacity-20" />
                            <p className="font-medium">Estas configurações estarão disponíveis em breve.</p>
                        </div>
                    )}
                </div>

                {successMessage && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-bottom-4">
                        <Check className="h-5 w-5" />
                        {successMessage}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <SettingsIcon className="h-5 w-5" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Configurações</h1>
                </div>
                <p className="text-gray-500 font-medium">Personalize sua experiência no Stokly.</p>
            </header>

            <div className="space-y-4">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className="w-full flex items-center gap-6 p-6 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all text-left group"
                    >
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-all">
                            <section.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{section.label}</h3>
                            <p className="text-sm text-gray-500 font-medium">{section.desc}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-12 p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-500/20 text-center">
                <h3 className="text-xl font-black mb-2">Versão 1.0.0</h3>
                <p className="text-blue-100 font-medium text-sm">O sistema está atualizado. Algumas configurações avançadas requerem permissão de administrador.</p>
            </div>
        </div>
    );
}
