import { storage } from '../services/storageService.js';

export const getPatients = async (req, res) => {
  try {
    const { search, admissionStatus, gender } = req.query;
    const patients = await storage.getPatients({ search, admissionStatus, gender });
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await storage.getPatientById(id);
    if (!patient) {
      return res.status(404).json({ error: `Patient ${id} not found.` });
    }

    // Attach patient admission history
    const allAdmissions = await storage.getAdmissions({ patientId: id });
    res.json({
      ...patient,
      admissionHistory: allAdmissions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      age,
      gender,
      phone,
      email,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
      medicalHistory
    } = req.body;

    // Field validations
    const errors = [];
    if (!name || !name.trim()) errors.push('Patient full name is required.');
    if (!dateOfBirth) errors.push('Date of birth is required.');
    if (age === undefined || age === null || isNaN(age)) errors.push('Valid age is required.');
    if (!gender) errors.push('Gender selection is required.');
    if (!phone || !phone.trim()) errors.push('Primary contact phone number is required.');
    if (!address || !address.trim()) errors.push('Residential address is required.');
    if (!emergencyContact || !emergencyContact.name || !emergencyContact.phone) {
      errors.push('Emergency contact name and phone number are required.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const created = await storage.createPatient(req.body);
    res.status(201).json({
      success: true,
      message: `Patient ${created.name} registered successfully with ID ${created.patientId}.`,
      patient: created
    });
  } catch (err) {
    console.error('Error creating patient:', err);
    res.status(400).json({ error: err.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await storage.updatePatient(id, req.body);
    res.json({
      success: true,
      message: `Patient ${updated.name} (${id}) updated successfully.`,
      patient: updated
    });
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(400).json({ error: err.message });
  }
};
