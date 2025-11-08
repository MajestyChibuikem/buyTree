import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerService } from '../services/api';

// Available categories based on strategy
const CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Books & Stationery',
  'Food & Snacks',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Home & Living',
  'Art & Crafts',
];

export default function BecomeSeller() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    shopName: '',
    categories: [],
    bankCode: '',
    accountNumber: '',
  });
  const [banks, setBanks] = useState([]);
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Fetch banks on mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await sellerService.getBanks();
        setBanks(response.data.banks);
      } catch (err) {
        setError('Failed to load banks. Please refresh the page.');
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];

      return { ...prev, categories };
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.shopName) {
      setError('Please enter a shop name');
      return;
    }

    if (formData.categories.length === 0) {
      setError('Please select at least 1 category');
      return;
    }

    if (formData.categories.length > 3) {
      setError('You can only select up to 3 categories');
      return;
    }

    if (!formData.bankCode || !formData.accountNumber) {
      setError('Please select a bank and enter your account number');
      return;
    }

    if (formData.accountNumber.length !== 10) {
      setError('Account number must be 10 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await sellerService.registerSeller(formData);
      setAccountName(response.data.accountName);

      // Show success and redirect
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register as seller');
      setLoading(false);
    }
  };

  if (user?.role === 'seller') {
    navigate('/seller/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Become a Seller</h2>
            <p className="mt-2 text-sm text-gray-600">
              Start selling on BuyTree and reach students across Nigeria
            </p>
          </div>

          {accountName && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">
                <p className="font-semibold">Success! Account verified for:</p>
                <p className="mt-1">{accountName}</p>
                <p className="mt-2">Redirecting to your seller dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Name */}
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                Shop Name
              </label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., Campus Fashionista"
                value={formData.shopName}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be your shop's display name
              </p>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Categories (Select 1-3)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-4 py-3 text-sm font-medium rounded-md border-2 transition-colors ${
                      formData.categories.includes(category)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Selected: {formData.categories.length}/3 categories
              </p>
            </div>

            {/* Bank Selection */}
            <div>
              <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700">
                Bank
              </label>
              <select
                id="bankCode"
                name="bankCode"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={formData.bankCode}
                onChange={handleChange}
                disabled={loadingBanks}
              >
                <option value="">
                  {loadingBanks ? 'Loading banks...' : 'Select your bank'}
                </option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                Account Number
              </label>
              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                required
                maxLength="10"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="0123456789"
                value={formData.accountNumber}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Your account will be verified with Paystack
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                How payments work:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• You keep 95% of each sale</li>
                <li>• BuyTree takes 5% platform fee</li>
                <li>• Payments are held for 24 hours after delivery</li>
                <li>• Money goes directly to your bank account</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || loadingBanks || accountName}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying account...' : 'Create Seller Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
