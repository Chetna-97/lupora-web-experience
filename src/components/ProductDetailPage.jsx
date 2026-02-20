import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Minus, Plus, Star, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { assetUrl, cartFetch } from '../utils/api';
import usePageTitle from '../utils/usePageTitle';

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      <div className="aspect-[3/4] bg-neutral-800 animate-pulse" />
      <div className="flex flex-col justify-center py-8">
        <div className="h-2 w-24 bg-neutral-800 animate-pulse rounded mb-4" />
        <div className="h-10 w-64 bg-neutral-800 animate-pulse rounded mb-6" />
        <div className="h-6 w-32 bg-neutral-800 animate-pulse rounded mb-8" />
        <div className="space-y-3 mb-10">
          <div className="h-3 w-full bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-5/6 bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-4/6 bg-neutral-800 animate-pulse rounded" />
        </div>
        <div className="h-14 w-48 bg-neutral-800 animate-pulse rounded" />
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
            className={star <= rating ? 'text-[#C5A059] fill-[#C5A059]' : 'text-gray-600'}
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
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      setAdded(true);
      await addToCart(product._id, quantity);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error('Add to cart failed:', err);
      setAdded(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    try {
      await addToCart(product._id, quantity);
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

  return (
    <div className="min-h-screen bg-black pt-24">
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
              <p className="text-gray-500 text-sm tracking-widest uppercase mb-8">
                Product not found
              </p>
              <Link
                to="/gallery"
                className="px-12 py-4 border border-white/20 text-white text-[9px] tracking-[0.5em] uppercase hover:bg-[#C5A059] hover:border-[#C5A059] hover:text-black transition-all duration-700"
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
                  className="aspect-[3/4] bg-neutral-900 overflow-hidden rounded-2xl border border-white/5 shadow-2xl shadow-black/50"
                >
                  <img
                    src={assetUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Product Info */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex flex-col justify-center py-4 lg:py-8"
                >
                  <p className="text-[#C5A059] text-[9px] uppercase tracking-[0.5em] mb-4">
                    {product.category}
                  </p>
                  <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-serif italic mb-6">
                    {product.name}
                  </h1>

                  {/* Rating summary */}
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <StarRating rating={Math.round(Number(avgRating))} size={14} />
                      <span className="text-gray-400 text-xs">{avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}

                  {product.price && (
                    <p className="text-gray-300 text-2xl font-serif tracking-wider mb-8">
                      &#8377;{product.price.toLocaleString('en-IN')}
                    </p>
                  )}
                  {product.description && (
                    <p className="text-gray-400 text-sm leading-loose mb-10 max-w-lg">
                      {product.description}
                    </p>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-6 mb-8">
                    <span className="text-gray-500 text-[9px] tracking-[0.3em] uppercase">
                      Quantity
                    </span>
                    <div className="flex items-center gap-4 border border-white/20 px-3 py-2 rounded-full">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors p-1"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-white text-sm tracking-wider w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        aria-label="Increase quantity"
                        className="text-gray-400 hover:text-white transition-colors p-1"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex items-center justify-center gap-3 px-10 py-4 bg-[#C5A059] text-black text-[10px] tracking-[0.3em] uppercase font-medium rounded-full hover:bg-[#d4af6a] transition-all duration-500"
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
                      className="flex items-center justify-center gap-3 px-10 py-4 border border-[#C5A059] text-[#C5A059] text-[10px] tracking-[0.3em] uppercase font-medium rounded-full hover:bg-[#C5A059] hover:text-black transition-all duration-500"
                    >
                      <Zap size={16} strokeWidth={1.5} />
                      Buy Now
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Reviews Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-24 border-t border-white/10 pt-16"
              >
                <h2 className="text-white text-2xl md:text-3xl font-serif italic mb-2">Customer Reviews</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3 mb-8">
                    <StarRating rating={Math.round(Number(avgRating))} size={18} />
                    <span className="text-white text-lg font-serif">{avgRating}</span>
                    <span className="text-gray-500 text-sm">based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                  </div>
                )}
                {reviews.length === 0 && (
                  <p className="text-gray-500 text-sm mb-8">No reviews yet. Be the first to review this product.</p>
                )}

                {/* Review Form */}
                {isAuthenticated && !userAlreadyReviewed ? (
                  <form onSubmit={handleReviewSubmit} className="mb-12 p-6 border border-white/10 rounded-xl max-w-xl">
                    <h3 className="text-white text-sm tracking-[0.2em] uppercase mb-5">Write a Review</h3>
                    <div className="mb-4">
                      <p className="text-gray-400 text-xs mb-2">Your Rating</p>
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
                      className="w-full bg-transparent border border-white/20 text-white px-4 py-3 text-sm tracking-wide focus:border-[#C5A059] focus:outline-none transition-colors placeholder-gray-600 resize-none mb-2"
                    />
                    <p className="text-gray-600 text-[10px] mb-4 text-right">{reviewForm.comment.length}/500</p>
                    {reviewError && <p className="text-red-400 text-xs mb-3">{reviewError}</p>}
                    {reviewSuccess && <p className="text-green-400 text-xs mb-3">{reviewSuccess}</p>}
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-8 py-3 bg-[#C5A059] text-black text-[10px] tracking-[0.3em] uppercase font-medium hover:bg-[#d4af6a] transition-all duration-500 disabled:opacity-50"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : isAuthenticated && userAlreadyReviewed ? (
                  <p className="text-gray-500 text-sm mb-12 italic">You have already reviewed this product.</p>
                ) : (
                  <p className="text-gray-500 text-sm mb-12">
                    <button onClick={() => setShowAuthModal(true)} className="text-[#C5A059] hover:underline">Sign in</button> to write a review.
                  </p>
                )}

                {/* Reviews List */}
                {reviews.length > 0 && (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review._id} className="border-b border-white/5 pb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <StarRating rating={review.rating} size={13} />
                          <span className="text-white text-sm font-medium">{review.userName}</span>
                          <span className="text-gray-600 text-xs">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
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
                  className="mt-24 border-t border-white/10 pt-16"
                >
                  <h2 className="text-white text-2xl md:text-3xl font-serif italic mb-10">You Might Also Like</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {relatedProducts.map(p => (
                      <Link
                        key={p._id}
                        to={`/product/${p._id}`}
                        className="group"
                      >
                        <div className="aspect-[3/4] bg-neutral-900 overflow-hidden rounded-xl border border-white/5 hover:border-[#C5A059]/30 transition-all duration-500 mb-4">
                          <img
                            src={assetUrl(p.image)}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                        </div>
                        <p className="text-[#C5A059] text-[8px] uppercase tracking-[0.3em] mb-1">{p.category}</p>
                        <h3 className="text-white text-sm font-serif group-hover:text-[#C5A059] transition-colors">{p.name}</h3>
                        {p.price && (
                          <p className="text-gray-400 text-xs mt-1">&#8377;{p.price.toLocaleString('en-IN')}</p>
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
