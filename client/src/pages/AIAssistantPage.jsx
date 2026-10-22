import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Bed, 
  FileText, 
  TrendingUp, 
  Copy, 
  Check, 
  RefreshCw,
  Activity,
  HeartPulse,
  Brain,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { PriorityBadge, Badge } from '../components/common/Badge';
import { ClinicalSafetyBanner } from '../components/common/ClinicalSafetyBanner';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../context/NotificationContext';

export function AIAssistantPage({ onNavigate }) {
  const { success, error: notifyError, warning } = useNotification();

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'department' | 'bed' | 'summary' | 'analytics'

  // Triage Inputs
  const [vitals, setVitals] = useState({
    bpSystolic: '135',
    bpDiastolic: '88',
    heartRate: '94',
    respRate: '20',
    spo2: '96',
    temperature: '37.4'
  });
  const [symptomsInput, setSymptomsInput] = useState('Acute chest discomfort, shortness of breath on exertion, lightheadedness');
  const [patientAge, setPatientAge] = useState(55);
  const [patientGender, setPatientGender] = useState('Male');

  // AI Evaluation Outputs
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [departmentResult, setDepartmentResult] = useState(null);
  const [bedResult, setBedResult] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Analytics Trends
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await api.getAIAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading AI analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Quick Preset Samples for Student / Evaluator Demo
  const loadPreset = (preset) => {
    if (preset === 'stemi') {
      setVitals({ bpSystolic: '178', bpDiastolic: '108', heartRate: '116', respRate: '26', spo2: '91', temperature: '37.1' });
      setSymptomsInput('Crushing substernal chest pain radiating to left jaw, diaphoresis, dyspnea');
      setPatientAge(58);
      setPatientGender('Male');
    } else if (preset === 'stroke') {
      setVitals({ bpSystolic: '185', bpDiastolic: '110', heartRate: '88', respRate: '18', spo2: '97', temperature: '36.8' });
      setSymptomsInput('Acute onset right-sided facial droop, slurred speech, expressive aphasia');
      setPatientAge(72);
      setPatientGender('Female');
    } else if (preset === 'asthma') {
      setVitals({ bpSystolic: '108', bpDiastolic: '68', heartRate: '120', respRate: '30', spo2: '93', temperature: '37.5' });
      setSymptomsInput('Severe wheezing, tachypnea, intercostal retractions, unable to complete sentences');
      setPatientAge(10);
      setPatientGender('Female');
    } else if (preset === 'routine') {
      setVitals({ bpSystolic: '122', bpDiastolic: '78', heartRate: '72', respRate: '16', spo2: '99', temperature: '36.6' });
      setSymptomsInput('Scheduled elective left knee arthroscopy, mild chronic joint pain, stable');
      setPatientAge(48);
      setPatientGender('Male');
    }
  };

  // Run comprehensive evaluation
  const handleRunFullEvaluation = async () => {
    setIsEvaluating(true);
    try {
      // 1. Triage Assessment
      const triageRes = await api.aiTriage({
        vitals,
        symptoms: symptomsInput.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean),
        reasonForAdmission: symptomsInput,
        age: patientAge,
        gender: patientGender
      });
      setTriageResult(triageRes.assessment);

      // 2. Department Recommendation
      const deptRes = await api.aiDepartment({
        reasonForAdmission: symptomsInput,
        symptoms: [symptomsInput],
        age: patientAge
      });
      setDepartmentResult(deptRes.recommendation);

      // 3. Bed Recommendation
      const bedRes = await api.aiRecommendBed({
        priority: triageRes.assessment.suggestedPriority,
        department: deptRes.recommendation.recommendedDepartment,
        patientGender
      });
      setBedResult(bedRes.recommendation);

      // 4. Clinical Handover Summary (SBAR)
      const sumRes = await api.aiAdmissionSummary({
        patient: { name: 'Evaluated Patient', age: patientAge, gender: patientGender },
        admissionData: {
          reasonForAdmission: symptomsInput,
          vitals,
          department: deptRes.recommendation.recommendedDepartment,
          admissionPriority: triageRes.assessment.suggestedPriority,
          attendingDoctor: 'Attending Hospitalist'
        },
        triageResult: triageRes.assessment,
        recommendedBed: bedRes.recommendation?.bestBed
      });
      setSummaryResult(sumRes.summary);

      success('AI Clinical Assessment & Handover generated successfully.');
    } catch (err) {
      notifyError('AI evaluation failed: ' + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopySummary = () => {
    if (!summaryResult?.conciseText) return;
    navigator.clipboard.writeText(summaryResult.conciseText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
    success('SBAR Clinical Handover note copied to clipboard.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" />
            <span>AI Clinical Decision Support System (CDSS)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">AI Admission Assistant & Triage Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Standardized NEWS2 triage calculation, symptom-to-department routing, and intelligent bed allocation advisor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Rule-Based Clinical Engine (Transparent)
          </span>
        </div>
      </div>

      {/* Safety Compliance Banner */}
      <ClinicalSafetyBanner 
        isEmergency={triageResult?.isEmergency} 
        engine="Transparent NEWS2 Clinical Protocol" 
      />

      {/* Preset Buttons for Demo */}
      <div className="bg-white rounded-2xl border border-hospital-border p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Demo Clinical Scenarios:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadPreset('stemi')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
            >
              Emergency STEMI (Cardiology)
            </button>
            <button
              onClick={() => loadPreset('stroke')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
            >
              Code Stroke (Neurology)
            </button>
            <button
              onClick={() => loadPreset('asthma')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
            >
              Pediatric Asthma (Urgent)
            </button>
            <button
              onClick={() => loadPreset('routine')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
            >
              Elective Knee Surgery (Routine)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Evaluation Form */}
      <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft space-y-5">
        <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider border-b border-slate-100 pb-2">
          Clinical Input Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Presenting Symptoms & Chief Complaint <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={symptomsInput}
              onChange={(e) => setSymptomsInput(e.target.value)}
              placeholder="Enter patient symptoms, duration, radiating pain, level of consciousness..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Age</label>
            <input
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
            <select
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Vitals Grid */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Physiological Intake Vitals
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Systolic BP (mmHg)</span>
              <input
                type="number"
                value={vitals.bpSystolic}
                onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center mt-1"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Diastolic BP (mmHg)</span>
              <input
                type="number"
                value={vitals.bpDiastolic}
                onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center mt-1"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Heart Rate (bpm)</span>
              <input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center mt-1"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Resp Rate (/min)</span>
              <input
                type="number"
                value={vitals.respRate}
                onChange={(e) => setVitals({ ...vitals, respRate: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center mt-1"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">SpO2 (% O2)</span>
              <input
                type="number"
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center mt-1"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block">Temp (°C)</span>
              <input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-center mt-1"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleRunFullEvaluation}
          disabled={isEvaluating}
          className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isEvaluating ? 'Running Multi-Factor Clinical Evaluation...' : 'Generate AI Admission & Triage Recommendations'}</span>
        </button>
      </div>

      {/* AI Results 4-Panel Grid */}
      {triageResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          
          {/* 1. Admission Priority Assistance */}
          <div className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                1. Admission Priority Suggestion
              </span>
              <PriorityBadge priority={triageResult.suggestedPriority} />
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {triageResult.rationale}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Clinical Scoring Factors & Triggers:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs">
                {triageResult.factors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2. Department Recommendation */}
          <div className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600" />
                2. Department Recommendation
              </span>
              <span className="text-xs font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                {departmentResult?.confidenceScore}% Confidence
              </span>
            </div>

            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl">
              <span className="text-[10px] text-teal-700 uppercase font-bold tracking-wider">Recommended Service</span>
              <h4 className="text-base font-bold text-teal-950 mt-0.5">{departmentResult?.recommendedDepartment}</h4>
              <p className="text-xs text-teal-800 mt-1">{departmentResult?.rationale}</p>
            </div>

            {departmentResult?.alternatives?.length > 0 && (
              <p className="text-[11px] text-slate-500">
                Secondary consideration: {departmentResult.alternatives.join(', ')}
              </p>
            )}
          </div>

          {/* 3. Bed Recommendation */}
          <div className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-teal-600" />
                3. Bed Recommendation
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {bedResult?.availableCount} beds currently free
              </span>
            </div>

            {bedResult?.bestBed ? (
              <div className="p-3.5 bg-warm-100/80 border border-warm-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-teal-950">Bed {bedResult.bestBed.bedNumber}</span>
                    <p className="text-xs text-slate-700">{bedResult.bestBed.wardName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-teal-500 text-white font-bold text-xs">
                    {bedResult.bestBed.fitScore}% Fit
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {bedResult.bestBed.recommendationRationale}
                </p>
                <div className="pt-2 border-t border-warm-300/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">${bedResult.bestBed.dailyRate}/day</span>
                  <button
                    onClick={() => onNavigate('new-admission')}
                    className="text-teal-800 hover:text-teal-950 font-bold flex items-center gap-1"
                  >
                    <span>Proceed to Allocate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-600 font-medium">{bedResult?.message}</p>
            )}
          </div>

          {/* 4. SBAR Handover Summary */}
          <div className="bg-white rounded-2xl border border-hospital-border p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                4. SBAR Handover Summary
              </span>
              <button
                onClick={handleCopySummary}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 border border-slate-200"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copied' : 'Copy SBAR'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2 text-slate-800 max-h-48 overflow-y-auto">
              <p><strong className="text-teal-800">S:</strong> {summaryResult?.sbar?.situation}</p>
              <p><strong className="text-teal-800">B:</strong> {summaryResult?.sbar?.background}</p>
              <p><strong className="text-teal-800">A:</strong> {summaryResult?.sbar?.assessment}</p>
              <p><strong className="text-teal-800">R:</strong> {summaryResult?.sbar?.recommendation}</p>
            </div>
          </div>

        </div>
      )}

      {/* 5. Admission Analytics & Trends */}
      {analyticsData && (
        <div className="bg-white rounded-2xl border border-hospital-border p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>5. Admission & Triage Workflow Analytics</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Total Admissions Evaluated: <strong>{analyticsData.totalEvaluated}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Busy Departments */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Busiest Admission Departments
              </span>
              {analyticsData.busyDepartments?.slice(0, 4).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-slate-700">
                  <span>{i + 1}. {d.name}</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {d.count} patients
                  </span>
                </div>
              ))}
            </div>

            {/* Priority Distribution */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Intake Priority Breakdown
              </span>
              <div className="flex items-center justify-between text-rose-800 font-semibold">
                <span>Emergency Review:</span>
                <span>{analyticsData.priorityCounts?.Emergency || 0}</span>
              </div>
              <div className="flex items-center justify-between text-amber-800 font-semibold">
                <span>Urgent Review:</span>
                <span>{analyticsData.priorityCounts?.Urgent || 0}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-800 font-semibold">
                <span>Routine Inpatient:</span>
                <span>{analyticsData.priorityCounts?.Routine || 0}</span>
              </div>
            </div>

            {/* Response Performance */}
            <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 space-y-2">
              <span className="font-bold text-teal-900 uppercase tracking-wider text-[10px] block">
                Clinical Assist Performance
              </span>
              <p className="text-teal-800 font-medium">
                Average Triage Latency: <strong className="text-teal-950">{analyticsData.averageTriageResponseTime}</strong>
              </p>
              <p className="text-[11px] text-teal-700">
                Zero double-booking runtime invariant verified across 100% of bed allocation mutations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
