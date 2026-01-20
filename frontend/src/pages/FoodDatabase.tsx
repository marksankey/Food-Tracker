import { useState, useEffect } from 'react';
import { foodAPI } from '../services/api';
import { Food } from '../types';
import ProductSearch from '../components/ProductSearch';
import './FoodDatabase.css';

const FoodDatabase = () => {
  const [activeTab, setActiveTab] = useState<'myFoods' | 'searchProducts'>('myFoods');
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const response = await foodAPI.getAll();
      setFoods(response.data);
    } catch (error) {
      console.error('Failed to load foods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentFoods = async () => {
    try {
      setIsLoading(true);
      const response = await foodAPI.getRecent(7);
      setFoods(response.data);
      setFilterCategory('recent');
    } catch (error) {
      console.error('Failed to load recent foods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await foodAPI.delete(id);
      setFoods(foods.filter(food => food.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete food:', error);
      alert('Failed to delete food item');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadFoods();
      return;
    }

    try {
      setIsLoading(true);
      const filters = filterCategory !== 'all' ? { category: filterCategory } : {};
      const response = await foodAPI.search(searchQuery, filters);
      setFoods(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFoods = foods.filter((food) => {
    if (filterCategory === 'free') return food.isFreeFood;
    if (filterCategory === 'speed') return food.isSpeedFood;
    if (filterCategory === 'healthyExtra') return food.healthyExtraType;
    if (filterCategory === 'recent') return true; // Already filtered by backend
    return true;
  });

  return (
    <div className="container">
      <h1>Food Database</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'myFoods' ? 'active' : ''}`}
          onClick={() => setActiveTab('myFoods')}
        >
          My Foods
        </button>
        <button
          className={`tab-btn ${activeTab === 'searchProducts' ? 'active' : ''}`}
          onClick={() => setActiveTab('searchProducts')}
        >
          Search UK Products
        </button>
      </div>

      {activeTab === 'myFoods' ? (
        <>
          <div className="card search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search for foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn btn-primary">
                Search
              </button>
            </div>

            <div className="filters">
              <button
                className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => { setFilterCategory('all'); loadFoods(); }}
              >
                All Foods
              </button>
              <button
                className={`filter-btn ${filterCategory === 'recent' ? 'active' : ''}`}
                onClick={loadRecentFoods}
              >
                Recent (7 days)
              </button>
              <button
                className={`filter-btn ${filterCategory === 'free' ? 'active' : ''}`}
                onClick={() => setFilterCategory('free')}
              >
                Free Foods
              </button>
              <button
                className={`filter-btn ${filterCategory === 'speed' ? 'active' : ''}`}
                onClick={() => setFilterCategory('speed')}
              >
                Speed Foods
              </button>
              <button
                className={`filter-btn ${filterCategory === 'healthyExtra' ? 'active' : ''}`}
                onClick={() => setFilterCategory('healthyExtra')}
              >
                Healthy Extras
              </button>
            </div>
          </div>

          <div className="card">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="food-grid">
                {filteredFoods.map((food) => (
                  <div key={food.id} className="food-item">
                    <div className="food-header">
                      <h3>{food.name}</h3>
                      <div className="food-badges">
                        {food.isFreeFood && <span className="badge badge-free">Free</span>}
                        {food.isSpeedFood && <span className="badge badge-speed">Speed</span>}
                        {food.healthyExtraType && (
                          <span className="badge badge-extra">HE {food.healthyExtraType}</span>
                        )}
                      </div>
                    </div>
                    <div className="food-info">
                      <div className="food-syns">
                        <span className="syn-value">{food.synValue}</span>
                        <span className="syn-label">syns</span>
                      </div>
                      <div className="food-portion">
                        per {food.portionSize} {food.portionUnit}
                      </div>
                    </div>
                    <div className="food-actions">
                      {deleteConfirm === food.id ? (
                        <div className="delete-confirm">
                          <span>Delete this item?</span>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(food.id)}
                          >
                            Yes
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(food.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredFoods.length === 0 && (
                  <p className="no-results">No foods found. Try a different search.</p>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <ProductSearch onProductSaved={loadFoods} />
        </div>
      )}
    </div>
  );
};

export default FoodDatabase;
