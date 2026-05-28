import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-warm-bg dark:bg-darkTheme-bg text-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-6 text-brand-dark dark:text-brand">
          <FiAlertTriangle className="w-24 h-24 mx-auto" />
        </div>
        <h1 className="text-5xl font-bold text-warm-text dark:text-darkTheme-textPrimary mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-warm-text dark:text-darkTheme-textPrimary mb-3">
          Page Not Found
        </h2>
        <p className="text-warm-muted dark:text-darkTheme-textSecondary mb-8">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-warm-sidebar font-semibold rounded-lg shadow-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark transition-colors"
        >
          <FiHome className="w-5 h-5" />
          <span>Go to Homepage</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
