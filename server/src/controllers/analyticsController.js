import { storage } from '../services/storageService.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const patients = await storage.getPatients();
    const admissions = await storage.getAdmissions();
    const beds = await storage.getBeds();
    const activityLogs = await storage.getActivityLogs(8);
    const wards = await storage.getWards();

    const todayStr = new Date().toISOString().slice(0, 10);

    const totalRegisteredPatients = patients.length;
    const currentlyAdmitted = patients.filter(p => p.admissionStatus === 'Admitted').length;
    const totalDischarged = admissions.filter(a => a.status === 'Discharged').length;
    const pendingAdmissions = admissions.filter(a => a.status === 'Pending').length;

    const admittedToday = admissions.filter(a => {
      const aDate = new Date(a.admissionDate).toISOString().slice(0, 10);
      return aDate === todayStr && a.status === 'Admitted';
    }).length;

    const totalBeds = beds.length;
    const availableBeds = beds.filter(b => b.status === 'Available').length;
    const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
    const maintenanceBeds = beds.filter(b => b.status === 'Maintenance').length;
    const overallOccupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

    // Ward-wise occupancy for charts
    const wardOccupancyData = wards.map(w => {
      const wardBeds = beds.filter(b => b.wardId === w.wardId || b.wardType === w.wardType);
      const total = wardBeds.length;
      const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
      const available = wardBeds.filter(b => b.status === 'Available').length;
      const maintenance = wardBeds.filter(b => b.status === 'Maintenance').length;
      return {
        name: w.name.replace(' Ward', '').replace(' Care', '').replace(' Suite', ''),
        fullName: w.name,
        occupied,
        available,
        maintenance,
        total,
        rate: total > 0 ? Math.round((occupied / total) * 100) : 0
      };
    });

    // Department admissions breakdown
    const deptMap = {};
    admissions.forEach(a => {
      deptMap[a.department] = (deptMap[a.department] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptMap).map(([name, count]) => ({
      name,
      admissions: count
    })).sort((a, b) => b.admissions - a.admissions);

    // Admission activity timeline (last 7 days)
    const daysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[key] = { date: key, routine: 0, urgent: 0, emergency: 0, total: 0 };
    }

    admissions.forEach(a => {
      const d = new Date(a.admissionDate);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (daysMap[key]) {
        daysMap[key].total++;
        if (a.admissionPriority === 'Emergency') daysMap[key].emergency++;
        else if (a.admissionPriority === 'Urgent') daysMap[key].urgent++;
        else daysMap[key].routine++;
      }
    });

    // If less than 2 points have data in last 7 days because of static mock date, distribute logically
    const timelineData = Object.values(daysMap);

    // Recent 5 admissions
    const recentAdmissions = admissions.slice(0, 5);

    res.json({
      metrics: {
        totalRegisteredPatients,
        currentlyAdmitted,
        admittedToday,
        availableBeds,
        occupiedBeds,
        maintenanceBeds,
        totalBeds,
        overallOccupancyRate: Number(overallOccupancyRate),
        pendingAdmissions,
        totalDischarged
      },
      charts: {
        wardOccupancyData,
        departmentDistribution,
        admissionTimeline: timelineData
      },
      recentAdmissions,
      recentActivityLogs: activityLogs,
      storageStatus: storage.getStorageStatus()
    });
  } catch (err) {
    console.error('Error compiling dashboard summary:', err);
    res.status(500).json({ error: err.message });
  }
};

export const exportReportCSV = async (req, res) => {
  try {
    const { type } = req.params; // 'patients' | 'admissions' | 'beds'
    let csv = '';
    let filename = `pams_${type}_export.csv`;

    if (type === 'patients') {
      const patients = await storage.getPatients();
      const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'Blood Group', 'Admission Status', 'Allergies', 'Registration Date'];
      const rows = patients.map(p => [
        `"${p.patientId}"`,
        `"${p.name}"`,
        p.age,
        `"${p.gender}"`,
        `"${p.phone}"`,
        `"${p.bloodGroup}"`,
        `"${p.admissionStatus}"`,
        `"${(p.allergies || []).join('; ')}"`,
        `"${new Date(p.registrationDate).toLocaleDateString()}"`
      ]);
      csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'admissions') {
      const admissions = await storage.getAdmissions();
      const headers = ['Admission ID', 'Patient ID', 'Patient Name', 'Department', 'Doctor', 'Priority', 'Ward', 'Bed', 'Status', 'Admission Date', 'Discharge Date'];
      const rows = admissions.map(a => [
        `"${a.admissionId}"`,
        `"${a.patientId}"`,
        `"${a.patientName}"`,
        `"${a.department}"`,
        `"${a.attendingDoctor}"`,
        `"${a.admissionPriority}"`,
        `"${a.assignedWard}"`,
        `"${a.assignedBedNumber}"`,
        `"${a.status}"`,
        `"${new Date(a.admissionDate).toLocaleString()}"`,
        `"${a.dischargeDate ? new Date(a.dischargeDate).toLocaleString() : 'N/A'}"`
      ]);
      csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'beds') {
      const beds = await storage.getBeds();
      const headers = ['Bed ID', 'Bed Number', 'Ward', 'Ward Type', 'Status', 'Current Patient', 'Department', 'Daily Rate'];
      const rows = beds.map(b => [
        `"${b.bedId}"`,
        `"${b.bedNumber}"`,
        `"${b.wardName}"`,
        `"${b.wardType}"`,
        `"${b.status}"`,
        `"${b.currentPatientName || 'None'}"`,
        `"${b.department}"`,
        b.dailyRate
      ]);
      csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      return res.status(400).json({ error: 'Invalid export type. Supported: patients, admissions, beds' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
