import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, sellerService, reviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ReviewList from '../components/reviews/ReviewList';
import ReviewForm from '../components/reviews/ReviewForm';
import ShopSEO from '../components/SEO/ShopSEO';
import { motion as Motion } from 'framer-motion';

export default function ProductDetail() {
  const { shopSlug, productSlug } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToCart: addToCartContext, itemCount } = useCart();

  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userPurchasedOrder, setUserPurchasedOrder] = useState(null);

  useEffect(() => {
    fetchProductData();
  }, [productSlug, shopSlug]);

  useEffect(() => {
    if (user && product) {
      checkUserPurchase();
    }
  }, [user, product]);

  const fetchProductData = async () => {
    setLoading(true);
    setError('');

    try {
      const shopResponse = await sellerService.getSellerBySlug(shopSlug);
      setShop(shopResponse.data.seller);

      const productsResponse = await productService.getProductsByShopSlug(shopSlug);
      const foundProduct = productsResponse.data.products.find(
        p => p.slug === productSlug || p.id.toString() === productSlug
      );

      if (!foundProduct) {
        setError('Product not found');
      } else {
        setProduct(foundProduct);
        // Track product view silently for analytics
        if (foundProduct.id) {
          productService.getProductById(foundProduct.id).catch(e => console.error('Failed to track view', e));
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const checkUserPurchase = async () => {
    try {
      const response = await reviewService.getReviewableProducts();
      const reviewableProducts = response.data.products || [];

      const purchasedProduct = reviewableProducts.find(
        p => p.product_id === product.id
      );

      if (purchasedProduct) {
        setUserPurchasedOrder({
          orderId: purchasedProduct.order_id,
          orderNumber: purchasedProduct.order_number,
        });
      } else {
        setUserPurchasedOrder(null);
      }
    } catch (error) {
      console.error('Failed to check user purchase:', error);
      setUserPurchasedOrder(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleAddToCart = async () => {
    const productData = {
      product_name: product.name,
      price: product.price,
      product_image_url: product.image_url,
      product_slug: product.slug,
      shop_slug: shopSlug,
    };

    const result = await addToCartContext(product.id, quantity, productData);
    if (result.success) {
      alert(`Added ${quantity} × ${product.name} to cart!`);
    } else {
      alert(result.error || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    const productData = {
      product_name: product.name,
      price: product.price,
      product_image_url: product.image_url,
      product_slug: product.slug,
      shop_slug: shopSlug,
    };

    const result = await addToCartContext(product.id, quantity, productData);

    if (!result.success) {
      alert(result.error || 'Failed to add to cart');
      return;
    }

    if (!user) {
      const currentPath = `/shop/${shopSlug}/product/${productSlug}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    navigate('/checkout');
  };

  const handleShare = (platform) => {
    const productUrl = `${window.location.origin}/shop/${shopSlug}/product/${productSlug}`;
    const shareText = `Check out ${product.name} at ${shop.shop_name} on BuyTree! ${formatPrice(product.price)}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + productUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(productUrl);
        alert('Product link copied to clipboard!');
        setShowShareModal(false);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !shop) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center">
          <div className="text-zinc-900 text-6xl font-black mb-4">:(</div>
          <p className="text-zinc-500 font-medium mb-6">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate(shopSlug ? `/shop/${shopSlug}` : '/')}
            className="px-8 py-3 bg-zinc-900 text-white font-bold uppercase tracking-widest text-xs hover:bg-cinematic-dark transition-colors"
          >
            {shopSlug ? 'Back to Shop' : 'Go Home'}
          </button>
        </div>
      </div>
    );
  }

  const images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : [];

  return (
    <>
      <ShopSEO shop={shop} product={product} />
      <div className="min-h-screen bg-white font-cinematic text-zinc-900 pb-20 sm:pb-0">
        
        {/* Cinematic Navbar - Kept per user request, but restyled */}
        <nav className="bg-white border-b border-zinc-100 sticky top-0 z-40">
          <div className="px-6 py-4 lg:px-12">
            <div className="flex justify-between items-center h-12">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => navigate(`/shop/${shopSlug}`)}
                  className="hover:text-cinematic-dark transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Shop
                </button>
                <div className="hidden sm:block w-px h-6 bg-zinc-200"></div>
                <div className="hidden sm:block text-xl font-black tracking-tighter text-zinc-900">
                  {shop.shop_name}
                </div>
              </div>
              <div className="flex items-center space-x-6">
                {user ? (
                  <>
                    <span className="text-zinc-500 hidden sm:inline text-xs font-bold tracking-widest uppercase">
                      {user.firstName}
                    </span>
                    {user.role === 'seller' && (
                      <button
                        onClick={() => navigate('/seller/dashboard')}
                        className="text-cinematic-dark hover:text-zinc-900 text-xs font-bold tracking-widest uppercase hidden sm:block transition-colors"
                      >
                        Dashboard
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="text-zinc-500 hover:text-zinc-900 text-xs font-bold tracking-widest uppercase transition-colors"
                    >
                      Login
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate('/cart')}
                  className="relative flex items-center gap-2 hover:text-cinematic-dark transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-cinematic-dark text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 50/50 Split Editorial Layout */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          
          {/* Left: Image Gallery (Sticky) */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] bg-zinc-50 flex flex-col border-r border-zinc-100">
            {/* Main Image */}
            <div className="flex-1 relative overflow-hidden group bg-zinc-100">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-zinc-300 font-black text-4xl tracking-tighter">NO IMAGE</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="h-32 flex p-4 gap-4 overflow-x-auto bg-white border-t border-zinc-100 hide-scrollbar shrink-0">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-full aspect-[4/5] overflow-hidden transition-all duration-300 ${
                      selectedImage === index ? 'ring-2 ring-zinc-900 ring-offset-2 opacity-100' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details (Scrolling) */}
          <div className="w-full lg:w-1/2 p-8 lg:p-16 xl:p-24 overflow-y-auto">
            <Motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              {/* Breadcrumb / Category */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  {shop.shop_name}
                </span>
                <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-cinematic-dark">
                  {product.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 leading-[1.1] tracking-tighter mb-8">
                {product.name}
              </h1>

              {/* Price & Stock Container */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between py-6 border-y-2 border-zinc-900 mb-12 gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Price</div>
                  <div className="text-4xl font-black text-zinc-900">{formatPrice(product.price)}</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Availability</div>
                  <div className={`text-sm font-bold uppercase tracking-widest ${product.quantity_available > 0 ? 'text-cinematic-dark' : 'text-red-600'}`}>
                    {product.quantity_available > 0 ? `${product.quantity_available} IN STOCK` : 'SOLD OUT'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-12">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 border-b border-zinc-200 pb-2">About this piece</h3>
                  <p className="text-zinc-600 leading-relaxed font-medium whitespace-pre-line text-lg">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              {product.quantity_available > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-900">Quantity</div>
                    <div className="flex items-center border border-zinc-200">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center hover:bg-zinc-50 text-xl font-medium transition-colors"
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.quantity_available}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity_available, parseInt(e.target.value) || 1)))}
                        className="w-16 h-12 text-center text-lg font-bold border-x border-zinc-200 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
                        className="w-12 h-12 flex items-center justify-center hover:bg-zinc-50 text-xl font-medium transition-colors"
                        disabled={quantity >= product.quantity_available}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                    <button
                      onClick={handleAddToCart}
                      className="px-8 py-5 border-2 border-zinc-900 text-zinc-900 font-black uppercase tracking-widest text-sm hover:bg-zinc-50 transition-colors"
                    >
                      ADD TO CART
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="px-8 py-5 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm hover:bg-cinematic-dark transition-colors"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full py-6 border-2 border-zinc-200 text-zinc-400 font-black uppercase tracking-widest text-center mb-12">
                  OUT OF STOCK
                </div>
              )}

              {/* Share */}
              <button
                onClick={() => setShowShareModal(true)}
                className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Product
              </button>

              {/* Reviews Section */}
              <div className="mt-24 border-t-2 border-zinc-900 pt-12">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase mb-8">Reviews</h2>
                
                {user && userPurchasedOrder && !showReviewForm && (
                  <div className="mb-12 bg-zinc-50 p-8 border border-zinc-100">
                    <p className="text-sm font-medium text-zinc-500 mb-6">
                      You purchased this piece in order #{userPurchasedOrder.orderNumber}. We'd love to hear your thoughts.
                    </p>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-8 py-4 bg-white border border-zinc-200 text-zinc-900 font-bold uppercase tracking-widest text-xs hover:border-zinc-900 transition-colors"
                    >
                      Write a Review
                    </button>
                  </div>
                )}

                {showReviewForm && userPurchasedOrder && (
                  <div className="mb-12">
                    <ReviewForm
                      productId={product.id}
                      orderId={userPurchasedOrder.orderId}
                      productName={product.name}
                      onReviewSubmitted={() => {
                        setShowReviewForm(false);
                        setUserPurchasedOrder(null);
                      }}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                )}

                <ReviewList productId={product.id} />
              </div>

            </Motion.div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Bar (Visible only on very small screens, optional but keeping for parity) */}
        {product.quantity_available > 0 && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 px-4 py-4 border-2 border-zinc-900 text-zinc-900 font-black uppercase tracking-widest text-[10px]"
              >
                CART
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 px-4 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px]"
              >
                BUY
              </button>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md bg-white p-8 border border-zinc-200 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Share Piece</h3>
                <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-2">
                <button onClick={() => handleShare('copy')} className="w-full text-left px-6 py-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold tracking-widest uppercase text-xs transition-colors flex items-center justify-between">
                  Copy Link
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
                <button onClick={() => handleShare('twitter')} className="w-full text-left px-6 py-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold tracking-widest uppercase text-xs transition-colors flex items-center justify-between">
                  Twitter
                  <span className="opacity-50 font-normal">→</span>
                </button>
                <button onClick={() => handleShare('facebook')} className="w-full text-left px-6 py-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold tracking-widest uppercase text-xs transition-colors flex items-center justify-between">
                  Facebook
                  <span className="opacity-50 font-normal">→</span>
                </button>
                <button onClick={() => handleShare('whatsapp')} className="w-full text-left px-6 py-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold tracking-widest uppercase text-xs transition-colors flex items-center justify-between">
                  WhatsApp
                  <span className="opacity-50 font-normal">→</span>
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </div>
    </>
  );
}
