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
    race: { type: String, default: '' },
    class: { type: String, default: '' },
    background: { type: String, default: '' },
    plan: { type: String, default: '' },
    level: { type: Number, default: 0 },
    alignment: { type: String, default: '' },
    characterImage: { type: String, default: '' }, // URL da imagem
    personalDescription: { type: String, default: '' },
    familyAndFriends: { type: String, default: '' },
    insanityEpisodes: { type: String, default: '' },
    wounds: { type: String, default: '' }
  },
  
  // Atributos D&D
  attributes: {
    strength: {
      score: { type: Number, default: 10 },
      modifier: { type: Number, default: 0 },
      savingThrow: { type: Number, default: 0 }
    },
    dexterity: {
      score: { type: Number, default: 10 },
      modifier: { type: Number, default: 0 },
      savingThrow: { type: Number, default: 0 }
    },
    constitution: {
      score: { type: Number, default: 10 },
      modifier: { type: Number, default: 0 },
      savingThrow: { type: Number, default: 0 }
    },
    intelligence: {
      score: { type: Number, default: 10 },
      modifier: { type: Number, default: 0 },
      savingThrow: { type: Number, default: 0 }
    },
    wisdom: {
      score: { type: Number, default: 10 },
      modifier: { type: Number, default: 0 },
      savingThrow: { type: Number, default: 0 }
    },
    charisma: {
      score: { type: Number, default: 10 },
      modifier: { type: Number, default: 0 },
      savingThrow: { type: Number, default: 0 }
    }
  },
  
  // Status do personagem
  status: {
    health: {
      current: { type: Number, default: 10 },
      max: { type: Number, default: 10 },
      temporary: { type: Number, default: 0 }
    },
    healthDice: {
      total: { type: Number, default: 0 },
      max: { type: Number, default: 0 }
    },
    deathSaves: {
      success: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 3 }
      },
      failure: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 3 }
      }
    },
    luck: { type: Number, default: 0 }
  },

  // Inspiração
  inspiration: { type: Number, default: 0 },

  // Bônus de Proficiência
  proficiencyBonus: { type: Number, default: 0 },

  // Combate
  combat: {
    defense: { type: Number, default: 0 },
    initiative: { type: Number, default: 0 },
    movement: { type: Number, default: 0 }
  },
  
  // Perícias do personagem
  skills: {
    acrobacia: { value: { type: Number, default: 0 } },
    arcanismo: { value: { type: Number, default: 0 } },
    atletismo: { value: { type: Number, default: 0 } },
    atuacao: { value: { type: Number, default: 0 } },
    blefar: { value: { type: Number, default: 0 } },
    furtividade: { value: { type: Number, default: 0 } },
    historia: { value: { type: Number, default: 0 } },
    intimidacao: { value: { type: Number, default: 0 } },
    intuicao: { value: { type: Number, default: 0 } },
    investigacao: { value: { type: Number, default: 0 } },
    lidarComAnimais: { value: { type: Number, default: 0 } },
    medicina: { value: { type: Number, default: 0 } },
    natureza: { value: { type: Number, default: 0 } },
    percepcao: { value: { type: Number, default: 0 } },
    persuasao: { value: { type: Number, default: 0 } },
    prestidigitacao: { value: { type: Number, default: 0 } },
    religiao: { value: { type: Number, default: 0 } },
    sobrevivencia: { value: { type: Number, default: 0 } }
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

  // Slots de magia
  magicSlots: {
    level0: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level1: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level2: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level3: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level4: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level5: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level6: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level7: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level8: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    },
    level9: {
      used: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      spells: { type: String, default: '' }
    }
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