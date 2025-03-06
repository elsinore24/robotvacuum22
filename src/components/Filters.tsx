import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface Props {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

export default function Filters({ onSearch, onFilterChange }: Props) {
  const [activeFilters, setActiveFilters] = useState({
    conditions: ['new', 'used'],
    brands: ['iRobot', 'Roborock'],
    features: ['mopping', 'autoEmpty', 'mapping', 'obstacleAvoidance'],
    suction: '2000'
  });

  const handleFilterChange = (type: string, value: string) => {
    let updatedFilters = { ...activeFilters };
    
    switch (type) {
      case 'condition':
        if (updatedFilters.conditions.includes(value)) {
          updatedFilters.conditions = updatedFilters.conditions.filter(c => c !== value);
        } else {
          updatedFilters.conditions.push(value);
        }
        break;
      case 'brand':
        if (updatedFilters.brands.includes(value)) {
          updatedFilters.brands = updatedFilters.brands.filter(b => b !== value);
        } else {
          updatedFilters.brands.push(value);
        }
        break;
      case 'feature':
        if (updatedFilters.features.includes(value)) {
          updatedFilters.features = updatedFilters.features.filter(f => f !== value);
        } else {
          updatedFilters.features.push(value);
        }
        break;
      case 'suction':
        updatedFilters.suction = value;
        break;
    }

    setActiveFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow p-4">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search vacuums..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Condition Section */}
        <div className="border rounded-lg p-3">
          <h3 className="font-semibold mb-2 text-gray-700">Condition</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.conditions.includes('new')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('condition', 'new')}
              />
              <span className="ml-2 text-sm">New</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.conditions.includes('used')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('condition', 'used')}
              />
              <span className="ml-2 text-sm">Used</span>
            </label>
          </div>
        </div>

        {/* Brand Section */}
        <div className="border rounded-lg p-3">
          <h3 className="font-semibold mb-2 text-gray-700">Brand</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.brands.includes('iRobot')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('brand', 'iRobot')}
              />
              <span className="ml-2 text-sm">iRobot</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.brands.includes('Roborock')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('brand', 'Roborock')}
              />
              <span className="ml-2 text-sm">Roborock</span>
            </label>
          </div>
        </div>

        {/* Features Section */}
        <div className="border rounded-lg p-3">
          <h3 className="font-semibold mb-2 text-gray-700">Features</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.features.includes('mopping')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('feature', 'mopping')}
              />
              <span className="ml-2 text-sm">Mopping</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.features.includes('autoEmpty')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('feature', 'autoEmpty')}
              />
              <span className="ml-2 text-sm">Auto Empty</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.features.includes('mapping')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('feature', 'mapping')}
              />
              <span className="ml-2 text-sm">Smart Mapping</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeFilters.features.includes('obstacleAvoidance')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('feature', 'obstacleAvoidance')}
              />
              <span className="ml-2 text-sm">Obstacle Avoidance</span>
            </label>
          </div>
        </div>

        {/* Price Range Section */}
        <div className="border rounded-lg p-3">
          <h3 className="font-semibold mb-2 text-gray-700">Price Range</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Minimum ($)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0"
                onChange={(e) => onFilterChange({ minPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Maximum ($)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="2000"
                onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Suction Power Section */}
        <div className="border rounded-lg p-3">
          <h3 className="font-semibold mb-2 text-gray-700">Suction Power</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="suction"
                checked={activeFilters.suction === '2000'}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('suction', '2000')}
              />
              <span className="ml-2 text-sm">2000+ Pa</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="suction"
                checked={activeFilters.suction === '4000'}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => handleFilterChange('suction', '4000')}
              />
              <span className="ml-2 text-sm">4000+ Pa</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
