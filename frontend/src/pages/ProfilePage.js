import React from 'react';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';

const ProfilePage = () => {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-soft p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-primary-100 mb-6"
          >
            <FiUser className="h-12 w-12 text-primary-600" />
          </motion.div>
          
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-4">Profile Page</h1>
          <p className="text-xl text-dark-500 mb-8">
            User profile management is coming soon!
          </p>
          
          <div className="max-w-md mx-auto text-left p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-medium text-dark-800 mb-4">Planned Features:</h2>
            <ul className="list-disc pl-5 space-y-2 text-dark-600">
              <li>Update your profile information</li>
              <li>Change your password</li>
              <li>Manage account settings</li>
              <li>Customize URL preferences</li>
              <li>Connect social accounts</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage; 