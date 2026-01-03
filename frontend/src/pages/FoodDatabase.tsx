import { useState, useEffect } from 'react';
import { foodAPI } from '../services/api';
import { Food } from '../types';
import './FoodDatabase.css';

const FoodDatabase = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
    return true;
  });

  return (
    <div className="container">
      <h1>Food Database</h1>

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
            onClick={() => setFilterCategory('all')}
          >
            All Foods
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
              </div>
            ))}
            {filteredFoods.length === 0 && (
              <p className="no-results">No foods found. Try a different search.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDatabase;
