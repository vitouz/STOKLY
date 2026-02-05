import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Package,
    TrendingUp,
    AlertCircle,
    ShoppingCart,
    DollarSign,
    Clock,
    CreditCard,
    AlertTriangle,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardStats {
    todaySalesCount: number;
    todaySalesTotal: number;
    periodRevenue: number;
    totalProducts: number;
    lowStockCount: number;
}

interface SaleRecord {
    id: string;
    created_at: string;
    total_amount: number;
    payment_method: string;
    status: string;
    sale_items?: {
        id: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        products: { name: string } | null;
    }[];
}

interface TopProduct {
    name: string;
    quantity: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        todaySalesCount: 0,
        todaySalesTotal: 0,
        periodRevenue: 0,
        totalProducts: 0,
        lowStockCount: 0
    });
    const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [alerts, setAlerts] = useState<string[]>([]);
    const [expandedSale, setExpandedSale] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, [period]);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const now = new Date();
            let startDate: Date;

            if (period === 'today') startDate = startOfDay(now);
            else if (period === '7d') startDate = startOfDay(subDays(now, 7));
            else startDate = startOfDay(subDays(now, 30));

            // 1. Fetch Products for Stock Stats
            const { data: products } = await supabase
                .from('products')
                .select('stock_quantity, min_stock_level');

            // 2. Fetch Sales for the selected period
            const { data: sales } = await supabase
                .from('sales')
                .select(`
                    *,
                    sale_items (
                        id,
                        quantity,
                        unit_price,
                        total_price,
                        products (name)
                    )
                `)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            // 3. Fetch Top Products
            const { data: saleItems } = await supabase
                .from('sale_items')
                .select('quantity, products(name)')
                .gte('created_at', startDate.toISOString());

            // Process Stats
            const today = startOfDay(now);
            const todaySales = (sales || []).filter(s => new Date(s.created_at) >= today);

            const newStats: DashboardStats = {
                todaySalesCount: todaySales.length,
                todaySalesTotal: todaySales.reduce((acc, s) => acc + s.total_amount, 0),
                periodRevenue: (sales || []).reduce((acc, s) => acc + s.total_amount, 0),
                totalProducts: products?.length || 0,
                lowStockCount: products?.filter(p => p.stock_quantity <= p.min_stock_level).length || 0
            };

            setStats(newStats);
            setRecentSales((sales || []).slice(0, 5));

            // Process Chart Data (Sales per day)
            const daysMap: Record<string, number> = {};
            (sales || []).forEach(s => {
                const day = format(parseISO(s.created_at), 'dd/MM');
                daysMap[day] = (daysMap[day] || 0) + s.total_amount;
            });
            const formattedChartData = Object.keys(daysMap).map(day => ({
                name: day,
                total: daysMap[day]
            })).reverse();
            setChartData(formattedChartData);

            // Process Top Products
            const prodMap: Record<string, number> = {};
            (saleItems || []).forEach((item: any) => {
                const name = item.products?.name || 'Desconhecido';
                prodMap[name] = (prodMap[name] || 0) + item.quantity;
            });
            const top = Object.keys(prodMap)
                .map(name => ({ name, quantity: prodMap[name] }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
            setTopProducts(top);

            // Alerts
            const newAlerts = [];
            if (newStats.lowStockCount > 0) newAlerts.push(`${newStats.lowStockCount} produtos com estoque crítico!`);
            if (newStats.todaySalesCount === 0 && period === 'today') newAlerts.push('Nenhuma venda registrada hoje ainda.');
            setAlerts(newAlerts);

        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    const getColor = (index: number) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        return colors[index % colors.length];
    };

    const getPaymentLabel = (method: string) => {
        switch (method) {
            case 'money': return 'Dinheiro';
            case 'pix': return 'PIX';
            case 'credit_card': return 'Crédito';
            case 'debit_card': return 'Débito';
            default: return method;
        }
    };

    const chartTextColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const chartGridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <main className="max-w-7xl mx-auto space-y-8">
                {/* Welcome & Quick Action */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Visão Geral</h1>
                        <p className="text-gray-500 font-medium">Bem-vindo de volta, aqui está o resumo do seu negócio.</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
                        {(['today', '7d', '30d'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {p === 'today' ? 'Hoje' : p === '7d' ? '7 Dias' : '30 Dias'}
                            </button>
                        ))}
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
                                <ShoppingCart className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hoje</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.todaySalesCount}</h3>
                            <p className="text-sm font-bold text-gray-500">Vendas hoje</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faturamento</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                {loading ? '...' : `R$ ${stats.periodRevenue.toFixed(2)}`}
                            </h3>
                            <p className="text-sm font-bold text-gray-500">No período selecionado</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-2xl text-purple-600 dark:text-purple-400">
                                <Package className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estoque</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.totalProducts}</h3>
                            <p className="text-sm font-bold text-gray-500">Produtos cadastrados</p>
                        </div>
                    </div>

                    <div className={`p-6 rounded-3xl shadow-sm border transition-colors ${stats.lowStockCount > 0
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                        : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stats.lowStockCount > 0 ? 'bg-red-200 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-900/30 text-gray-400'} p-3 rounded-2xl`}>
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alertas</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className={`text-2xl font-black ${stats.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {loading ? '...' : stats.lowStockCount}
                            </h3>
                            <p className="text-sm font-bold text-gray-500">Reposição necessária</p>
                        </div>
                    </div>
                </div>

                {/* Alerts Section */}
                {alerts.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                onClick={() => alert.includes('estoque') ? navigate('/inventory') : null}
                                className="bg-white dark:bg-gray-800/50 border-l-4 border-amber-500 p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border-y border-r border-gray-100 dark:border-gray-700/50"
                            >
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{alert}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800/50 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Tendência de Vendas</h3>
                            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 'bold' }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                            color: theme === 'dark' ? '#ffffff' : '#1e293b'
                                        }}
                                        labelStyle={{ fontWeight: 'bold', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: theme === 'dark' ? '#1e293b' : '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Mais Vendidos</h3>
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={100}
                                        tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 'bold' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc', radius: 8 }}
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
                                        }}
                                    />
                                    <Bar dataKey="quantity" radius={[0, 8, 8, 0]} barSize={20}>
                                        {topProducts.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={getColor(index)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Sales & Shortcuts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Últimas Vendas</h3>
                            <button onClick={() => navigate('/sales-history')} className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">Ver todas</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest w-10"></th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Venda</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Pagamento</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {recentSales.map((sale) => (
                                        <React.Fragment key={sale.id}>
                                            <tr
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all cursor-pointer group ${expandedSale === sale.id ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                                                onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    {expandedSale === sale.id ? <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                                                            <Clock className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white">#{sale.id.slice(0, 8)}</div>
                                                            <div className="text-xs text-gray-500">{format(parseISO(sale.created_at), "HH:mm 'em' dd/MM")}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white">R$ {sale.total_amount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                        {getPaymentLabel(sale.payment_method)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate('/sales-history'); }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                        title="Ver no histórico completo"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedSale === sale.id && (
                                                <tr className="bg-blue-50/20 dark:bg-blue-900/10">
                                                    <td colSpan={5} className="px-8 py-4">
                                                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                                            <table className="min-w-full">
                                                                <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produto</th>
                                                                        <th className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qtd</th>
                                                                        <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                                                    {sale.sale_items?.map((item) => (
                                                                        <tr key={item.id}>
                                                                            <td className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300">{item.products?.name}</td>
                                                                            <td className="px-4 py-2 text-xs text-center font-bold text-gray-500 dark:text-gray-400">{item.quantity}</td>
                                                                            <td className="px-4 py-2 text-xs text-right font-black text-gray-900 dark:text-white">R$ {item.total_price.toFixed(2)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {recentSales.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">Nenhuma venda recente</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Atalhos</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Vender', icon: ShoppingCart, color: 'blue', path: '/sales' },
                                { label: 'Produtos', icon: Package, color: 'purple', path: '/inventory' },
                                { label: 'Histórico', icon: Clock, color: 'emerald', path: '/sales-history' },
                                { label: 'Config', icon: Filter, color: 'amber', path: '/settings' }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(item.path)}
                                    className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                                >
                                    <div className={`p-3 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400 group-hover:scale-110 transition-all`}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
