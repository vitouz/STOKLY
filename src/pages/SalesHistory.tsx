import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Calendar,
    Filter,
    Clock,
    CreditCard,
    ChevronDown,
    ChevronUp,
    Eye,
    Loader2,
    ShoppingCart
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
        name: string;
    } | null;
}

interface Sale {
    id: string;
    created_at: string;
    total_amount: number;
    payment_method: string;
    status: string;
    sale_items: SaleItem[];
}

export default function SalesHistory() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfDay(new Date()), 'yyyy-MM-dd'));
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [expandedSale, setExpandedSale] = useState<string | null>(null);

    useEffect(() => {
        fetchSales();
    }, [startDate, endDate, paymentFilter]);

    async function fetchSales() {
        try {
            setLoading(true);
            let query = supabase
                .from('sales')
                .select(`
                    *,
                    sale_items (
                        *,
                        products (name)
                    )
                `)
                .gte('created_at', startOfDay(parseISO(startDate)).toISOString())
                .lte('created_at', endOfDay(parseISO(endDate)).toISOString())
                .order('created_at', { ascending: false });

            if (paymentFilter !== 'all') {
                query = query.eq('payment_method', paymentFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSales(data || []);
        } catch (err) {
            console.error('Error fetching sales:', err);
        } finally {
            setLoading(false);
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedSale(expandedSale === id ? null : id);
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

    const totalPeriod = sales.reduce((acc, sale) => acc + sale.total_amount, 0);

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <main className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Histórico de Vendas</h1>
                        <p className="text-gray-500 font-medium">Consulte e analise todas as vendas realizadas.</p>
                    </div>
                </header>

                {/* Filters & Summary */}
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Início
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-gray-700 transition-all"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Fim
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-gray-700 transition-all"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Filter className="h-3 w-3" /> Pagamento
                            </label>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 dark:text-white border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-gray-700 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Todos os métodos</option>
                                <option value="money">Dinheiro</option>
                                <option value="pix">PIX</option>
                                <option value="credit_card">Cartão de Crédito</option>
                                <option value="debit_card">Cartão de Débito</option>
                            </select>
                        </div>
                        <div className="bg-blue-600 dark:bg-blue-500 p-4 rounded-2xl text-white flex flex-col justify-center text-left">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total no Período</span>
                            <span className="text-xl font-black">R$ {totalPeriod.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Sales List */}
                <div className="bg-white dark:bg-gray-800/50 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="h-10 w-10 animate-spin mb-4" />
                            <p className="font-bold">Carregando vendas...</p>
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                            <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                            <p className="font-bold">Nenhuma venda encontrada no período.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest w-10"></th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest uppercase">Venda</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest uppercase">Data/Hora</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest uppercase">Método</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest uppercase">Valor</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {sales.map((sale) => (
                                        <React.Fragment key={sale.id}>
                                            <tr
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all cursor-pointer group ${expandedSale === sale.id ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                                                onClick={() => toggleExpand(sale.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    {expandedSale === sale.id ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <span className="font-bold text-gray-900 dark:text-white">#{sale.id.slice(0, 8)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-sm font-medium">{format(parseISO(sale.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase text-left">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                        {getPaymentLabel(sale.payment_method)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                                    R$ {sale.total_amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedSale === sale.id && (
                                                <tr className="bg-blue-50/20 dark:bg-blue-900/10">
                                                    <td colSpan={6} className="px-12 py-6">
                                                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                                            <div className="px-6 py-4 bg-blue-50/50 dark:bg-gray-900/50 border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                                                                <h4 className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest">Itens da Venda</h4>
                                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{sale.sale_items.length} produtos</span>
                                                            </div>
                                                            <table className="min-w-full">
                                                                <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                                                                    <tr>
                                                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produto</th>
                                                                        <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qtd</th>
                                                                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unitário</th>
                                                                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                                                    {sale.sale_items.map((item) => (
                                                                        <tr key={item.id}>
                                                                            <td className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 text-left">{item.products?.name || 'Produto Removido'}</td>
                                                                            <td className="px-6 py-3 text-sm text-center font-bold text-gray-500 dark:text-gray-400">{item.quantity}</td>
                                                                            <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">R$ {item.unit_price.toFixed(2)}</td>
                                                                            <td className="px-6 py-3 text-sm text-right font-black text-gray-900 dark:text-white">R$ {item.total_price.toFixed(2)}</td>
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
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
