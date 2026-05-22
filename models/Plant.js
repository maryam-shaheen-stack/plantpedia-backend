const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plant name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  urduName: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  urduDescription: {
    type: String,
    trim: true,
    default: ''
  },
  benefits: {
    type: String,
    required: [true, 'Benefits are required'],
    trim: true
  },
  urduBenefits: {
    type: String,
    trim: true,
    default: ''
  },
  wateringGuide: {
    type: String,
    required: [true, 'Watering guide is required'],
    trim: true
  },
  sunlightRequirement: {
    type: String,
    required: [true, 'Sunlight requirement is required'],
    enum: ['Full Sun', 'Partial Sun', 'Shade', 'Indirect Light'],
    default: 'Full Sun'
  },
  growthMethod: {
    type: String,
    required: [true, 'Growth method is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Indoor', 'Outdoor', 'Medicinal', 'Flowering', 'Succulent', 'Vegetable', 'Herb', 'Tree'],
    default: 'Indoor'
  },
  soilType: {
    type: String,
    enum: ['Sandy', 'Clay', 'Loamy', 'Any'],
    default: 'Any'
  },
  growingSeason: {
    type: String,
    enum: [
      'Spring (March–May)',
      'Summer (June–August)',
      'Autumn (September–November)',
      'Winter (December–February)',
      'Year Round'
    ],
    default: 'Year Round'
  },
  temperatureRange: {
    type: String,
    trim: true,
    default: ''
  },
  plantLifespan: {
    type: String,
    enum: ['Annual', 'Biennial', 'Perennial'],
    default: 'Perennial'
  },
  imageUrl: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plant', plantSchema);