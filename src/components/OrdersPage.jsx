import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cartFetch, assetUrl } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

export default function OrdersPage() {
  usePageTitle('My Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    const fetchOrders = async () => {
      try {
        const data = await cartFetch('/api/orders');
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const statusColor = (status) => {
    switch (status) {
      case 'placed': return 'text-blue-400';
      case 'processing': return 'text-yellow-400';
      case 'shipped': return 'text-purple-400';
      case 'delivered': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-muted';
    }
  };

  return (
    <div className="min-h-screen bg-surface pt-24">
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-12 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-accent uppercase tracking-[0.5em] text-[10px] mb-4"
            >
              Your Purchases
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-foreground text-4xl md:text-5xl font-serif italic"
            >
              My Orders
            </motion.h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-dim/50 animate-pulse rounded" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Package size={48} className="text-dim mx-auto mb-6" strokeWidth={1} />
              <p className="text-subtle text-sm tracking-widest uppercase mb-8">No orders yet</p>
              <Link
                to="/gallery"
                className="px-12 py-4 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase hover:bg-accent hover:border-accent hover:text-surface transition-all duration-700"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-foreground/10 overflow-hidden"
                >
                  {/* Order Header — clickable */}
                  <button
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-foreground/[0.02] transition-colors text-left"
                  >
                    <div className="flex flex-wrap items-center gap-4 md:gap-8">
                      <div>
                        <p className="text-subtle text-[9px] tracking-[0.2em] uppercase">Order</p>
                        <p className="text-accent text-sm font-mono">
                          #{order._id.toString().slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-subtle text-[9px] tracking-[0.2em] uppercase">Date</p>
                        <p className="text-foreground-2 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-subtle text-[9px] tracking-[0.2em] uppercase">Total</p>
                        <p className="text-foreground text-sm font-serif">
                          &#8377;{order.totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-subtle text-[9px] tracking-[0.2em] uppercase">Status</p>
                        <p className={`text-sm capitalize ${statusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-subtle transition-transform duration-300 flex-shrink-0 ${expandedId === order._id ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedId === order._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 md:px-6 pb-6 border-t border-foreground/5 pt-4">
                          {/* Items */}
                          <div className="space-y-3 mb-6">
                            {order.items.map((item) => (
                              <div key={`${item.productId}-${item.size || 'default'}`} className="flex gap-3 items-center">
                                <div className="w-10 h-12 bg-dim overflow-hidden flex-shrink-0 rounded-md border border-foreground/5">
                                  <img
                                    src={assetUrl(item.image)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-foreground text-sm truncate">{item.name}{item.size && <span className="text-subtle text-[10px] ml-1">({item.size})</span>}</p>
                                  <p className="text-subtle text-[11px]">x{item.quantity}</p>
                                </div>
                                <p className="text-foreground-2 text-sm">
                                  &#8377;{(item.price * item.quantity).toLocaleString('en-IN')}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Address + Payment */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-foreground/5">
                            <div>
                              <p className="text-subtle text-[9px] tracking-[0.2em] uppercase mb-2">Ship To</p>
                              <div className="text-muted text-sm leading-relaxed">
                                <p className="text-foreground">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.address}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-subtle text-[9px] tracking-[0.2em] uppercase mb-2">Payment</p>
                              <p className="text-muted text-sm">
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}
                              </p>
                              <p className="text-subtle text-[11px] capitalize">
                                {order.paymentStatus}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
