const mongoose = require('mongoose');

// Esquema para equipamentos
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  description: { type: String, default: '' }
});

// Esquema para armas
const weaponSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  type: { type: String, default: '' },
  damage: { type: String, default: '' },
  currentAmmo: { type: Number, default: 0 },
  maxAmmo: { type: Number, default: 0 },
  range: { type: String, default: '' },
  attack: { type: String, default: '' }
});

// Esquema para histórico de dados
const diceRollSchema = new mongoose.Schema({
  rollType: { type: String, enum: ['attribute', 'skill', 'damage', 'general'], required: true },
  rollName: { type: String, default: '' },
  diceType: { type: String, default: '' },
  total: { type: Number, required: true },
  successLevel: { type: String, default: '' },
  timestamp: { type: String, required: true },
  numDice: { type: Number, default: 1 },
  rolls: [{ type: Number }],
  constants: [{ type: Number }],
  breakdown: [{ type: String }]
}, { _id: false });

// Esquema principal da ficha do personagem
const characterSchema = new mongoose.Schema({
  // Referência ao usuário que criou esta ficha
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Tipo de ficha: player, npc, monster
  characterType: { type: String, enum: ['player', 'npc', 'monster'], default: 'player' },

    // Imagem do personagem (base64)
  image: { type: String, default: '' },
  
  // Informações básicas do personagem
  basicInfo: {
    name: { type: String, required: true },
    player: { type: String, required: true },
    role: { type: String, default: '' },
    specialty: { type: String, default: '' },
    circle: { type: String, default: '' },
    plan: { type: String, default: '' },
    level: { type: Number, default: 0 },
    birthplace: { type: String, default: '' },
    characterImage: { type: String, default: '' }, // URL da imagem
    personalDescription: { type: String, default: '' },
    familyAndFriends: { type: String, default: '' },
    insanityEpisodes: { type: String, default: '' },
    wounds: { type: String, default: '' }
  },
  
  // Características (atributos principais)
  body: {
    move: { type: Number, default: 0 },
    moveDourado: { type: Boolean, default: false },
    attack: { type: Number, default: 0 },
    attackDourado: { type: Boolean, default: false },
    control: { type: Number, default: 0 },
    controlDourado: { type: Boolean, default: false },
    maxImpulsos: { type: Number, default: 1 },
    impulsos: [{ type: Boolean, default: false }],
    acoes: [{
      dourado: { type: Boolean, default: false },
      acoes: [{ type: Boolean, default: false }]
    }],
    resistencias: [{ type: Boolean, default: false }]
  },
  cunning: {
    sway: { type: Number, default: 0 },
    swayDourado: { type: Boolean, default: false },
    read: { type: Number, default: 0 },
    readDourado: { type: Boolean, default: false },
    hide: { type: Number, default: 0 },
    hideDourado: { type: Boolean, default: false },
    maxImpulsos: { type: Number, default: 1 },
    impulsos: [{ type: Boolean, default: false }],
    acoes: [{
      dourado: { type: Boolean, default: false },
      acoes: [{ type: Boolean, default: false }]
    }],
    resistencias: [{ type: Boolean, default: false }]
  },
  intuition: {
    search: { type: Number, default: 0 },
    searchDourado: { type: Boolean, default: false },
    focus: { type: Number, default: 0 },
    focusDourado: { type: Boolean, default: false },
    sense: { type: Number, default: 0 },
    senseDourado: { type: Boolean, default: false },
    maxImpulsos: { type: Number, default: 1 },
    impulsos: [{ type: Boolean, default: false }],
    acoes: [{
      dourado: { type: Boolean, default: false },
      acoes: [{ type: Boolean, default: false }]
    }],
    resistencias: [{ type: Boolean, default: false }]
  },
  
  // Status do personagem
  status: {
    marks: {
      body: {
        maxMarks: { type: Number, default: 0 },
        marks: [{ type: Boolean, default: false }]
      },
      mind: {
        maxMarks: { type: Number, default: 0 },
        marks: [{ type: Boolean, default: false }]
      },
      blood: {
        maxMarks: { type: Number, default: 0 },
        marks: [{ type: Boolean, default: false }]
      }
    },
    scars: {
      type: [{
        checked: { type: Boolean, default: false },
        description: { type: String, default: '' }
      }],
      default: [{checked: false, description: ''}, {checked: false, description: ''}, {checked: false, description: ''}]
    },
    luck: { type: Number, default: 0 }
  },
  
  // Habilidades do personagem
  skills: {
    roleskills: { type: String, default: '' },
    specialtyskills: { type: String, default: '' },
    circleskills: { type: String, default: '' }
  },
  
  // Equipamentos
  equipment: [equipmentSchema],

  // Armas
  weapons: [weaponSchema],

  // Histórico de dados
  diceHistory: [diceRollSchema],

  // Notas e background
  notes: {
    backstory: { type: String, default: '' },
    significantPeople: { type: String, default: '' },
    meaningfulLocations: { type: String, default: '' },
    treasuredPossessions: { type: String, default: '' },
    rituals: { type: String, default: '' },
    generalNotes: { type: String, default: '' }
  },

  // História do personagem
  history: { type: String, default: '' },

  // Renda e economias
  incomeAndEconomy: {
    possessions: { type: String, default: '' },
    properties: { type: String, default: '' }
  },

  // Controle de versão
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Atualizar campo updatedAt sempre que modificar
characterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Character', characterSchema);