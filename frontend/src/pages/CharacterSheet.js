import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { characterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

import DiceHistory from '../components/DiceRoller';
import Notification from '../components/Notification';
import '../styles/CharacterSheet.css';

const translations = {
    attributes: {
        strength: 'Força',
        dexterity: 'Destreza',
        constitution: 'Constituição',
        intelligence: 'Inteligência',
        wisdom: 'Sabedoria',
        charisma: 'Carisma'
    },
};

const diceTypes = [
    { label: 'd4', sides: 4 },
    { label: 'd6', sides: 6 },
    { label: 'd8', sides: 8 },
    { label: 'd10', sides: 10 },
    { label: 'd12', sides: 12 },
    { label: 'd20', sides: 20 },
    { label: 'd100', sides: 100 }
];

const getModifier = (score) => {
    if (score === 1) return -5;
    if (score >= 2 && score <= 3) return -4;
    if (score >= 4 && score <= 5) return -3;
    if (score >= 6 && score <= 7) return -2;
    if (score >= 8 && score <= 9) return -1;
    if (score >= 10 && score <= 11) return 0;
    if (score >= 12 && score <= 13) return 1;
    if (score >= 14 && score <= 15) return 2;
    if (score >= 16 && score <= 17) return 3;
    if (score >= 18 && score <= 19) return 4;
    if (score >= 20 && score <= 21) return 5;
    return 5 + Math.floor((score - 21) / 2);
};

const getProficiencyBonus = (level) => {
    if (level >= 1 && level <= 4) return 2;
    if (level >= 5 && level <= 8) return 3;
    if (level >= 9 && level <= 12) return 4;
    if (level >= 13 && level <= 16) return 5;
    if (level >= 17 && level <= 20) return 6;
    return 0;
};

const attributeSkills = {
    strength: ['atletismo'],
    dexterity: ['acrobacia', 'furtividade', 'prestidigitacao'],
    constitution: [],
    intelligence: ['arcanismo', 'historia', 'investigacao', 'natureza', 'religiao'],
    wisdom: ['intuicao', 'lidarComAnimais', 'medicina', 'percepcao', 'sobrevivencia'],
    charisma: ['atuacao', 'blefar', 'intimidacao', 'persuasao']
};

const skillToAttribute = {
    atletismo: 'strength',
    acrobacia: 'dexterity',
    furtividade: 'dexterity',
    prestidigitacao: 'dexterity',
    arcanismo: 'intelligence',
    historia: 'intelligence',
    investigacao: 'intelligence',
    natureza: 'intelligence',
    religiao: 'intelligence',
    intuicao: 'wisdom',
    lidarComAnimais: 'wisdom',
    medicina: 'wisdom',
    percepcao: 'wisdom',
    sobrevivencia: 'wisdom',
    atuacao: 'charisma',
    blefar: 'charisma',
    intimidacao: 'charisma',
    persuasao: 'charisma'
};


const CharacterSheet = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { logout } = useAuth();

    const isMasterMode = location.pathname.includes('/master/');

    const [character, setCharacter] = useState(null);
    const isNPCOrMonster = character?.characterType === 'npc' || character?.characterType === 'monster';
    const isMonster = character?.characterType === 'monster';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // Roll result states
    const [rollValue, setRollValue] = useState(0);
    const [rollDie, setRollDie] = useState(0);
    const [rollModifier, setRollModifier] = useState(0);
    const [successLevel, setSuccessLevel] = useState('Fracasso');
    const [isSuccess, setIsSuccess] = useState(false);
    const [rollName, setRollName] = useState('');
    const [rollCategory, setRollCategory] = useState('');
    const [isSkillRoll, setIsSkillRoll] = useState(false);

    const [diceHistory, setDiceHistory] = useState([]);
    const [showDiceModal, setShowDiceModal] = useState(false);
    const [selectedDice, setSelectedDice] = useState('d6');
    const [numDice, setNumDice] = useState(1);
    const [rollResult, setRollResult] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [isRollingDice, setIsRollingDice] = useState(false);

    const [showAddSkillModal, setShowAddSkillModal] = useState(false);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillValue, setNewSkillValue] = useState(0);

    // Notification states
    const [notifications, setNotifications] = useState([]);

    // No início do componente, adicione um estado para a imagem preview:
    const [imagePreview, setImagePreview] = useState('');

    const imageInputRef = useRef(null);

    // Estado para modificadores de vida
    const [healthModifierValue, setHealthModifierValue] = useState(0);



    // Função para lidar com upload da imagem
    const handleImageChange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setCharacter(prev => ({
                    ...prev,
                    image: reader.result, // salva base64 no objeto character
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const fetchCharacter = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await characterAPI.getById(id);
                let charData = response.data;
                setDiceHistory(charData.diceHistory || []);

                // Ensure D&D structure is initialized
                charData = {
                    ...charData,
                    basicInfo: {
                        name: charData.basicInfo?.name || '',
                        player: charData.basicInfo?.player || '',
                        race: charData.basicInfo?.race || '',
                        class: charData.basicInfo?.class || '',
                        background: charData.basicInfo?.background || '',
                        level: charData.basicInfo?.level || 0,
                        alignment: charData.basicInfo?.alignment || '',
                        characterImage: charData.basicInfo?.characterImage || '',
                        personalDescription: charData.basicInfo?.personalDescription || '',
                        familyAndFriends: charData.basicInfo?.familyAndFriends || '',
                        insanityEpisodes: charData.basicInfo?.insanityEpisodes || '',
                        wounds: charData.basicInfo?.wounds || '',

                    },
                    attributes: {
                        strength: {
                            score: charData.attributes?.strength?.score || 0,
                            modifier: charData.attributes?.strength?.modifier || 0,
                            savingThrow: {
                                value: charData.attributes?.strength?.savingThrow?.value || 0,
                                checked: charData.attributes?.strength?.savingThrow?.checked || false
                            }
                        },
                        dexterity: {
                            score: charData.attributes?.dexterity?.score || 0,
                            modifier: charData.attributes?.dexterity?.modifier || 0,
                            savingThrow: {
                                value: charData.attributes?.dexterity?.savingThrow?.value || 0,
                                checked: charData.attributes?.dexterity?.savingThrow?.checked || false
                            }
                        },
                        constitution: {
                            score: charData.attributes?.constitution?.score || 0,
                            modifier: charData.attributes?.constitution?.modifier || 0,
                            savingThrow: {
                                value: charData.attributes?.constitution?.savingThrow?.value || 0,
                                checked: charData.attributes?.constitution?.savingThrow?.checked || false
                            }
                        },
                        intelligence: {
                            score: charData.attributes?.intelligence?.score || 0,
                            modifier: charData.attributes?.intelligence?.modifier || 0,
                            savingThrow: {
                                value: charData.attributes?.intelligence?.savingThrow?.value || 0,
                                checked: charData.attributes?.intelligence?.savingThrow?.checked || false
                            }
                        },
                        wisdom: {
                            score: charData.attributes?.wisdom?.score || 0,
                            modifier: charData.attributes?.wisdom?.modifier || 0,
                            savingThrow: {
                                value: charData.attributes?.wisdom?.savingThrow?.value || 0,
                                checked: charData.attributes?.wisdom?.savingThrow?.checked || false
                            }
                        },
                        charisma: {
                            score: charData.attributes?.charisma?.score || 0,
                            modifier: charData.attributes?.charisma?.modifier || 0,
                            savingThrow: {
                                value: charData.attributes?.charisma?.savingThrow?.value || 0,
                                checked: charData.attributes?.charisma?.savingThrow?.checked || false
                            }
                        }
                    },
                    status: {
                        health: {
                            current: charData.status?.health?.current || 0,
                            max: charData.status?.health?.max || 0,
                            temporary: charData.status?.health?.temporary || 0
                        },
                        healthDice: {
                            total: charData.status?.healthDice?.total || 0,
                            max: charData.status?.healthDice?.max || 0
                        },
                        deathSaves: {
                            success: charData.status?.deathSaves?.success || 0,
                            failure: charData.status?.deathSaves?.failure || 0
                        },

                    },
                    inspiration: charData.inspiration || 0,
                    proficiencyBonus: charData.proficiencyBonus || 0,
                    combat: {
                        defense: charData.combat?.defense || 0,
                        initiative: charData.combat?.initiative || 0,
                        movement: charData.combat?.movement || 0
                    },
                    skills: {
                        acrobacia: { value: charData.skills?.acrobacia?.value || 0, checked: charData.skills?.acrobacia?.checked || false },
                        arcanismo: { value: charData.skills?.arcanismo?.value || 0, checked: charData.skills?.arcanismo?.checked || false },
                        atletismo: { value: charData.skills?.atletismo?.value || 0, checked: charData.skills?.atletismo?.checked || false },
                        atuacao: { value: charData.skills?.atuacao?.value || 0, checked: charData.skills?.atuacao?.checked || false },
                        blefar: { value: charData.skills?.blefar?.value || 0, checked: charData.skills?.blefar?.checked || false },
                        furtividade: { value: charData.skills?.furtividade?.value || 0, checked: charData.skills?.furtividade?.checked || false },
                        historia: { value: charData.skills?.historia?.value || 0, checked: charData.skills?.historia?.checked || false },
                        intimidacao: { value: charData.skills?.intimidacao?.value || 0, checked: charData.skills?.intimidacao?.checked || false },
                        intuicao: { value: charData.skills?.intuicao?.value || 0, checked: charData.skills?.intuicao?.checked || false },
                        investigacao: { value: charData.skills?.investigacao?.value || 0, checked: charData.skills?.investigacao?.checked || false },
                        lidarComAnimais: { value: charData.skills?.lidarComAnimais?.value || 0, checked: charData.skills?.lidarComAnimais?.checked || false },
                        medicina: { value: charData.skills?.medicina?.value || 0, checked: charData.skills?.medicina?.checked || false },
                        natureza: { value: charData.skills?.natureza?.value || 0, checked: charData.skills?.natureza?.checked || false },
                        percepcao: { value: charData.skills?.percepcao?.value || 0, checked: charData.skills?.percepcao?.checked || false },
                        persuasao: { value: charData.skills?.persuasao?.value || 0, checked: charData.skills?.persuasao?.checked || false },
                        prestidigitacao: { value: charData.skills?.prestidigitacao?.value || 0, checked: charData.skills?.prestidigitacao?.checked || false },
                        religiao: { value: charData.skills?.religiao?.value || 0, checked: charData.skills?.religiao?.checked || false },
                        sobrevivencia: { value: charData.skills?.sobrevivencia?.value || 0, checked: charData.skills?.sobrevivencia?.checked || false }
                    },
                    equipment: charData.equipment || [],
                    notes: {
                        treasuredPossessions: charData.notes?.treasuredPossessions || '',
                        rituals: charData.notes?.rituals || '',
                        proficiencies: charData.notes?.proficiencies || '',
                        languages: charData.notes?.languages || '',
                        generalNotes: charData.notes?.generalNotes || ''
                    },
                    history: charData.history || '',
                    weapons: Array.isArray(charData.weapons) ? charData.weapons : [],
                    armors: Array.isArray(charData.armors) ? charData.armors : []
                };

                // Remove incomeAndEconomy from character data if it exists
                delete charData.incomeAndEconomy;

                // Ensure magicInfo structure is initialized
                charData = {
                    ...charData,
                    magicInfo: {
                        keyAbility: charData.magicInfo?.keyAbility || '',
                        attackBonus: charData.magicInfo?.attackBonus || '',
                        dt: charData.magicInfo?.dt || 0
                    }
                };

                // Ensure magicSlots structure is initialized
                charData = {
                    ...charData,
                    magicSlots: {
                        level0: {
                            used: charData.magicSlots?.level0?.used || 0,
                            max: charData.magicSlots?.level0?.max || 0,
                            spells: charData.magicSlots?.level0?.spells || ''
                        },
                        level1: {
                            used: charData.magicSlots?.level1?.used || 0,
                            max: charData.magicSlots?.level1?.max || 0,
                            spells: charData.magicSlots?.level1?.spells || ''
                        },
                        level2: {
                            used: charData.magicSlots?.level2?.used || 0,
                            max: charData.magicSlots?.level2?.max || 0,
                            spells: charData.magicSlots?.level2?.spells || ''
                        },
                        level3: {
                            used: charData.magicSlots?.level3?.used || 0,
                            max: charData.magicSlots?.level3?.max || 0,
                            spells: charData.magicSlots?.level3?.spells || ''
                        },
                        level4: {
                            used: charData.magicSlots?.level4?.used || 0,
                            max: charData.magicSlots?.level4?.max || 0,
                            spells: charData.magicSlots?.level4?.spells || ''
                        },
                        level5: {
                            used: charData.magicSlots?.level5?.used || 0,
                            max: charData.magicSlots?.level5?.max || 0,
                            spells: charData.magicSlots?.level5?.spells || ''
                        },
                        level6: {
                            used: charData.magicSlots?.level6?.used || 0,
                            max: charData.magicSlots?.level6?.max || 0,
                            spells: charData.magicSlots?.level6?.spells || ''
                        },
                        level7: {
                            used: charData.magicSlots?.level7?.used || 0,
                            max: charData.magicSlots?.level7?.max || 0,
                            spells: charData.magicSlots?.level7?.spells || ''
                        },
                        level8: {
                            used: charData.magicSlots?.level8?.used || 0,
                            max: charData.magicSlots?.level8?.max || 0,
                            spells: charData.magicSlots?.level8?.spells || ''
                        },
                        level9: {
                            used: charData.magicSlots?.level9?.used || 0,
                            max: charData.magicSlots?.level9?.max || 0,
                            spells: charData.magicSlots?.level9?.spells || ''
                        }
                    }
                };

                setCharacter(charData);
            } catch (err) {
                console.error('Error loading character:', err);
                setError(`Erro ao carregar ficha: ${err.message || err}`);
            }
            setLoading(false);
        };
        fetchCharacter();
    }, [id]);

    useEffect(() => {
        setImagePreview(character?.image || '');
    }, [character]);

    // Recalculate skills when proficiencyBonus changes
    useEffect(() => {
        if (character) {
            setCharacter(prev => {
                const newSkills = { ...prev.skills };
                Object.keys(attributeSkills).forEach(attr => {
                    const modifier = prev.attributes[attr]?.modifier || 0;
                    const skills = attributeSkills[attr];
                    skills.forEach(skill => {
                        if (newSkills[skill]) {
                            const proficiencyBonus = newSkills[skill].checked ? prev.proficiencyBonus : 0;
                            newSkills[skill].value = modifier + proficiencyBonus;
                        }
                    });
                });
                return { ...prev, skills: newSkills };
            });
        }
    }, [character?.proficiencyBonus]);

    // Update magic attack bonus when attributes change
    useEffect(() => {
        if (character && character.magicInfo?.keyAbility) {
            const attrMap = {
                'Inteligência': 'intelligence',
                'Sabedoria': 'wisdom',
                'Carisma': 'charisma'
            };
            const attr = attrMap[character.magicInfo.keyAbility];
            const modifier = character.attributes[attr]?.modifier || 0;
            setCharacter(prev => ({
                ...prev,
                magicInfo: {
                    ...prev.magicInfo,
                    attackBonus: modifier.toString()
                }
            }));
        }
    }, [character?.attributes?.intelligence?.modifier, character?.attributes?.wisdom?.modifier, character?.attributes?.charisma?.modifier]);

    // Handlers para atualizar campos aninhados
    const handleBasicInfoChange = (field, value) => {
        setCharacter(prev => {
            const newBasicInfo = {
                ...prev.basicInfo,
                [field]: value,
            };

            // If level changed, update proficiency bonus
            if (field === 'level') {
                const newLevel = Number(value);
                const newProficiencyBonus = getProficiencyBonus(newLevel);

                // Recalculate skills with new proficiency bonus
                const newSkills = { ...prev.skills };
                Object.keys(attributeSkills).forEach(attr => {
                    const modifier = prev.attributes[attr]?.modifier || 0;
                    const skills = attributeSkills[attr];
                    skills.forEach(skill => {
                        if (newSkills[skill]) {
                            const proficiencyBonus = newSkills[skill].checked ? newProficiencyBonus : 0;
                            newSkills[skill].value = modifier + proficiencyBonus;
                        }
                    });
                });

                return {
                    ...prev,
                    basicInfo: newBasicInfo,
                    proficiencyBonus: newProficiencyBonus,
                    skills: newSkills,
                };
            }

            return {
                ...prev,
                basicInfo: newBasicInfo,
            };
        });
    };



    const handleChange = (section, field, value) => {
        setCharacter(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const handleMagicSlotsChange = (level, field, value) => {
        setCharacter(prev => ({
            ...prev,
            magicSlots: {
                ...prev.magicSlots,
                [level]: {
                    ...prev.magicSlots[level],
                    [field]: value,
                },
            },
        }));
    };

    const handleMagicSlotCheckboxChange = (level, index) => {
        setCharacter(prev => {
            const currentUsed = prev.magicSlots[level]?.used || 0;
            const newUsed = index + 1 === currentUsed ? index : index + 1;
            return {
                ...prev,
                magicSlots: {
                    ...prev.magicSlots,
                    [level]: {
                        ...prev.magicSlots[level],
                        used: newUsed,
                    },
                },
            };
        });
    };

    const handleAttributeChange = (attribute, field, value) => {
        setCharacter(prev => {
            const newAttributes = {
                ...prev.attributes,
                [attribute]: {
                    ...prev.attributes[attribute],
                    [field]: value,
                },
            };

            // If score changed, calculate modifier
            if (field === 'score') {
                const score = Number(value);
                const modifier = getModifier(score);
                newAttributes[attribute].modifier = modifier;

                // Update saving throw
                newAttributes[attribute].savingThrow = {
                    ...newAttributes[attribute].savingThrow,
                    value: modifier + (newAttributes[attribute].savingThrow?.checked ? prev.proficiencyBonus : 0)
                };

                // Update skills for this attribute
                const newSkills = { ...prev.skills };
                const skillsForAttr = attributeSkills[attribute] || [];
                skillsForAttr.forEach(skill => {
                    if (newSkills[skill]) {
                        const proficiencyBonus = newSkills[skill].checked ? (prev.proficiencyBonus || 0) : 0;
                        newSkills[skill].value = modifier + proficiencyBonus;
                    }
                });

                return {
                    ...prev,
                    attributes: newAttributes,
                    skills: newSkills,
                };
            }

            // If saving throw proficiency changed
            if (field === 'savingThrowChecked') {
                newAttributes[attribute].savingThrow = {
                    ...newAttributes[attribute].savingThrow,
                    checked: value,
                    value: prev.attributes[attribute].modifier + (value ? prev.proficiencyBonus : 0)
                };
                return {
                    ...prev,
                    attributes: newAttributes,
                };
            }

            return {
                ...prev,
                attributes: newAttributes,
            };
        });
    };







    // Removed unused functions: handleSkillChange, addSkill, removeSkill

    const handleWeaponChange = (index, field, value) => {
        const newWeapons = [...(character.weapons || [])];
        newWeapons[index] = { ...newWeapons[index], [field]: value };
        setCharacter(prev => ({ ...prev, weapons: newWeapons }));
    };

    const addWeapon = () => {
        setCharacter(prev => ({
            ...prev,
            weapons: [...(prev.weapons || []), { name: '', type: '', damage: '', range: '', attack: '', proficiency: false }],
        }));
    };

    const removeWeapon = index => {
        const newWeapons = [...(character.weapons || [])];
        newWeapons.splice(index, 1);
        setCharacter(prev => ({ ...prev, weapons: newWeapons }));
    };

    const handleArmorChange = (index, field, value) => {
        const newArmors = [...(character.armors || [])];
        newArmors[index] = { ...newArmors[index], [field]: value };
        setCharacter(prev => ({ ...prev, armors: newArmors }));
    };

    const addArmor = () => {
        setCharacter(prev => ({
            ...prev,
            armors: [...(prev.armors || []), { name: '', type: '', ca: '', stealth: '', weight: 0, proficiency: false }],
        }));
    };

    const removeArmor = index => {
        const newArmors = [...(character.armors || [])];
        newArmors.splice(index, 1);
        setCharacter(prev => ({ ...prev, armors: newArmors }));
    };

    const showNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await characterAPI.update(id, { ...character, diceHistory });
            showNotification('Ficha salva com sucesso!', 'success');
        } catch (err) {
            setError('Erro ao salvar ficha.');
            showNotification('Erro ao salvar ficha.', 'error');
        }
        setSaving(false);
    };

    const handleApplyDamage = () => {
        const damage = Number(healthModifierValue);
        if (damage > 0) {
            setCharacter(prev => {
                const newCurrent = Math.max(0, prev.status.health.current - damage);
                return {
                    ...prev,
                    status: {
                        ...prev.status,
                        health: {
                            ...prev.status.health,
                            current: newCurrent
                        }
                    }
                };
            });
            setHealthModifierValue(0);
        }
    };

    const handleApplyHeal = () => {
        const heal = Number(healthModifierValue);
        if (heal > 0) {
            setCharacter(prev => {
                const maxHealth = prev.status.health.max;
                const newCurrent = Math.min(maxHealth, prev.status.health.current + heal);
                return {
                    ...prev,
                    status: {
                        ...prev.status,
                        health: {
                            ...prev.status.health,
                            current: newCurrent
                        }
                    }
                };
            });
            setHealthModifierValue(0);
        }
    };

    const parseDamageDice = (damageString) => {
        if (!damageString) return null;
        const parts = damageString.split('+').map(part => part.trim());
        const parsedParts = [];
        for (const part of parts) {
            const diceMatch = part.match(/^(\d+)d(\d+)$/i);
            const constantMatch = part.match(/^(\d+)$/);
            if (diceMatch) {
                parsedParts.push({
                    type: 'dice',
                    numDice: parseInt(diceMatch[1], 10),
                    sides: parseInt(diceMatch[2], 10)
                });
            } else if (constantMatch) {
                parsedParts.push({
                    type: 'constant',
                    value: parseInt(constantMatch[1], 10)
                });
            } else {
                return null; // Invalid format
            }
        }
        return parsedParts;
    };

    const rollDamageDice = (index) => {
        const weapon = character.weapons[index];
        const parsed = parseDamageDice(weapon.damage);

        if (!parsed) {
            showNotification('Formato de dano inválido. Use algo como "1d6+2".', 'error');
            return;
        }

        setIsRollingDice(true);
        setShowDiceModal(true);
        setRollResult(null);

        setTimeout(() => {
            let total = 0;
            let rolls = [];
            let constants = [];

            for (const part of parsed) {
                if (part.type === 'dice') {
                    for (let i = 0; i < part.numDice; i++) {
                        const roll = Math.floor(Math.random() * part.sides) + 1;
                        rolls.push(roll);
                        total += roll;
                    }
                } else if (part.type === 'constant') {
                    constants.push(part.value);
                    total += part.value;
                }
            }

            const newRoll = {
                rollType: 'damage',
                rollName: weapon.name || 'Arma',
                diceType: weapon.damage,
                numDice: rolls.length,
                total,
                rolls,
                constants,
                breakdown: [`Rolou ${rolls.length}x dados: ${rolls.join(', ')}`, ...(constants.length > 0 ? [`Constantes: ${constants.join(', ')}`] : [])],
                timestamp: new Date().toLocaleString()
            };

            setRollResult(newRoll);
            setIsRollingDice(false);
        }, 1000);
    };

    const rollDice = () => {
        const dice = diceTypes.find(d => d.label === selectedDice);
        if (!dice) return;

        setIsRollingDice(true);

        setTimeout(() => {
            let total = 0;
            let rolls = [];

            for (let i = 0; i < numDice; i++) {
                const roll = Math.floor(Math.random() * dice.sides) + 1;
                rolls.push(roll);
                total += roll;
            }

            const newRoll = {
                rollType: 'general',
                rollName: `${numDice}x${selectedDice}`,
                diceType: selectedDice,
                numDice,
                total,
                rolls,
                breakdown: [`Rolou ${numDice}x${selectedDice}: ${rolls.join(', ')}`],
                timestamp: new Date().toLocaleString()
            };

            setRollResult(newRoll);
            setIsRollingDice(false);
        }, 1000);
    };

    const handleRollLuck = () => {
        setIsRolling(true);
        setShowModal(true);
        setModalMessage("Rolando dados...");
        setIsSkillRoll(false);
        setRollCategory('SORTE');
        setRollName('Sorte');

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll; // No modifier for luck
            setRollValue(total);
            setRollDie(roll);
            setRollModifier(0);

            let level = 'Fracasso';
            let success = false;
            if (total <= 1) {
                level = 'Desastre';
                success = false;
            } else if (total >= 2 && total <= 7) {
                level = 'Fracasso';
                success = false;
            } else if (total >= 8 && total <= 14) {
                level = 'Sucesso Parcial';
                success = true;
            } else if (total >= 15) {
                level = 'Sucesso Completo';
                success = true;
            }
            setSuccessLevel(level);
            setIsSuccess(success);

            const message = `Resultado de Sorte: Dado ${roll} - ${level}`;
            setModalMessage(message);
            setIsRolling(false);

            // Add roll to history
            const newRoll = {
                rollType: 'luck',
                rollName: 'Sorte',
                diceType: 'd20',
                total: total,
                rolls: [roll],
                successLevel: level,
                timestamp: new Date().toLocaleString()
            };
            setDiceHistory(prev => [newRoll, ...prev]);
        }, 1500);
    };

    const handleRollD20 = (category) => {
        if (typeof category !== 'string') category = 'ATRIBUTOS';
        setIsRolling(true);
        setShowModal(true);
        setModalMessage("Rolando dados...");
        setIsSkillRoll(false);
        setRollCategory(category);
        setRollName('1d20');

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 20) + 1;
            setRollValue(roll);
            setRollDie(roll);
            setRollModifier(0);
            setSuccessLevel('');
            setIsSuccess(true);

            const message = `Resultado de 1d20: ${roll}`;
            setModalMessage(message);
            setIsRolling(false);

            // Add roll to history
            const newRoll = {
                rollType: 'general',
                rollName: '1d20',
                diceType: 'd20',
                numDice: 1,
                total: roll,
                rolls: [roll],
                category: category === 'ATRIBUTOS' ? 'Atributos e Perícias' : category === 'COMBATE' ? 'Combate' : 'Geral',
                timestamp: new Date().toLocaleString()
            };
            setDiceHistory(prev => [newRoll, ...prev]);
        }, 1500);
    };

    if (loading) return <p>Carregando ficha...</p>;
    if (error) return <p className="errorText">{error}</p>;
    if (!character) return <p>Ficha não encontrada.</p>;

    return (
        <>
            {notifications.map(notification => (
                <Notification
                    key={notification.id}
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                />
            ))}
            <div className="container">
                {isNPCOrMonster && (
                    <div className="npcMonsterNotice">
                        <p>Esta é uma ficha de {character.characterType === 'npc' ? 'NPC' : 'Monstro'}. Apenas seções relevantes são exibidas.</p>
                    </div>
                )}
                <header className="header">
                    <h1 className="headerTitle">
                        {isMasterMode ? 'Editar Ficha (Mestre) - ' : 'Ficha de '}{character.basicInfo.name || 'Investigador'}
                    </h1>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="logoutButton"
                        title="Sair"
                    >
                        Sair
                    </button>
                </header>

                <section className="section">
                    <div className="sectionHeader">DETALHES PESSOAIS</div>
                    <div className="detailsContainer">
                        <div className="leftColumn">
                            <label className="label">Nome</label>
                            <input
                                type="text"
                                value={character.basicInfo.name || ''}
                                onChange={e => handleBasicInfoChange('name', e.target.value)}
                                className="input"
                                placeholder="Nome do Personagem"
                            />
                            <label className="label">Jogador</label>
                            <input
                                type="text"
                                value={character.basicInfo.player || ''}
                                onChange={e => handleBasicInfoChange('player', e.target.value)}
                                className="input"
                                placeholder="Nome do Jogador"
                            />
                            <label className="label">Raça</label>
                            <input
                                type="text"
                                value={character.basicInfo.race || ''}
                                onChange={e => handleBasicInfoChange('race', e.target.value)}
                                className="input"
                                placeholder="Raça"
                            />
                            <label className="label">Classe</label>
                            <input
                                type="text"
                                value={character.basicInfo.class || ''}
                                onChange={e => handleBasicInfoChange('class', e.target.value)}
                                className="input"
                                placeholder="Classe"
                            />
                            {!isMonster && (
                                <>
                                    <label className="label">Antecedentes</label>
                                    <input
                                        type="text"
                                        value={character.basicInfo.background || ''}
                                        onChange={e => handleBasicInfoChange('background', e.target.value)}
                                        className="input"
                                        placeholder="Antecedentes"
                                    />
                                </>
                            )}
                            <label className="label">Tendência</label>
                            <input
                                type="text"
                                value={character.basicInfo.alignment || ''}
                                onChange={e => handleBasicInfoChange('alignment', e.target.value)}
                                className="input"
                                placeholder="Tendência"
                            />
                            <label className="levelLabel">Nível</label>
                            <input
                                type="number"
                                min="0"
                                value={character.basicInfo.level || 0}
                                onChange={e => handleBasicInfoChange('level', Number(e.target.value))}
                                className="levelInput"
                                placeholder="Nível"
                            />
                        </div>
                        <div className="rightColumn">
                            <div className="imageDiceContainer">
                                <div
                                    onClick={() => imageInputRef.current?.click()}
                                    className="imageContainer"
                                >
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Imagem do personagem"
                                            className="characterImage"
                                        />
                                    ) : (
                                        <div className="noImage">
                                            Sem imagem
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDiceModal(true);
                                        setRollResult(null);
                                    }}
                                    className="diceButtonInline"
                                    title="Rolar Dados"
                                >
                                    <img src="/images/unnamed(1).png" alt="Dados" className="diceImage" />
                                </button>
                            </div>

                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="fileInput"
                            />

                            {/* Status Bars */}
                            <div className="barsContainer">
                                {/* Health Modifiers */}
                                <div className="healthModifiersContainer">
                                    <input
                                        type="number"
                                        min="0"
                                        value={healthModifierValue}
                                        onChange={e => setHealthModifierValue(Number(e.target.value))}
                                        className="healthModifierInput"
                                        placeholder="Valor"
                                    />
                                    <button
                                        onClick={handleApplyDamage}
                                        className="healthModifierButton damageButton"
                                    >
                                    Dano
                                    </button>
                                    <button
                                        onClick={handleApplyHeal}
                                        className="healthModifierButton healButton"
                                    >
                                    Cura
                                    </button>
                                </div>

                                {/* HP Bar */}
                                <div className="hpBarContainer">
                                    <div className="barLabel">Vida</div>
                                    <div className="bar">
                                        <div
                                            className={(character.status?.health?.current || 0) === 0 ? "emptyBar" : "hpBar"}
                                            style={{
                                                width: `${Math.min(100, (character.status?.health?.current || 0) / Math.max((character.status?.health?.max || 1), 1) * 100)}%`,
                                            }}
                                        />
                                        <div className="overlayInput">
                                            <input
                                                type="number"
                                                min="0"
                                                max={character.status?.health?.maximum || 99}
                                                value={character.status?.health?.current || 0}
                                                onChange={e => {
                                                    const newStatus = { ...character.status };
                                                    newStatus.health = { ...newStatus.health, current: Math.min(Number(e.target.value), newStatus.health.maximum || 99) };
                                                    setCharacter(prev => ({ ...prev, status: newStatus }));
                                                }}
                                                className="smallInput"
                                            />
                                            <span>/</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={character.status?.health?.max || 0}
                                                onChange={e => {
                                                    const newStatus = { ...character.status };
                                                    const newMax = Number(e.target.value);
                                                    newStatus.health = {
                                                        ...newStatus.health,
                                                        max: newMax,
                                                        current: Math.min(newStatus.health.current || 0, newMax)
                                                    };
                                                    setCharacter(prev => ({ ...prev, status: newStatus }));
                                                }}
                                                className="smallInput"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Temporary Health Input */}
                                <div className="healthInputsContainer">
                                    <div className="healthInputGroup">
                                        <label className="healthBarLabel">Vida Temporária</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={character.status?.health?.temporary || 0}
                                            onChange={e => {
                                                const newStatus = { ...character.status };
                                                newStatus.health = { ...newStatus.health, temporary: Number(e.target.value) };
                                                setCharacter(prev => ({ ...prev, status: newStatus }));
                                            }}
                                            className="healthInput"
                                            placeholder="Temp"
                                        />
                                    </div>
                                </div>
                                {/* Health Dice */}
                                <div className="healthDiceContainer">
                                    <div className="healthDiceLabel">Dados de Vida</div>
                                    <div className="healthDiceInputs">
                                        <input
                                            type="number"
                                            min="0"
                                            value={character.status?.healthDice?.total || 0}
                                            onChange={e => {
                                                const newStatus = { ...character.status };
                                                newStatus.healthDice = { ...newStatus.healthDice, total: Number(e.target.value) };
                                                setCharacter(prev => ({ ...prev, status: newStatus }));
                                            }}
                                            className="smallInput"
                                            placeholder="Total"
                                        />
                                        <span>/</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={character.status?.healthDice?.max || 0}
                                            onChange={e => {
                                                const newStatus = { ...character.status };
                                                newStatus.healthDice = { ...newStatus.healthDice, max: Number(e.target.value) };
                                                setCharacter(prev => ({ ...prev, status: newStatus }));
                                            }}
                                            className="smallInput"
                                            placeholder="Máx"
                                        />
                                    </div>
                                </div>

                                {/* Death Saves */}
                                <div className="deathSavesContainer">
                                    <div className="deathSavesLabel">Testes Contra a Morte</div>
                                    <div className="deathSavesInputs">
                                        <div className="deathSaveRow">
                                            <span className="deathSaveType">Sucesso</span>
                                            {[0, 1, 2].map(index => (
                                                <input
                                                    key={index}
                                                    type="checkbox"
                                                    className="checkboxInput success"
                                                    checked={(character.status?.deathSaves?.success || 0) > index}
                                                    onChange={e => {
                                                        const newStatus = { ...character.status };
                                                        const currentSuccess = newStatus.deathSaves?.success || 0;
                                                        const newSuccess = e.target.checked ? currentSuccess + 1 : currentSuccess - 1;
                                                        newStatus.deathSaves = { ...newStatus.deathSaves, success: Math.max(0, Math.min(3, newSuccess)) };
                                                        setCharacter(prev => ({ ...prev, status: newStatus }));
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="deathSaveRow">
                                            <span className="deathSaveType">Fracasso</span>
                                            {[0, 1, 2].map(index => (
                                                <input
                                                    key={index}
                                                    type="checkbox"
                                                    className="checkboxInput failure"
                                                    checked={(character.status?.deathSaves?.failure || 0) > index}
                                                    onChange={e => {
                                                        const newStatus = { ...character.status };
                                                        const currentFailure = newStatus.deathSaves?.failure || 0;
                                                        const newFailure = e.target.checked ? currentFailure + 1 : currentFailure - 1;
                                                        newStatus.deathSaves = { ...newStatus.deathSaves, failure: Math.max(0, Math.min(3, newFailure)) };
                                                        setCharacter(prev => ({ ...prev, status: newStatus }));
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>



                        </div>
                    </div>
                </section>



                {/* Atributos e Perícias */}
                <section className="section">
                    <div className="sectionHeaderWithDice">
                        <span className="sectionTitle">Atributos e Perícias</span>
                        <button
                            onClick={() => handleRollD20('ATRIBUTOS')}
                            className="diceButton"
                            title="Rolar 1d20"
                        >
                            <img src="/images/unnamed(1).png" alt="Dados" className="diceIconSmall" />
                        </button>
                    </div>
                    <div className="inspirationProficiencyContainer">
                        <div className="inspirationStat">
                            <label className="inspirationLabel">Inspiração</label>
                            <input
                                type="checkbox"
                                checked={!!character.inspiration}
                                onChange={e => setCharacter(prev => ({ ...prev, inspiration: e.target.checked ? 1 : 0 }))}
                                className="inspirationCheckbox"
                            />
                        </div>
                        <div className="proficiencyStat">
                            <label className="proficiencyLabel">Bônus de Proficiência</label>
                            <input
                                type="number"
                                min="0"
                                value={character.proficiencyBonus || 0}
                                readOnly
                                className="proficiencyInput"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="attributesBorder">
                        <div className="attributesGrid">
                            {/* Força */}
                            <div className="strengthColumn">
                                <h3 className="strengthHeader">
                                    <input
                                        type="checkbox"
                                        checked={character.attributes?.strength?.savingThrow?.checked || false}
                                        onChange={e => handleAttributeChange('strength', 'savingThrowChecked', e.target.checked)}
                                        className="attributeProficiencyCheckbox"
                                    />
                                    {translations.attributes.strength}
                                </h3>
                                <div className="strengthItem">
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={character.attributes?.strength?.score || 0}
                                        onChange={e => handleAttributeChange('strength', 'score', Number(e.target.value))}
                                        className="valueInput"
                                        placeholder="Score"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="10"
                                        value={character.attributes?.strength?.modifier || 0}
                                        readOnly
                                        className="smallInputmd"
                                        placeholder="Mod"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="15"
                                        value={character.attributes?.strength?.savingThrow?.value || 0}
                                        readOnly
                                        className="smallInputst"
                                        placeholder="ST"
                                    />
                                </div>
                                <div className="atletismoBlock">
                                    <h4 className="atletismoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.atletismo?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.strength?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        atletismo: { ...prev.skills.atletismo, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Atletismo
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.atletismo?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                atletismo: { ...prev.skills.atletismo, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="atletismoInput"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Destreza */}
                            <div className="dexterityColumn">
                                <h3 className="dexterityHeader">
                                    <input
                                        type="checkbox"
                                        checked={character.attributes?.dexterity?.savingThrow?.checked || false}
                                        onChange={e => handleAttributeChange('dexterity', 'savingThrowChecked', e.target.checked)}
                                        className="attributeProficiencyCheckbox"
                                    />
                                    {translations.attributes.dexterity}
                                </h3>
                                <div className="dexterityItem">
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={character.attributes?.dexterity?.score || 0}
                                        onChange={e => handleAttributeChange('dexterity', 'score', Number(e.target.value))}
                                        className="valueInput"
                                        placeholder="Score"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="10"
                                        value={character.attributes?.dexterity?.modifier || 0}
                                        readOnly
                                        className="smallInputmd"
                                        placeholder="Mod"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="15"
                                        value={character.attributes?.dexterity?.savingThrow?.value || 0}
                                        readOnly
                                        className="smallInputst"
                                        placeholder="ST"
                                    />
                                </div>
                                <div className="acrobaciaBlock">
                                    <h4 className="acrobaciaHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.acrobacia?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.dexterity?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        acrobacia: { ...prev.skills.acrobacia, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Acrobacia
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.acrobacia?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                acrobacia: { ...prev.skills.acrobacia, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="acrobaciaInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="furtividadeBlock">
                                    <h4 className="furtividadeHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.furtividade?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.dexterity?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        furtividade: { ...prev.skills.furtividade, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Furtividade
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.furtividade?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                furtividade: { ...prev.skills.furtividade, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="furtividadeInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="prestidigitacaoBlock">
                                    <h4 className="prestidigitacaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.prestidigitacao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.dexterity?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        prestidigitacao: { ...prev.skills.prestidigitacao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Prestidigitação
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.prestidigitacao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                prestidigitacao: { ...prev.skills.prestidigitacao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="prestidigitacaoInput"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Constituição */}
                            <div className="constitutionColumn">
                                <h3 className="constitutionHeader">
                                    <input
                                        type="checkbox"
                                        checked={character.attributes?.constitution?.savingThrow?.checked || false}
                                        onChange={e => handleAttributeChange('constitution', 'savingThrowChecked', e.target.checked)}
                                        className="attributeProficiencyCheckbox"
                                    />
                                    {translations.attributes.constitution}
                                </h3>
                                <div className="constitutionItem">
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={character.attributes?.constitution?.score || 0}
                                        onChange={e => handleAttributeChange('constitution', 'score', Number(e.target.value))}
                                        className="valueInput"
                                        placeholder="Score"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="10"
                                        value={character.attributes?.constitution?.modifier || 0}
                                        readOnly
                                        className="smallInputmd"
                                        placeholder="Mod"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="15"
                                        value={character.attributes?.constitution?.savingThrow?.value || 0}
                                        readOnly
                                        className="smallInputst"
                                        placeholder="ST"
                                    />
                                </div>
                            </div>

                            {/* Inteligência */}
                            <div className="intelligenceColumn">
                                <h3 className="intelligenceHeader">
                                    <input
                                        type="checkbox"
                                        checked={character.attributes?.intelligence?.savingThrow?.checked || false}
                                        onChange={e => handleAttributeChange('intelligence', 'savingThrowChecked', e.target.checked)}
                                        className="attributeProficiencyCheckbox"
                                    />
                                    {translations.attributes.intelligence}
                                </h3>
                                <div className="intelligenceItem">
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={character.attributes?.intelligence?.score || 0}
                                        onChange={e => handleAttributeChange('intelligence', 'score', Number(e.target.value))}
                                        className="valueInput"
                                        placeholder="Score"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="10"
                                        value={character.attributes?.intelligence?.modifier || 0}
                                        readOnly
                                        className="smallInputmd"
                                        placeholder="Mod"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="15"
                                        value={character.attributes?.intelligence?.savingThrow?.value || 0}
                                        readOnly
                                        className="smallInputst"
                                        placeholder="ST"
                                    />
                                </div>
                                <div className="arcanismoBlock">
                                    <h4 className="arcanismoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.arcanismo?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.intelligence?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        arcanismo: { ...prev.skills.arcanismo, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Arcanismo
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.arcanismo?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                arcanismo: { ...prev.skills.arcanismo, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="arcanismoInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="historiaBlock">
                                    <h4 className="historiaHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.historia?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.intelligence?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        historia: { ...prev.skills.historia, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        História
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.historia?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                historia: { ...prev.skills.historia, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="historiaInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="investigacaoBlock">
                                    <h4 className="investigacaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.investigacao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.intelligence?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        investigacao: { ...prev.skills.investigacao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Investigação
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.investigacao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                investigacao: { ...prev.skills.investigacao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="investigacaoInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="naturezaBlock">
                                    <h4 className="naturezaHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.natureza?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.intelligence?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        natureza: { ...prev.skills.natureza, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Natureza
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.natureza?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                natureza: { ...prev.skills.natureza, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="naturezaInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="religiaoBlock">
                                    <h4 className="religiaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.religiao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.intelligence?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        religiao: { ...prev.skills.religiao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Religião
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.religiao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                religiao: { ...prev.skills.religiao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="religiaoInput"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Sabedoria */}
                            <div className="wisdomColumn">
                                <h3 className="wisdomHeader">
                                    <input
                                        type="checkbox"
                                        checked={character.attributes?.wisdom?.savingThrow?.checked || false}
                                        onChange={e => handleAttributeChange('wisdom', 'savingThrowChecked', e.target.checked)}
                                        className="attributeProficiencyCheckbox"
                                    />
                                    {translations.attributes.wisdom}
                                </h3>
                                <div className="wisdomItem">
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={character.attributes?.wisdom?.score || 0}
                                        onChange={e => handleAttributeChange('wisdom', 'score', Number(e.target.value))}
                                        className="valueInput"
                                        placeholder="Score"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="10"
                                        value={character.attributes?.wisdom?.modifier || 0}
                                        readOnly
                                        className="smallInputmd"
                                        placeholder="Mod"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="15"
                                        value={character.attributes?.wisdom?.savingThrow?.value || 0}
                                        readOnly
                                        className="smallInputst"
                                        placeholder="ST"
                                    />
                                </div>
                                <div className="intuicaoBlock">
                                    <h4 className="intuicaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.intuicao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.wisdom?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        intuicao: { ...prev.skills.intuicao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Intuição
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.intuicao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                intuicao: { ...prev.skills.intuicao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="intuicaoInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="lidarComAnimaisBlock">
                                    <h4 className="lidarComAnimaisHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.lidarComAnimais?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.wisdom?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        lidarComAnimais: { ...prev.skills.lidarComAnimais, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Lidar com Animais
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.lidarComAnimais?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                lidarComAnimais: { ...prev.skills.lidarComAnimais, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="lidarComAnimaisInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="medicinaBlock">
                                    <h4 className="medicinaHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.medicina?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.wisdom?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        medicina: { ...prev.skills.medicina, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Medicina
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.medicina?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                medicina: { ...prev.skills.medicina, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="medicinaInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="percepcaoBlock">
                                    <h4 className="percepcaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.percepcao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.wisdom?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        percepcao: { ...prev.skills.percepcao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Percepção
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.percepcao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                percepcao: { ...prev.skills.percepcao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="percepcaoInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="sobrevivenciaBlock">
                                    <h4 className="sobrevivenciaHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.sobrevivencia?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.wisdom?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        sobrevivencia: { ...prev.skills.sobrevivencia, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Sobrevivência
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.sobrevivencia?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                sobrevivencia: { ...prev.skills.sobrevivencia, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="sobrevivenciaInput"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Carisma */}
                            <div className="charismaColumn">
                                <h3 className="charismaHeader">
                                    <input
                                        type="checkbox"
                                        checked={character.attributes?.charisma?.savingThrow?.checked || false}
                                        onChange={e => handleAttributeChange('charisma', 'savingThrowChecked', e.target.checked)}
                                        className="attributeProficiencyCheckbox"
                                    />
                                    {translations.attributes.charisma}
                                </h3>
                                <div className="charismaItem">
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={character.attributes?.charisma?.score || 0}
                                        onChange={e => handleAttributeChange('charisma', 'score', Number(e.target.value))}
                                        className="valueInput"
                                        placeholder="Score"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="10"
                                        value={character.attributes?.charisma?.modifier || 0}
                                        readOnly
                                        className="smallInputmd"
                                        placeholder="Mod"
                                    />
                                    <input
                                        type="number"
                                        min="-5"
                                        max="15"
                                        value={character.attributes?.charisma?.savingThrow?.value || 0}
                                        readOnly
                                        className="smallInputst"
                                        placeholder="ST"
                                    />
                                </div>
                                <div className="atuacaoBlock">
                                    <h4 className="atuacaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.atuacao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.charisma?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        atuacao: { ...prev.skills.atuacao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Atuação
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.atuacao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                atuacao: { ...prev.skills.atuacao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="atuacaoInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="blefarBlock">
                                    <h4 className="blefarHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.blefar?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.charisma?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        blefar: { ...prev.skills.blefar, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Blefar
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.blefar?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                blefar: { ...prev.skills.blefar, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="blefarInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="intimidacaoBlock">
                                    <h4 className="intimidacaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.intimidacao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.charisma?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        intimidacao: { ...prev.skills.intimidacao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Intimidação
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.intimidacao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                intimidacao: { ...prev.skills.intimidacao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="intimidacaoInput"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="persuasaoBlock">
                                    <h4 className="persuasaoHeader">
                                        <input
                                            type="checkbox"
                                            checked={character.skills?.persuasao?.checked || false}
                                            onChange={e => setCharacter(prev => {
                                                const modifier = prev.attributes.charisma?.modifier || 0;
                                                const proficiencyBonus = e.target.checked ? prev.proficiencyBonus : 0;
                                                const newValue = modifier + proficiencyBonus;
                                                return {
                                                    ...prev,
                                                    skills: {
                                                        ...prev.skills,
                                                        persuasao: { ...prev.skills.persuasao, checked: e.target.checked, value: newValue }
                                                    }
                                                };
                                            })}
                                            className="skillCheckbox"
                                        />
                                        Persuasão
                                    </h4>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={character.skills?.persuasao?.value || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                persuasao: { ...prev.skills.persuasao, value: Number(e.target.value) }
                                            }
                                        }))}
                                        className="persuasaoInput"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Proficiências */}
                <section className="section">
                    <div className="sectionHeader">Proficiências</div>
                    <div className="sectionBorder">
                        <div className="skillsContainer">
                            <div className="skillItem">
                                <textarea
                                    value={character.notes?.proficiencies || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, proficiencies: e.target.value }
                                    }))}
                                    className="textarea habilidadesTextarea"
                                    placeholder="Proficiências..."
                                />
                            </div>
                            <div className="skillItem">
                                <textarea
                                    value={character.notes?.languages || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, languages: e.target.value }
                                    }))}
                                    className="textarea habilidadesTextarea"
                                    placeholder="Proficiências..."
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Combate */}
                <section className="section">
                    <div className="sectionHeaderWithDice">
                        <span className="sectionTitle">Combate</span>
                        <button
                            onClick={() => handleRollD20('COMBATE')}
                            className="diceButton"
                            title="Rolar 1d20"
                        >
                            <img src="/images/unnamed(1).png" alt="Dados" className="diceIconSmall" />
                        </button>
                    </div>
                    <div className="combatStats">
                        <div className="combatStat">
                            <label className="combatLabel">Defesa</label>
                            <input
                                type="number"
                                min="0"
                                value={character.combat?.defense || 0}
                                onChange={e => handleChange('combat', 'defense', Number(e.target.value))}
                                className="combatInput"
                                placeholder="0"
                            />
                        </div>
                        <div className="combatStat">
                            <label className="combatLabel">Iniciativa</label>
                            <input
                                type="number"
                                min="-5"
                                max="10"
                                value={character.attributes?.dexterity?.modifier || 0}
                                readOnly
                                className="combatInput"
                                placeholder="0"
                            />
                        </div>
                        <div className="combatStat">
                            <label className="combatLabel">Deslocamento</label>
                            <input
                                type="number"
                                min="0"
                                value={character.combat?.movement || 0}
                                onChange={e => handleChange('combat', 'movement', Number(e.target.value))}
                                className="combatInput"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    {(character.weapons && character.weapons.length > 0) ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="th">Proficiência</th>
                                    <th className="th">Nome</th>
                                    <th className="th">Tipo</th>
                                    <th className="th">Dano</th>
                                    <th className="th">Alcance</th>
                                    <th className="th">Efeitos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {character.weapons.map((weapon, index) => (
                                    <tr key={index}>
                                        <td className="td">
                                            <input
                                                type="checkbox"
                                                checked={weapon.proficiency || false}
                                                onChange={e => handleWeaponChange(index, 'proficiency', e.target.checked)}
                                                className="skillCheckbox"
                                            />
                                        </td>
                                        <td className="td">
                                            <input
                                                type="text"
                                                value={weapon.name || ''}
                                                onChange={e => handleWeaponChange(index, 'name', e.target.value)}
                                                className="tableInput"
                                                placeholder="Nome"
                                            />
                                        </td>
                                        <td className="td">
                                            <select
                                                value={weapon.type || ''}
                                                onChange={e => handleWeaponChange(index, 'type', e.target.value)}
                                                className="tableInput"
                                            >
                                                <option value="">Selecione o tipo</option>
                                                <option value="Contundente">Contundente</option>
                                                <option value="Perfurante">Perfurante</option>
                                                <option value="Cortante">Cortante</option>
                                                <option value="Ácido">Ácido</option>
                                                <option value="Mágico">Mágico</option>
                                                <option value="Necrótico">Necrótico</option>
                                                <option value="Psíquico">Psíquico</option>
                                                <option value="Venenoso">Venenoso</option>
                                            </select>
                                        </td>
                                        <td className="td damageTd">
                                            <input
                                                type="text"
                                                value={weapon.damage || ''}
                                                onChange={e => handleWeaponChange(index, 'damage', e.target.value)}
                                                className="tableInput"
                                                placeholder="Dano"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    rollDamageDice(index);
                                                }}
                                                className="diceButtonSmall"
                                                title="Rolar Dano"
                                            >
                                                <img src="/images/unnamed(1).png" alt="Rolar Dado" className="damageRollImg24" />
                                            </button>
                                        </td>
                                        <td className="td">
                                            <input
                                                type="text"
                                                value={weapon.range || ''}
                                                onChange={e => handleWeaponChange(index, 'range', e.target.value)}
                                                className="tableInput"
                                                placeholder="Alcance"
                                            />
                                        </td>
                                        <td className="td">
                                            <input
                                                type="text"
                                                value={weapon.attack || ''}
                                                onChange={e => handleWeaponChange(index, 'attack', e.target.value)}
                                                className="tableInput"
                                                placeholder="Efeitos"
                                            />
                                        </td>
                                        <td className="td">
                                            <button
                                                onClick={() => removeWeapon(index)}
                                                className="buttonDanger"
                                                title="Remover"
                                            >
                                                X
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Nenhum item de combate cadastrado.</p>
                    )}
                    <button onClick={addWeapon} className="button-primary">+ Adicionar Item</button>
                    <br />
                    <br />
                    {(character.armors && character.armors.length > 0) ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="th">Proficiência</th>
                                    <th className="th">Nome</th>
                                    <th className="th">Tipo</th>
                                    <th className="th">CA</th>
                                    <th className="th">Furtividade</th>
                                    <th className="th">Peso (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {character.armors.map((armor, index) => (
                                    <tr key={index}>
                                        <td className="td">
                                            <input
                                                type="checkbox"
                                                checked={armor.proficiency || false}
                                                onChange={e => handleArmorChange(index, 'proficiency', e.target.checked)}
                                                className="skillCheckbox"
                                            />
                                        </td>
                                        <td className="td">
                                            <input
                                                type="text"
                                                value={armor.name || ''}
                                                onChange={e => handleArmorChange(index, 'name', e.target.value)}
                                                className="tableInput"
                                                placeholder="Nome"
                                            />
                                        </td>
                                        <td className="td">
                                            <select
                                                value={armor.type || ''}
                                                onChange={e => handleArmorChange(index, 'type', e.target.value)}
                                                className="tableInput"
                                            >
                                                <option value="">Selecione o tipo</option>
                                                <option value="Armadura Leve">Armadura Leve</option>
                                                <option value="Armadura Média">Armadura Média</option>
                                                <option value="Armadura Pesada">Armadura Pesada</option>
                                                <option value="Escudo">Escudo</option>
                                            </select>
                                        </td>
                                        <td className="td">
                                            <input
                                                type="text"
                                                value={armor.ca || ''}
                                                onChange={e => handleArmorChange(index, 'ca', e.target.value)}
                                                className="tableInput"
                                                placeholder="CA"
                                            />
                                        </td>
                                        <td className="td">
                                            <select
                                                value={armor.stealth || ''}
                                                onChange={e => handleArmorChange(index, 'stealth', e.target.value)}
                                                className="tableInput"
                                            >
                                                <option value="">Selecione</option>
                                                <option value="Desvantagem">Desvantagem</option>
                                            </select>
                                        </td>
                                        <td className="td">
                                            <input
                                                type="number"
                                                min="0"
                                                value={armor.weight || 0}
                                                onChange={e => handleArmorChange(index, 'weight', Number(e.target.value))}
                                                className="tableInput"
                                                placeholder="Peso"
                                            />
                                        </td>
                                        <td className="td">
                                            <button
                                                onClick={() => removeArmor(index)}
                                                className="buttonDanger"
                                                title="Remover"
                                            >
                                                X
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Nenhuma armadura cadastrada.</p>
                    )}
                    <button onClick={addArmor} className="button-primary">+ Adicionar Armadura</button>
                </section>

                {!isMonster && (
                    <>
                        {/* Equipamentos */}
                        <section className="section">
                            <div className="sectionHeader">Equipamentos</div>
                            {(character.equipment && character.equipment.length > 0) ? (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th className="theq">Nome</th>
                                            <th className="theq">Quantidade</th>
                                            <th className="th">Descrição</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {character.equipment.map((item, index) => (
                                            <tr key={index}>
                                                <td className="td">
                                                    <input
                                                        type="text"
                                                        value={item.name || ''}
                                                        onChange={e => {
                                                            const newEquipment = [...character.equipment];
                                                            newEquipment[index] = { ...newEquipment[index], name: e.target.value };
                                                            setCharacter(prev => ({ ...prev, equipment: newEquipment }));
                                                        }}
                                                        className="nameInput"
                                                        placeholder="Nome"
                                                    />
                                                </td>
                                                <td className="td">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity || 1}
                                                        onChange={e => {
                                                            const newEquipment = [...character.equipment];
                                                            newEquipment[index] = { ...newEquipment[index], quantity: Number(e.target.value) };
                                                            setCharacter(prev => ({ ...prev, equipment: newEquipment }));
                                                        }}
                                                        className="quantityInput"
                                                        placeholder="Quantidade"
                                                    />
                                                </td>
                                                <td className="td">
                                                    <input
                                                        type="text"
                                                        value={item.description || ''}
                                                        onChange={e => {
                                                            const newEquipment = [...character.equipment];
                                                            newEquipment[index] = { ...newEquipment[index], description: e.target.value };
                                                            setCharacter(prev => ({ ...prev, equipment: newEquipment }));
                                                        }}
                                                        className="descriptionInput"
                                                        placeholder="Descrição"
                                                    />
                                                </td>
                                                <td className="td">
                                                    <button
                                                        onClick={() => {
                                                            const newEquipment = [...character.equipment];
                                                            newEquipment.splice(index, 1);
                                                            setCharacter(prev => ({ ...prev, equipment: newEquipment }));
                                                        }}
                                                        className="buttonDanger"
                                                        title="Remover"
                                                    >
                                                        X
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>Nenhum equipamento cadastrado.</p>
                            )}
                            <button
                                onClick={() => {
                                    setCharacter(prev => ({
                                        ...prev,
                                        equipment: [...(prev.equipment || []), { name: '', quantity: 1, description: '' }]
                                    }));
                                }}
                                className="button-primary"
                            >
                                + Adicionar Equipamento
                            </button>
                        </section>
                    </>
                )}

                {/* Habilidades */}
                <section className="section">
                    <div className="sectionHeader">Habilidades</div>
                    <div className="sectionBorder">
                        <div className="skillsContainer">
                            <div className="skillItem">
                                <textarea
                                    value={character.notes?.treasuredPossessions || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, treasuredPossessions: e.target.value }
                                    }))}
                                    className="textarea habilidadesTextarea"
                                    placeholder="Habilidades..."
                                />
                            </div>
                            <div className="skillItem">
                                <textarea
                                    value={character.notes?.rituals || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, rituals: e.target.value }
                                    }))}
                                    className="textarea habilidadesTextarea"
                                    placeholder="Habilidades..."
                                />
                            </div>
                        </div>

                    </div>

                </section>



                {/* Mágicka */}
                <section className="section">
                    <div className="sectionHeader">Mágicka</div>
                        <div className="sectionBorder">
                            <div className="magicStats">
                                <div className="magicStat">
                                    <label className="magicLabel">Habilidade Chave</label>
                                    <select
                                        value={character.magicInfo?.keyAbility || ''}
                                        onChange={e => {
                                            const selected = e.target.value;
                                            const attrMap = {
                                                'Inteligência': 'intelligence',
                                                'Sabedoria': 'wisdom',
                                                'Carisma': 'charisma'
                                            };
                                            const attr = attrMap[selected];
                                            const modifier = character.attributes[attr]?.modifier || 0;
                                            setCharacter(prev => ({
                                                ...prev,
                                                magicInfo: {
                                                    ...prev.magicInfo,
                                                    keyAbility: selected,
                                                    attackBonus: modifier.toString()
                                                }
                                            }));
                                        }}
                                        className="magicInput"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Inteligência">Inteligência</option>
                                        <option value="Sabedoria">Sabedoria</option>
                                        <option value="Carisma">Carisma</option>
                                    </select>
                                </div>
                                <div className="magicStat">
                                    <label className="magicLabel">Bônus de Ataque</label>
                                    <input
                                        type="number"
                                        value={character.magicInfo?.attackBonus || 0}
                                        readOnly
                                        className="magicInput"
                                        placeholder="Bônus de Ataque"
                                    />
                                </div>
                                <div className="magicStat">
                                    <label className="magicLabel">DT</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={character.magicInfo?.dt || 0}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            magicInfo: { ...prev.magicInfo, dt: Number(e.target.value) }
                                        }))}
                                        className="magicInput"
                                        placeholder="DT"
                                    />
                                </div>
                            </div>
                            <div className="magicContainer">
                                {/* Truques (Level 0) */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Truques</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">0</div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level0?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level0', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea0"
                                        placeholder="Truques..."
                                    />
                                </div>

                                {/* Level 1 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">1</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level1?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level1', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level1?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level1?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level1', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level1?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level1', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea1"
                                        placeholder="Magias de nível 1..."
                                    />
                                </div>

                                {/* Level 2 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível </span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">2</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level2?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level2', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level2?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level2?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level2', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level2?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level2', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea2"
                                        placeholder="Magias de nível 2..."
                                    />
                                </div>

                                {/* Level 3 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">3</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level3?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level3', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level3?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level3?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level3', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level3?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level3', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea3"
                                        placeholder="Magias de nível 3..."
                                    />
                                </div>

                                {/* Level 4 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">4</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level4?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level4', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level4?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level4?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level4', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level4?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level4', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea4"
                                        placeholder="Magias de nível 4..."
                                    />
                                </div>

                                {/* Level 5 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">5</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level5?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level5', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level5?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level5?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level5', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level5?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level5', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea5"
                                        placeholder="Magias de nível 5..."
                                    />
                                </div>

                                {/* Level 6 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">6</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level6?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level6', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level6?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level6?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level6', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level6?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level6', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea6"
                                        placeholder="Magias de nível 6..."
                                    />
                                </div>

                                {/* Level 7 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">7</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level7?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level7', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level7?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level7?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level7', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level7?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level7', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea7"
                                        placeholder="Magias de nível 7..."
                                    />
                                </div>

                                {/* Level 8 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">8</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level8?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level8', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level8?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level8?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level8', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level8?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level8', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea8"
                                        placeholder="Magias de nível 8..."
                                    />
                                </div>

                                {/* Level 9 */}
                                <div className="skillItem">
                                    <div className="truquesHeader">
                                        <span className="truquesLabel">Magias de Nível</span>
                                        <div className="truquesLevelContainer">
                                            <div className="truquesLevelCircle">9</div>
                                        </div>
                                        <div className="slotsContainer">
                                            <input
                                                type="number"
                                                min="0"
                                                value={character.magicSlots?.level9?.max || 0}
                                                onChange={e => handleMagicSlotsChange('level9', 'max', Number(e.target.value))}
                                                className="smallInput"
                                                placeholder="Total"
                                            />
                                            <div className="checkboxes">
                                                {Array.from({ length: character.magicSlots?.level9?.max || 0 }, (_, index) => (
                                                    <input
                                                        key={index}
                                                        type="checkbox"
                                                        checked={(character.magicSlots?.level9?.used || 0) > index}
                                                        onChange={() => handleMagicSlotCheckboxChange('level9', index)}
                                                        className="checkboxInput"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={character.magicSlots?.level9?.spells || ''}
                                        onChange={e => handleMagicSlotsChange('level9', 'spells', e.target.value)}
                                        className="textarea skillTextarea truquesTextarea truquesTextarea9"
                                        placeholder="Magias de nível 9..."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
               

                {/* Detalhes Pessoais */}
                {!isNPCOrMonster && (
                    <section className="section">
                        <div className="sectionHeader">Informações Pessoais</div>
                        <div className="flexRow">
                            <div className="flexCol">
                                <label className="label">Descrição Pessoal</label>
                                <textarea
                                    value={character.basicInfo.personalDescription || ''}
                                    onChange={e => handleBasicInfoChange('personalDescription', e.target.value)}
                                    className="personalDescriptionTextarea"
                                    placeholder="Descreva o personagem..."
                                />

                                <label className="label">Família e Amigos</label>
                                <textarea
                                    value={character.basicInfo.familyAndFriends || ''}
                                    onChange={e => handleBasicInfoChange('familyAndFriends', e.target.value)}
                                    className="familyAndFriendsTextarea"
                                    placeholder="Família, amigos, contatos..."
                                />
                            </div>

                            <div className="flexCol">
                                <label className="label">Episódios de Insanidade</label>
                                <textarea
                                    value={character.basicInfo.insanityEpisodes || ''}
                                    onChange={e => handleBasicInfoChange('insanityEpisodes', e.target.value)}
                                    className="insanityEpisodesTextarea"
                                    placeholder="Detalhes sobre insanidade..."
                                />

                                <label className="label">Ferimentos</label>
                                <textarea
                                    value={character.basicInfo.wounds || ''}
                                    onChange={e => handleBasicInfoChange('wounds', e.target.value)}
                                    className="woundsTextarea"
                                    placeholder="Ferimentos e lesões..."
                                />



                            </div>
                        </div>
                    </section>
                )}

                {/* História do Personagem */}
                {!isMonster && (
                    <section className="section">
                        <div className="sectionHeader">História do Personagem</div>
                        <label className="label">História do Personagem</label>
                        <textarea
                            value={character.history || ''}
                            onChange={e => setCharacter(prev => ({ ...prev, history: e.target.value }))}
                            className="historyTextarea"
                            placeholder="História do personagem..."
                        />
                        <label className="label">Notas Gerais</label>
                        <textarea
                            value={character.notes?.generalNotes || ''}
                            onChange={e => setCharacter(prev => ({
                                ...prev,
                                notes: { ...prev.notes, generalNotes: e.target.value }
                            }))}
                            className="generalNotesTextarea"
                            placeholder="Notas gerais..."
                        />

                    </section>
                )}

                {/* Dados */}
                <section className="section">
                    <div className="sectionHeader">Histórico de Dados</div>
                    <DiceHistory history={diceHistory} />
                </section>

                {/* Botões Salvar / Cancelar */}
                <div className="saveButtons">
                    <button
                        onClick={handleSave}
                        className="saveButton"
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar Ficha'}
                    </button>
                    <button
                        onClick={() => navigate(isMasterMode ? '/master-dashboard' : '/dashboard')}
                        className="cancelButton"
                    >
                        Voltar
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="modalOverlay" onClick={() => setShowModal(false)}>
                    <div className="modalContent" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowModal(false)}
                            className="modalClose"
                        >
                            ×
                        </button>
                        {isRolling ? (
                            <>
                                <img src="/images/unnamed(1).png" alt="Rolling Dice" style={{ width: '50px', height: '50px', animation: 'spin 1s linear infinite' }} />
                                <p style={{ marginTop: '20px', textAlign: 'center' }}>{modalMessage}</p>
                            </>
                        ) : (
                            <>
                                <div className="modalTitle">{rollCategory}</div>
                                <div className="modalDescription">(Rolagem de dado para {rollName})</div>
                                <div className="diceResults">
                                    <div className="diceBoxWhite">{rollDie}</div>
                                </div>
                                {isSkillRoll && (
                                    <div className="subSkills">
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {showDiceModal && (
                <div className="modalOverlay" onClick={() => { setRollResult(null); setShowDiceModal(false); setIsRollingDice(false); }}>
                    <div className="modalContent" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => { setRollResult(null); setShowDiceModal(false); setIsRollingDice(false); }}
                            className="modalClose"
                        >
                            ×
                        </button>
                        {isRollingDice ? (
                            <>
                                <img src="/images/unnamed(1).png" alt="Rolling Dice" style={{ width: '50px', height: '50px', animation: 'spin 1s linear infinite' }} />
                                <p style={{ marginTop: '20px', textAlign: 'center' }}>Rolando dados...</p>
                            </>
                        ) : rollResult ? (
                            <>
                                <div className="modalTitle">{rollResult.isDamage ? 'ROLAGEM DE DANO' : 'ROLAGEM DE DADOS'}</div>
                                <div className="modalDescription">({rollResult.diceType})</div>
                                <div className="diceResults">
                                    {rollResult.rolls.map((roll, index) => (
                                        <div key={index} className="diceBox">{roll}</div>
                                    ))}
                                </div>
                                {rollResult.constants && rollResult.constants.length > 0 && (
                                    <div className="diceResults">
                                        {rollResult.constants.map((constant, index) => (
                                            <div key={`constant-${index}`} className="constantBox">{constant}</div>
                                        ))}
                                    </div>
                                )}
                                <div className="successIndicator">
                                    {rollResult.isDamage ? rollResult.description : `Total: ${rollResult.total}`}
                                </div>
                                <button
                                    onClick={() => { setDiceHistory(prev => [rollResult, ...prev]); setRollResult(null); setShowDiceModal(false); }}
                                    style={{
                                        backgroundColor: '#27ae60',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        marginTop: '10px',
                                    }}
                                >
                                    OK
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="modalTitle">ESCOLHER DADO</div>
                                <div className="modalDescription">Selecione o tipo e a quantidade de dados para rolar</div>
                                <div className="modalForm">
                                    <div>
                                        <label className="label" style={{ color: '#fff', marginBottom: '5px', display: 'block' }}>Tipo de dado:</label>
                                        <select
                                            value={selectedDice}
                                            onChange={e => setSelectedDice(e.target.value)}
                                            className="modalSelect"
                                        >
                                            {diceTypes.map(dice => (
                                                <option key={dice.label} value={dice.label} style={{ backgroundColor: '#000', color: '#fff' }}>
                                                    {dice.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label" style={{ color: '#fff', marginBottom: '5px', display: 'block' }}>Quantidade de dados:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={numDice}
                                            onChange={e => setNumDice(Math.max(1, Math.min(20, Number(e.target.value))))}
                                            className="modalInput"
                                        />
                                    </div>
                                </div>
                                <div className="modalButtonRow">
                                    <button
                                        onClick={rollDice}
                                        className="buttonPrimary"
                                        style={{ minWidth: '70px' }}
                                    >
                                        Rolar
                                    </button>
                                    <button
                                        onClick={() => { setRollResult(null); setShowDiceModal(false); }}
                                        className="buttonPrimary"
                                        style={{ minWidth: '70px' }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showAddSkillModal && (
                <div className="modalOverlay" onClick={() => { setNewSkillName(''); setNewSkillValue(0); setShowAddSkillModal(false); }}>
                    <div className="modalContent" onClick={e => e.stopPropagation()}>
                        <h3>Adicionar Perícia</h3>
                        <label className="label">Nome:</label>
                        <input
                            type="text"
                            value={newSkillName}
                            onChange={e => setNewSkillName(e.target.value)}
                            className="input"
                            placeholder="Nome da perícia"
                        />
                        <label className="label">Valor:</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={newSkillValue}
                            onChange={e => setNewSkillValue(Number(e.target.value))}
                            className="input"
                            placeholder="Valor da perícia"
                        />
                        <button
                            onClick={() => {
                                if (newSkillName.trim()) {
                                    setCharacter(prev => ({
                                        ...prev,
                                        skills: [...(prev.skills || []), { name: newSkillName, baseValue: newSkillValue, currentValue: newSkillValue, category: 'general', checked: false }],
                                    }));
                                    setNewSkillName('');
                                    setNewSkillValue(0);
                                    setShowAddSkillModal(false);
                                }
                            }}
                            className="buttonPrimary"
                            style={{ marginRight: '10px' }}
                        >
                            OK
                        </button>
                        <button
                            onClick={() => { setNewSkillName(''); setNewSkillValue(0); setShowAddSkillModal(false); }}
                            className="modalClose"
                        >
                            X
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CharacterSheet;
