import { supabase } from '../lib/supabase';
import { LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="h-6 w-6 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900 tracking-tight">Stockly</span>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
                    <p className="mt-1 text-sm text-gray-500">Visão geral das métricas do seu negócio.</p>
                </header>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Placeholder Cards */}
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
                                            <User className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total de Usuários</dt>
                                            <dd className="text-lg font-medium text-gray-900">12.345</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-blue-700 hover:text-blue-900">
                                        Ver tudo
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-lg bg-blue-50 border border-blue-100 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <LayoutDashboard className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Pronto para começar</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    Este painel está pronto para o seu conteúdo. Comece a adicionar suas funcionalidades aqui.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
