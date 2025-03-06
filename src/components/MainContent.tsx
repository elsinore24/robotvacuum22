import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown, Filter, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import MobileFilterPanel from './MobileFilterPanel';
import { handleViewDeal } from '../utils/platformUtils';

// Top brands with 20% VER boost
const TOP_BRANDS = ['ROBOROCK', 'IROBOT', 'SHARK'];
const TOP_BRAND_BOOST = 1.2;

interface Deal {
  id: string;
  title: string;
  price: number;
  image_url: string;
  deal_url: string;
  brand: string;
  model_number: string | null;
  suction_power: number | null;
  cleaniq_score: number | null;
  cleaning_score: number | null;
  navigation_score: number | null;
  smart_score: number | null;
  maintenance_score: number | null;
  battery_score: number | null;
  pet_family_score: number | null;
  review_score: number | null;
  battery_minutes: number | null;
  navigation_type: string | null;
  self_empty: boolean;
  mopping: boolean;
  hepa_filter: boolean;
  edge_cleaning: boolean;
  side_brush: boolean;
  dual_brush: boolean;
  tangle_free: boolean;
  wifi: boolean;
  app_control: boolean;
  voice_control: boolean;
  scheduling: boolean;
  zone_cleaning: boolean;
  spot_cleaning: boolean;
  no_go_zones: boolean;
  auto_boost: boolean;
  object_recognition: boolean;
  furniture_recognition: boolean;
  pet_recognition: boolean;
  three_d_mapping: boolean;
  obstacle_avoidance: boolean;
  uv_sterilization: boolean;
  maintenance_reminder: boolean;
  filter_replacement_indicator: boolean;
  brush_cleaning_indicator: boolean;
  large_dustbin: boolean;
  auto_empty_base: boolean;
  washable_dustbin: boolean;
  washable_filter: boolean;
  easy_brush_removal: boolean;
  self_cleaning_brushroll: boolean;
  dustbin_full_indicator: boolean;
}

export default function MainContent() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'price' | 'cleaniq_score'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    brands: [] as string[],
    minPrice: '',
    maxPrice: '',
    searchQuery: '',
    suctionPower: [] as string[],
    selfEmptying: false,
    hasMop: false,
    highSuction: false,
    bestValue: false,
    condition: {
      new: true,
      used: false,
    },
  });

  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const maxPossiblePrice = 2000;
  const [tempPriceRange, setTempPriceRange] = useState([0, maxPossiblePrice]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showTopBrandsOnly, setShowTopBrandsOnly] = useState(false);

  // Calculate VER (Value Efficiency Ratio) for a deal
  const calculateVER = (deal: Deal): number => {
    if (!deal.cleaniq_score || !deal.price || deal.price <= 0) return 0;
    
    // Base VER calculation
    let ver = deal.cleaniq_score / deal.price;
    
    // Apply 20% boost for top brands
    if (TOP_BRANDS.includes(deal.brand.toUpperCase())) {
      ver *= TOP_BRAND_BOOST;
    }
    
    return ver;
  };

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data, error } = await supabase
          .from('robot_vacuums')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDeals(data || []);

        const brandCounts = (data || []).reduce((acc: { [key: string]: number }, deal) => {
          const normalizedBrand = deal.brand.toUpperCase();
          acc[normalizedBrand] = (acc[normalizedBrand] || 0) + 1;
          return acc;
        }, {});

        const sortedBrands = Object.entries(brandCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([brand]) => brand);

        setAvailableBrands(sortedBrands);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  useEffect(() => {
    let filtered = [...deals];

    if (filters.condition.new && !filters.condition.used) {
      filtered = filtered.filter((deal) => !deal.title?.startsWith('USED-'));
    } else if (!filters.condition.new && filters.condition.used) {
      filtered = filtered.filter((deal) => deal.title?.startsWith('USED-'));
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (deal) =>
          deal.title.toLowerCase().includes(query) ||
          deal.brand.toLowerCase().includes(query) ||
          (deal.model_number?.toLowerCase().includes(query))
      );
    }

    if (showTopBrandsOnly) {
      filtered = filtered.filter((deal) => 
        TOP_BRANDS.includes(deal.brand.toUpperCase())
      );
    } else if (filters.brands.length > 0) {
      filtered = filtered.filter((deal) => 
        filters.brands.some(brand => brand.toUpperCase() === deal.brand.toUpperCase())
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter((deal) => deal.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((deal) => deal.price <= Number(filters.maxPrice));
    }

    if (filters.suctionPower.length > 0) {
      filtered = filtered.filter((deal) =>
        filters.suctionPower.some((power) => {
          const powerValue = parseInt(power);
          return deal.suction_power && deal.suction_power >= powerValue;
        })
      );
    }

    if (filters.selfEmptying) {
      filtered = filtered.filter((deal) => deal.self_empty);
    }

    if (filters.hasMop) {
      filtered = filtered.filter((deal) => deal.mopping);
    }

    if (filters.highSuction) {
      filtered = filtered.filter((deal) => deal.suction_power && deal.suction_power >= 10000);
    }

    // Apply Best Value filter using VER
    if (filters.bestValue) {
      // Calculate VER for all filtered deals
      const dealsWithVER = filtered.map(deal => ({
        deal,
        ver: calculateVER(deal)
      }));
      
      // Sort by VER and take top 33%
      dealsWithVER.sort((a, b) => b.ver - a.ver);
      const topThird = Math.ceil(dealsWithVER.length / 3);
      
      // Filter to only include top third of deals by VER
      filtered = dealsWithVER
        .slice(0, topThird)
        .map(item => item.deal);
    }

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortField] ?? 0;
        const bValue = b[sortField] ?? 0;
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredDeals(filtered);
  }, [deals, filters, sortField, sortDirection, showTopBrandsOnly]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = parseInt(e.target.value);
    setTempPriceRange((prev) =>
      type === 'min' ? [Math.min(value, prev[1]), prev[1]] : [prev[0], Math.max(value, prev[0])]
    );
  };

  const applyPriceFilter = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: tempPriceRange[0].toString(),
      maxPrice: tempPriceRange[1].toString(),
    }));
  };

  const displayedBrands = showAllBrands ? availableBrands : availableBrands.slice(0, 5);

  const getPresentFeatures = (deal: Deal) => {
    const features = [
      { key: 'self_empty', label: 'Self-Empty' },
      { key: 'mopping', label: 'Mopping' },
      { key: 'hepa_filter', label: 'HEPA Filter' },
      { key: 'edge_cleaning', label: 'Edge Cleaning' },
      { key: 'side_brush', label: 'Side Brush' },
      { key: 'dual_brush', label: 'Dual Brush' },
      { key: 'tangle_free', label: 'Tangle-Free' },
      { key: 'wifi', label: 'Wi-Fi Connected' },
      { key: 'app_control', label: 'App Control' },
      { key: 'voice_control', label: 'Voice Control' },
      { key: 'scheduling', label: 'Scheduling' },
      { key: 'zone_cleaning', label: 'Zone Cleaning' },
      { key: 'spot_cleaning', label: 'Spot Cleaning' },
      { key: 'no_go_zones', label: 'No-Go Zones' },
      { key: 'auto_boost', label: 'Auto-Boost' },
      { key: 'object_recognition', label: 'Object Recognition' },
      { key: 'furniture_recognition', label: 'Furniture Recognition' },
      { key: 'pet_recognition', label: 'Pet Recognition' },
      { key: 'three_d_mapping', label: '3D Mapping' },
      { key: 'obstacle_avoidance', label: 'Obstacle Avoidance' },
      { key: 'uv_sterilization', label: 'UV Sterilization' },
      { key: 'maintenance_reminder', label: 'Maintenance Reminder' },
    ];

    return features
      .filter((feature) => deal[feature.key as keyof Deal] === true)
      .map((feature) => feature.label);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileFilterPanel
        show={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        setFilters={setFilters}
        tempPriceRange={tempPriceRange}
        handlePriceChange={handlePriceChange}
        applyPriceFilter={applyPriceFilter}
        availableBrands={availableBrands}
        displayedBrands={displayedBrands}
        setShowAllBrands={setShowAllBrands}
        showAllBrands={showAllBrands}
        maxPossiblePrice={maxPossiblePrice}
        showTopBrandsOnly={showTopBrandsOnly}
        setShowTopBrandsOnly={setShowTopBrandsOnly}
      />

      <div className="flex flex-row-reverse lg:flex-row gap-4">
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-3">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              />

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
                    onClick={applyPriceFilter}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center text-gray-600 hover:text-gray-900"
            >
              <Filter className="h-5 w-5 mr-2" />
              <span>Filters</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading deals...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-900 max-w-[80px]">
                        <span className="block truncate">Brand</span>
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-900 max-w-[100px]">
                        <span className="block truncate">Model</span>
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-900 w-[80px]">
                        <button
                          onClick={() => {
                            setSortField('price');
                            setSortDirection(
                              sortField === 'price'
                                ? sortDirection === 'asc'
                                  ? 'desc'
                                  : 'asc'
                                : 'asc'
                            );
                          }}
                          className="flex items-center"
                        >
                          Price
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-900 w-[90px]">
                        <button
                          onClick={() => {
                            setSortField('cleaniq_score');
                            setSortDirection(
                              sortField === 'cleaniq_score'
                                ? sortDirection === 'asc'
                                  ? 'desc'
                                  : 'asc'
                                : 'asc'
                            );
                          }}
                          className="flex items-center whitespace-nowrap"
                        >
                          CLEAN IQ<sup className="text-xs">®</sup>
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDeals.map((deal) => (
                      <React.Fragment key={deal.id}>
                        <tr 
                          onClick={() => toggleRowExpansion(deal.id)} 
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-2 py-1.5">
                            <div className="flex items-center space-x-2 max-w-[80px]">
                              <img
                                src={deal.image_url || 'https://via.placeholder.com/24x24'}
                                alt={deal.brand}
                                className="w-6 h-6 object-cover rounded flex-shrink-0"
                              />
                              <span className="text-xs truncate">{deal.brand}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 max-w-[100px]">
                            <span className="text-xs truncate block">
                              {deal.model_number || 'N/A'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-xs font-medium w-[80px]">
                            ${deal.price.toFixed(2)}
                          </td>
                          <td className="px-2 py-1.5 w-[90px]">
                            {deal.cleaniq_score ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {deal.cleaniq_score.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                          </td>
                        </tr>
                        {expandedRow === deal.id && (
                          <tr>
                            <td colSpan={4} className="px-2 py-2 bg-gray-50">
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                  <h4 className="text-xs font-medium text-gray-900 mb-1">Brand Details</h4>
                                  <img
                                    src={deal.image_url || 'https://via.placeholder.com/120x120'}
                                    alt={deal.title}
                                    className="w-full h-20 object-cover rounded-lg mb-1"
                                  />
                                  <h3 className="text-xs font-medium text-gray-900 truncate">
                                    {deal.title}
                                  </h3>
                                </div>

                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                  <h4 className="text-xs font-medium text-gray-900 mb-1">Specifications</h4>
                                  <dl className="space-y-1">
                                    <div>
                                      <dt className="text-xs text-gray-500">Model</dt>
                                      <dd className="text-xs font-medium truncate">
                                        {deal.model_number || 'N/A'}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-xs text-gray-500">Suction Power</dt>
                                      <dd className="text-xs font-medium">
                                        {deal.suction_power ? `${deal.suction_power} Pa` : 'N/A'}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-xs text-gray-500">Battery Life</dt>
                                      <dd className="text-xs font-medium">
                                        {deal.battery_minutes ? `${deal.battery_minutes} min` : 'N/A'}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>

                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                  <h4 className="text-xs font-medium text-gray-900 mb-1">Features</h4>
                                  <ul className="space-y-1 max-h-[80px] overflow-y-auto">
                                    {getPresentFeatures(deal).map((feature, index) => (
                                      <li key={index} className="flex items-center text-xs text-gray-600">
                                        <Check className="h-3 w-3 mr-1 text-green-500 flex-shrink-0" />
                                        <span className="truncate">{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <button
                                    className="mt-2 block w-full text-center px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewDeal(deal.deal_url);
                                    }}
                                  >
                                    View Deal
                                  </button>
                                </div>

                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-xs font-medium text-gray-900">CLEAN IQ® Score</h4>
                                    <div className="bg-blue-50 px-1.5 py-0.5 rounded-lg">
                                      <span className="text-base font-semibold text-blue-600">
                                        {deal.cleaniq_score ? deal.cleaniq_score.toFixed(1) : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    {[
                                      { label: 'Cleaning', score: deal.cleaning_score },
                                      { label: 'Navigation', score: deal.navigation_score },
                                      { label: 'Smart', score: deal.smart_score },
                                      { label: 'Maintenance', score: deal.maintenance_score },
                                      { label: 'Battery', score: deal.battery_score },
                                      { label: 'Pet Family', score: deal.pet_family_score },
                                      { label: 'Review', score: deal.review_score }
                                    ].map(({ label, score }) => (
                                      <div key={label} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{label}</span>
                                        <span className="text-xs font-medium">
                                          {score ? score.toFixed(1) : 'N/A'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
