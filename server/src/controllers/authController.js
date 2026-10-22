import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from '../services/storageService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pams_hospital_jwt_super_secret_key_2025';

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await storage.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role check if provided
    if (role && user.role !== role) {
      return res.status(401).json({ 
        error: `Account role mismatch: '${user.name}' is registered as '${user.role}', but you selected '${role}'.` 
      });
    }

    // Check password
    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }
    // Allow demo plain text fallback for local testing
    if (!isMatch && user.password && user.password === password) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.userId, 
        email: user.email, 
        role: user.role, 
        name: user.name,
        department: user.department 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export const getDemoAccounts = async (req, res) => {
  try {
    const users = await storage.getUsers();
    const demoList = users.map(u => ({
      userId: u.userId,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      password: u.password || 'password123'
    }));
    res.json(demoList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.findUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User session not found.' });
    }

    res.json({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
