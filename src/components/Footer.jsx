import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-darkBlue border-t border-gray-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-gold mb-4">Chandara VR</h3>
            <p className="text-gray-400 text-sm">
              Experience sports like never before with immersive 360° virtual reality streaming from anywhere in the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  Become a Streamer
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  Streaming Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  VR Setup
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-gold transition-colors text-sm">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect With Us</h4>
            <div className="flex gap-4 mb-4">
              <a href="#" className="w-10 h-10 bg-darkerBlue rounded-lg flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold border border-gray-700 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-darkerBlue rounded-lg flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold border border-gray-700 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-darkerBlue rounded-lg flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold border border-gray-700 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-darkerBlue rounded-lg flex items-center justify-center text-gray-400 hover:text-gold hover:border-gold border border-gray-700 transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@chandaravr.com" className="hover:text-gold transition-colors">
                support@chandaravr.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 Chandara VR. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-gold transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-gold transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-gold transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
