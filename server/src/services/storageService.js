import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  initialUsers,
  initialDepartments,
  initialDoctors,
  initialWards,
  initialBeds,
  initialPatients,
  initialAdmissions,
  initialActivityLogs,
  initialHospitalSettings
} from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'pams-data') : path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

class StorageService {
  constructor() {
    this.isMongoConnected = false;
    this.memoryStore = {
      users: [],
      departments: [],
      doctors: [],
      wards: [],
      beds: [],
      patients: [],
      admissions: [],
      activityLogs: [],
      hospitalSettings: {}
    };
    this.initLock = false;
  }

  async initialize() {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Try MongoDB connection if configured
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        console.log('Attempting MongoDB connection...');
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 2000
        });
        this.isMongoConnected = true;
        console.log('Connected to MongoDB successfully.');
      } catch (err) {
        this.isMongoConnected = false;
        console.log(`MongoDB connection not active (${err.message}). Using local persistent file storage.`);
      }
    }

    // Initialize local file store
    await this.loadOrSeedFileStore();
  }

  async loadOrSeedFileStore() {
    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryStore = { ...this.memoryStore, ...parsed };
        console.log(`Loaded existing data from ${STORE_FILE}`);
        return;
      } catch (err) {
        console.error('Error reading store.json, re-seeding:', err.message);
      }
    }

    // Seed default data
    await this.seedDefaultData();
  }

  async seedDefaultData() {
    console.log('Seeding initial clinical healthcare dataset...');
    // Hash user passwords for demo
    const hashedUsers = initialUsers.map(user => {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(user.password, salt);
      return {
        ...user,
        passwordHash: hashedPassword,
        password: user.password // keep plaintext convenience for demo inspect
      };
    });

    this.memoryStore = {
      users: hashedUsers,
      departments: [...initialDepartments],
      doctors: [...initialDoctors],
      wards: [...initialWards],
      beds: [...initialBeds],
      patients: [...initialPatients],
      admissions: [...initialAdmissions],
      activityLogs: [...initialActivityLogs],
      hospitalSettings: { ...initialHospitalSettings }
    };

    this.persistToFile();
    console.log('Seeding completed. Data saved to file.');
  }

  persistToFile() {
    try {
      const tempPath = `${STORE_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.memoryStore, null, 2), 'utf-8');
      fs.renameSync(tempPath, STORE_FILE);
    } catch (err) {
      console.error('Failed to write store.json:', err.message);
    }
  }

  getStorageStatus() {
    return {
      mode: this.isMongoConnected ? 'MongoDB (Live)' : 'Local File Storage (Active Demo Mode)',
      isMongoConnected: this.isMongoConnected,
      totalPatients: this.memoryStore.patients.length,
      totalBeds: this.memoryStore.beds.length,
      totalAdmissions: this.memoryStore.admissions.length,
      dataFile: STORE_FILE
    };
  }

  // USERS & AUTH
  async getUsers() {
    return this.memoryStore.users;
  }

  async findUserByEmail(email) {
    return this.memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(userId) {
    return this.memoryStore.users.find(u => u.userId === userId);
  }

  // PATIENTS
  async getPatients(filters = {}) {
    let list = [...this.memoryStore.patients];
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.patientId.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }
    if (filters.admissionStatus) {
      list = list.filter(p => p.admissionStatus === filters.admissionStatus);
    }
    if (filters.gender) {
      list = list.filter(p => p.gender === filters.gender);
    }
    // Sort newest first
    list.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
    return list;
  }

  async getPatientById(patientId) {
    return this.memoryStore.patients.find(p => p.patientId === patientId);
  }

  async createPatient(patientData) {
    // Generate next patient ID
    const count = this.memoryStore.patients.length + 1;
    const year = new Date().getFullYear();
    const formattedCount = String(count).padStart(3, '0');
    const patientId = `PAT-${year}-${formattedCount}`;

    const newPatient = {
      patientId,
      name: patientData.name.trim(),
      dateOfBirth: patientData.dateOfBirth,
      age: Number(patientData.age),
      gender: patientData.gender,
      phone: patientData.phone.trim(),
      email: patientData.email ? patientData.email.trim() : '',
      address: patientData.address.trim(),
      emergencyContact: {
        name: patientData.emergencyContact?.name || '',
        relation: patientData.emergencyContact?.relation || '',
        phone: patientData.emergencyContact?.phone || ''
      },
      bloodGroup: patientData.bloodGroup || 'Unknown',
      allergies: Array.isArray(patientData.allergies) ? patientData.allergies : [],
      medicalHistory: patientData.medicalHistory || '',
      registrationDate: new Date(),
      admissionStatus: 'Not Admitted',
      currentAdmissionId: null,
      currentBedId: null,
      assignedDoctor: null
    };

    this.memoryStore.patients.unshift(newPatient);
    
    // Add activity log
    await this.addActivityLog({
      action: 'PATIENT_REGISTERED',
      title: 'New Patient Registered',
      details: `${newPatient.name} registered with ID ${newPatient.patientId}.`,
      performedBy: patientData.registeredBy || 'Admin',
      role: 'Staff',
      targetId: newPatient.patientId
    });

    this.persistToFile();
    return newPatient;
  }

  async updatePatient(patientId, updateData) {
    const idx = this.memoryStore.patients.findIndex(p => p.patientId === patientId);
    if (idx === -1) {
      throw new Error(`Patient ${patientId} not found.`);
    }

    const current = this.memoryStore.patients[idx];
    const updated = {
      ...current,
      ...updateData,
      emergencyContact: {
        ...current.emergencyContact,
        ...(updateData.emergencyContact || {})
      },
      updatedAt: new Date()
    };

    this.memoryStore.patients[idx] = updated;

    await this.addActivityLog({
      action: 'PATIENT_UPDATED',
      title: 'Patient Record Updated',
      details: `Demographics and clinical profile updated for ${updated.name} (${patientId}).`,
      performedBy: updateData.updatedBy || 'Staff',
      role: 'Staff',
      targetId: patientId
    });

    this.persistToFile();
    return updated;
  }

  // BEDS & WARDS
  async getBeds(filters = {}) {
    let list = [...this.memoryStore.beds];
    if (filters.wardId) {
      list = list.filter(b => b.wardId === filters.wardId);
    }
    if (filters.wardType) {
      list = list.filter(b => b.wardType === filters.wardType);
    }
    if (filters.status) {
      list = list.filter(b => b.status === filters.status);
    }
    if (filters.department) {
      list = list.filter(b => b.department === filters.department);
    }
    return list;
  }

  async getBedById(bedId) {
    return this.memoryStore.beds.find(b => b.bedId === bedId);
  }

  async addBed(bedData) {
    const existing = this.memoryStore.beds.find(b => b.bedNumber.toLowerCase() === bedData.bedNumber.toLowerCase());
    if (existing) {
      throw new Error(`Bed with number ${bedData.bedNumber} already exists in the system.`);
    }

    const bedId = `BED-${bedData.wardType.toUpperCase().slice(0, 3)}-${bedData.bedNumber}`;
    const newBed = {
      bedId,
      bedNumber: bedData.bedNumber,
      wardId: bedData.wardId || 'WARD-GEN',
      wardName: bedData.wardName || 'General Medical Ward',
      wardType: bedData.wardType || 'General',
      floor: bedData.floor || '1st Floor',
      status: 'Available',
      currentPatientId: null,
      currentPatientName: null,
      currentAdmissionId: null,
      department: bedData.department || 'General Medicine',
      dailyRate: Number(bedData.dailyRate) || 1500,
      features: Array.isArray(bedData.features) ? bedData.features : [],
      lastCleaned: new Date(),
      maintenanceNotes: ''
    };

    this.memoryStore.beds.push(newBed);

    await this.addActivityLog({
      action: 'BED_ADDED',
      title: 'New Bed Commissioned',
      details: `Bed ${newBed.bedNumber} added to ${newBed.wardName}.`,
      performedBy: bedData.createdBy || 'Admin',
      role: 'Admin',
      targetId: newBed.bedId
    });

    this.persistToFile();
    return newBed;
  }

  async updateBed(bedId, updateData) {
    const idx = this.memoryStore.beds.findIndex(b => b.bedId === bedId);
    if (idx === -1) {
      throw new Error(`Bed ${bedId} not found.`);
    }

    const current = this.memoryStore.beds[idx];

    // If attempting to mark Maintenance when occupied, check
    if (updateData.status === 'Maintenance' && current.status === 'Occupied') {
      throw new Error(`Cannot place Bed ${current.bedNumber} into maintenance while it is occupied by a patient (${current.currentPatientName}). Please discharge or transfer the patient first.`);
    }

    // If changing status from Occupied to Available directly without discharge workflow, reject
    if (current.status === 'Occupied' && updateData.status === 'Available' && !updateData.forceRelease) {
      throw new Error(`Bed ${current.bedNumber} is occupied by patient ${current.currentPatientName}. Use the patient discharge workflow to release occupied beds.`);
    }

    const updated = {
      ...current,
      ...updateData,
      updatedAt: new Date()
    };

    this.memoryStore.beds[idx] = updated;

    await this.addActivityLog({
      action: 'BED_UPDATED',
      title: 'Bed Status Modified',
      details: `Bed ${updated.bedNumber} status updated to ${updated.status}. Notes: ${updated.maintenanceNotes || 'None'}`,
      performedBy: updateData.updatedBy || 'Staff',
      role: 'Staff',
      targetId: bedId
    });

    this.persistToFile();
    return updated;
  }

  async getWards() {
    return this.memoryStore.wards;
  }

  async getDepartments() {
    return this.memoryStore.departments;
  }

  async addDepartment(deptData) {
    const deptId = `DEP-${deptData.name.toUpperCase().replace(/\s+/g, '').slice(0, 5)}`;
    const newDept = {
      departmentId: deptId,
      name: deptData.name,
      headOfDepartment: deptData.headOfDepartment || '',
      description: deptData.description || '',
      phoneExtension: deptData.phoneExtension || '2000',
      totalDoctors: 0
    };
    this.memoryStore.departments.push(newDept);
    this.persistToFile();
    return newDept;
  }

  async getDoctors(filters = {}) {
    let list = [...this.memoryStore.doctors];
    if (filters.department) {
      list = list.filter(d => d.department === filters.department);
    }
    return list;
  }

  async addDoctor(docData) {
    const count = this.memoryStore.doctors.length + 1;
    const docId = `DOC-${String(count).padStart(3, '0')}`;
    const newDoc = {
      doctorId: docId,
      name: docData.name,
      specialization: docData.specialization,
      department: docData.department,
      qualification: docData.qualification || 'MBBS, MD',
      phone: docData.phone || '',
      email: docData.email || '',
      availableDays: docData.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      activeAdmissionsCount: 0,
      status: 'Available'
    };
    this.memoryStore.doctors.push(newDoc);
    this.persistToFile();
    return newDoc;
  }

  // ADMISSIONS WORKFLOW (WITH STRICT ATOMIC BED LOCKING)
  async getAdmissions(filters = {}) {
    let list = [...this.memoryStore.admissions];
    if (filters.status) {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters.department) {
      list = list.filter(a => a.department === filters.department);
    }
    if (filters.priority) {
      list = list.filter(a => a.admissionPriority === filters.priority);
    }
    if (filters.patientId) {
      list = list.filter(a => a.patientId === filters.patientId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(a => 
        a.admissionId.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.patientId.toLowerCase().includes(q) ||
        a.assignedBedNumber.toLowerCase().includes(q) ||
        a.attendingDoctor.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.admissionDate) - new Date(a.admissionDate));
    return list;
  }

  async getAdmissionById(admissionId) {
    return this.memoryStore.admissions.find(a => a.admissionId === admissionId);
  }

  /**
   * CRITICAL REQUIREMENT:
   * "Prevent allocation of an already occupied bed. Check bed availability before confirming admission.
   *  Do not allow an admission to be confirmed if the selected bed is unavailable."
   */
  async createAdmission(admissionData) {
    // 1. Verify Patient
    const patient = await this.getPatientById(admissionData.patientId);
    if (!patient) {
      throw new Error(`Patient ${admissionData.patientId} does not exist in registry.`);
    }

    if (patient.admissionStatus === 'Admitted') {
      throw new Error(`Patient ${patient.name} (${patient.patientId}) is ALREADY currently admitted in Bed ${patient.currentBedId} (Admission ${patient.currentAdmissionId}). Please discharge or transfer first.`);
    }

    // 2. ATOMIC BED CHECK & LOCK
    const bedIdx = this.memoryStore.beds.findIndex(b => b.bedId === admissionData.assignedBedId);
    if (bedIdx === -1) {
      throw new Error(`Selected Bed (${admissionData.assignedBedId}) does not exist in the hospital inventory.`);
    }

    const targetBed = this.memoryStore.beds[bedIdx];
    if (targetBed.status === 'Occupied') {
      throw new Error(`ALLOCATION CONFLICT: Bed ${targetBed.bedNumber} is ALREADY OCCUPIED by patient ${targetBed.currentPatientName || 'another patient'}. Please select an available bed.`);
    }

    if (targetBed.status === 'Maintenance') {
      throw new Error(`ALLOCATION REJECTED: Bed ${targetBed.bedNumber} is currently under maintenance (${targetBed.maintenanceNotes || 'Biomedical servicing'}).`);
    }

    // 3. Generate unique Admission ID
    const count = this.memoryStore.admissions.length + 1;
    const year = new Date().getFullYear();
    const formattedCount = String(count).padStart(3, '0');
    const admissionId = `ADM-${year}-${formattedCount}`;

    const newAdmission = {
      admissionId,
      patientId: patient.patientId,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      admissionDate: admissionData.admissionDate ? new Date(admissionData.admissionDate) : new Date(),
      admissionTime: admissionData.admissionTime || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      reasonForAdmission: admissionData.reasonForAdmission.trim(),
      symptoms: Array.isArray(admissionData.symptoms) ? admissionData.symptoms : [],
      vitals: {
        bpSystolic: Number(admissionData.vitals?.bpSystolic) || 120,
        bpDiastolic: Number(admissionData.vitals?.bpDiastolic) || 80,
        heartRate: Number(admissionData.vitals?.heartRate) || 75,
        respRate: Number(admissionData.vitals?.respRate) || 16,
        spo2: Number(admissionData.vitals?.spo2) || 98,
        temperature: Number(admissionData.vitals?.temperature) || 37.0,
        newsScore: Number(admissionData.vitals?.newsScore) || 0
      },
      department: admissionData.department,
      attendingDoctor: admissionData.attendingDoctor,
      doctorSpecialty: admissionData.doctorSpecialty || admissionData.department,
      admissionPriority: admissionData.admissionPriority || 'Routine',
      aiTriageAssessment: admissionData.aiTriageAssessment || {
        suggestedPriority: admissionData.admissionPriority || 'Routine',
        triageScore: 50,
        rationale: 'Assessed at registration.',
        factors: ['Routine clinical evaluation'],
        suggestedDepartment: admissionData.department,
        isAiAssisted: false
      },
      wardType: admissionData.wardType || targetBed.wardType,
      assignedBedId: targetBed.bedId,
      assignedBedNumber: targetBed.bedNumber,
      assignedWard: targetBed.wardName,
      admissionNotes: admissionData.admissionNotes || '',
      status: 'Admitted',
      dischargeDate: null,
      dischargeTime: null,
      dischargeSummary: null,
      dischargeCondition: null,
      createdBy: admissionData.createdBy || 'Admin'
    };

    // 4. ATOMICALLY UPDATE BED
    targetBed.status = 'Occupied';
    targetBed.currentPatientId = patient.patientId;
    targetBed.currentPatientName = patient.name;
    targetBed.currentAdmissionId = admissionId;
    this.memoryStore.beds[bedIdx] = targetBed;

    // 5. UPDATE PATIENT STATUS
    const pIdx = this.memoryStore.patients.findIndex(p => p.patientId === patient.patientId);
    if (pIdx !== -1) {
      this.memoryStore.patients[pIdx].admissionStatus = 'Admitted';
      this.memoryStore.patients[pIdx].currentAdmissionId = admissionId;
      this.memoryStore.patients[pIdx].currentBedId = targetBed.bedId;
      this.memoryStore.patients[pIdx].assignedDoctor = admissionData.attendingDoctor;
    }

    // 6. RECORD ADMISSION
    this.memoryStore.admissions.unshift(newAdmission);

    // 7. RECORD AUDIT LOG
    await this.addActivityLog({
      action: 'ADMISSION_CREATED',
      title: `${newAdmission.admissionPriority} Admission Confirmed`,
      details: `${patient.name} (${patient.patientId}) admitted to Bed ${targetBed.bedNumber} (${targetBed.wardName}) under ${newAdmission.attendingDoctor}.`,
      performedBy: admissionData.createdBy || 'Admin',
      role: 'Staff',
      targetId: admissionId
    });

    this.persistToFile();
    return newAdmission;
  }

  /**
   * DISCHARGE PATIENT WORKFLOW:
   * "On discharge:
   *  - Record discharge date and time
   *  - Update the admission status
   *  - Release the assigned bed
   *  - Preserve the admission history"
   */
  async dischargePatient(admissionId, dischargeDetails = {}) {
    const admissionIdx = this.memoryStore.admissions.findIndex(a => a.admissionId === admissionId);
    if (admissionIdx === -1) {
      throw new Error(`Admission record ${admissionId} not found.`);
    }

    const admission = this.memoryStore.admissions[admissionIdx];
    if (admission.status === 'Discharged') {
      throw new Error(`Admission ${admissionId} has already been discharged on ${admission.dischargeDate}.`);
    }

    const dischargeDate = dischargeDetails.dischargeDate ? new Date(dischargeDetails.dischargeDate) : new Date();
    const dischargeTime = dischargeDetails.dischargeTime || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dischargeSummary = dischargeDetails.dischargeSummary || 'Patient completed inpatient treatment course and is cleared for discharge.';
    const dischargeCondition = dischargeDetails.dischargeCondition || 'Recovered';

    // 1. Release assigned bed
    const bedIdx = this.memoryStore.beds.findIndex(b => b.bedId === admission.assignedBedId);
    let freedBedNumber = admission.assignedBedNumber;
    if (bedIdx !== -1) {
      this.memoryStore.beds[bedIdx].status = 'Available';
      this.memoryStore.beds[bedIdx].currentPatientId = null;
      this.memoryStore.beds[bedIdx].currentPatientName = null;
      this.memoryStore.beds[bedIdx].currentAdmissionId = null;
      this.memoryStore.beds[bedIdx].lastCleaned = new Date();
      freedBedNumber = this.memoryStore.beds[bedIdx].bedNumber;
    }

    // 2. Update Patient status
    const pIdx = this.memoryStore.patients.findIndex(p => p.patientId === admission.patientId);
    if (pIdx !== -1) {
      this.memoryStore.patients[pIdx].admissionStatus = 'Discharged';
      this.memoryStore.patients[pIdx].currentAdmissionId = null;
      this.memoryStore.patients[pIdx].currentBedId = null;
      this.memoryStore.patients[pIdx].assignedDoctor = null;
    }

    // 3. Update Admission record (preserving history)
    admission.status = 'Discharged';
    admission.dischargeDate = dischargeDate;
    admission.dischargeTime = dischargeTime;
    admission.dischargeSummary = dischargeSummary;
    admission.dischargeCondition = dischargeCondition;
    this.memoryStore.admissions[admissionIdx] = admission;

    // 4. Log Activity
    await this.addActivityLog({
      action: 'PATIENT_DISCHARGED',
      title: 'Patient Discharged & Bed Released',
      details: `${admission.patientName} (${admission.patientId}) discharged from Bed ${freedBedNumber}. Condition: ${dischargeCondition}. Bed is now available.`,
      performedBy: dischargeDetails.performedBy || 'Staff',
      role: 'Staff',
      targetId: admissionId
    });

    this.persistToFile();
    return admission;
  }

  // AUDIT ACTIVITY LOGS
  async getActivityLogs(limit = 20) {
    return this.memoryStore.activityLogs.slice(0, limit);
  }

  async addActivityLog(logData) {
    const logId = `LOG-${String(this.memoryStore.activityLogs.length + 1).padStart(3, '0')}`;
    const newLog = {
      logId,
      action: logData.action,
      title: logData.title,
      details: logData.details,
      performedBy: logData.performedBy || 'Staff',
      role: logData.role || 'Staff',
      targetId: logData.targetId || null,
      timestamp: new Date()
    };
    this.memoryStore.activityLogs.unshift(newLog);
    if (this.memoryStore.activityLogs.length > 100) {
      this.memoryStore.activityLogs.pop();
    }
    return newLog;
  }

  // SETTINGS & HOSPITAL INFO
  async getHospitalSettings() {
    return this.memoryStore.hospitalSettings;
  }

  async updateHospitalSettings(newSettings) {
    this.memoryStore.hospitalSettings = {
      ...this.memoryStore.hospitalSettings,
      ...newSettings
    };
    await this.addActivityLog({
      action: 'SETTINGS_UPDATED',
      title: 'Hospital Settings Updated',
      details: 'Facility metadata, admission capacity, and system rules adjusted.',
      performedBy: newSettings.updatedBy || 'Admin',
      role: 'Admin'
    });
    this.persistToFile();
    return this.memoryStore.hospitalSettings;
  }

  async resetToSampleData() {
    await this.seedDefaultData();
    return { success: true, message: 'All patients, admissions, beds, and records reset to sample dataset.' };
  }
}

export const storage = new StorageService();
