import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiLink, FiPercent, FiTag, FiAlertCircle, FiInfo } from 'react-icons/fi';

const ABTestingForm = ({ variants, setVariants }) => {
  const [totalWeight, setTotalWeight] = useState(100);
  
  useEffect(() => {
    // Calculate total weight whenever variants change
    const sum = variants.reduce((sum, v) => sum + Number(v.weight), 0);
    setTotalWeight(sum);
  }, [variants]);

  // Add a new variant
  const addVariant = () => {
    // Calculate default weight based on existing variants
    const currentVariantsCount = variants.length;
    const defaultWeight = currentVariantsCount === 0 ? 50 : Math.floor(100 / (currentVariantsCount + 1));
    
    // Adjust weights of existing variants to make room for the new one
    const updatedVariants = variants.map(variant => ({
      ...variant,
      weight: Math.floor(Number(variant.weight) * (100 - defaultWeight) / 100)
    }));
    
    // Add the new variant
    setVariants([
      ...updatedVariants,
      {
        name: `Variant ${String.fromCharCode(65 + currentVariantsCount)}`, // A, B, C, etc.
        destination_url: '',
        weight: defaultWeight
      }
    ]);
  };
  
  // Remove a variant
  const removeVariant = (index) => {
    if (variants.length <= 2) {
      alert('A/B testing requires at least two variants.');
      return;
    }
    
    const removedWeight = Number(variants[index].weight);
    const remainingVariants = variants.filter((_, i) => i !== index);
    
    // Redistribute the removed weight proportionally
    const totalRemainingWeight = remainingVariants.reduce((sum, v) => sum + Number(v.weight), 0);
    
    const updatedVariants = remainingVariants.map(variant => ({
      ...variant,
      weight: totalRemainingWeight === 0 
        ? Math.floor(100 / remainingVariants.length) 
        : Math.floor(Number(variant.weight) + (Number(variant.weight) / totalRemainingWeight) * removedWeight)
    }));
    
    // Ensure weights sum to 100
    const weightSum = updatedVariants.reduce((sum, v) => sum + Number(v.weight), 0);
    if (weightSum !== 100 && updatedVariants.length > 0) {
      // Add any remaining weight to the first variant
      updatedVariants[0].weight += (100 - weightSum);
    }
    
    setVariants(updatedVariants);
  };
  
  // Handle variant changes
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    
    // If weight is changed, ensure weights sum to 100
    if (field === 'weight') {
      const numValue = parseInt(value, 10) || 0;
      updatedVariants[index].weight = numValue;
      
      // Calculate the total weight excluding the current variant
      const otherVariantsWeight = variants.reduce((sum, v, i) => 
        i === index ? sum : sum + Number(v.weight), 0);
      
      // If total exceeds 100, adjust the current variant
      if (otherVariantsWeight + numValue > 100) {
        updatedVariants[index].weight = 100 - otherVariantsWeight;
      }
      
      // If total is less than 100, add the remainder to the next variant
      if (otherVariantsWeight + numValue < 100) {
        const remainder = 100 - (otherVariantsWeight + numValue);
        
        // Find the next variant (or the first if we're at the end)
        const nextIndex = (index + 1) % variants.length;
        if (nextIndex !== index) {
          updatedVariants[nextIndex].weight += remainder;
        }
      }
    }
    
    setVariants(updatedVariants);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-dark-800">A/B Testing Variants</h3>
          <p className="text-sm text-dark-500">Create multiple destination URLs and split traffic between them</p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="text-sm text-primary-600 flex items-center focus:outline-none hover:text-primary-700"
        >
          <FiPlus className="mr-1 h-4 w-4" /> Add Variant
        </button>
      </div>
      
      {totalWeight !== 100 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-center">
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          <span>Variant weights must sum to 100% (current: {totalWeight}%)</span>
        </div>
      )}
      
      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-dark-700 flex items-center">
                {variant.name || `Variant ${index + 1}`}
                {index === 0 && (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-800 py-0.5 px-2 rounded-full">Control</span>
                )}
              </h4>
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-500 hover:text-red-700"
                disabled={variants.length <= 2}
              >
                <FiTrash2 />
              </button>
            </div>
            
            <div>
              <label htmlFor={`variant-name-${index}`} className="block text-sm font-medium text-dark-700 mb-1">
                <FiTag className="inline mr-1" /> Variant Name
              </label>
              <input
                type="text"
                id={`variant-name-${index}`}
                value={variant.name}
                onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                placeholder={`Variant ${String.fromCharCode(65 + index)}`}
                className="input w-full py-2"
              />
            </div>
            
            <div>
              <label htmlFor={`destination-url-${index}`} className="block text-sm font-medium text-dark-700 mb-1">
                <FiLink className="inline mr-1" /> Destination URL
              </label>
              <input
                type="url"
                id={`destination-url-${index}`}
                value={variant.destination_url}
                onChange={(e) => handleVariantChange(index, 'destination_url', e.target.value)}
                placeholder="https://example.com"
                className="input w-full py-2"
                required
              />
              {index === 0 && !variant.destination_url && (
                <p className="mt-1 text-xs text-dark-500">
                  <FiInfo className="inline mr-1" /> The first variant will use the original URL if left empty
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor={`weight-${index}`} className="block text-sm font-medium text-dark-700 mb-1 flex justify-between">
                <span><FiPercent className="inline mr-1" /> Traffic Weight (%)</span>
                <span className="text-dark-500">{variant.weight}%</span>
              </label>
              <input
                type="range"
                id={`weight-${index}`}
                value={variant.weight}
                onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                min="1"
                max="99"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${index === 0 ? 'bg-primary-500' : 'bg-secondary-500'}`}
                  style={{ width: `${variant.weight}%` }}
                ></div>
              </div>
              <div className="mt-1 flex justify-between">
                <input
                  type="number"
                  value={variant.weight}
                  onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                  min="1"
                  max="99"
                  className="input w-16 py-1 text-sm"
                />
                <span className="text-xs text-dark-500 self-center">
                  {variant.weight < 10 ? 'Low traffic' : variant.weight > 40 ? 'High traffic' : 'Medium traffic'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-dark-500 flex justify-between items-center pt-2">
        <span>Total variants: {variants.length}</span>
        <span className={totalWeight !== 100 ? "text-red-500 font-medium" : "text-accent-500"}>
          Total weight: {totalWeight}%
        </span>
      </div>
    </div>
  );
};

export default ABTestingForm; 