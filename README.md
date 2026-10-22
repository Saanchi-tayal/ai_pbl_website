# Patient Admission Management System (PAMS)
**AI-Powered Hospital Admission & Bed Allocation Platform**

An intelligent, modern, responsive full-stack web application built for college Project-Based Learning (PBL). PAMS digitizes and streamlines hospital inpatient admissions, prevents double-booking of beds through atomic lock checks, performs automated clinical triage scoring (adapted from the NHS NEWS2 protocol), and assists medical staff with department and bed routing.

---

## 🏥 Key Features

### 1. Hospital Staff Authentication & Role-Based Access Control (RBAC)
- Role separation for **Admin**, **Receptionist**, and **Doctor / Clinician**.
- One-click demo credentials picker for fast evaluation and testing.
- JWT-based authentication with session persistence.

### 2. Comprehensive Clinical Dashboard
- Real-time summary cards: Total Registered Patients, Admitted Today, Available Beds, Occupied Beds, Pending Admissions, Discharged Patients.
- **Dynamic calculation:** All numbers and charts are derived strictly from active database/store records.
- Recharts visualizations:
  - **Admission Activity Chart:** Inpatient volume by clinical priority (Emergency, Urgent, Routine).
  - **Ward Occupancy Chart:** Live capacity across ICU, General, Semi-Private, and Private wards.
- Recent admissions table with quick-action Discharge modal.
- Audited activity event stream.

### 3. Patient Registration & Digital Health ID
- Auto-generated Patient ID (`PAT-YYYY-XXX`).
- Automatic age calculation from Date of Birth input.
- Detailed demographics, next-of-kin emergency contact, blood group, allergies, and chronic medical history.
- Immediate handover action: "Admit Patient Now" upon saving.

### 4. Admission Workflow & Atomic Bed Allocation Lock
- Intake workflow linking registered patients to hospital wards.
- Recording of baseline physiological vitals (Systolic/Diastolic BP, Heart Rate, Respiratory Rate, SpO2, Temperature).
- **Concurrency & Double-Booking Protection:** Strict backend verification prevents allocating already occupied or maintenance beds.
- Generates unique Admission ID (`ADM-YYYY-XXX`) and admission confirmation receipt.

### 5. Patient Management Directory
- Filterable and searchable patient master table.
- Detailed modal displaying demographic records, emergency contacts, allergy profiles, and complete inpatient admission history.
- Inline demographic editing modal.

### 6. Interactive Bed & Ward Management Matrix
- Visual bed grid grouped by ward category:
  - **Intensive Care Unit (ICU)** (Floor 2)
  - **General Medical Ward** (Floor 1)
  - **Semi-Private Care Ward** (Floor 3)
  - **Deluxe Private Suite Ward** (Floor 4)
- Color-coded indicators:
  - 🟢 **Green:** Available (ready for allocation)
  - 🔴 **Red:** Occupied (shows patient name, admission ID, and department)
  - 🟡 **Amber:** Maintenance (biomedical servicing notes)
- Add new beds to hospital inventory with custom equipment features and rates.
- Toggle maintenance status with safeguards preventing maintenance while a patient is in bed.

### 7. AI Admission Assistant & Clinical Decision Support (CDSS)
- **Admission Priority Assistance:** Evaluates vitals and red-flag symptoms to recommend Emergency, Urgent, or Routine review with transparent clinical scoring factors.
- **Prominent Emergency Warning:** Flags critical presentations with explicit instructions to transfer immediately to the emergency resuscitation bay.
- **Department Recommendation:** Matches reported symptoms to medical specialties (Cardiology, Neurology, Pulmonology, Orthopedics, Pediatrics, General Medicine, Emergency Medicine).
- **Intelligent Bed Recommendation:** Suggests the best available bed with fit scores based on patient acuity and ward suitability.
- **SBAR Handover Summary Generator:** Creates concise clinical summaries (Situation, Background, Assessment, Recommendation) with a copy-to-clipboard button.
- **Admission & Triage Analytics:** Shows busiest departments, response latency (< 0.4s), and priority trends.

### 8. Discharge Management Workflow
- Patient discharge records date, time, discharge summary notes, and condition (Recovered, Improved, Transferred, Against Medical Advice).
- **Automatic Bed Release:** Discharging a patient immediately updates the bed status to **Available** and clears patient occupancy while preserving the historical admission log.

### 9. Reports, Analytics & CSV Export
- Hospital KPIs and bed occupancy census.
- One-click CSV export for **Patients**, **Admissions**, and **Bed Census**.

### 10. Master Facility Settings & Demo Reset
- Hospital profile and accreditation metadata.
- Department directory (add and manage departments).
- Physician staff directory (add and manage attending doctors).
- Role-based permissions matrix.
- **One-Click Demo Reset:** Easily reset all beds, admissions, and patients back to the clean initial demo dataset at any point during presentation.

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite |
| **Styling** | Tailwind CSS with custom medical palette (`#1F5E63`, `#8FAF9A`, `#E8E6DF`) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | Dual-Engine: MongoDB via Mongoose **plus** zero-config Local Persistent File Storage Engine (`server/data/store.json`) |
| **Security** | JWT Tokens, bcryptjs password hashing, atomic bed locks |

---

## 🔑 Demo Credentials

| Role | Email | Password | Department |
|---|---|---|---|
| **Admin** | `admin@pams.hospital` | `password123` | Hospital Administration |
| **Receptionist** | `reception@pams.hospital` | `password123` | Intake & Triage Desk |
| **Doctor** | `doctor@pams.hospital` | `password123` | Cardiology |

*(Note: On the login screen, you can also click any of the 3 quick-fill role buttons to load credentials instantly).*

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Installation
Dependencies are already installed in both `server/` and `client/`. To re-install from scratch if needed:
```bash
npm run install:all
```

### Running the Application
To run both the backend server and frontend client simultaneously:
```bash
npm run dev
```

Alternatively, run them in separate terminals:
```bash
# Terminal 1: Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

---

## 🧪 Testing the Core Workflows

1. **Sign In:** Use the Admin quick-fill button to log in.
2. **Dashboard Overview:** Observe live KPI counts, the admission priority bar chart, and ward occupancy progress bars.
3. **Patient Registration:** Navigate to *Register Patient*, enter a DOB to test automatic age calculation, add emergency contact details, and save.
4. **New Admission & AI Triage:**
   - Select your registered patient.
   - Enter symptoms or click one of the preset buttons in the AI Assistant (e.g. *Emergency STEMI*).
   - Click **AI Triage & Bed Assist** to witness automated NEWS2 scoring and bed matching.
   - Select an available bed and click **Confirm Patient Admission & Lock Bed**.
5. **Bed Concurrency Check:** Navigate to *Bed Management* and observe that the allocated bed turned 🔴 **Occupied** with the patient's name. Try to allocate that bed again in another admission — notice it is strictly blocked!
6. **Discharge & Automatic Bed Release:** Go to *Admission Records* or the Dashboard recent table, click **Discharge**, enter summary notes, and confirm. Watch the bed immediately turn 🟢 **Available** again.
7. **Reports & CSV Export:** Visit *Reports & Analytics* and click **Admissions CSV** to download the generated spreadsheet.

---

## 🛡️ Medical Disclaimer
*PAMS is an educational software developed for academic Project-Based Learning (PBL) demonstrations. All AI-assisted triage calculations, ward recommendations, and admission summaries are clinical decision support aids and do not substitute professional medical judgment.*
