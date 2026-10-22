import express from 'express';
import {
  getSettings,
  updateSettings,
  addDepartment,
  addDoctor,
  resetSampleData
} from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/departments', addDepartment);
router.post('/doctors', addDoctor);
router.post('/reset', resetSampleData);

export default router;
