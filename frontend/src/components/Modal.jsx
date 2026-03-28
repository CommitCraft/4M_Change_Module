import React from 'react';

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
