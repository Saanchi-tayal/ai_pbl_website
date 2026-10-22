import React from 'react';

export function LoadingSpinner({ text = 'Loading clinical data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-500 mt-3">{text}</p>
    </div>
  );
}

export default LoadingSpinner;
