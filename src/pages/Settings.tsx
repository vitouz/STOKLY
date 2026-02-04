import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette } from 'lucide-react';

export default function Settings() {
    const sections = [
        { id: 'profile', label: 'Meu Perfil', icon: User, desc: 'Gerencie suas informações pessoais e senha.' },
        { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Configure alertas de estoque e vendas.' },
        { id: 'security', label: 'Segurança', icon: Shield, desc: 'Controle de acesso e sessões ativas.' },
        { id: 'data', label: 'Dados', icon: Database, desc: 'Exportação de relatórios e backup do sistema.' },
        { id: 'appearance', label: 'Aparência', icon: Palette, desc: 'Personalize cores e modo escuro.' },
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <SettingsIcon className="h-5 w-5" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações</h1>
                </div>
                <p className="text-gray-500 font-medium">Personalize sua experiência no STOKLY.</p>
            </header>

            <div className="space-y-4">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        className="w-full flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all text-left group"
                    >
                        <div className="bg-gray-50 p-4 rounded-2xl text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                            <section.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-gray-900 mb-1">{section.label}</h3>
                            <p className="text-sm text-gray-500 font-medium">{section.desc}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                            <SettingsIcon className="h-4 w-4" />
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
