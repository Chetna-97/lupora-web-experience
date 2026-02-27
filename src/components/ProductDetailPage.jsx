import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Minus, Plus, Star, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { assetUrl, cartFetch } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';
import PriceDisplay from './PriceDisplay';

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      <div className="aspect-[3/4] bg-dim animate-pulse" />
      <div className="flex flex-col justify-center py-8">
        <div className="h-2 w-24 bg-dim animate-pulse rounded mb-4" />
        <div className="h-10 w-64 bg-dim animate-pulse rounded mb-6" />
        <div className="h-6 w-32 bg-dim animate-pulse rounded mb-8" />
        <div className="space-y-3 mb-10">
          <div className="h-3 w-full bg-dim animate-pulse rounded" />
          <div className="h-3 w-5/6 bg-dim animate-pulse rounded" />
          <div className="h-3 w-4/6 bg-dim animate-pulse rounded" />
        </div>
        <div className="h-14 w-48 bg-dim animate-pulse rounded" />
      </div>
    </div>
  );
}

function StarRating({ rating, size = 16, interactive = false, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <Star
            size={size}
            className={star <= rating ? 'text-accent fill-accent' : 'text-faint'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState('50ml');
  const { addToCart } = useCart();
  const { isAuthenticated, user, setShowAuthModal } = useAuth();
  usePageTitle(product?.name || 'Product');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
    setAdded(false);
    setSelectedSize('50ml');
    setReviewForm({ rating: 0, comment: '' });
    setReviewError('');
    setReviewSuccess('');

    const fetchProduct = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);

        // Fetch related products (same category)
        const allRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
        if (allRes.ok) {
          const allProducts = await allRes.json();
          const related = allProducts
            .filter(p => p.category === data.category && p._id !== data._id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err.message);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  const handleAddToCart = async () => {
    if (displayStock === 0) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      setAdded(true);
      const sizeToSend = hasVariants ? selectedSize : null;
      await addToCart(product._id, quantity, sizeToSend);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error('Add to cart failed:', err);
      setAdded(false);
    }
  };

  const handleBuyNow = async () => {
    if (displayStock === 0) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      const sizeToSend = hasVariants ? selectedSize : null;
      await addToCart(product._id, quantity, sizeToSend);
      navigate('/checkout');
    } catch (err) {
      console.error('Buy now failed:', err);
    }
  };

  const userAlreadyReviewed = reviews.some(r => r.userId === user?.id);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (reviewForm.rating === 0) {
      setReviewError('Please select a rating');
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewError('Please write a comment');
      return;
    }

    setReviewSubmitting(true);
    try {
      const newReview = await cartFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId: product._id,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim()
        })
      });
      setReviews(prev => [newReview, ...prev]);
      setReviewForm({ rating: 0, comment: '' });
      setReviewSuccess('Review submitted!');
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Resolve variant-specific display data
  const hasVariants = product?.variants?.length > 0;
  const getDisplayData = () => {
    if (!product) return { displayPrice: 0, displayOriginalPrice: null, displayImage: '', displayStock: -1 };
    if (hasVariants) {
      const variant = product.variants.find(v => v.size === selectedSize);
      if (variant) {
        return {
          displayPrice: variant.price,
          displayOriginalPrice: variant.originalPrice || null,
          displayImage: variant.image || product.image,
          displayStock: variant.stock != null ? variant.stock : product.stock,
        };
      }
    }
    return {
      displayPrice: product.price,
      displayOriginalPrice: product.originalPrice || null,
      displayImage: product.image,
      displayStock: product.stock,
    };
  };
  const { displayPrice, displayOriginalPrice, displayImage, displayStock } = getDisplayData();

  return (
    <div className="min-h-screen bg-surface pt-24">
      {/* Product Detail */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <DetailSkeleton />
          ) : !product ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-subtle text-sm tracking-widest uppercase mb-8">
                Product not found
              </p>
              <Link
                to="/gallery"
                className="px-12 py-4 border border-foreground/20 text-foreground text-[9px] tracking-[0.5em] uppercase hover:bg-accent hover:border-accent hover:text-black transition-all duration-700"
              >
                Explore Collection
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Product Image */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="aspect-[3/4] bg-dim overflow-hidden rounded-2xl border border-foreground/5 shadow-2xl shadow-black/50 relative"
                >
                  <img
                    src={assetUrl(displayImage)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {displayStock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-2xl">
                      <span className="px-8 py-3 border border-white/30 text-white text-[10px] tracking-[0.4em] uppercase backdrop-blur-sm bg-black/30">
                        Sold Out
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Product Info */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex flex-col justify-center py-4 lg:py-8"
                >
                  <p className="text-accent text-[9px] uppercase tracking-[0.5em] mb-4">
                    {product.category}
                  </p>
                  <h1 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-serif italic mb-6">
                    {product.name}
                  </h1>

                  {/* Rating summary */}
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <StarRating rating={Math.round(Number(avgRating))} size={14} />
                      <span className="text-muted text-xs">{avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}

                  {displayPrice && (
                    <div className="mb-8">
                      <PriceDisplay price={displayPrice} originalPrice={displayOriginalPrice} size="lg" />
                    </div>
                  )}

                  {/* Size Selector */}
                  {hasVariants && (
                    <div className="mb-8">
                      <p className="text-subtle text-[9px] tracking-[0.3em] uppercase mb-3">Size</p>
                      <div className="flex gap-3">
                        {product.variants.map(v => (
                          <button
                            key={v.size}
                            onClick={() => setSelectedSize(v.size)}
                            disabled={v.stock === 0}
                            className={`px-5 py-2.5 text-xs tracking-[0.2em] uppercase border rounded-full transition-all duration-300
                              ${selectedSize === v.size
                                ? 'border-accent bg-accent/10 text-accent font-medium'
                                : v.stock === 0
                                  ? 'border-foreground/10 text-faint cursor-not-allowed line-through'
                                  : 'border-foreground/20 text-muted hover:border-accent/50 hover:text-foreground'
                              }`}
                          >
                            {v.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.description && (
                    <p className="text-muted text-sm leading-loose mb-10 max-w-lg">
                      {product.description}
                    </p>
                  )}

                  {displayStock === 0 ? (
                    <div className="flex items-center gap-3 px-10 py-4 bg-dim text-faint text-[10px] tracking-[0.3em] uppercase rounded-full cursor-not-allowed w-fit">
                      Sold Out
                    </div>
                  ) : (
                    <>
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-6 mb-8">
                        <span className="text-subtle text-[9px] tracking-[0.3em] uppercase">
                          Quantity
                        </span>
                        <div className="flex items-center gap-4 border border-foreground/20 px-3 py-2 rounded-full">
                          <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                            className="text-muted hover:text-foreground disabled:opacity-30 transition-colors p-1"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-foreground text-sm tracking-wider w-8 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(q => q + 1)}
                            aria-label="Increase quantity"
                            className="text-muted hover:text-foreground transition-colors p-1"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-4">
                        <button
                          onClick={handleAddToCart}
                          className="flex items-center justify-center gap-3 px-10 py-4 bg-accent text-black text-[10px] tracking-[0.3em] uppercase font-medium rounded-full hover:bg-accent-hover transition-all duration-500"
                        >
                          {added ? (
                            'Added to Cart'
                          ) : (
                            <>
                              <ShoppingBag size={16} strokeWidth={1.5} />
                              Add to Cart
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleBuyNow}
                          className="flex items-center justify-center gap-3 px-10 py-4 border border-accent text-accent text-[10px] tracking-[0.3em] uppercase font-medium rounded-full hover:bg-accent hover:text-black transition-all duration-500"
                        >
                          <Zap size={16} strokeWidth={1.5} />
                          Buy Now
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Reviews Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-24 border-t border-foreground/10 pt-16"
              >
                <h2 className="text-foreground text-2xl md:text-3xl font-serif italic mb-2">Customer Reviews</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3 mb-8">
                    <StarRating rating={Math.round(Number(avgRating))} size={18} />
                    <span className="text-foreground text-lg font-serif">{avgRating}</span>
                    <span className="text-subtle text-sm">based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                  </div>
                )}
                {reviews.length === 0 && (
                  <p className="text-subtle text-sm mb-8">No reviews yet. Be the first to review this product.</p>
                )}

                {/* Review Form */}
                {isAuthenticated && !userAlreadyReviewed ? (
                  <form onSubmit={handleReviewSubmit} className="mb-12 p-6 border border-foreground/10 rounded-xl max-w-xl">
                    <h3 className="text-foreground text-sm tracking-[0.2em] uppercase mb-5">Write a Review</h3>
                    <div className="mb-4">
                      <p className="text-muted text-xs mb-2">Your Rating</p>
                      <StarRating
                        rating={reviewForm.rating}
                        size={24}
                        interactive
                        onChange={(r) => setReviewForm(prev => ({ ...prev, rating: r }))}
                      />
                    </div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your experience with this product..."
                      maxLength={500}
                      rows={4}
                      className="w-full bg-transparent border border-foreground/20 text-foreground px-4 py-3 text-sm tracking-wide focus:border-accent focus:outline-none transition-colors placeholder-faint resize-none mb-2"
                    />
                    <p className="text-faint text-[10px] mb-4 text-right">{reviewForm.comment.length}/500</p>
                    {reviewError && <p className="text-red-400 text-xs mb-3">{reviewError}</p>}
                    {reviewSuccess && <p className="text-green-400 text-xs mb-3">{reviewSuccess}</p>}
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-8 py-3 bg-accent text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-accent-hover transition-all duration-500 disabled:opacity-50"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : isAuthenticated && userAlreadyReviewed ? (
                  <p className="text-subtle text-sm mb-12 italic">You have already reviewed this product.</p>
                ) : (
                  <p className="text-subtle text-sm mb-12">
                    <button onClick={() => setShowAuthModal(true)} className="text-accent hover:underline">Sign in</button> to write a review.
                  </p>
                )}

                {/* Reviews List */}
                {reviews.length > 0 && (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review._id} className="border-b border-foreground/5 pb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <StarRating rating={review.rating} size={13} />
                          <span className="text-foreground text-sm font-medium">{review.userName}</span>
                          <span className="text-faint text-xs">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-foreground-2 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* You Might Also Like */}
              {relatedProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="mt-24 border-t border-foreground/10 pt-16"
                >
                  <h2 className="text-foreground text-2xl md:text-3xl font-serif italic mb-10">You Might Also Like</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {relatedProducts.map(p => (
                      <Link
                        key={p._id}
                        to={`/product/${p._id}`}
                        className="group"
                      >
                        <div className="aspect-[3/4] bg-dim overflow-hidden rounded-xl border border-foreground/5 hover:border-accent/30 transition-all duration-500 mb-4 relative">
                          <img
                            src={assetUrl(p.image)}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                          {p.stock === 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                              <span className="text-white text-[8px] tracking-[0.3em] uppercase">Sold Out</span>
                            </div>
                          )}
                        </div>
                        <p className="text-accent text-[8px] uppercase tracking-[0.3em] mb-1">{p.category}</p>
                        <h3 className="text-foreground text-sm font-serif group-hover:text-accent transition-colors">{p.name}</h3>
                        {p.price && (
                          <div className="mt-1">
                            <PriceDisplay price={p.price} originalPrice={p.originalPrice} showBadge={false} />
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
