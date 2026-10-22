const API_BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('pams_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.error || (data.details && data.details.join(', ')) || 'Request failed';
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getDemoUsers: () => request('/auth/demo-users'),
  getCurrentUser: () => request('/auth/me'),

  // Health
  getHealth: () => request('/health'),

  // Patients
  getPatients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/patients${query ? `?${query}` : ''}`);
  },
  getPatientById: (id) => request(`/patients/${id}`),
  createPatient: (patientData) => request('/patients', { method: 'POST', body: JSON.stringify(patientData) }),
  updatePatient: (id, patientData) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(patientData) }),

  // Admissions
  getAdmissions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admissions${query ? `?${query}` : ''}`);
  },
  getAdmissionById: (id) => request(`/admissions/${id}`),
  createAdmission: (admissionData) => request('/admissions', { method: 'POST', body: JSON.stringify(admissionData) }),
  dischargePatient: (id, dischargeData) => request(`/admissions/${id}/discharge`, { method: 'POST', body: JSON.stringify(dischargeData) }),

  // Beds & Wards
  getBeds: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/beds${query ? `?${query}` : ''}`);
  },
  getBedStats: () => request('/beds/stats'),
  getWards: () => request('/beds/wards'),
  addBed: (bedData) => request('/beds', { method: 'POST', body: JSON.stringify(bedData) }),
  updateBed: (id, bedData) => request(`/beds/${id}`, { method: 'PUT', body: JSON.stringify(bedData) }),

  // AI Assistant
  aiTriage: (data) => request('/ai/triage', { method: 'POST', body: JSON.stringify(data) }),
  aiDepartment: (data) => request('/ai/department', { method: 'POST', body: JSON.stringify(data) }),
  aiRecommendBed: (data) => request('/ai/recommend-bed', { method: 'POST', body: JSON.stringify(data) }),
  aiAdmissionSummary: (data) => request('/ai/admission-summary', { method: 'POST', body: JSON.stringify(data) }),
  getAIAnalytics: () => request('/ai/analytics'),

  // Analytics & Dashboard
  getDashboardSummary: () => request('/analytics/dashboard-summary'),
  exportCSV: async (type) => {
    const blob = await request(`/analytics/export/${type}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pams_${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  addDepartment: (data) => request('/settings/departments', { method: 'POST', body: JSON.stringify(data) }),
  addDoctor: (data) => request('/settings/doctors', { method: 'POST', body: JSON.stringify(data) }),
  resetDemoData: () => request('/settings/reset', { method: 'POST' })
};
