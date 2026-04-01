import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productService, uploadService, aiService } from '../services/api';

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
  const navigate = useNavigate();
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
  const [aiCatSuggestion, setAiCatSuggestion] = useState(null); // { category, confidence }
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

    // Auto-categorize on name change (debounced)
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
      for (const file of files) {
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
    if (!window.confirm('Delete this product?')) return;
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
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/seller/dashboard')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">My Products</h1>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Product List */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="font-medium">No products yet</p>
            <p className="text-sm mt-1">Click "Add Product" to list your first item.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-emerald-600 font-semibold text-sm">{formatPrice(product.price)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEditForm(product)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 text-xs border border-red-100 text-red-500 rounded-lg py-1.5 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-base">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jollof Rice & Chicken"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>

              {/* AI Category Suggestion chip */}
              {aiCatLoading && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin inline-block" />
                  Suggesting category…
                </p>
              )}
              {aiCatSuggestion && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-emerald-700">
                    ✦ Suggested: <strong>{aiCatSuggestion.category}</strong>
                    <span className="text-emerald-400 text-xs ml-1">({aiCatSuggestion.confidence} confidence)</span>
                  </span>
                  <button
                    type="button"
                    onClick={acceptCategorySuggestion}
                    className="ml-auto text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-md hover:bg-emerald-600"
                  >
                    Accept
                  </button>
                  <button type="button" onClick={() => setAiCatSuggestion(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={aiDescLoading}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiDescLoading ? (
                      <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <span>✦</span>
                    )}
                    {aiDescLoading ? 'Generating…' : 'Generate with AI'}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe your product…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="4000"
                    min="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity_available"
                    value={formData.quantity_available}
                    onChange={handleChange}
                    placeholder="1"
                    min="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-emerald-400 transition-colors text-sm text-gray-500">
                  {uploadingImages ? (
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                  {uploadingImages ? 'Uploading…' : 'Upload images'}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                </label>
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.images.map((url, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                >
                  {submitting ? 'Saving…' : editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
