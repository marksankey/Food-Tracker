import { useState } from 'react';
import { productsAPI, diaryAPI, Product } from '../services/api';
import { format } from 'date-fns';
import BarcodeScanner from './BarcodeScanner';
import './ProductSearch.css';

interface ProductSearchProps {
  onProductSaved?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

// Helper function to get default meal based on current time
const getDefaultMeal = (): 'breakfast' | 'lunch' | 'dinner' | 'snacks' => {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 14) return 'lunch';
  return 'dinner';
};

const ProductSearch = ({ onProductSaved, searchQuery: externalSearchQuery, onSearchQueryChange }: ProductSearchProps) => {
  const [searchType, setSearchType] = useState<'name' | 'barcode'>('name');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Add to diary modal state
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [diaryQuantity, setDiaryQuantity] = useState(1);
  const [diaryMeal, setDiaryMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>(getDefaultMeal());
  const [diaryDate, setDiaryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAddingToDiary, setIsAddingToDiary] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setProducts([]);

    try {
      if (searchType === 'barcode') {
        const response = await productsAPI.searchByBarcode(searchQuery);
        console.log('Barcode search response:', response.data);
        setProducts([response.data]);
      } else {
        const response = await productsAPI.searchByName(searchQuery);
        console.log('Name search response:', response.data);
        console.log('First product synValue:', response.data.products[0]?.synValue);
        setProducts(response.data.products);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDiaryModal = (product: Product) => {
    setSelectedProduct(product);
    setDiaryQuantity(1);
    setDiaryMeal(getDefaultMeal());
    setDiaryDate(format(new Date(), 'yyyy-MM-dd'));
    setShowDiaryModal(true);
  };

  const closeDiaryModal = () => {
    setShowDiaryModal(false);
    setSelectedProduct(null);
  };

  const handleAddToDiary = async () => {
    if (!selectedProduct) return;

    setIsAddingToDiary(true);
    setError('');
    setSuccess('');

    try {
      // First, save the product to My Foods
      const savedFood = await productsAPI.saveProduct({
        barcode: selectedProduct.barcode,
        name: selectedProduct.name,
        synValue: selectedProduct.synValue,
        isFree: selectedProduct.isFreeFood,
        isSpeed: selectedProduct.isSpeedFood,
        servingSize: selectedProduct.servingSize
      });

      // Calculate syn value based on quantity
      const synValue = selectedProduct.isFreeFood ? 0 : selectedProduct.synValue * diaryQuantity;

      // Then add to the food diary
      await diaryAPI.addEntry({
        date: diaryDate,
        mealType: diaryMeal,
        foodId: savedFood.data.id,
        quantity: diaryQuantity,
        synValueConsumed: synValue,
        isHealthyExtra: false,
      });

      setSuccess(`"${selectedProduct.name}" added to your ${diaryMeal}!`);
      closeDiaryModal();

      if (onProductSaved) {
        onProductSaved();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add to diary');
    } finally {
      setIsAddingToDiary(false);
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
                  <span className="syn-value">{product.synValue ?? 0}</span>
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
                  onClick={() => openDiaryModal(product)}
                  className="btn btn-primary btn-save"
                >
                  Add to Food Diary
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

      {showDiaryModal && selectedProduct && (
        <div className="diary-modal-overlay" onClick={closeDiaryModal}>
          <div className="diary-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add to Food Diary</h2>

            <div className="diary-modal-food-info">
              <h3>{selectedProduct.name}</h3>
              <div className="diary-modal-syns">
                {selectedProduct.isFreeFood ? (
                  <span className="free-food-label">Free Food</span>
                ) : (
                  <>
                    <span className="syn-value">{selectedProduct.synValue}</span>
                    <span className="syn-label">syns per {selectedProduct.servingSize}</span>
                  </>
                )}
              </div>
              {selectedProduct.isFreeFood && (
                <p className="free-food-description">
                  This is a Free Food, which doesn't need to be counted, measured or weighed.
                  You can enjoy as much Free Food as you like!
                </p>
              )}
            </div>

            <div className="diary-modal-form">
              <div className="form-group">
                <label>Quantity</label>
                <div className="quantity-selector">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setDiaryQuantity(Math.max(0.5, diaryQuantity - 0.5))}
                  >
                    −
                  </button>
                  <span className="qty-value">
                    {selectedProduct.isFreeFood ? 'Unlimited' : diaryQuantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setDiaryQuantity(diaryQuantity + 0.5)}
                    disabled={selectedProduct.isFreeFood}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Meal</label>
                <div className="meal-selector">
                  <button
                    type="button"
                    className="meal-nav-btn"
                    onClick={() => {
                      const meals: ('breakfast' | 'lunch' | 'dinner' | 'snacks')[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
                      const currentIndex = meals.indexOf(diaryMeal);
                      setDiaryMeal(meals[(currentIndex - 1 + meals.length) % meals.length]);
                    }}
                  >
                    ‹
                  </button>
                  <span className="meal-value">{diaryMeal.charAt(0).toUpperCase() + diaryMeal.slice(1)}</span>
                  <button
                    type="button"
                    className="meal-nav-btn"
                    onClick={() => {
                      const meals: ('breakfast' | 'lunch' | 'dinner' | 'snacks')[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
                      const currentIndex = meals.indexOf(diaryMeal);
                      setDiaryMeal(meals[(currentIndex + 1) % meals.length]);
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <div className="date-selector">
                  <button
                    type="button"
                    className="date-nav-btn"
                    onClick={() => {
                      const date = new Date(diaryDate);
                      date.setDate(date.getDate() - 1);
                      setDiaryDate(format(date, 'yyyy-MM-dd'));
                    }}
                  >
                    ‹
                  </button>
                  <span className="date-value">
                    {format(new Date(diaryDate), 'EEEE, d MMM yyyy')}
                  </span>
                  <button
                    type="button"
                    className="date-nav-btn"
                    onClick={() => {
                      const date = new Date(diaryDate);
                      date.setDate(date.getDate() + 1);
                      setDiaryDate(format(date, 'yyyy-MM-dd'));
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            <div className="diary-modal-actions">
              <button
                onClick={handleAddToDiary}
                className="btn btn-add-diary"
                disabled={isAddingToDiary}
              >
                {isAddingToDiary ? 'Adding...' : 'Add to Planner'}
              </button>
              <button onClick={closeDiaryModal} className="btn btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
