import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/dashboard" className="navbar-brand">
            🍎 Food Tracker
          </Link>
          <div className="navbar-menu">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/diary" className="nav-link">Food Diary</Link>
            <Link to="/foods" className="nav-link">Food Database</Link>
            <Link to="/weight" className="nav-link">Weight Tracker</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
          </div>
          <div className="navbar-user">
            <span className="user-name">👤 {user?.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
