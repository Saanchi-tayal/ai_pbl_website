import express from 'express';
import {
  assessPriority,
  recommendDepartment,
  recommendBed,
  generateSummary,
  getAIAnalytics
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/triage', assessPriority);
router.post('/department', recommendDepartment);
router.post('/recommend-bed', recommendBed);
router.post('/admission-summary', generateSummary);
router.get('/analytics', getAIAnalytics);

export default router;
