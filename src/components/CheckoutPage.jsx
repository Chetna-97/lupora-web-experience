import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cartFetch, assetUrl } from '../utils/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, loading, refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isAuthenticated) refreshCart();
  }, [isAuthenticated, refreshCart]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/cart');
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const placeOrder = async (paymentData = {}) => {
    const res = await cartFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddress: form,
        paymentMethod,
        ...paymentData
      })
    });
    return res;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const { fullName, phone, address, city, state, pincode } = form;
    if (!fullName || !phone || !address || !city || !state || !pincode) {
      setError('Please fill in all shipping details');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);

    try {
      if (paymentMethod === 'cod') {
        const result = await placeOrder();
        navigate(`/order-confirmation/${result.orderId}`);
      } else {
        // Razorpay flow
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError('Failed to load payment gateway. Please try again.');
          setSubmitting(false);
          return;
        }

        // Create Razorpay order on backend
        const paymentOrder = await cartFetch('/api/payment/create-order', {
          method: 'POST',
          body: JSON.stringify({ amount: totalPrice })
        });

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'Lupora Perfumes',
          description: 'Purchase from Lupora',
          order_id: paymentOrder.orderId,
          handler: async (response) => {
            try {
              // Verify payment
              const verification = await cartFetch('/api/payment/verify', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              if (verification.verified) {
                const result = await placeOrder({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id
                });
                navigate(`/order-confirmation/${result.orderId}`);
              } else {
                setError('Payment verification failed. Please contact support.');
                setSubmitting(false);
              }
            } catch (err) {
              setError('Payment verification failed. Please contact support.');
              setSubmitting(false);
            }
          },
          prefill: {
            name: user?.name || form.fullName,
            email: user?.email || '',
            contact: form.phone
          },
          theme: { color: '#C5A059' },
          modal: {
            ondismiss: () => setSubmitting(false)
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-transparent border border-white/20 text-white px-4 py-3 text-sm tracking-wide focus:border-[#C5A059] focus:outline-none transition-colors placeholder-gray-600";

  return (
    <div className="min-h-screen bg-black pt-24">
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="mb-12 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#C5A059] uppercase tracking-[0.5em] text-[10px] mb-4"
            >
              Secure Checkout
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-4xl md:text-5xl font-serif italic"
            >
              Checkout
            </motion.h1>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <ShoppingBag size={48} className="text-gray-700 mx-auto mb-6" strokeWidth={1} />
              <p className="text-gray-500 text-sm tracking-widest uppercase mb-8">Your cart is empty</p>
              <Link
                to="/gallery"
                className="px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-[#C5A059] hover:border-[#C5A059] hover:text-black transition-all duration-700"
              >
                Explore Collection
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
                {/* Shipping Form — Left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="lg:col-span-3"
                >
                  <h2 className="text-white text-lg tracking-[0.2em] uppercase mb-8">Shipping Details</h2>
                  {/* Show logged-in user email */}
                  <p className="text-gray-400 text-sm mb-6">
                    Order confirmation will be sent to <span className="text-[#C5A059]">{user?.email}</span>
                  </p>
                  <div className="space-y-5">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      value={form.fullName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <textarea
                      name="address"
                      placeholder="Street Address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass + " resize-none"}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={form.city}
                        onChange={handleChange}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={form.state}
                        onChange={handleChange}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode"
                        value={form.pincode}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <h2 className="text-white text-lg tracking-[0.2em] uppercase mt-12 mb-8">Payment Method</h2>
                  <div className="space-y-4">
                    <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-white/20 hover:border-white/40'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#C5A059]"
                      />
                      <div>
                        <p className="text-white text-sm tracking-wide">Cash on Delivery</p>
                        <p className="text-gray-500 text-[11px] mt-1">Pay when your order arrives</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all duration-300 ${paymentMethod === 'razorpay' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-white/20 hover:border-white/40'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-[#C5A059]"
                      />
                      <div>
                        <p className="text-white text-sm tracking-wide">Pay Online (Razorpay)</p>
                        <p className="text-gray-500 text-[11px] mt-1">UPI, Cards, Net Banking, Wallets</p>
                      </div>
                    </label>
                  </div>
                </motion.div>

                {/* Order Summary — Right */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:col-span-2"
                >
                  <div className="border border-white/10 p-6 lg:p-8 sticky top-28">
                    <h2 className="text-white text-lg tracking-[0.2em] uppercase mb-6">Order Summary</h2>
                    <div className="space-y-4 mb-6">
                      {items.map((item) => (
                        <div key={item.productId} className="flex gap-4">
                          <div className="w-16 h-20 bg-neutral-900 overflow-hidden flex-shrink-0 rounded-lg border border-white/5">
                            <img
                              src={assetUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-serif truncate">{item.name}</p>
                            <p className="text-gray-500 text-[11px] mt-1">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-gray-300 text-sm flex-shrink-0">
                            &#8377;{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <div className="flex justify-between text-gray-400 text-sm">
                        <span>Subtotal</span>
                        <span>&#8377;{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 text-sm">
                        <span>Shipping</span>
                        <span className="text-[#C5A059]">Free</span>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex justify-between text-white">
                        <span className="text-sm tracking-[0.2em] uppercase">Total</span>
                        <span className="text-xl font-serif">&#8377;{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-400 text-xs mt-4 text-center">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-6 py-4 bg-[#C5A059] text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-[#d4af6a] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Pay & Place Order'}
                    </button>

                    <Link
                      to="/cart"
                      className="block text-center mt-4 text-gray-500 text-[10px] tracking-[0.2em] uppercase hover:text-white transition-colors"
                    >
                      Back to Cart
                    </Link>
                  </div>
                </motion.div>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
