import { useState, useEffect } from 'react';
import { diaryAPI, foodAPI } from '../services/api';
import { FoodDiaryEntry, Food } from '../types';
import { format, addDays, subDays } from 'date-fns';
import './FoodDiary.css';

const FoodDiary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast');
  const [selectedFood, setSelectedFood] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isHealthyExtra, setIsHealthyExtra] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
    loadFoods();
  }, [selectedDate]);

  const loadEntries = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await diaryAPI.getByDate(dateStr);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFoods = async () => {
    try {
      const response = await foodAPI.getAll(100);
      setFoods(response.data);
    } catch (error) {
      console.error('Failed to load foods:', error);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedFood) return;

    const food = foods.find((f) => f.id === selectedFood);
    if (!food) return;

    const synValue = food.isFreeFood ? 0 : food.synValue * quantity;

    try {
      await diaryAPI.addEntry({
        date: format(selectedDate, 'yyyy-MM-dd'),
        mealType: selectedMeal,
        foodId: selectedFood,
        quantity,
        synValueConsumed: synValue,
        isHealthyExtra,
      });

      setShowAddModal(false);
      setSelectedFood('');
      setQuantity(1);
      setIsHealthyExtra(false);
      loadEntries();
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await diaryAPI.deleteEntry(id);
      loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const openAddModal = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    setSelectedMeal(meal);
    setShowAddModal(true);
  };

  const getEntriesByMeal = (meal: string) => {
    return entries.filter((entry) => entry.mealType === meal);
  };

  const getMealTotal = (meal: string) => {
    return getEntriesByMeal(meal).reduce((sum, entry) => sum + entry.synValueConsumed, 0);
  };

  const filteredFoods = searchQuery
    ? foods.filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : foods;

  return (
    <div className="container">
      <div className="diary-header">
        <h1>Food Diary</h1>
        <div className="date-navigator">
          <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="btn btn-secondary">
            ← Previous
          </button>
          <span className="current-date">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="btn btn-secondary">
            Next →
          </button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
            <div key={meal} className="card meal-section">
              <div className="meal-header">
                <h2>{meal.charAt(0).toUpperCase() + meal.slice(1)}</h2>
                <div className="meal-info">
                  <span className="meal-syns">{getMealTotal(meal)} syns</span>
                  <button onClick={() => openAddModal(meal as any)} className="btn btn-primary">
                    + Add Food
                  </button>
                </div>
              </div>
              <div className="meal-entries">
                {getEntriesByMeal(meal).length > 0 ? (
                  getEntriesByMeal(meal).map((entry) => (
                    <div key={entry.id} className="entry-row">
                      <div className="entry-details">
                        <span className="entry-name">{entry.food?.name || 'Unknown'}</span>
                        <span className="entry-quantity">
                          {entry.quantity} × {entry.food?.portionSize} {entry.food?.portionUnit}
                        </span>
                        {entry.isHealthyExtra && <span className="badge badge-extra">HE</span>}
                      </div>
                      <div className="entry-actions">
                        <span className="entry-syns">{entry.synValueConsumed} syns</span>
                        <button onClick={() => handleDeleteEntry(entry.id)} className="btn-delete">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-entries-text">No entries for this meal</p>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Food to {selectedMeal}</h2>
            <div className="form-group">
              <label>Search Food</label>
              <input
                type="text"
                placeholder="Search for a food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Select Food</label>
              <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}>
                <option value="">Choose a food...</option>
                {filteredFoods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} ({food.synValue} syns per {food.portionSize} {food.portionUnit})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={isHealthyExtra}
                  onChange={(e) => setIsHealthyExtra(e.target.checked)}
                />
                Mark as Healthy Extra
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddEntry} className="btn btn-primary" disabled={!selectedFood}>
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDiary;
