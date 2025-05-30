import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import urlService from '../services/urlService';
import InactiveUrlModal from '../components/url/InactiveUrlModal';

const RedirectPage = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inactiveUrlInfo, setInactiveUrlInfo] = useState(null);
  
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        setLoading(true);
        const result = await urlService.checkUrlStatus(shortCode);
        
        // If we got a result with status 'error', the URL is inactive or expired
        if (result && result.status === 'error') {
          setInactiveUrlInfo(result);
        } else {
          // If we got here, something unexpected happened
          // The normal behavior would be a redirect from the backend
          setError('An unexpected error occurred. Please try again later.');
        }
      } catch (err) {
        console.error('Error checking URL status:', err);
        setError('Failed to check URL status. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAndRedirect();
  }, [shortCode, navigate]);
  
  const handleCloseModal = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-dark-500">Redirecting...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md w-full text-center">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 btn btn-primary"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {inactiveUrlInfo && (
        <InactiveUrlModal 
          urlInfo={inactiveUrlInfo} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default RedirectPage; 