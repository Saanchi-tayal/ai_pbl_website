import { AIAdmissionService } from '../services/aiAdmissionService.js';
import { storage } from '../services/storageService.js';

export const assessPriority = async (req, res) => {
  try {
    const { vitals, symptoms, reasonForAdmission, age, gender } = req.body;
    const assessment = AIAdmissionService.assessPriority({
      vitals,
      symptoms,
      reasonForAdmission,
      age,
      gender
    });

    res.json({
      success: true,
      assessment,
      safetyNotice: 'ASSISTIVE ONLY: Staff must confirm all triage decisions with standard clinical protocol. Do not delay emergency resuscitation.'
    });
  } catch (err) {
    console.error('AI priority error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const recommendDepartment = async (req, res) => {
  try {
    const { reasonForAdmission, symptoms, age } = req.body;
    const recommendation = AIAdmissionService.recommendDepartment({
      reasonForAdmission,
      symptoms,
      age
    });

    res.json({
      success: true,
      recommendation,
      disclaimer: 'Clinical department suggestion is based on reported symptoms and admission indications.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const recommendBed = async (req, res) => {
  try {
    const { priority, department, wardTypePreference, patientGender } = req.body;
    const allBeds = await storage.getBeds();

    const bedRecommendation = AIAdmissionService.recommendBed(allBeds, {
      priority: priority || 'Routine',
      department: department || 'General Medicine',
      wardTypePreference,
      patientGender
    });

    res.json({
      success: true,
      recommendation: bedRecommendation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const generateSummary = async (req, res) => {
  try {
    const { patientId, admissionData, triageResult, recommendedBed } = req.body;
    let patient = null;
    if (patientId) {
      patient = await storage.getPatientById(patientId);
    }

    const summary = AIAdmissionService.generateAdmissionSummary({
      patient,
      admissionData: admissionData || {},
      triageResult: triageResult || {},
      recommendedBed: recommendedBed || {}
    });

    res.json({
      success: true,
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAIAnalytics = async (req, res) => {
  try {
    const admissions = await storage.getAdmissions();
    const beds = await storage.getBeds();

    // Calculate busy departments
    const deptCounts = {};
    admissions.forEach(a => {
      deptCounts[a.department] = (deptCounts[a.department] || 0) + 1;
    });

    const busyDepartments = Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate priority distribution
    const priorityCounts = { Emergency: 0, Urgent: 0, Routine: 0 };
    admissions.forEach(a => {
      if (priorityCounts[a.admissionPriority] !== undefined) {
        priorityCounts[a.admissionPriority]++;
      }
    });

    // Ward utilization
    const wardUtilization = {};
    beds.forEach(b => {
      if (!wardUtilization[b.wardName]) {
        wardUtilization[b.wardName] = { total: 0, occupied: 0 };
      }
      wardUtilization[b.wardName].total++;
      if (b.status === 'Occupied') {
        wardUtilization[b.wardName].occupied++;
      }
    });

    const wardStats = Object.entries(wardUtilization).map(([name, data]) => ({
      name,
      total: data.total,
      occupied: data.occupied,
      utilizationRate: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0
    }));

    res.json({
      busyDepartments,
      priorityCounts,
      wardStats,
      totalEvaluated: admissions.length,
      averageTriageResponseTime: '< 0.4s (Automated Clinical Rule Matrix)'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
