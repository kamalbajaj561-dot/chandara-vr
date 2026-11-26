import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-darkBlue border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gold">
            Chandara VR
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-gold transition-colors">
              Home
            </Link>
            <Link to="/events" className="text-gray-300 hover:text-gold transition-colors">
              Events
            </Link>
            
            {user ? (
              <>
                <Link 
                  to={user.role === 'admin' ? '/admin' : user.role === 'streamer' ? '/streamer-dashboard' : '/dashboard'}
                  className="text-gray-300 hover:text-gold transition-colors"
                >
                  Dashboard
                </Link>
                <NotificationBell />
                <Link to="/orders" className="text-gray-300 hover:text-gold transition-colors">
                  Orders
                </Link>
                <Link to="/profile" className="text-gray-300 hover:text-gold transition-colors">
                  Profile
                </Link>
                {user.role === 'streamer' && (
                  <Link to="/create-event" className="text-gray-300 hover:text-gold transition-colors">
                    Create Event
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-gold transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-gray-300 hover:text-gold transition-colors">
                Home
              </Link>
              <Link to="/events" className="text-gray-300 hover:text-gold transition-colors">
                Events
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to={user.role === 'admin' ? '/admin' : user.role === 'streamer' ? '/streamer-dashboard' : '/dashboard'}
                    className="text-gray-300 hover:text-gold transition-colors"
                  >
                    Dashboard
                  </Link>
                  {user.role === 'streamer' && (
                    <Link to="/create-event" className="text-gray-300 hover:text-gold transition-colors">
                      Create Event
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-gold transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-center">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
