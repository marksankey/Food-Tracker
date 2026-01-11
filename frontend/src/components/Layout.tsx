import { Outlet, Link } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
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
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
