import { storage } from '../services/storageService.js';

export const getAdmissions = async (req, res) => {
  try {
    const { status, department, priority, patientId, search } = req.query;
    const admissions = await storage.getAdmissions({ status, department, priority, patientId, search });
    res.json(admissions);
  } catch (err) {
    console.error('Error fetching admissions:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const admission = await storage.getAdmissionById(id);
    if (!admission) {
      return res.status(404).json({ error: `Admission record ${id} not found.` });
    }
    res.json(admission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAdmission = async (req, res) => {
  try {
    const {
      patientId,
      department,
      attendingDoctor,
      admissionPriority,
      assignedBedId,
      reasonForAdmission,
      wardType
    } = req.body;

    const errors = [];
    if (!patientId) errors.push('Please select a registered patient.');
    if (!department) errors.push('Hospital department selection is required.');
    if (!attendingDoctor) errors.push('Attending doctor must be specified.');
    if (!admissionPriority) errors.push('Admission priority is required.');
    if (!assignedBedId) errors.push('Bed allocation is required. An available bed must be selected.');
    if (!reasonForAdmission || !reasonForAdmission.trim()) {
      errors.push('Reason for admission / chief complaint must be documented.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Call storage service with atomic bed lock
    const admission = await storage.createAdmission(req.body);

    res.status(201).json({
      success: true,
      message: `Admission ${admission.admissionId} confirmed. Bed ${admission.assignedBedNumber} allocated to ${admission.patientName}.`,
      admission
    });
  } catch (err) {
    console.error('Admission creation error:', err.message);
    res.status(409).json({ error: err.message });
  }
};

export const dischargePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { dischargeDate, dischargeTime, dischargeSummary, dischargeCondition, performedBy } = req.body;

    const discharged = await storage.dischargePatient(id, {
      dischargeDate,
      dischargeTime,
      dischargeSummary,
      dischargeCondition,
      performedBy
    });

    res.json({
      success: true,
      message: `Patient ${discharged.patientName} discharged successfully. Bed ${discharged.assignedBedNumber} is now freed and available.`,
      admission: discharged
    });
  } catch (err) {
    console.error('Patient discharge error:', err.message);
    res.status(400).json({ error: err.message });
  }
};
