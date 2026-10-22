import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'teal', trend = null, onClick }) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      iconBg: 'bg-teal-500 text-white',
      border: 'border-teal-100 hover:border-teal-300',
      text: 'text-teal-900'
    },
    sage: {
      bg: 'bg-sage-50',
      iconBg: 'bg-sage-400 text-slate-800',
      border: 'border-sage-200 hover:border-sage-300',
      text: 'text-slate-800'
    },
    emerald: {
      bg: 'bg-emerald-50/60',
      iconBg: 'bg-emerald-500 text-white',
      border: 'border-emerald-100 hover:border-emerald-300',
      text: 'text-emerald-950'
    },
    rose: {
      bg: 'bg-rose-50/60',
      iconBg: 'bg-rose-500 text-white',
      border: 'border-rose-100 hover:border-rose-300',
      text: 'text-rose-950'
    },
    amber: {
      bg: 'bg-amber-50/60',
      iconBg: 'bg-amber-500 text-white',
      border: 'border-amber-100 hover:border-amber-300',
      text: 'text-amber-950'
    },
    blue: {
      bg: 'bg-blue-50/60',
      iconBg: 'bg-blue-500 text-white',
      border: 'border-blue-100 hover:border-blue-300',
      text: 'text-blue-950'
    }
  };

  const c = colorMap[color] || colorMap.teal;

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white rounded-xl border p-5 shadow-soft transition-all duration-200 hover:shadow-card ${c.border} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-800">{value}</span>
            {trend && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shadow-sm ${c.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
