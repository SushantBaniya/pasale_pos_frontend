import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface ErrorPageProps {
  message?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ message }) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-warm-bg dark:bg-darkTheme-bg text-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-6 text-red-500">
          <FiAlertCircle className="w-24 h-24 mx-auto" />
        </div>
        <h1 className="text-4xl font-bold text-warm-text dark:text-darkTheme-textPrimary mb-4">
          Something Went Wrong
        </h1>
        <p className="text-warm-muted dark:text-darkTheme-textSecondary mb-8">
          {message || "We're sorry, but an unexpected error occurred. Please try again later."}
        </p>
        <button
          onClick={handleReload}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <FiRefreshCw className="w-5 h-5" />
          <span>Reload Page</span>
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
