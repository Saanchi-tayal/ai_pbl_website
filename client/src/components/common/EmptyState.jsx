import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  description = 'There are currently no items matching your criteria.',
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 my-4">
      <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500 hover:bg-teal-600 text-white transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ text = 'Loading clinical data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
      <p className="text-xs font-medium text-slate-500 mt-3">{text}</p>
    </div>
  );
}
