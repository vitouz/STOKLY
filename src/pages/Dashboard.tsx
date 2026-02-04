import { useEffect, useState } from 'react';
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
}

interface TopProduct {
    name: string;
    quantity: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
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
                .select('*')
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

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <main className="max-w-7xl mx-auto space-y-8">
                {/* Welcome & Quick Action */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Visão Geral</h1>
                        <p className="text-gray-500 font-medium">Bem-vindo de volta, aqui está o resumo do seu negócio.</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {(['today', '7d', '30d'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {p === 'today' ? 'Hoje' : p === '7d' ? '7 Dias' : '30 Dias'}
                            </button>
                        ))}
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                                <ShoppingCart className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hoje</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900">{loading ? '...' : stats.todaySalesCount}</h3>
                            <p className="text-sm font-bold text-gray-500">Vendas hoje</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faturamento</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900">
                                {loading ? '...' : `R$ ${stats.periodRevenue.toFixed(2)}`}
                            </h3>
                            <p className="text-sm font-bold text-gray-500">No período selecionado</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                                <Package className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estoque</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900">{loading ? '...' : stats.totalProducts}</h3>
                            <p className="text-sm font-bold text-gray-500">Produtos cadastrados</p>
                        </div>
                    </div>

                    <div className={`p-6 rounded-3xl shadow-sm border ${stats.lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stats.lowStockCount > 0 ? 'bg-red-200 text-red-600' : 'bg-gray-50 text-gray-400'} p-3 rounded-2xl`}>
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alertas</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className={`text-2xl font-black ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
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
                                className="bg-white border-l-4 border-amber-500 p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    <p className="text-sm font-bold text-gray-700">{alert}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Tendência de Vendas</h3>
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Mais Vendidos</h3>
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={100}
                                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }}
                                    />
                                    <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} />
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
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900">Últimas Vendas</h3>
                            <button onClick={() => navigate('/sales')} className="text-blue-600 font-bold text-sm hover:underline">Ver todas</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Venda</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Valor</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Pagamento</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {recentSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50 transition-all cursor-pointer group">
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-100 p-2 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                        <Clock className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">#{sale.id.slice(0, 8)}</div>
                                                        <div className="text-xs text-gray-500">{format(parseISO(sale.created_at), "HH:mm 'em' dd/MM")}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-900">R$ {sale.total_amount.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                    {sale.payment_method === 'money' ? 'DINHEIRO' : sale.payment_method.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {sale.status === 'completed' ? 'Finalizada' : sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentSales.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">Nenhuma venda recente</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 mb-6">Atalhos</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Vender', icon: ShoppingCart, color: 'blue', path: '/sales' },
                                { label: 'Produtos', icon: Package, color: 'purple', path: '/inventory' },
                                { label: 'Relatórios', icon: TrendingUp, color: 'emerald', path: '#' },
                                { label: 'Config', icon: Filter, color: 'amber', path: '/settings' }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(item.path)}
                                    className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-all group"
                                >
                                    <div className={`p-3 rounded-2xl bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-all`}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
