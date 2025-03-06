import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Robot Vacuum Price</span>
              <span className="ml-2 text-sm text-gray-600">(Affiliate Links)</span>
            </Link>
          </div>
          
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                location.pathname === '/'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Deals
            </Link>
            
            <Link
              to="/blog"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                location.pathname.startsWith('/blog')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guides
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
