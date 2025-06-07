import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiEdit2, 
  FiLock, 
  FiShield, 
  FiTrash2, 
  FiSave, 
  FiX, 
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiRefreshCw,
  FiGlobe,
  FiCalendar,
  FiMail,
  FiClock
} from 'react-icons/fi';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password2: ''
  });
  
  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await authService.getFullProfile();
        setUserProfile(profile);
        setProfileForm({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || ''
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load your profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save profile changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const updatedProfile = await authService.updateProfile(profileForm);
      setUserProfile(prev => ({
        ...prev,
        ...updatedProfile
      }));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.new_password2) {
      toast.error('New passwords do not match!');
      return;
    }
    
    try {
      setLoading(true);
      await authService.changePassword(passwordForm);
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password2: ''
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.response?.data?.current_password) {
        toast.error('Current password is incorrect.');
      } else {
        toast.error('Failed to change password.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== userProfile.email) {
      toast.error('Email confirmation does not match!');
      return;
    }
    
    try {
      setLoading(true);
      await authService.deleteAccount();
      toast.success('Your account has been deleted.');
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not available';
    }
  };
  
  if (loading && !userProfile) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header and Avatar */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center shadow-md">
                  <FiUser className="h-12 w-12 text-primary-600" />
                </div>
                {/* Account Active Indicator */}
                {userProfile?.is_active && (
                  <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center" title="Account Active">
                    <FiCheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <h1 className="text-3xl font-display font-bold text-dark-900">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </h1>
                  {userProfile?.is_active && (
                    <span className="ml-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                      <FiCheckCircle className="mr-1" /> Active
                    </span>
                  )}
                </div>
                <p className="text-dark-500 flex items-center">
                  <FiMail className="mr-1.5" /> {userProfile?.email}
                </p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary flex items-center"
              >
                <FiEdit2 className="mr-2" /> Edit Profile
              </button>
            )}
          </motion.div>

          {/* Last Login Card */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft overflow-hidden border-l-4 border-green-500">
            <div className="p-4 flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FiClock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-dark-900">Last Login</h3>
                <p className="text-dark-600">
                  {userProfile?.last_login 
                    ? formatDate(userProfile.last_login) 
                    : <span className="text-gray-500">No login history available</span>}
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* User Info and Edit Form */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft overflow-hidden">
            {isEditing ? (
              <form onSubmit={handleProfileSubmit} className="p-6">
                <h2 className="text-xl font-semibold text-dark-900 mb-4">Edit Profile</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-600 font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileForm.first_name}
                        onChange={handleProfileChange}
                        className="form-input w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-dark-600 font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={profileForm.last_name}
                        onChange={handleProfileChange}
                        className="form-input w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-dark-600 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      className="form-input w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex items-center space-x-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" /> Save Changes
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-ghost flex items-center"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileForm({
                        first_name: userProfile.first_name || '',
                        last_name: userProfile.last_name || '',
                        email: userProfile.email || ''
                      });
                    }}
                  >
                    <FiX className="mr-2" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-dark-900 mb-4">Account Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center text-dark-600 mb-1">
                      <FiMail className="mr-2" /> 
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <div className="text-dark-900">{userProfile?.email}</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center text-dark-600 mb-1">
                      <FiUser className="mr-2" /> 
                      <span className="text-sm font-medium">Full Name</span>
                    </div>
                    <div className="text-dark-900">{userProfile?.first_name} {userProfile?.last_name}</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center text-dark-600 mb-1">
                      <FiShield className="mr-2" /> 
                      <span className="text-sm font-medium">Account Role</span>
                    </div>
                    <div className="text-dark-900">
                      {userProfile?.role === 'ADMIN' ? (
                        <span className="bg-accent-100 text-accent-800 px-2 py-1 rounded-md text-xs font-medium">
                          Administrator
                        </span>
                      ) : (
                        <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs font-medium">
                          {userProfile?.role}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center text-dark-600 mb-1">
                      <FiGlobe className="mr-2" /> 
                      <span className="text-sm font-medium">IP Address</span>
                    </div>
                    <div className="text-dark-900">{userProfile?.ip_address || 'N/A'}</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center text-dark-600 mb-1">
                      <FiCalendar className="mr-2" /> 
                      <span className="text-sm font-medium">Member Since</span>
                    </div>
                    <div className="text-dark-900">{formatDate(userProfile?.date_joined)}</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center text-dark-600 mb-1">
                      <FiCheckCircle className="mr-2" /> 
                      <span className="text-sm font-medium">Account Status</span>
                    </div>
                    <div className="text-dark-900">
                      {userProfile?.is_active ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Security Settings */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft">
            <div className="border-b border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-dark-900 mb-2">Account Security</h2>
                <p className="text-dark-500">Manage your account security settings</p>
              </div>
            </div>
            
            {/* Password Change */}
            <div className="border-b border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-dark-800 mb-1">Change Password</h3>
                    <p className="text-dark-500 text-sm">Update your password for increased security</p>
                  </div>
                  
                  <button 
                    className="btn btn-ghost-primary flex items-center"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm ? (
                      <>
                        <FiX className="mr-2" /> Cancel
                      </>
                    ) : (
                      <>
                        <FiLock className="mr-2" /> Change
                      </>
                    )}
                  </button>
                </div>
                
                {showPasswordForm && (
                  <form onSubmit={handlePasswordSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-dark-600 font-medium mb-1 text-sm">Current Password</label>
                        <input
                          type="password"
                          name="current_password"
                          value={passwordForm.current_password}
                          onChange={handlePasswordChange}
                          className="form-input w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-dark-600 font-medium mb-1 text-sm">New Password</label>
                        <input
                          type="password"
                          name="new_password"
                          value={passwordForm.new_password}
                          onChange={handlePasswordChange}
                          className="form-input w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-dark-600 font-medium mb-1 text-sm">Confirm New Password</label>
                        <input
                          type="password"
                          name="new_password2"
                          value={passwordForm.new_password2}
                          onChange={handlePasswordChange}
                          className="form-input w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button 
                        type="submit" 
                        className="btn btn-primary w-full"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
            {/* Delete Account */}
            <div className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-dark-800 mb-1">Delete Account</h3>
                  <p className="text-dark-500 text-sm">Permanently delete your account and all associated data</p>
                </div>
                
                <button 
                  className="btn btn-danger flex items-center"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                >
                  {showDeleteConfirm ? (
                    <>
                      <FiX className="mr-2" /> Cancel
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="mr-2" /> Delete
                    </>
                  )}
                </button>
              </div>
              
              {showDeleteConfirm && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-start">
                    <FiAlertTriangle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <h4 className="text-red-700 font-medium mb-2">Warning: This action cannot be undone</h4>
                      <p className="text-red-600 text-sm mb-4">
                        Deleting your account will permanently remove all your data, including shortened URLs, 
                        analytics, and personal information. This action cannot be reversed.
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-red-700 font-medium mb-1 text-sm">
                          Confirm by typing your email: {userProfile?.email}
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          className="form-input w-full rounded-lg border border-red-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-150 flex items-center justify-center"
                        disabled={loading || deleteConfirmation !== userProfile?.email}
                        onClick={handleDeleteAccount}
                      >
                        {loading ? (
                          <>
                            <FiRefreshCw className="mr-2 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <FiTrash2 className="mr-2" /> Permanently Delete Account
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage; 