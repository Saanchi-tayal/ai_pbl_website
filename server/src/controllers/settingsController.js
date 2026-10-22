import { storage } from '../services/storageService.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await storage.getHospitalSettings();
    const departments = await storage.getDepartments();
    const doctors = await storage.getDoctors();
    const wards = await storage.getWards();
    const status = storage.getStorageStatus();

    res.json({
      settings,
      departments,
      doctors,
      wards,
      storageStatus: status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const updated = await storage.updateHospitalSettings(req.body);
    res.json({
      success: true,
      message: 'Hospital configuration settings updated.',
      settings: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const addDepartment = async (req, res) => {
  try {
    const { name, headOfDepartment, description, phoneExtension } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required.' });
    }
    const created = await storage.addDepartment(req.body);
    res.status(201).json({
      success: true,
      message: `Department '${created.name}' created successfully.`,
      department: created
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const addDoctor = async (req, res) => {
  try {
    const { name, specialization, department, phone, email, qualification } = req.body;
    if (!name || !specialization || !department) {
      return res.status(400).json({ error: 'Name, specialization, and department are required.' });
    }
    const created = await storage.addDoctor(req.body);
    res.status(201).json({
      success: true,
      message: `Doctor '${created.name}' onboarded successfully.`,
      doctor: created
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const resetSampleData = async (req, res) => {
  try {
    const result = await storage.resetToSampleData();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
