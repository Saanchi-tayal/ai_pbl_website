import express from 'express';
import {
  getBeds,
  getBedStats,
  addBed,
  updateBed,
  getWards
} from '../controllers/bedController.js';

const router = express.Router();

router.get('/', getBeds);
router.get('/stats', getBedStats);
router.get('/wards', getWards);
router.post('/', addBed);
router.put('/:id', updateBed);

export default router;
