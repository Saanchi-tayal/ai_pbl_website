import express from 'express';
import {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  dischargePatient
} from '../controllers/admissionController.js';

const router = express.Router();

router.get('/', getAdmissions);
router.get('/:id', getAdmissionById);
router.post('/', createAdmission);
router.post('/:id/discharge', dischargePatient);

export default router;
