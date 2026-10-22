import { storage } from '../services/storageService.js';

export const getBeds = async (req, res) => {
  try {
    const { wardId, wardType, status, department } = req.query;
    const beds = await storage.getBeds({ wardId, wardType, status, department });
    res.json(beds);
  } catch (err) {
    console.error('Error fetching beds:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getBedStats = async (req, res) => {
  try {
    const beds = await storage.getBeds();
    const wards = await storage.getWards();

    const total = beds.length;
    const available = beds.filter(b => b.status === 'Available').length;
    const occupied = beds.filter(b => b.status === 'Occupied').length;
    const maintenance = beds.filter(b => b.status === 'Maintenance').length;
    const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : 0;

    // Ward-wise breakdown
    const wardBreakdown = wards.map(ward => {
      const wardBeds = beds.filter(b => b.wardId === ward.wardId || b.wardType === ward.wardType);
      const wTotal = wardBeds.length;
      const wAvailable = wardBeds.filter(b => b.status === 'Available').length;
      const wOccupied = wardBeds.filter(b => b.status === 'Occupied').length;
      const wMaint = wardBeds.filter(b => b.status === 'Maintenance').length;
      const wRate = wTotal > 0 ? ((wOccupied / wTotal) * 100).toFixed(1) : 0;

      return {
        wardId: ward.wardId,
        wardName: ward.name,
        wardType: ward.wardType,
        totalBeds: wTotal,
        available: wAvailable,
        occupied: wOccupied,
        maintenance: wMaint,
        occupancyRate: Number(wRate)
      };
    });

    res.json({
      total,
      available,
      occupied,
      maintenance,
      occupancyRate: Number(occupancyRate),
      wardBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addBed = async (req, res) => {
  try {
    const { bedNumber, wardType, wardId, wardName, department, dailyRate, features } = req.body;
    if (!bedNumber || !bedNumber.trim()) {
      return res.status(400).json({ error: 'Bed number / label is required.' });
    }
    if (!wardType) {
      return res.status(400).json({ error: 'Ward type is required.' });
    }

    const created = await storage.addBed(req.body);
    res.status(201).json({
      success: true,
      message: `Bed ${created.bedNumber} added successfully to ${created.wardName}.`,
      bed: created
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateBed = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await storage.updateBed(id, req.body);
    res.json({
      success: true,
      message: `Bed ${updated.bedNumber} updated successfully.`,
      bed: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getWards = async (req, res) => {
  try {
    const wards = await storage.getWards();
    res.json(wards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
