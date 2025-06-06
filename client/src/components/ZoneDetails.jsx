import React from 'react';

export default function ZoneDetails({ zone, data }) {
  const getDemandLevel = (demand) => {
    if (demand > 100) return { label: 'High', color: 'bg-red-100 text-red-700' };
    if (demand > 50) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Low', color: 'bg-green-100 text-green-700' };
  };

  const demand = data?.demand;
  const demandLevel = demand !== undefined && demand !== 'N/A' ? getDemandLevel(demand) : null;

  return (
    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-800">
      <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">
        Zone ID: <span className="text-blue-600">{zone}</span>
      </h3>

      <div className="space-y-2 leading-relaxed">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-600">Predicted Demand:</span>
          <span className="text-gray-900">{demand !== undefined ? Math.round(demand) : 'N/A'}</span>
          {demandLevel && (
            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${demandLevel.color}`}>
              {demandLevel.label}
            </span>
          )}
        </div>

        <p>
          <span className="font-bold text-gray-600">Borough:</span>{' '}
          <span className="text-gray-900">{data?.borough ?? 'Unknown'}</span>
        </p>
        <p>
          <span className="font-bold text-gray-600">Zone Name:</span>{' '}
          <span className="text-gray-900">{data?.zoneName ?? 'Unknown'}</span>
        </p>
      </div>
    </div>
  );
}
