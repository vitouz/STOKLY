import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Package,
    Plus,
    Search,
    Trash2,
    Edit2,
    AlertTriangle,
    X,
    Save,
    Barcode,
    DollarSign,
    Loader2
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    cost_price: number;
    stock_quantity: number;
    min_stock_level: number;
    category: string;
    barcode: string;
    unit: string;
}

export default function Inventory() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        cost_price: '',
        stock_quantity: '',
        min_stock_level: '5',
        category: '',
        barcode: '',
        unit: 'UN'
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            setIsInitialLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setIsInitialLoading(false);
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (product: Product | null = null) => {
        setFeedback(null);
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                cost_price: product.cost_price?.toString() || '0',
                stock_quantity: product.stock_quantity.toString(),
                min_stock_level: product.min_stock_level.toString(),
                category: product.category || '',
                barcode: product.barcode || '',
                unit: product.unit || 'UN'
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                cost_price: '',
                stock_quantity: '',
                min_stock_level: '5',
                category: '',
                barcode: '',
                unit: 'UN'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        const price = parseFloat(formData.price) || 0;
        const costPrice = parseFloat(formData.cost_price) || 0;
        const stockQty = parseInt(formData.stock_quantity) || 0;
        const minStock = parseInt(formData.min_stock_level) || 0;

        if (price < 0 || costPrice < 0 || stockQty < 0 || minStock < 0) {
            setFeedback({ type: 'error', message: 'Valores não podem ser negativos.' });
            setIsSubmitting(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const productData: any = {
                name: formData.name,
                description: formData.description,
                price: price,
                cost_price: costPrice,
                stock_quantity: stockQty,
                min_stock_level: minStock,
                category: formData.category,
                barcode: formData.barcode,
                unit: formData.unit
            };

            // Only send user_id on insert
            if (!editingProduct) {
                productData.user_id = user.id;
            }

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }

            setToast({ type: 'success', message: `Produto ${editingProduct ? 'atualizado' : 'cadastrado'} com sucesso!` });
            setIsModalOpen(false);
            fetchProducts();
        } catch (err: any) {
            console.error('Error saving product:', err);
            let message = err.details || err.message || 'Erro ao salvar produto.';

            if (message.includes('profiles')) {
                message = 'Seu perfil de usuário não foi encontrado no banco. Por favor, rode o comando SQL que forneci no chat para sincronizar seu login.';
            }

            setFeedback({
                type: 'error',
                message: message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setToast({ type: 'success', message: 'Produto excluído com sucesso!' });
            setDeletingProduct(null);
            fetchProducts();
        } catch (err: any) {
            console.error('Error deleting product:', err);
            setToast({ type: 'error', message: err.message || 'Erro ao excluir produto.' });
        }
    };

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <main className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Gestão de Estoque</h1>
                        <p className="text-gray-500 font-medium">Controle total sobre seus produtos, custos e reposição.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25 gap-3"
                    >
                        <Plus className="h-6 w-6" /> Novo Produto
                    </button>
                </header>

                <div className="mb-8">
                    <div className="relative max-w-xl">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nome, categoria ou código de barras..."
                            className="block w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Produto</th>
                                    <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Categoria / EAN</th>
                                    <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Preço</th>
                                    <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Estoque</th>
                                    <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {isInitialLoading ? (
                                    Array(5).fill(0).map((_, idx) => (
                                        <tr key={idx} className="animate-pulse">
                                            <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded-xl w-48"></div></td>
                                            <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded-xl w-32"></div></td>
                                            <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded-xl w-24"></div></td>
                                            <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded-xl w-20"></div></td>
                                            <td className="px-6 py-6 text-right"><div className="h-10 bg-gray-100 rounded-xl w-16 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                                            Nenhum produto encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const isLowStock = product.stock_quantity <= product.min_stock_level;
                                        return (
                                            <tr key={product.id} className="group hover:bg-gray-50 transition-all">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-2xl ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} transition-transform group-hover:scale-110`}>
                                                            <Package className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <div className="text-base font-black text-gray-900">{product.name}</div>
                                                            <div className="text-xs text-gray-400 font-medium">{product.description || 'Sem descrição'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="inline-flex w-fit px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            {product.category || 'Geral'}
                                                        </span>
                                                        {product.barcode && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                                                <Barcode className="h-3 w-3" />
                                                                {product.barcode}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900">R$ {product.price.toFixed(2)}</span>
                                                        {product.cost_price > 0 && (
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Custo: R$ {product.cost_price.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex flex-col">
                                                            <span className={`text-base font-black ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {product.stock_quantity} <span className="text-[10px] text-gray-400 ml-0.5">{product.unit || 'UN'}</span>
                                                            </span>
                                                        </div>
                                                        {isLowStock && (
                                                            <div className="bg-red-100 p-1 rounded-md">
                                                                <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right space-x-2">
                                                    <button
                                                        onClick={() => openModal(product)}
                                                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingProduct(product)}
                                                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <header className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                    <div className="bg-blue-600 p-2 rounded-xl text-white">
                                        {editingProduct ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                    </div>
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            {feedback && (
                                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {feedback.type === 'success' ? <Plus className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                    <span className="flex-1">{feedback.message}</span>
                                </div>
                            )}

                            <div className="space-y-5 text-left">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nome do Produto</label>
                                    <input
                                        required
                                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                        placeholder="Ex: Teclado Mecânico RGB"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                            <Barcode className="h-3.5 w-3.5" /> Código EAN
                                        </label>
                                        <input
                                            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                            value={formData.barcode}
                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Categoria</label>
                                        <input
                                            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                            <DollarSign className="h-3.5 w-3.5" /> Preço Venda
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm text-blue-600"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 text-gray-400">Preço Custo</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                            value={formData.cost_price}
                                            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Qtd</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                            value={formData.stock_quantity}
                                            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Unidade</label>
                                        <select
                                            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            <option value="UN">UN</option>
                                            <option value="KG">KG</option>
                                            <option value="LT">LT</option>
                                            <option value="PC">PC</option>
                                            <option value="CX">CX</option>
                                            <option value="BD">BD</option>
                                            <option value="MT">MT</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5" /> Estoque Mínimo
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                                        value={formData.min_stock_level}
                                        onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                                    />
                                </div>
                            </div>
                        </form>

                        <footer className="px-6 py-5 border-t border-gray-50 flex gap-3 bg-gray-50/50">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-4 border-2 border-gray-200 text-gray-400 font-black rounded-2xl hover:bg-white hover:text-gray-900 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={(e) => handleSave(e as any)}
                                disabled={isSubmitting}
                                className="flex-[2] px-4 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" /> {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                                    </>
                                )}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className={`px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                        {toast.type === 'success' ? <Save className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deletingProduct && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                <Trash2 className="h-10 w-10 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Excluir Produto?</h3>
                            <p className="text-gray-500 font-medium px-4">
                                Tem certeza que deseja excluir <span className="text-gray-900 font-black">"{deletingProduct.name}"</span>? Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <footer className="p-6 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setDeletingProduct(null)}
                                className="flex-1 px-4 py-4 bg-white border-2 border-gray-100 text-gray-400 font-black rounded-2xl hover:text-gray-900 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deletingProduct.id)}
                                className="flex-1 px-4 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Excluir
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
