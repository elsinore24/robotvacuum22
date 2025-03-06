import React, { useState } from 'react';
import { ArrowUpDown, Info } from 'lucide-react';
import { VacuumCleaner, SortOption, SortDirection } from '../types';

interface Props {
  vacuums: VacuumCleaner[];
}

export default function VacuumTable({ vacuums: initialVacuums }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSpecs, setShowSpecs] = useState<string | null>(null);

  const sortedVacuums = [...initialVacuums].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'suction':
        comparison = a.specs.suction - b.specs.suction;
        break;
      case 'batteryLife':
        comparison = a.specs.batteryLife - b.specs.batteryLife;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-4 text-left">Model</th>
            <th className="p-4 text-left">Condition</th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('price')}>
              <div className="flex items-center">
                Price
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('suction')}>
              <div className="flex items-center">
                Suction Power
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </th>
            <th className="p-4">Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedVacuums.map((vacuum) => (
            <React.Fragment key={vacuum.id}>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={vacuum.imageUrl}
                      alt={vacuum.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <div className="font-medium">{vacuum.name}</div>
                      <div className="text-sm text-gray-500">{vacuum.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    vacuum.condition === 'new' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {vacuum.condition.charAt(0).toUpperCase() + vacuum.condition.slice(1)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="font-medium">${vacuum.price}</div>
                  {vacuum.previousPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      ${vacuum.previousPrice}
                    </div>
                  )}
                </td>
                <td className="p-4">{vacuum.specs.suction} Pa</td>
                <td className="p-4">
                  <button
                    onClick={() => setShowSpecs(showSpecs === vacuum.id ? null : vacuum.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </td>
              </tr>
              {showSpecs === vacuum.id && (
                <tr className="bg-gray-50">
                  <td colSpan={5} className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Battery Life</div>
                        <div className="font-medium">{vacuum.specs.batteryLife} min</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Dust Bin</div>
                        <div className="font-medium">{vacuum.specs.dustBinCapacity} ml</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Noise Level</div>
                        <div className="font-medium">{vacuum.specs.noiseLevel} dB</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Height</div>
                        <div className="font-medium">{vacuum.specs.height} mm</div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <a
                        href={vacuum.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View on Amazon
                      </a>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
