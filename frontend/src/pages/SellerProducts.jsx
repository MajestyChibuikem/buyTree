import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, uploadService, aiService } from '../services/api';
import CinematicDashboardLayout from '../layouts/CinematicDashboardLayout';
import { motion as Motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import heic2any from 'heic2any';

const CATEGORIES = [
  'Food & Snacks', 'Drinks & Beverages', 'Electronics', 'Fashion & Clothing',
  'Books & Stationery', 'Beauty & Personal Care', 'Health & Wellness',
  'Home & Living', 'Sports & Fitness', 'Art & Crafts', 'Services', 'Other',
];

const EMPTY_FORM = {
  name: '', description: '', price: '', quantity_available: '',
  category: '', images: [],
};

// --- Reusable Scroll Reveal Component ---
const FadeInScroll = ({ children, className }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 95%', 'start 65%']
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <Motion.div ref={ref} style={{ opacity, y, willChange: 'transform, opacity' }} className={className}>
      {children}
    </Motion.div>
  );
};

export default function SellerProducts() {
  const { user } = useAuth();
  const nameDebounceRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // AI state
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiCatSuggestion, setAiCatSuggestion] = useState(null);
  const [aiCatLoading, setAiCatLoading] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getMyProducts();
      setProducts(res.data?.products || res.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setAiCatSuggestion(null);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity_available: product.quantity_available,
      category: product.category || '',
      images: product.image_urls || [],
    });
    setAiCatSuggestion(null);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
      setAiCatSuggestion(null);
      if (value.length > 3) {
        nameDebounceRef.current = setTimeout(() => {
          handleSuggestCategory(value, formData.description);
        }, 600);
      }
    }
  };

  const handleSuggestCategory = async (name, description) => {
    try {
      setAiCatLoading(true);
      const res = await aiService.suggestCategory({ name, description });
      const { category, confidence } = res.data;
      if (confidence !== 'low' && category) {
        setAiCatSuggestion({ category, confidence });
      }
    } catch {
      // silently ignore
    } finally {
      setAiCatLoading(false);
    }
  };

  const acceptCategorySuggestion = () => {
    setFormData(prev => ({ ...prev, category: aiCatSuggestion.category }));
    setAiCatSuggestion(null);
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
      alert('Enter a product name and category first.');
      return;
    }
    try {
      setAiDescLoading(true);
      const res = await aiService.generateDescription({
        name: formData.name,
        price: formData.price,
        category: formData.category,
      });
      if (res.data?.description) {
        setFormData(prev => ({ ...prev, description: res.data.description }));
      }
    } catch {
      alert('Could not generate description. Try again.');
    } finally {
      setAiDescLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setUploadingImages(true);
      const urls = [];
      for (let file of files) {
        // Handle iPhone HEIC/HEIF images seamlessly
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
          try {
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8,
            });
            const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            file = new File([singleBlob], file.name.replace(/\.heic|\.heif/i, '.jpg'), { type: 'image/jpeg' });
          } catch (conversionError) {
            console.error('HEIC conversion failed:', conversionError);
            alert(`Could not process ${file.name}. Please try a standard photo.`);
            continue; // Skip this file and proceed to others
          }
        }

        const res = await uploadService.uploadImage(file);
        urls.push(res.data?.url || res.url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      alert('Image upload failed.');
      console.error(err);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      alert('Name, price, and category are required.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity_available: parseInt(formData.quantity_available) || 0,
        category: formData.category,
        image_urls: formData.images,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
      } else {
        await productService.createProduct(payload);
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch {
      alert('Failed to delete product.');
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })
      .format(price).replace('NGN', '₦');

  return (
    <CinematicDashboardLayout>
      <div className="max-w-7xl mx-auto pb-32 overflow-hidden px-4 md:px-0">
        
        {/* HUGE HERO */}
        <div className="pt-12 pb-24 md:pb-32 border-b border-zinc-200 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <Motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-sm mb-6"
            >
              Inventory Management
            </Motion.p>
            <Motion.h1 
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1 }}
              className="text-[64px] sm:text-[96px] md:text-[140px] font-black tracking-tighter leading-[0.9] text-cinematic-dark break-words"
            >
              Products
            </Motion.h1>
          </div>
          <Motion.button 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
             onClick={openCreateForm}
             className="px-8 py-4 bg-cinematic-dark text-white font-bold tracking-widest uppercase text-xs hover:bg-cinematic-dark/90 transition-colors shadow-lg"
          >
             + Add Product
          </Motion.button>
        </div>

        {/* PRODUCT GRID (Editorial Catalog) */}
        <FadeInScroll className="py-24">
          {loading ? (
            <div className="h-[40vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-cinematic-dark border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="py-32 text-center">
              <h3 className="text-3xl font-black tracking-tight text-zinc-300 mb-4">Your catalog is empty</h3>
              <p className="text-zinc-500 font-medium">Click "Add Product" to create your first listing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-x-12 lg:gap-y-24">
              {products.map((product, i) => (
                <div key={product.id} className="group flex flex-col gap-6 relative">
                  
                  {/* Status Tag */}
                  <div className="absolute top-4 left-4 z-10 pointer-events-none">
                     <span className={`text-[10px] px-3 py-1 font-bold uppercase tracking-widest border ${
                       product.is_active ? 'bg-white text-cinematic-dark border-transparent' : 'bg-zinc-900 text-white border-transparent'
                     }`}>
                       {product.is_active ? 'Active' : 'Inactive'}
                     </span>
                  </div>

                  {/* Image Container */}
                  <div className="aspect-[4/5] bg-zinc-100 overflow-hidden relative border border-zinc-200">
                    {product.image_urls?.[0] ? (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                         <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No Image</span>
                      </div>
                    )}
                    
                    {/* Hover Overlay with Actions */}
                    <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all duration-300">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditForm(product); }}
                        className="px-6 py-3 bg-white text-zinc-900 font-bold uppercase tracking-widest text-[10px] hover:bg-cinematic-dark hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                        className="px-6 py-3 bg-red-600 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="flex flex-col">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{product.category}</p>
                    <h3 className="font-bold text-xl text-zinc-900 tracking-tight leading-snug group-hover:text-cinematic-dark transition-colors">{product.name}</h3>
                    <div className="flex justify-between items-end mt-4 border-t-2 border-zinc-900 pt-4">
                      <p className="text-2xl font-black text-zinc-900">{formatPrice(product.price)}</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Qty: {product.quantity_available}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FadeInScroll>
      </div>

      {/* Cinematic Modal for Create/Edit */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-10">
            {/* Backdrop */}
            <Motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md"
              onClick={() => setShowForm(false)}
            />

            {/* Modal */}
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white shadow-2xl overflow-hidden rounded-none"
            >
              <div className="px-12 py-8 border-b-2 border-zinc-900 flex items-end justify-between bg-white">
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Product Editor</p>
                  <h2 className="text-4xl font-black text-cinematic-dark tracking-tight">
                    {editingProduct ? 'Edit Listing' : 'New Listing'}
                  </h2>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="w-12 h-12 border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-900 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-12 py-12 space-y-10 max-h-[70vh] overflow-y-auto">
                {/* Product Name */}
                <div>
                  <label className="block text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase mb-4">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product title..."
                    className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-4 text-3xl font-bold text-zinc-900 focus:outline-none focus:border-cinematic-dark transition-all placeholder:text-zinc-300"
                    required
                  />
                </div>

                {/* AI Category Suggestion */}
                <AnimatePresence>
                  {aiCatLoading && (
                    <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                      <span className="w-4 h-4 border-2 border-zinc-200 border-t-cinematic-dark rounded-full animate-spin" />
                      Analyzing...
                    </Motion.div>
                  )}
                  {aiCatSuggestion && (
                    <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between border-t border-b border-zinc-100 py-4 mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-cinematic-dark text-xl">✦</span>
                        <span className="text-zinc-600 text-sm font-bold tracking-wide">AI Classification: <strong className="text-cinematic-dark font-black">{aiCatSuggestion.category}</strong></span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={acceptCategorySuggestion} className="px-4 py-2 border-2 border-cinematic-dark text-cinematic-dark text-xs font-bold uppercase tracking-widest hover:bg-cinematic-dark hover:text-white transition-colors">
                          Apply
                        </button>
                        <button type="button" onClick={() => setAiCatSuggestion(null)} className="text-zinc-400 hover:text-zinc-900 text-xs font-bold uppercase tracking-widest">
                          Dismiss
                        </button>
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>

                {/* Category & Price Grid */}
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <label className="block text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase mb-4">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-4 text-xl font-bold text-zinc-900 focus:outline-none focus:border-cinematic-dark transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select a category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase mb-4">Price (₦)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-4 text-xl font-bold text-zinc-900 focus:outline-none focus:border-cinematic-dark transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-end justify-between mb-4">
                    <label className="block text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase">Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={aiDescLoading}
                      className="flex items-center gap-2 text-xs font-bold text-cinematic-dark hover:text-cinematic-dark/80 disabled:opacity-50 transition-colors uppercase tracking-[0.2em]"
                    >
                      {aiDescLoading ? (
                        <span className="w-3 h-3 border-2 border-cinematic-dark border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <span>✦</span>
                      )}
                      {aiDescLoading ? 'Writing...' : 'AI Writer'}
                    </button>
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Provide a compelling description of your product..."
                    className="w-full bg-zinc-50 border border-zinc-200 p-6 text-zinc-900 text-lg leading-relaxed focus:outline-none focus:border-cinematic-dark transition-all resize-none font-medium"
                  />
                </div>

                {/* Images & Quantity Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <label className="block text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase mb-4">Images</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 hover:border-cinematic-dark p-8 cursor-pointer transition-colors text-zinc-400 hover:text-zinc-900 bg-white min-h-[160px]">
                      {uploadingImages ? (
                        <div className="flex flex-col items-center gap-4">
                           <span className="w-8 h-8 border-2 border-zinc-200 border-t-cinematic-dark rounded-full animate-spin" />
                           <span className="text-xs font-bold uppercase tracking-widest text-cinematic-dark">Processing...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl mb-2">+</span>
                          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Upload Photos</span>
                          <span className="text-xs mt-2 opacity-50">HEIC/JPG/PNG</span>
                        </>
                      )}
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                    </label>
                  </div>
                  
                  <div>
                     <label className="block text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase mb-4">Stock Quantity</label>
                     <input
                       type="number"
                       name="quantity_available"
                       value={formData.quantity_available}
                       onChange={handleChange}
                       placeholder="Enter amount"
                       min="0"
                       className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-4 text-3xl font-black text-zinc-900 focus:outline-none focus:border-cinematic-dark transition-all"
                     />
                  </div>
                </div>

                {/* Image Previews */}
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-4 pt-4">
                    {formData.images.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 group">
                        <img src={url} alt="" className="w-full h-full object-cover border border-zinc-200" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="text-white text-xs font-bold uppercase tracking-widest hover:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* Submit Footer */}
              <div className="px-12 py-8 border-t-2 border-zinc-900 bg-white flex justify-end gap-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-4 text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-4 bg-cinematic-dark text-white font-bold uppercase tracking-widest text-xs hover:bg-cinematic-dark/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </CinematicDashboardLayout>
  );
}
