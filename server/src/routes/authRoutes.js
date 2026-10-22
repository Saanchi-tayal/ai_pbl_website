import express from 'express';
import { login, getDemoAccounts, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.get('/demo-users', getDemoAccounts);
router.get('/me', getCurrentUser);

export default router;
