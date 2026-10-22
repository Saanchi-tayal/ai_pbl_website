import React from 'react';
import { AlertTriangle, ShieldCheck, Sparkles, Activity } from 'lucide-react';

export function ClinicalSafetyBanner({ isEmergency = false, engine = 'Rule-Based Clinical Triage Engine (NEWS2)' }) {
  if (isEmergency) {
    return (
      <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-4 shadow-soft my-3 text-rose-900 animate-pulse-subtle" role="alert">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-500 text-white rounded-lg flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide uppercase text-rose-800">
              CRITICAL EMERGENCY CLINICAL ALERT — IMMEDIATE ASSESSMENT REQUIRED
            </h4>
            <p className="text-xs mt-1 text-rose-700 leading-relaxed font-medium">
              High-acuity red flag vitals or symptoms detected. <strong>DO NOT DELAY EMERGENCY CARE</strong> while using this software. Transfer patient immediately to the Emergency Resuscitation Bay for direct evaluation by qualified medical personnel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3.5 my-3 text-teal-900 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-teal-500 text-white rounded-lg flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs flex-1 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-teal-900">
            <span>AI Clinical Decision Support Active</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-mono border border-teal-300">
              {engine}
            </span>
          </div>
          <p className="text-teal-700 mt-0.5">
            All AI-assisted triage scores, ward recommendations, and admission summaries are advisory suggestions for authorized staff. Final admission and triage decisions must always be made by licensed healthcare clinicians.
          </p>
        </div>
      </div>
    </div>
  );
}
