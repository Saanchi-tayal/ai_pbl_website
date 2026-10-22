import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-teal-50 text-teal-800 border border-teal-200',
    sage: 'bg-sage-100 text-sage-800 border border-sage-300',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',

    // Specific Healthcare Clinical Variants
    emergency: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold animate-pulse-subtle',
    urgent: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
    routine: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium',

    // Bed Statuses
    available: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    occupied: 'bg-rose-100 text-rose-800 border border-rose-300',
    maintenance: 'bg-amber-100 text-amber-800 border border-amber-300'
  };

  const chosenVariant = variantClasses[variant] || variantClasses.default;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]} ${chosenVariant} ${className}`}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = (priority || 'routine').toLowerCase();
  if (p === 'emergency') {
    return <Badge variant="emergency"><span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Emergency</Badge>;
  }
  if (p === 'urgent') {
    return <Badge variant="urgent"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Urgent</Badge>;
  }
  return <Badge variant="routine"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Routine</Badge>;
}

export function BedStatusBadge({ status }) {
  const s = (status || 'available').toLowerCase();
  if (s === 'occupied') {
    return <Badge variant="occupied"><span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Occupied</Badge>;
  }
  if (s === 'maintenance') {
    return <Badge variant="maintenance"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Maintenance</Badge>;
  }
  return <Badge variant="available"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Available</Badge>;
}
