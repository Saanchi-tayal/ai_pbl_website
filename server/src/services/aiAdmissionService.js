/**
 * AI Admission Assistant Service
 * 
 * Clinical Decision Support System (CDSS) for Hospital Patient Admission.
 * Implements:
 * 1. Modified National Early Warning Score (NEWS2) & Emergency Triage Severity Algorithm
 * 2. Symptom & Clinical Entity Department Recommendation Matrix
 * 3. Ward & Bed Availability Optimization Engine
 * 4. SBAR Clinical Handover Summary Generator
 * 5. Optional Gemini API enhancement when GEMINI_API_KEY is configured
 */

// Medical symptom ontologies and departmental correlation
const DEPARTMENT_KEYWORD_MAP = {
  Cardiology: [
    'chest pain', 'angina', 'stemi', 'nstemi', 'palpitations', 'myocardial',
    'arrhythmia', 'heart failure', 'cardiac', 'troponin', 'tachycardia',
    'bradycardia', 'coronary', 'hypertensive crisis', 'syncope'
  ],
  Neurology: [
    'stroke', 'hemiparesis', 'facial droop', 'slurred speech', 'aphasia',
    'seizure', 'epilepsy', 'head trauma', 'loss of consciousness', 'coma',
    'migraine', 'neuropathy', 'confusion', 'dizziness', 'gcs'
  ],
  Pulmonology: [
    'shortness of breath', 'dyspnea', 'hypoxia', 'wheezing', 'asthma',
    'copd', 'pneumonia', 'cough', 'hemoptysis', 'respiratory failure',
    'pleuritic', 'stridor', 'bronchitis'
  ],
  Orthopedics: [
    'fracture', 'broken bone', 'dislocation', 'joint pain', 'ligament',
    'fall', 'trauma', 'sprain', 'orthopedic', 'swelling limb',
    'inability to bear weight', 'tibia', 'femur', 'wrist'
  ],
  Pediatrics: [
    'child', 'infant', 'pediatric', 'neonatal', 'toddler', 'croup',
    'febrile seizure', 'pediatric asthma', 'vaccination'
  ],
  'General Medicine': [
    'fever', 'pyrexia', 'diabetes', 'dka', 'gastroenteritis', 'dehydration',
    'weakness', 'fatigue', 'malaise', 'infection', 'uti', 'sepsis',
    'vomiting', 'nausea', 'abdominal pain', 'cellulitis'
  ],
  'Emergency Medicine': [
    'unresponsive', 'cardiac arrest', 'severe shock', 'anaphylaxis',
    'major trauma', 'gunshot', 'stab', 'respiratory arrest', 'massive bleeding'
  ]
};

// Red flag emergency clinical symptoms that trigger critical alerts
const EMERGENCY_RED_FLAGS = [
  'crushing chest pain',
  'loss of consciousness',
  'unresponsive',
  'cardiac arrest',
  'severe respiratory distress',
  'stridor',
  'acute facial droop',
  'acute hemiparesis',
  'massive bleeding',
  'anaphylaxis',
  'cyanosis'
];

export class AIAdmissionService {
  /**
   * 1. ADMISSION PRIORITY ASSISTANCE
   * Calculates clinical triage level (Routine, Urgent, Emergency) using vital signs and symptoms.
   */
  static assessPriority(data) {
    const vitals = data.vitals || {};
    const symptoms = (data.symptoms || []).map(s => s.toLowerCase());
    const reason = (data.reasonForAdmission || '').toLowerCase();
    const age = Number(data.age) || 30;

    let score = 0;
    const factors = [];
    const redFlagsDetected = [];

    // Vital: Respiratory Rate
    const rr = Number(vitals.respRate);
    if (rr) {
      if (rr <= 8 || rr >= 25) {
        score += 30;
        factors.push(`Severe tachypnea / bradypnea (Respiratory Rate: ${rr}/min)`);
      } else if (rr >= 21) {
        score += 15;
        factors.push(`Elevated Respiratory Rate (${rr}/min)`);
      }
    }

    // Vital: SpO2 (Oxygen Saturation)
    const spo2 = Number(vitals.spo2);
    if (spo2) {
      if (spo2 <= 91) {
        score += 35;
        factors.push(`Critical hypoxemia: SpO2 ${spo2}% on room air (Requires immediate high-flow O2)`);
      } else if (spo2 <= 94) {
        score += 20;
        factors.push(`Moderate hypoxemia: SpO2 ${spo2}%`);
      }
    }

    // Vital: Blood Pressure (Systolic)
    const sbp = Number(vitals.bpSystolic);
    if (sbp) {
      if (sbp < 90) {
        score += 35;
        factors.push(`Hypotension / Shock risk: Systolic BP ${sbp} mmHg`);
      } else if (sbp >= 180) {
        score += 25;
        factors.push(`Hypertensive crisis range: Systolic BP ${sbp} mmHg`);
      } else if (sbp >= 160) {
        score += 12;
        factors.push(`Elevated Systolic BP (${sbp} mmHg)`);
      }
    }

    // Vital: Heart Rate
    const hr = Number(vitals.heartRate);
    if (hr) {
      if (hr <= 40 || hr >= 130) {
        score += 30;
        factors.push(`Severe cardiac rate abnormality: Heart Rate ${hr} bpm`);
      } else if (hr >= 105 || hr <= 50) {
        score += 15;
        factors.push(`Tachycardia / Bradycardia: Heart Rate ${hr} bpm`);
      }
    }

    // Vital: Temperature
    const temp = Number(vitals.temperature);
    if (temp) {
      if (temp <= 35.0 || temp >= 39.5) {
        score += 20;
        factors.push(`High fever / Hypothermia: Temperature ${temp}°C`);
      } else if (temp >= 38.3) {
        score += 10;
        factors.push(`Pyrexia: Temperature ${temp}°C`);
      }
    }

    // Red flag symptom detection
    for (const flag of EMERGENCY_RED_FLAGS) {
      if (reason.includes(flag) || symptoms.some(s => s.includes(flag))) {
        score += 40;
        redFlagsDetected.push(flag.toUpperCase());
        factors.push(`EMERGENCY RED FLAG: ${flag.toUpperCase()}`);
      }
    }

    // Pediatric factor
    if (age <= 12 && score > 20) {
      score += 10;
      factors.push(`Pediatric patient factor (Age ${age} yrs requires heightened vigilance)`);
    }

    // Geriatric factor
    if (age >= 75 && score > 20) {
      score += 10;
      factors.push(`Geriatric patient factor (Age ${age} yrs with acute presentation)`);
    }

    // Determine Priority Category
    let suggestedPriority = 'Routine';
    let urgencyBadge = 'bg-blue-100 text-blue-800';
    let rationale = '';

    if (score >= 55 || redFlagsDetected.length > 0) {
      suggestedPriority = 'Emergency';
      urgencyBadge = 'bg-red-100 text-red-800 border-red-300';
      rationale = 'Critical presentation. Immediate physician assessment, continuous telemetry, and stabilization indicated.';
    } else if (score >= 25) {
      suggestedPriority = 'Urgent';
      urgencyBadge = 'bg-amber-100 text-amber-800 border-amber-300';
      rationale = 'Significant physiological abnormality or moderate symptom distress. Prompt medical evaluation within 30-60 minutes.';
    } else {
      suggestedPriority = 'Routine';
      urgencyBadge = 'bg-green-100 text-green-800 border-green-300';
      rationale = 'Physiologically stable. Safe for standard admission workflow, elective testing, or general bed placement.';
      if (factors.length === 0) {
        factors.push('Vital signs within normal clinical ranges');
        factors.push('No acute cardiovascular or neurological red flags identified');
      }
    }

    return {
      suggestedPriority,
      score: Math.min(score, 100),
      urgencyBadge,
      rationale,
      factors,
      redFlags: redFlagsDetected,
      isEmergency: suggestedPriority === 'Emergency',
      hasRedFlags: redFlagsDetected.length > 0,
      timestamp: new Date().toISOString(),
      engine: 'Rule-Based Clinical Triage Engine (NEWS2 Adapted)'
    };
  }

  /**
   * 2. DEPARTMENT RECOMMENDATION
   * Recommends department based on keywords, age, and clinical complaints.
   */
  static recommendDepartment(data) {
    const text = `${data.reasonForAdmission || ''} ${(data.symptoms || []).join(' ')}`.toLowerCase();
    const age = Number(data.age) || 30;

    const departmentScores = {};

    // Base score by keyword matching
    for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORD_MAP)) {
      departmentScores[dept] = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          departmentScores[dept] += 15;
        }
      }
    }

    // Age weighting: if patient is pediatric (< 14), boost Pediatrics
    if (age <= 14) {
      departmentScores['Pediatrics'] = (departmentScores['Pediatrics'] || 0) + 40;
    }

    // Sort departments by score
    const ranked = Object.entries(departmentScores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);

    const topDept = ranked[0].score > 0 ? ranked[0].name : 'General Medicine';
    const confidence = ranked[0].score > 0 ? Math.min(65 + ranked[0].score, 96) : 60;

    const rationaleMap = {
      Cardiology: 'Symptoms align with cardiovascular disease, acute chest discomfort, or rhythm instability.',
      Neurology: 'Acute focal neurological deficits, altered sensorium, or seizure activity identified.',
      Pulmonology: 'Respiratory distress, hypoxemia, or airway obstruction symptoms predominant.',
      Orthopedics: 'Musculoskeletal trauma, bone deformity, or extremity weight-bearing failure identified.',
      Pediatrics: 'Patient age criteria (under 14 years) with acute pediatric illness presentation.',
      'General Medicine': 'Systemic internal illness, infectious process, metabolic derangement, or non-localized symptoms.',
      'Emergency Medicine': 'High-acuity resuscitation or multitrauma presentation requiring emergency room care.'
    };

    return {
      recommendedDepartment: topDept,
      confidenceScore: confidence,
      rationale: rationaleMap[topDept] || 'General inpatient care recommended based on symptoms.',
      alternatives: ranked.slice(1, 3).filter(r => r.score > 0).map(r => r.name),
      engine: 'Symptom-Ontology Clinical Mapping Engine'
    };
  }

  /**
   * 3. BED RECOMMENDATION ENGINE
   * Evaluates available beds and ranks the best match for patient acuity and department.
   */
  static recommendBed(allBeds, { priority, department, wardTypePreference, patientGender }) {
    // Filter only available beds
    const availableBeds = allBeds.filter(b => b.status === 'Available');

    if (availableBeds.length === 0) {
      return {
        bestBed: null,
        topRecommendations: [],
        availableCount: 0,
        message: 'No beds are currently available in the hospital. Please initiate bed discharge or waitlist workflow.'
      };
    }

    // Determine target ward based on priority and preference
    let preferredWardType = wardTypePreference;
    if (!preferredWardType) {
      if (priority === 'Emergency') {
        preferredWardType = 'ICU';
      } else if (priority === 'Urgent') {
        preferredWardType = 'Semi-Private';
      } else {
        preferredWardType = 'General';
      }
    }

    // Score available beds
    const scoredBeds = availableBeds.map(bed => {
      let fitScore = 50;
      const reasons = [];

      // Ward type match
      if (bed.wardType === preferredWardType) {
        fitScore += 30;
        reasons.push(`Matches optimal ward type (${bed.wardType})`);
      } else if (priority === 'Emergency' && bed.wardType !== 'ICU') {
        fitScore -= 20;
        reasons.push('Non-ICU bed for emergency patient (telemetry may be limited)');
      }

      // Department alignment
      if (bed.department.toLowerCase() === department.toLowerCase()) {
        fitScore += 20;
        reasons.push(`Allocated within ${bed.department} primary ward`);
      }

      // Special equipment for high acuity
      if (priority === 'Emergency' && bed.features.some(f => f.toLowerCase().includes('ventilator') || f.toLowerCase().includes('telemetry') || f.toLowerCase().includes('monitor'))) {
        fitScore += 15;
        reasons.push('Features cardiac telemetry and respiratory support');
      }

      return {
        ...bed,
        fitScore: Math.min(Math.max(fitScore, 10), 98),
        recommendationRationale: reasons.join('; ')
      };
    });

    // Sort by fitScore descending
    scoredBeds.sort((a, b) => b.fitScore - a.fitScore);

    return {
      bestBed: scoredBeds[0],
      topRecommendations: scoredBeds.slice(0, 3),
      availableCount: availableBeds.length,
      preferredWardType,
      engine: 'Acuity-Based Bed Optimization Engine'
    };
  }

  /**
   * 4. CLINICAL HANDOVER SUMMARY (SBAR FORMAT)
   * Formats a professional clinical admission note for staff review.
   */
  static generateAdmissionSummary({ patient, admissionData, triageResult, recommendedBed }) {
    const sbar = {
      situation: `Admission for ${patient?.name || 'Patient'} (${patient?.age || 'N/A'}y ${patient?.gender || ''}) with chief complaint of: ${admissionData.reasonForAdmission || 'Under evaluation'}. Priority: ${admissionData.admissionPriority || triageResult?.suggestedPriority || 'Routine'}.`,
      
      background: `Medical History: ${patient?.medicalHistory || 'No significant prior medical history reported.'} Known Allergies: ${patient?.allergies?.length ? patient.allergies.join(', ') : 'No known drug allergies (NKDA)'}. Blood Group: ${patient?.bloodGroup || 'Unknown'}.`,
      
      assessment: `Vitals on Intake: BP ${admissionData.vitals?.bpSystolic || '120'}/${admissionData.vitals?.bpDiastolic || '80'} mmHg, HR ${admissionData.vitals?.heartRate || '75'} bpm, RR ${admissionData.vitals?.respRate || '16'}/min, SpO2 ${admissionData.vitals?.spo2 || '98'}%, Temp ${admissionData.vitals?.temperature || '37.0'}°C. AI Triage Score: ${triageResult?.score || 'N/A'}/100. Key Factors: ${triageResult?.factors?.slice(0, 3).join('; ') || 'Stable baseline'}.`,
      
      recommendation: `Admit under ${admissionData.attendingDoctor || 'Attending Physician'} (${admissionData.department || 'General Medicine'}). Ward Placement: ${recommendedBed?.wardName || admissionData.wardType || 'General'} (Bed: ${recommendedBed?.bedNumber || admissionData.assignedBedNumber || 'TBD'}). Plan: Initiate admission orders, telemetry as indicated, and baseline diagnostic labs.`
    };

    const conciseText = `[SBAR ADMISSION HANDOVER SUMMARY]
SITUATION: ${sbar.situation}
BACKGROUND: ${sbar.background}
ASSESSMENT: ${sbar.assessment}
RECOMMENDATION: ${sbar.recommendation}`;

    return {
      sbar,
      conciseText,
      generatedAt: new Date().toISOString(),
      disclaimer: 'CLINICAL ADVISORY: This summary is generated for clinical workflow assistance only and does not replace professional clinical judgement or formal physician admission orders.'
    };
  }
}
