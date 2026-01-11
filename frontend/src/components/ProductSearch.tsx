import { useState } from 'react';
import { productsAPI, Product } from '../services/api';
import BarcodeScanner from './BarcodeScanner';
import './ProductSearch.css';

interface ProductSearchProps {
  onProductSaved?: () => void;
}

const ProductSearch = ({ onProductSaved }: ProductSearchProps) => {
  const [searchType, setSearchType] = useState<'name' | 'barcode'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setProducts([]);

    try {
      if (searchType === 'barcode') {
        const response = await productsAPI.searchByBarcode(searchQuery);
        setProducts([response.data]);
      } else {
        const response = await productsAPI.searchByName(searchQuery);
        setProducts(response.data.products);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      setSuccess('');
      setError('');
      await productsAPI.saveProduct({
        barcode: product.barcode,
        name: product.name,
        synValue: product.synValue,
        isFree: product.isFreeFood,
        isSpeed: product.isSpeedFood,
        servingSize: product.servingSize
      });
      setSuccess(`"${product.name}" saved to your food database!`);
      if (onProductSaved) {
        onProductSaved();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setShowScanner(false);
    // Automatically search for the scanned barcode
    setTimeout(() => {
      handleSearchBarcode(barcode);
    }, 100);
  };

  const handleSearchBarcode = async (barcode: string) => {
    setIsLoading(true);
    setError('');
    setProducts([]);

    try {
      const response = await productsAPI.searchByBarcode(barcode);
      setProducts([response.data]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="product-search">
      <div className="search-type-toggle">
        <button
          className={`toggle-btn ${searchType === 'name' ? 'active' : ''}`}
          onClick={() => setSearchType('name')}
        >
          Search by Name
        </button>
        <button
          className={`toggle-btn ${searchType === 'barcode' ? 'active' : ''}`}
          onClick={() => setSearchType('barcode')}
        >
          Search by Barcode
        </button>
      </div>

      <div className="product-search-bar">
        <input
          type={searchType === 'barcode' ? 'number' : 'text'}
          placeholder={searchType === 'barcode' ? 'Enter barcode...' : 'Search UK products...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        {searchType === 'barcode' && (
          <button
            onClick={() => setShowScanner(true)}
            className="btn btn-secondary btn-camera"
            title="Scan barcode with camera"
          >
            📷
          </button>
        )}
        <button onClick={handleSearch} className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isLoading ? (
        <div className="loading-message">Searching Open Food Facts database...</div>
      ) : (
        <div className="products-grid">
          {products.length === 0 && searchQuery && !isLoading && (
            <p className="no-results">
              No products found. Try searching for UK commercial products like "Tesco Chicken" or scan a barcode.
            </p>
          )}

          {products.map((product) => (
            <div key={product.barcode} className="product-card">
              {product.image && (
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
              )}
              <div className="product-details">
                <h3>{product.name}</h3>
                <div className="product-badges">
                  {product.isFreeFood && <span className="badge badge-free">Free Food</span>}
                  {product.isSpeedFood && <span className="badge badge-speed">Speed Food</span>}
                </div>
                <div className="product-syns">
                  <span className="syn-value">{product.synValue}</span>
                  <span className="syn-label">syns per {product.servingSize}</span>
                </div>
                <div className="product-nutrition">
                  <h4>Nutritional Info (per 100g):</h4>
                  <div className="nutrition-grid">
                    <div>Calories: {product.nutrition.calories} kcal</div>
                    <div>Protein: {product.nutrition.protein}g</div>
                    <div>Carbs: {product.nutrition.carbs}g</div>
                    <div>Fat: {product.nutrition.fat}g</div>
                    <div>Sat Fat: {product.nutrition.saturatedFat}g</div>
                    <div>Sugar: {product.nutrition.sugars}g</div>
                  </div>
                </div>
                <button
                  onClick={() => handleSaveProduct(product)}
                  className="btn btn-primary btn-save"
                >
                  Save to My Foods
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="info-banner">
        <p>
          <strong>Powered by Open Food Facts</strong> - Search millions of UK products.
          Syn values are automatically calculated from nutritional information.
        </p>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default ProductSearch;
