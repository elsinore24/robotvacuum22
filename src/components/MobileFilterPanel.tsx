import React from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface MobileFilterPanelProps {
  show: boolean;
  onClose: () => void;
  filters: {
    brands: string[];
    minPrice: string;
    maxPrice: string;
    searchQuery: string;
    suctionPower: string[];
    selfEmptying: boolean;
    hasMop: boolean;
    highSuction: boolean;
    bestValue: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  tempPriceRange: [number, number];
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => void;
  applyPriceFilter: () => void;
  availableBrands: string[];
  displayedBrands: string[];
  setShowAllBrands: React.Dispatch<React.SetStateAction<boolean>>;
  showAllBrands: boolean;
  maxPossiblePrice: number;
  showTopBrandsOnly: boolean;
  setShowTopBrandsOnly: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
  show,
  onClose,
  filters,
  setFilters,
  tempPriceRange,
  handlePriceChange,
  applyPriceFilter,
  availableBrands,
  displayedBrands,
  setShowAllBrands,
  showAllBrands,
  maxPossiblePrice,
  showTopBrandsOnly,
  setShowTopBrandsOnly,
}) => {
  if (!show) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-[300px] bg-white shadow-xl z-50 lg:hidden">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev: any) => ({ ...prev, searchQuery: e.target.value }))}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Quick Filters</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showTopBrandsOnly}
                      onChange={(e) => {
                        setShowTopBrandsOnly(e.target.checked);
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, brands: [] }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">Top Brands</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.bestValue}
                      onChange={(e) => 
                        setFilters(prev => ({ ...prev, bestValue: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">Best Value</span>
                    <span className="ml-1 text-xs text-gray-500">(Top 33% VER)</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Features</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.selfEmptying}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, selfEmptying: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">Self-Emptying</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasMop}
                      onChange={(e) => setFilters((prev) => ({ ...prev, hasMop: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">Has Mop</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.highSuction}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, highSuction: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">High Suction (10000+ Pa)</span>
                  </label>
                </div>
              </div>

              <div className={showTopBrandsOnly ? 'opacity-50 pointer-events-none' : ''}>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">All Brands</h3>
                <div className="space-y-2">
                  {displayedBrands.map((brand) => (
                    <label key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.brands.some(b => b.toUpperCase() === brand.toUpperCase())}
                        onChange={(e) => {
                          setFilters((prev) => ({
                            ...prev,
                            brands: e.target.checked
                              ? [...prev.brands, brand]
                              : prev.brands.filter((b) => b.toUpperCase() !== brand.toUpperCase()),
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={showTopBrandsOnly}
                      />
                      <span className="ml-2 text-sm">{brand}</span>
                    </label>
                  ))}
                  {availableBrands.length > 5 && (
                    <button
                      onClick={() => setShowAllBrands(!showAllBrands)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {showAllBrands ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show More
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Price Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Min: ${tempPriceRange[0]}</label>
                    <input
                      type="range"
                      min={0}
                      max={maxPossiblePrice}
                      value={tempPriceRange[0]}
                      onChange={(e) => handlePriceChange(e, 'min')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Max: ${tempPriceRange[1]}</label>
                    <input
                      type="range"
                      min={0}
                      max={maxPossiblePrice}
                      value={tempPriceRange[1]}
                      onChange={(e) => handlePriceChange(e, 'max')}
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => {
                      applyPriceFilter();
                      onClose();
                    }}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileFilterPanel;
