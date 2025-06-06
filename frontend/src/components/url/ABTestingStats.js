import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FiBarChart2, FiTrendingUp } from 'react-icons/fi';

const ABTestingStats = ({ variants }) => {
  if (!variants || variants.length === 0) {
    return null;
  }
  
  // Prepare data for the pie chart
  const trafficData = variants.map(variant => ({
    name: variant.name,
    value: variant.weight,
    color: getRandomColor(variant.name)
  }));
  
  // Prepare data for the clicks chart
  const clicksData = variants.map(variant => ({
    name: variant.name,
    value: variant.access_count,
    color: getRandomColor(variant.name)
  }));
  
  // Prepare data for the conversion chart if available
  const conversionData = variants
    .filter(variant => variant.conversion_count > 0)
    .map(variant => ({
      name: variant.name,
      value: variant.conversion_rate,
      color: getRandomColor(variant.name)
    }));
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-dark-800">A/B Testing Results</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Traffic Distribution */}
        <div className="bg-white rounded-xl shadow-soft p-4">
          <h4 className="text-base font-medium text-dark-800 mb-2">Traffic Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Clicks Distribution */}
        <div className="bg-white rounded-xl shadow-soft p-4">
          <h4 className="text-base font-medium text-dark-800 mb-2">Clicks Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clicksData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {clicksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} clicks`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Conversion Rate */}
        <div className="bg-white rounded-xl shadow-soft p-4">
          <h4 className="text-base font-medium text-dark-800 mb-2">Conversion Rate</h4>
          {conversionData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-dark-400">
              <FiTrendingUp className="h-8 w-8 mb-2" />
              <p>No conversion data yet</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed Stats Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                Variant
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                Destination URL
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                Traffic Weight
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                Clicks
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                Conversions
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                Conversion Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {variants.map((variant, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: getRandomColor(variant.name) }}></div>
                    <span className="font-medium text-dark-700">{variant.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="max-w-xs truncate text-sm text-dark-500">
                    <a href={variant.destination_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">
                      {variant.destination_url}
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-500">
                  {variant.weight}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-500">
                  {variant.access_count}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-500">
                  {variant.conversion_count}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-dark-500">
                  {variant.conversion_rate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper function to generate consistent colors based on variant name
function getRandomColor(name) {
  const colors = [
    '#0ea5e9', // blue
    '#10b981', // green
    '#f97316', // orange
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f43f5e', // red
    '#14b8a6', // teal
    '#f59e0b', // amber
  ];
  
  // Use the string to generate a consistent index
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export default ABTestingStats; 