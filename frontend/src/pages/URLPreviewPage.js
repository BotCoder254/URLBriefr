import React from 'react';

const URLPreviewPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-xl font-semibold">URL Preview</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Destination Preview</h2>
            <p>URL preview content will appear here</p>
          </div>
        </div>
      </main>
      
      <footer className="bg-white py-3 text-center text-sm text-dark-400">
        <p>Powered by URLBriefr</p>
      </footer>
    </div>
  );
};

export default URLPreviewPage; 