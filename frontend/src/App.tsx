import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FoodDatabase from './pages/FoodDatabase';
import FoodDiary from './pages/FoodDiary';
import WeightTracker from './pages/WeightTracker';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="foods" element={<FoodDatabase />} />
          <Route path="diary" element={<FoodDiary />} />
          <Route path="weight" element={<WeightTracker />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
