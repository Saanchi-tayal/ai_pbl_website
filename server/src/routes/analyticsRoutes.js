import express from 'express';
import { getDashboardSummary, exportReportCSV } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard-summary', getDashboardSummary);
router.get('/export/:type', exportReportCSV);

export default router;
