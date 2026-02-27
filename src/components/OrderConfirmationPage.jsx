import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { cartFetch, assetUrl } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

export default function OrderConfirmationPage() {
  usePageTitle('Order Confirmed');
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchOrder = async () => {
      try {
        const data = await cartFetch(`/api/orders/${orderId}`);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-surface pt-24">
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : !order ? (
            <div className="text-center py-20">
              <p className="text-subtle text-sm tracking-widest uppercase mb-8">Order not found</p>
              <Link
                to="/gallery"
                className="px-12 py-4 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase hover:bg-accent hover:border-accent hover:text-surface transition-all duration-700"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {/* Success Header */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle size={64} className="text-green-500 mx-auto mb-6" strokeWidth={1.5} />
                </motion.div>
                <h1 className="text-foreground text-3xl md:text-4xl font-serif italic mb-3">Order Confirmed</h1>
                <p className="text-muted text-sm tracking-wide">
                  Thank you for your purchase! Your order has been placed successfully.
                </p>
              </div>

              {/* Order Details Card */}
              <div className="border border-foreground/10 p-6 md:p-8 mb-8">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-8 pb-6 border-b border-foreground/10">
                  <div>
                    <p className="text-subtle text-[9px] tracking-[0.3em] uppercase mb-1">Order ID</p>
                    <p className="text-accent text-sm tracking-wider font-mono">
                      #{order._id.toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-subtle text-[9px] tracking-[0.3em] uppercase mb-1">Date</p>
                    <p className="text-foreground-2 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-8">
                  <p className="text-foreground text-[10px] tracking-[0.3em] uppercase mb-4">Items</p>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={`${item.productId}-${item.size || 'default'}`} className="flex gap-4 items-center">
                        <div className="w-14 h-18 bg-dim overflow-hidden flex-shrink-0 rounded-lg border border-foreground/5">
                          <img
                            src={assetUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground text-sm font-serif">{item.name}</p>
                          {item.size && <p className="text-subtle text-[10px] tracking-[0.2em] uppercase">{item.size}</p>}
                          <p className="text-subtle text-[11px]">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-foreground-2 text-sm">
                          &#8377;{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping + Payment + Total */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-foreground/10">
                  <div>
                    <p className="text-foreground text-[10px] tracking-[0.3em] uppercase mb-3">Ship To</p>
                    <div className="text-muted text-sm leading-relaxed">
                      <p className="text-foreground">{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.phone}</p>
                      <p>{order.shippingAddress.address}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground text-[10px] tracking-[0.3em] uppercase mb-3">Payment</p>
                    <p className="text-muted text-sm">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}
                    </p>
                    <p className="text-subtle text-[11px] mt-1 capitalize">
                      Status: {order.paymentStatus}
                    </p>
                    <div className="mt-6">
                      <p className="text-foreground text-[10px] tracking-[0.3em] uppercase mb-2">Total</p>
                      <p className="text-accent text-2xl font-serif">
                        &#8377;{order.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/orders"
                  className="px-10 py-4 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase text-center hover:bg-foreground hover:text-surface transition-all duration-700"
                >
                  View All Orders
                </Link>
                <Link
                  to="/gallery"
                  className="px-10 py-4 bg-accent text-black text-[9px] tracking-[0.5em] uppercase text-center font-medium hover:bg-accent-hover transition-all duration-500"
                >
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
