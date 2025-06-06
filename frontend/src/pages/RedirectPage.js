import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import urlService from '../services/urlService';
import InactiveUrlModal from '../components/url/InactiveUrlModal';
import CustomRedirectPage from '../components/url/CustomRedirectPage';

const RedirectPage = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inactiveUrlInfo, setInactiveUrlInfo] = useState(null);
  const [redirectInfo, setRedirectInfo] = useState(null);
  
  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        setLoading(true);
        const result = await urlService.checkUrlStatus(shortCode);
        
        if (result) {
          if (result.status === 'error') {
            // URL is inactive or expired
            setInactiveUrlInfo(result);
          } else if (result.status === 'success' && result.redirect_type === 'custom') {
            // Custom redirect page is enabled
            setRedirectInfo({
              destinationUrl: result.destination_url,
              settings: result.redirect_settings
            });
          } else {
            // Direct redirect if no custom page
            window.location.href = result.destination_url || '/';
          }
        } else {
          // If we got here, something unexpected happened
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
  }, [shortCode]);
  
  const handleCloseModal = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-dark-500">Loading...</p>
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
  
  if (redirectInfo) {
    return <CustomRedirectPage 
      destinationUrl={redirectInfo.destinationUrl}
      settings={redirectInfo.settings}
    />;
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