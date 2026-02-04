import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings as SettingsIcon,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SidebarProps {
    isExpanded: boolean;
    setExpanded: (val: boolean) => void;
}

export default function Sidebar({ isExpanded, setExpanded }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, path: '/' },
        { id: 'inventory', label: 'Estoque', icon: Package, path: '/inventory' },
        { id: 'sales', label: 'Vendas', icon: ShoppingCart, path: '/sales' },
        { id: 'settings', label: 'Configurações', icon: SettingsIcon, path: '/settings' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 bg-[#0A0C10] border-r border-gray-800 transition-all duration-300 ease-in-out flex flex-col ${isExpanded ? 'w-64' : 'w-20'
                }`}
        >
            {/* Header / Logo & Toggle */}
            <div className={`h-16 flex items-center mb-6 px-4 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-blue-600 p-1.5 rounded-lg flex-shrink-0">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    {isExpanded && (
                        <span className="text-xl font-black text-white tracking-tight animate-in fade-in slide-in-from-left-2 duration-300">STOKLY</span>
                    )}
                </div>

                <button
                    onClick={() => setExpanded(!isExpanded)}
                    className={`p-2 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all ${!isExpanded ? 'hidden' : 'flex'
                        }`}
                    title="Recolher"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {!isExpanded && (
                    <button
                        onClick={() => setExpanded(true)}
                        className="absolute -right-3 top-20 bg-blue-600 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-all z-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                            title={!isExpanded ? item.label : ''}
                        >
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                            {isExpanded && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && <span className="font-bold text-sm tracking-wide">Sair</span>}
                </button>
            </div>
        </aside>
    );
}
