import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Custom hook to access the auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth; 