import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, uploadService, aiService } from '../services/api';
import CinematicDashboardLayout from '../layouts/CinematicDashboardLayout';
import { motion as Motion, AnimatePresence } from 'framer-motion';
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
      <div className="space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-cinematic-dark mb-2">
              Products
            </h1>
            <p className="text-zinc-500 text-lg font-medium">
              Manage your store's inventory and listings.
            </p>
          </div>
          <div>
            <button
              onClick={openCreateForm}
              className="px-8 py-3 rounded-full bg-cinematic-dark text-white font-bold hover:bg-cinematic-dark/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        </header>

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="h-[40vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-cinematic-dark border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center rounded-[32px] bg-white border border-zinc-200 shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100">
              <svg className="w-10 h-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">No products yet</h3>
            <p className="text-zinc-500">Click "Add Product" to create your first listing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <Motion.div 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={product.id} 
                className="group relative bg-white rounded-3xl overflow-hidden border border-zinc-200 hover:border-cinematic-dark/30 hover:shadow-lg transition-all cursor-pointer flex flex-col h-[380px]"
              >
                {/* Image Background */}
                <div className="relative h-1/2 w-full overflow-hidden bg-zinc-100">
                  {product.image_urls?.[0] ? (
                    <img 
                      src={product.image_urls[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <svg className="w-12 h-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                     <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border shadow-sm ${
                       product.is_active ? 'bg-white text-cinematic-dark border-cinematic-dark/20' : 'bg-white/90 text-zinc-500 border-zinc-200'
                     }`}>
                       {product.is_active ? 'Active' : 'Inactive'}
                     </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between bg-white relative z-10">
                  <div>
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">{product.category}</p>
                    <h3 className="font-extrabold text-xl text-zinc-900 tracking-tight mb-2 truncate group-hover:text-cinematic-dark transition-colors">{product.name}</h3>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-2xl font-black text-cinematic-dark">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-zinc-500 text-xs font-medium">Qty: {product.quantity_available}</span>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditForm(product); }}
                      className="w-10 h-10 rounded-full bg-white shadow-md border border-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-cinematic-dark hover:text-white transition-colors"
                    >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                      className="w-10 h-10 rounded-full bg-white shadow-md border border-zinc-100 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </Motion.div>
            ))}
          </div>
        )}
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
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />

            {/* Modal */}
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h2 className="text-2xl font-bold text-cinematic-dark tracking-tight">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="w-10 h-10 rounded-full bg-white border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Product Name */}
                <div>
                  <label className="block text-zinc-500 text-sm font-bold tracking-widest uppercase mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Leather Jacket"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-cinematic-dark focus:ring-1 focus:ring-cinematic-dark transition-all shadow-sm"
                    required
                  />
                </div>

                {/* AI Category Suggestion */}
                <AnimatePresence>
                  {aiCatLoading && (
                    <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                      <span className="w-4 h-4 border-2 border-zinc-200 border-t-cinematic-dark rounded-full animate-spin" />
                      Analyzing name for category...
                    </Motion.div>
                  )}
                  {aiCatSuggestion && (
                    <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between bg-cinematic-dark/5 border border-cinematic-dark/10 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-cinematic-dark">✦</span>
                        <span className="text-zinc-700 text-sm font-medium">AI Suggests: <strong className="text-cinematic-dark">{aiCatSuggestion.category}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={acceptCategorySuggestion} className="px-3 py-1 bg-cinematic-dark text-white text-xs font-bold rounded-lg hover:bg-cinematic-dark/90 transition-colors shadow-sm">
                          Apply
                        </button>
                        <button type="button" onClick={() => setAiCatSuggestion(null)} className="text-zinc-400 hover:text-zinc-600 p-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>

                {/* Category & Price Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-zinc-500 text-sm font-bold tracking-widest uppercase mb-2">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-cinematic-dark focus:ring-1 focus:ring-cinematic-dark transition-all shadow-sm"
                      required
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-sm font-bold tracking-widest uppercase mb-2">Price (₦) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="4000"
                      min="0"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-cinematic-dark focus:ring-1 focus:ring-cinematic-dark transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-zinc-500 text-sm font-bold tracking-widest uppercase">Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={aiDescLoading}
                      className="flex items-center gap-2 text-xs font-bold text-cinematic-dark hover:text-cinematic-dark/80 disabled:opacity-50 transition-colors uppercase tracking-widest"
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
                    placeholder="Describe your product..."
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-cinematic-dark focus:ring-1 focus:ring-cinematic-dark transition-all shadow-sm resize-none"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-zinc-500 text-sm font-bold tracking-widest uppercase mb-2">Images</label>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 hover:border-cinematic-dark/50 rounded-2xl p-8 cursor-pointer transition-colors text-zinc-400 hover:text-zinc-600 bg-zinc-50">
                    {uploadingImages ? (
                      <span className="w-8 h-8 border-2 border-zinc-200 border-t-cinematic-dark rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm font-bold tracking-wide">Upload Images</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                  </label>

                  {/* Image Previews */}
                  {formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                      {formData.images.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 group">
                          <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-zinc-200 shadow-sm" />
                          <div className="absolute inset-0 bg-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="w-8 h-8 bg-white hover:bg-red-50 text-red-500 rounded-full flex items-center justify-center transition-colors shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Quantity */}
                <div>
                   <label className="block text-zinc-500 text-sm font-bold tracking-widest uppercase mb-2">Quantity Available</label>
                   <input
                     type="number"
                     name="quantity_available"
                     value={formData.quantity_available}
                     onChange={handleChange}
                     placeholder="10"
                     min="0"
                     className="w-1/3 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-cinematic-dark focus:ring-1 focus:ring-cinematic-dark transition-all shadow-sm"
                   />
                </div>
              </form>

              {/* Submit Footer */}
              <div className="px-8 py-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-3 rounded-full border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 rounded-full bg-cinematic-dark text-white font-bold hover:bg-cinematic-dark/90 transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </CinematicDashboardLayout>
  );
}
