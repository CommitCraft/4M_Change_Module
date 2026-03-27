import toast from 'react-hot-toast';
import React from 'react';

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  if (message === 'Action cancelled by user') return;
  toast.error(message);
};

export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

export const showWarning = (message) => {
  toast((t) =>
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement('span', null, '⚠️'),
      React.createElement('span', null, message)
    )
  , {
    duration: 4000,
  });
};

export const showLoading = (message) => {
  return toast.loading(message);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
