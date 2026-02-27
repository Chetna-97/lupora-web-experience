import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Plus, ChevronDown, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cartFetch, assetUrl } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

export default function CheckoutPage() {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  const { items, totalPrice, loading } = useCart();
  const { isAuthenticated, user, setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Address selection state
  const [addressMode, setAddressMode] = useState('saved'); // 'saved' | 'new'
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'Home', fullName: '', address: '', city: '', state: '', pincode: ''
  });

  // Phone is separate — it's for order contact, not part of saved addresses
  const [phone, setPhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);

  const savedAddresses = user?.addresses || [];
  const defaultAddress = savedAddresses.find(a => a.isDefault) || savedAddresses[0] || null;
  const selectedAddress = savedAddresses.find(a => a._id === selectedAddressId) || null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/cart');
  }, [isAuthenticated, navigate]);

  // Initialize address selection when user loads
  useEffect(() => {
    if (!user) return;
    const userPhone = user.phone || '';
    setPhone(userPhone);
    setEditingPhone(!userPhone);
    if (savedAddresses.length > 0) {
      setAddressMode('saved');
      setSelectedAddressId(defaultAddress?._id || null);
    } else {
      setAddressMode('new');
    }
  }, [user?.id]);

  const handleNewAddressChange = (e) => {
    setNewAddressForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Get the shipping address to submit
  const getShippingAddress = () => {
    if (addressMode === 'saved' && selectedAddress) {
      return {
        fullName: selectedAddress.fullName,
        phone,
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
      };
    }
    return { ...newAddressForm, phone };
  };

  // Save new address to user's address book and select it
  const handleSaveNewAddress = async () => {
    const { fullName, address, city, state, pincode } = newAddressForm;
    if (!fullName || !address || !city || !state || !pincode) {
      setError('Please fill in all address fields');
      return;
    }
    setSavingAddress(true);
    setError('');
    try {
      const data = await cartFetch('/api/auth/addresses', {
        method: 'POST',
        body: JSON.stringify({ ...newAddressForm, isDefault: savedAddresses.length === 0 }),
      });
      setUser(prev => ({ ...prev, addresses: data.addresses }));
      // Select the newly added address (last in the array)
      const newAddr = data.addresses[data.addresses.length - 1];
      setSelectedAddressId(newAddr._id);
      setAddressMode('saved');
      setShowAddressPicker(false);
      setNewAddressForm({ label: 'Home', fullName: '', address: '', city: '', state: '', pincode: '' });
    } catch (err) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async (paymentData = {}) => {
    const res = await cartFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddress: getShippingAddress(),
        paymentMethod,
        ...paymentData
      })
    });
    return res;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const shippingAddress = getShippingAddress();
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      setError('Please fill in all shipping details');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setSubmitting(true);

    try {
      const result = await placeOrder();
      navigate(`/order-confirmation/${result.orderId}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-transparent border border-foreground/20 text-foreground px-4 py-3 text-sm tracking-wide focus:border-accent focus:outline-none transition-colors placeholder-faint";

  return (
    <div className="min-h-screen bg-surface pt-24">
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="mb-12 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-accent uppercase tracking-[0.5em] text-[10px] mb-4"
            >
              Secure Checkout
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-foreground text-4xl md:text-5xl font-serif italic"
            >
              Checkout
            </motion.h1>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <ShoppingBag size={48} className="text-dim mx-auto mb-6" strokeWidth={1} />
              <p className="text-subtle text-sm tracking-widest uppercase mb-8">Your cart is empty</p>
              <Link
                to="/gallery"
                className="px-12 py-4 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase hover:bg-accent hover:border-accent hover:text-black transition-all duration-700"
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
                  <h2 className="text-foreground text-lg tracking-[0.2em] uppercase mb-8">Shipping Details</h2>
                  <p className="text-muted text-sm mb-6">
                    Order confirmation will be sent to <span className="text-accent">{user?.email}</span>
                  </p>

                  {/* ── Saved Address Section ── */}
                  {savedAddresses.length > 0 && addressMode === 'saved' && selectedAddress ? (
                    <div className="mb-6">
                      {/* Selected address card */}
                      <div className="border border-accent/30 bg-accent/5 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-accent mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-foreground text-sm font-medium">{selectedAddress.label}</span>
                                {selectedAddress.isDefault && (
                                  <span className="text-accent text-[8px] tracking-[0.3em] uppercase flex items-center gap-1">
                                    <Star size={9} className="fill-accent" /> Default
                                  </span>
                                )}
                              </div>
                              <p className="text-foreground-2 text-sm">{selectedAddress.fullName}</p>
                              <p className="text-muted text-xs leading-relaxed mt-1">
                                {selectedAddress.address}<br />
                                {selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddressPicker(!showAddressPicker)}
                            className="flex items-center gap-1.5 text-accent text-[9px] tracking-[0.3em] uppercase hover:text-accent-hover transition-colors flex-shrink-0"
                          >
                            Change
                            <ChevronDown size={12} className={`transition-transform ${showAddressPicker ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Address picker dropdown */}
                      <AnimatePresence>
                        {showAddressPicker && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border border-foreground/10 border-t-0"
                          >
                            <div className="p-4 space-y-3">
                              {savedAddresses.map(addr => (
                                <button
                                  key={addr._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAddressId(addr._id);
                                    setAddressMode('saved');
                                    setShowAddressPicker(false);
                                  }}
                                  className={`w-full text-left p-4 border transition-all ${
                                    addr._id === selectedAddressId
                                      ? 'border-accent/40 bg-accent/5'
                                      : 'border-foreground/10 hover:border-foreground/30'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <MapPin size={14} className="text-subtle mt-0.5 flex-shrink-0" />
                                    <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-foreground text-xs font-medium">{addr.label}</span>
                                        {addr.isDefault && (
                                          <span className="text-accent text-[7px] tracking-[0.2em] uppercase">Default</span>
                                        )}
                                      </div>
                                      <p className="text-muted text-xs">
                                        {addr.fullName} &middot; {addr.address}, {addr.city}, {addr.state} — {addr.pincode}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}

                              {/* Add new address option */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAddressMode('new');
                                  setShowAddressPicker(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-foreground/20 text-muted text-xs tracking-wider uppercase hover:border-accent hover:text-accent transition-all"
                              >
                                <Plus size={14} />
                                Add New Address
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Phone field */}
                      <div className="mt-5">
                        {phone && !editingPhone ? (
                          <div className="flex items-center justify-between border border-foreground/20 px-4 py-3">
                            <span className="text-foreground text-sm tracking-wide">{phone}</span>
                            <button
                              type="button"
                              onClick={() => setEditingPhone(true)}
                              className="text-accent text-[9px] tracking-[0.3em] uppercase hover:text-accent-hover transition-colors"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            pattern="\d{10}"
                            maxLength={10}
                            title="10 digit phone number"
                            className={inputClass}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── New / Manual Address Form ── */
                    <div className="space-y-5 mb-6">
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddressMode('saved');
                            setSelectedAddressId(defaultAddress?._id || savedAddresses[0]?._id);
                          }}
                          className="text-accent text-[10px] tracking-[0.3em] uppercase hover:text-accent-hover transition-colors mb-2"
                        >
                          &larr; Use Saved Address
                        </button>
                      )}

                      {/* Save-to-address-book form */}
                      <div className="grid grid-cols-2 gap-5">
                        <select
                          name="label"
                          value={newAddressForm.label}
                          onChange={handleNewAddressChange}
                          className={`${inputClass} bg-surface col-span-1`}
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Full Name"
                          value={newAddressForm.fullName}
                          onChange={handleNewAddressChange}
                          required
                          minLength={2}
                          maxLength={100}
                          className={inputClass}
                        />
                      </div>
                      {phone && !editingPhone ? (
                        <div className="flex items-center justify-between border border-foreground/20 px-4 py-3">
                          <span className="text-foreground text-sm tracking-wide">{phone}</span>
                          <button
                            type="button"
                            onClick={() => setEditingPhone(true)}
                            className="text-accent text-[9px] tracking-[0.3em] uppercase hover:text-accent-hover transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          pattern="\d{10}"
                          maxLength={10}
                          title="10 digit phone number"
                          className={inputClass}
                        />
                      )}
                      <textarea
                        name="address"
                        placeholder="Street Address"
                        value={newAddressForm.address}
                        onChange={handleNewAddressChange}
                        required
                        minLength={5}
                        maxLength={500}
                        rows={3}
                        className={inputClass + " resize-none"}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={newAddressForm.city}
                          onChange={handleNewAddressChange}
                          required
                          minLength={2}
                          maxLength={50}
                          className={inputClass}
                        />
                        <input
                          type="text"
                          name="state"
                          placeholder="State"
                          value={newAddressForm.state}
                          onChange={handleNewAddressChange}
                          required
                          minLength={2}
                          maxLength={50}
                          className={inputClass}
                        />
                        <input
                          type="text"
                          name="pincode"
                          placeholder="Pincode"
                          value={newAddressForm.pincode}
                          onChange={handleNewAddressChange}
                          required
                          pattern="\d{6}"
                          maxLength={6}
                          title="6 digit pincode"
                          className={inputClass}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveNewAddress}
                        disabled={savingAddress}
                        className="flex items-center gap-2 px-6 py-3 border border-accent/30 text-accent text-[9px] tracking-[0.3em] uppercase hover:bg-accent/10 transition-all disabled:opacity-50"
                      >
                        <Plus size={13} />
                        {savingAddress ? 'Saving...' : 'Save & Use This Address'}
                      </button>
                    </div>
                  )}

                  {/* Payment Method */}
                  <h2 className="text-foreground text-lg tracking-[0.2em] uppercase mt-12 mb-8">Payment Method</h2>
                  <div className="space-y-4">
                    <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-accent bg-accent/5' : 'border-foreground/20 hover:border-foreground/40'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-accent"
                      />
                      <div>
                        <p className="text-foreground text-sm tracking-wide">Cash on Delivery</p>
                        <p className="text-subtle text-[11px] mt-1">Pay when your order arrives</p>
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
                  <div className="border border-foreground/10 p-6 lg:p-8 sticky top-28">
                    <h2 className="text-foreground text-lg tracking-[0.2em] uppercase mb-6">Order Summary</h2>
                    <div className="space-y-4 mb-6">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.size || 'default'}`} className="flex gap-4">
                          <div className="w-16 h-20 bg-dim overflow-hidden flex-shrink-0 rounded-lg border border-foreground/5">
                            <img
                              src={assetUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-serif truncate">{item.name}{item.size && <span className="text-subtle text-[10px] ml-1">({item.size})</span>}</p>
                            <p className="text-subtle text-[11px] mt-1">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-foreground-2 text-sm flex-shrink-0">
                            &#8377;{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-foreground/10 pt-4 space-y-3">
                      <div className="flex justify-between text-muted text-sm">
                        <span>Subtotal</span>
                        <span>&#8377;{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-muted text-sm">
                        <span>Shipping</span>
                        <span className="text-accent">Free</span>
                      </div>
                      <div className="border-t border-foreground/10 pt-3 flex justify-between text-foreground">
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
                      className="w-full mt-6 py-4 bg-accent text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-accent-hover transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Processing...' : 'Place Order'}
                    </button>

                    <Link
                      to="/cart"
                      className="block text-center mt-4 text-subtle text-[10px] tracking-[0.2em] uppercase hover:text-foreground transition-colors"
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
