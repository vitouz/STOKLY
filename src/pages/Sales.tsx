import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CheckCircle,
    Loader2,
    Package,
    CreditCard
} from 'lucide-react';


interface Product {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
    category: string | null;
}

interface CartItem extends Product {
    quantity: number;
}

export default function Sales() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [saleSuccess, setSaleSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'money' | 'credit_card' | 'debit_card' | 'pix'>('money');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .gt('stock_quantity', 0)
                .order('name', { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    }

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) {
                    alert('Estoque insuficiente');
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                if (newQty > item.stock_quantity) {
                    alert('Estoque insuficiente');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const checkout = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Create Sale
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    user_id: user.id,
                    total_amount: total,
                    payment_method: paymentMethod,
                    status: 'completed'
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items & Update Stock
            for (const item of cart) {
                const { error: itemError } = await supabase
                    .from('sale_items')
                    .insert([{
                        sale_id: sale.id,
                        product_id: item.id,
                        quantity: item.quantity,
                        unit_price: item.price,
                        total_price: item.price * item.quantity
                    }]);

                if (itemError) throw itemError;

                // Decrement stock
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ stock_quantity: item.stock_quantity - item.quantity })
                    .eq('id', item.id);

                if (stockError) throw stockError;
            }

            setSaleSuccess(true);
            setCart([]);
            fetchProducts();
            setTimeout(() => setSaleSuccess(false), 3000);
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Erro ao processar venda');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50">
            {/* Product Selection Area */}
            <div className="flex-1 flex flex-col p-8 h-full border-r border-gray-100">
                <header className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">PDV Digital</h1>
                    <p className="text-gray-500 font-medium text-sm">Selecione os produtos abaixo para iniciar a venda.</p>
                </header>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar produto por nome..."
                        className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center mt-12"><Loader2 className="h-10 w-10 text-blue-600 animate-spin" /></div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center mt-12 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            Nenhum produto disponível
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex flex-col justify-between h-40 group border border-transparent hover:border-blue-100"
                                >
                                    <div>
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">
                                            {product.category || 'Geral'}
                                        </span>
                                        <h3 className="font-bold text-gray-900 mt-2 line-clamp-2">{product.name}</h3>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-black text-gray-900">R$ {product.price.toFixed(2)}</span>
                                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Area */}
            <div className="w-full md:w-96 bg-white flex flex-col shadow-2xl relative z-10">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl text-white">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Carrinho</h2>
                    <span className="ml-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                        {cart.reduce((a, b) => a + b.quantity, 0)} itens
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                            <ShoppingCart className="h-16 w-16 mb-4" />
                            <p className="font-medium">O carrinho está vazio</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center animate-in slide-in-from-right-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                    <div className="text-blue-600 font-bold text-sm">R$ {(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 px-2 border border-gray-100">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md text-gray-500 transition-colors">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md text-gray-500 transition-colors">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Total */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-6">
                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'money', label: 'Dinheiro' },
                                { id: 'pix', label: 'PIX' },
                                { id: 'credit_card', label: 'Crédito' },
                                { id: 'debit_card', label: 'Débito' }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={`py-2 px-3 rounded-xl text-sm font-bold border-2 transition-all ${paymentMethod === method.id
                                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                        }`}
                                >
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-500 text-sm">
                            <span>Subtotal</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 font-black text-2xl pt-2">
                            <span>Total</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    {saleSuccess ? (
                        <div className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold animate-in zoom-in-95">
                            <CheckCircle className="h-5 w-5" /> Venda realizada!
                        </div>
                    ) : (
                        <button
                            onClick={checkout}
                            disabled={cart.length === 0 || isProcessing}
                            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${cart.length === 0 || isProcessing
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95'
                                }`}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <CreditCard className="h-5 w-5" /> Finalizar Venda (F10)
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
