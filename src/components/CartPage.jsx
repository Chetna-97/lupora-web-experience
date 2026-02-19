import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { assetUrl } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

function CartItemSkeleton() {
    return (
        <div className="flex gap-6 py-8 border-b border-white/10">
            <div className="w-24 h-32 bg-neutral-800 animate-pulse rounded" />
            <div className="flex-1">
                <div className="h-3 w-20 bg-neutral-800 animate-pulse rounded mb-2" />
                <div className="h-5 w-40 bg-neutral-800 animate-pulse rounded mb-4" />
                <div className="h-4 w-24 bg-neutral-800 animate-pulse rounded" />
            </div>
        </div>
    );
}

export default function CartPage() {
    usePageTitle('Cart');
    const { items, totalItems, totalPrice, loading, updateQuantity, removeFromCart, clearCart, refreshCart } = useCart();
    useEffect(() => {
        window.scrollTo(0, 0);
        refreshCart();
    }, [refreshCart]);

    const handleUpdateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        await updateQuantity(productId, newQuantity);
    };

    return (
        <div className="min-h-screen bg-black pt-24">
            {/* Cart Content */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Title */}
                    <div className="mb-16 text-center">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[#C5A059] uppercase tracking-[0.5em] text-[10px] mb-4"
                        >
                            Your Selection
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-white text-5xl md:text-7xl font-serif italic"
                        >
                            Shopping Cart
                        </motion.h1>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <CartItemSkeleton key={i} />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        /* Empty Cart */
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <ShoppingBag size={48} className="text-gray-700 mx-auto mb-6" strokeWidth={1} />
                            <p className="text-gray-500 text-sm tracking-widest uppercase mb-8">
                                Your cart is empty
                            </p>
                            <Link
                                to="/gallery"
                                className="px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-[#C5A059] hover:border-[#C5A059] hover:text-black transition-all duration-700"
                            >
                                Explore Collection
                            </Link>
                        </motion.div>
                    ) : (
                        /* Cart Items */
                        <div>
                            <AnimatePresence>
                                {items.map((item) => (
                                    <motion.div
                                        key={item.productId}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.4 }}
                                        className="flex gap-6 md:gap-10 py-8 border-b border-white/10"
                                    >
                                        {/* Product Image */}
                                        <div className="w-24 md:w-32 aspect-[3/4] bg-neutral-900 overflow-hidden flex-shrink-0 rounded-xl border border-white/5">
                                            <img
                                                src={assetUrl(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.3em] mb-1">
                                                    {item.category}
                                                </p>
                                                <h3 className="text-white text-lg md:text-xl font-serif">
                                                    {item.name}
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    &#8377;{item.price?.toLocaleString('en-IN')}
                                                </p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-4 border border-white/20 px-2 py-1">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors p-1"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-white text-sm tracking-wider w-6 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                                        className="text-gray-400 hover:text-white transition-colors p-1"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.productId)}
                                                    className="text-gray-600 hover:text-red-400 transition-colors p-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Line Total */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-white text-sm font-serif">
                                                &#8377;{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Cart Summary */}
                            <div className="mt-12 border-t border-white/20 pt-8">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-gray-400 text-[10px] tracking-[0.3em] uppercase">
                                        Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                                    </span>
                                    <span className="text-white text-2xl font-serif">
                                        &#8377;{totalPrice.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <Link
                                    to="/checkout"
                                    className="block w-full text-center py-4 bg-[#C5A059] text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-[#d4af6a] transition-all duration-500 mb-4"
                                >
                                    Proceed to Checkout
                                </Link>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        to="/gallery"
                                        className="flex-1 text-center px-8 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all duration-700"
                                    >
                                        Continue Shopping
                                    </Link>
                                    <button
                                        onClick={clearCart}
                                        className="px-8 py-4 border border-white/10 text-gray-500 text-[9px] tracking-[0.3em] uppercase hover:text-red-400 hover:border-red-400/30 transition-all duration-500"
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}
