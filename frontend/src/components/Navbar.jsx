import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import { 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaUserMd, 
  FaRobot, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaSignInAlt, 
  FaUserPlus,
  FaHeartbeat
} from 'react-icons/fa';

const Navbar = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!token) {
      return [
        { to: '/login', label: 'Login', icon: <FaSignInAlt /> },
        { to: '/doctor/login', label: 'Doctor Login', icon: <FaUserMd /> },
        { to: '/register', label: 'Register', icon: <FaUserPlus /> },
      ];
    }

    if (user?.role === 'admin') {
      return [
        { to: '/admin', label: 'Admin Dashboard', icon: <FaHome /> },
        { to: '/profile', label: 'Profile', icon: <FaUserCircle /> },
      ];
    }

    if (user?.role === 'doctor') {
      return [
        { to: '/doctor/dashboard', label: 'Doctor Dashboard', icon: <FaHome /> },
        { to: '/profile', label: 'Profile', icon: <FaUserCircle /> },
      ];
    }

    return [
      { to: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
      { to: '/doctors', label: 'Doctors', icon: <FaUserMd /> },
      { to: '/ai-tools', label: 'AI Tools', icon: <FaRobot /> },
      { to: '/profile', label: 'Profile', icon: <FaUserCircle /> },
    ];
  };

  const navLinks = getNavLinks();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
    }`;

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink 
            to={token ? '/dashboard' : '/login'} 
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <FaHeartbeat className="text-2xl" />
            <span className="text-xl font-bold tracking-tight">HealthAI</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={navLinkClass}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
            
            {token && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaUserCircle className="text-lg text-primary-600" />
                  <span className="font-medium">{user?.name || 'User'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                  title="Logout"
                >
                  <FaSignOutAlt />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {token && (
              <div className="flex items-center gap-3 px-4 py-3 mb-2 border-b border-gray-100">
                <FaUserCircle className="text-2xl text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role || 'User'}</p>
                </div>
              </div>
            )}
            
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
            
            {token && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200 mt-2"
              >
                <FaSignOutAlt />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

