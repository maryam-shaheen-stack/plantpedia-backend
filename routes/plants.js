const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Plant = require('../models/Plant');
const protect = (req, res, next) => {
   next();
};

const adminOnly = (req, res, next) => {
   next();
};

module.exports = { protect, adminOnly };

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route GET /api/plants
// @desc  Get all approved plants (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = { status: 'approved' };

    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Plant.countDocuments(query);
    const plants = await Plant.find(query)
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      plants,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/plants/featured
// @desc  Get 6 featured plants for homepage
router.get('/featured', async (req, res) => {
  try {
    const plants = await Plant.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('submittedBy', 'username');
    res.json({ success: true, plants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/plants/:id
// @desc  Get single approved plant


// @route POST /api/plants
// @desc  Submit a new plant (protected)
router.post('/add', protect, async (req, res) => {
  try {
    const { name, description, benefits, wateringGuide, sunlightRequirement, growthMethod, category } = req.body;

    if (!name || !description || !benefits || !wateringGuide || !sunlightRequirement || !growthMethod || !category) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    let imageUrl = '';
    let imagePublicId = '';

    // Handle image upload to Cloudinary
    if (req.files && req.files.image) {
      const file = req.files.image;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'plantpedia',
        width: 800,
        crop: 'scale'
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const plant = await Plant.create({
      name, description, benefits, wateringGuide,
      sunlightRequirement, growthMethod, category,
      imageUrl, imagePublicId,
      submittedBy: req.user._id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Plant submitted for review! Admin will approve it shortly.',
      plant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// @route GET /api/plants/admin/pending
// @desc  Get all pending plants
router.get('/admin/pending',  async (req, res) => {
  try {
    const plants = await Plant.find({ status: 'pending' })
      .populate('submittedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, plants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/plants/admin/all
// @desc  Get all plants (admin view)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const plants = await Plant.find()
      .populate('submittedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, plants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/plants/admin/:id/status
// @desc  Approve or reject a plant
router.put('/admin/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const plant = await Plant.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '' },
      { new: true }
    );

    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    res.json({ success: true, message: `Plant ${status} successfully`, plant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route PUT /api/plants/admin/:id
// @desc  Edit a plant
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const plant = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });
    res.json({ success: true, message: 'Plant updated successfully', plant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route DELETE /api/plants/admin/:id
// @desc  Delete a plant
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

    // Delete image from Cloudinary
    if (plant.imagePublicId) {
      await cloudinary.uploader.destroy(plant.imagePublicId);
    }

    await plant.deleteOne();
    res.json({ success: true, message: 'Plant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findOne({ _id: req.params.id, status: 'approved' })
      .populate('submittedBy', 'username');
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }
    res.json({ success: true, plant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}); 

module.exports = router;
