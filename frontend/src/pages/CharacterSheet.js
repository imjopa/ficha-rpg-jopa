import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { characterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

import DiceHistory from '../components/DiceRoller';
import '../styles/CharacterSheet.css';

const translations = {
    body: {
        move: 'Mover',
        attack: 'Atacar',
        control: 'Controlar'
    },
    cunning: {
        sway: 'Persuadir',
        read: 'Ler',
        hide: 'Esconder'
    },
    intuition: {
        search: 'Investigar',
        focus: 'Focar',
        sense: 'Sentir'
    },
    status: {
        marks: 'Marcas',
        scars: 'Cicatrizes',
        luck: 'Sorte'
    }
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
    const [douradoRoll, setDouradoRoll] = useState(0);

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

    // No início do componente, adicione um estado para a imagem preview:
    const [imagePreview, setImagePreview] = useState('');

    const imageInputRef = useRef(null);

    // Local states for maxImpulsos inputs to allow free typing
    const [bodyInput, setBodyInput] = useState('0');
    const [cunningInput, setCunningInput] = useState('0');
    const [intuitionInput, setIntuitionInput] = useState('0');

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

                // Ensure Candela Jopa structure is initialized
                charData = {
                    ...charData,
                    basicInfo: {
                        name: charData.basicInfo?.name || '',
                        player: charData.basicInfo?.player || '',
                        role: charData.basicInfo?.role || '',
                        specialty: charData.basicInfo?.specialty || '',
                        circle: charData.basicInfo?.circle || '',
                        level: charData.basicInfo?.level || 0,
                        birthplace: charData.basicInfo?.birthplace || '',
                        characterImage: charData.basicInfo?.characterImage || '',
                        personalDescription: charData.basicInfo?.personalDescription || '',
                        familyAndFriends: charData.basicInfo?.familyAndFriends || '',
                        insanityEpisodes: charData.basicInfo?.insanityEpisodes || '',
                        wounds: charData.basicInfo?.wounds || ''
                    },
                    body: {
                        move: charData.body?.move || 0,
                        attack: charData.body?.attack || 0,
                        control: charData.body?.control || 0,
                        moveDourado: charData.body?.moveDourado || false,
                        attackDourado: charData.body?.attackDourado || false,
                        controlDourado: charData.body?.controlDourado || false,
                        maxImpulsos: charData.body?.maxImpulsos || 0,
                        impulsos: Array.isArray(charData.body?.impulsos) ? charData.body.impulsos : [],
                        acoes: Array.isArray(charData.body?.acoes) ? charData.body.acoes : [],
                        resistencias: Array.isArray(charData.body?.resistencias) ? charData.body.resistencias : []
                    },
                    cunning: {
                        sway: charData.cunning?.sway || 0,
                        read: charData.cunning?.read || 0,
                        hide: charData.cunning?.hide || 0,
                        swayDourado: charData.cunning?.swayDourado || false,
                        readDourado: charData.cunning?.readDourado || false,
                        hideDourado: charData.cunning?.hideDourado || false,
                        maxImpulsos: charData.cunning?.maxImpulsos || 0,
                        impulsos: Array.isArray(charData.cunning?.impulsos) ? charData.cunning.impulsos : [],
                        acoes: Array.isArray(charData.cunning?.acoes) ? charData.cunning.acoes : [],
                        resistencias: Array.isArray(charData.cunning?.resistencias) ? charData.cunning.resistencias : []
                    },
                    intuition: {
                        search: charData.intuition?.search || 0,
                        focus: charData.intuition?.focus || 0,
                        sense: charData.intuition?.sense || 0,
                        searchDourado: charData.intuition?.searchDourado || false,
                        focusDourado: charData.intuition?.focusDourado || false,
                        senseDourado: charData.intuition?.senseDourado || false,
                        maxImpulsos: charData.intuition?.maxImpulsos || 0,
                        impulsos: Array.isArray(charData.intuition?.impulsos) ? charData.intuition.impulsos : [],
                        acoes: Array.isArray(charData.intuition?.acoes) ? charData.intuition.acoes : [],
                        resistencias: Array.isArray(charData.intuition?.resistencias) ? charData.intuition.resistencias : []
                    },
                    status: {
                        marks: {
                            body: {
                                maxMarks: charData.status?.marks?.body?.maxMarks || 0,
                                marks: Array.isArray(charData.status?.marks?.body?.marks) ? charData.status.marks.body.marks : []
                            },
                            mind: {
                                maxMarks: charData.status?.marks?.mind?.maxMarks || 0,
                                marks: Array.isArray(charData.status?.marks?.mind?.marks) ? charData.status.marks.mind.marks : []
                            },
                            blood: {
                                maxMarks: charData.status?.marks?.blood?.maxMarks || 0,
                                marks: Array.isArray(charData.status?.marks?.blood?.marks) ? charData.status.marks.blood.marks : []
                            }
                        },
                        scars: Array.isArray(charData.status?.scars) ? charData.status.scars : [
                            { checked: false, description: '' },
                            { checked: false, description: '' },
                            { checked: false, description: '' }
                        ],
                        luck: charData.status?.luck || 0
                    },
                    skills: {
                        roleskills: charData.skills?.roleskills || '',
                        specialtyskills: charData.skills?.specialtyskills || '',
                        circleskills: charData.skills?.circleskills || ''
                    },
                    equipment: charData.equipment || [],
                    notes: {
                        treasuredPossessions: charData.notes?.treasuredPossessions || '',
                        rituals: charData.notes?.rituals || '',
                        generalNotes: charData.notes?.generalNotes || ''
                    },
                    history: charData.history || '',
                    weapons: Array.isArray(charData.weapons) ? charData.weapons : []
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

    // Handlers para atualizar campos aninhados
    const handleBasicInfoChange = (field, value) => {
        setCharacter(prev => ({
            ...prev,
            basicInfo: {
                ...prev.basicInfo,
                [field]: value,
            },
        }));
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

    const handleIncomeChange = (field, value) => {
        setCharacter(prev => ({
            ...prev,
            incomeAndEconomy: {
                possessions: prev.incomeAndEconomy?.possessions || '',
                properties: prev.incomeAndEconomy?.properties || '',
                [field]: value,
            },
        }));
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
            weapons: [...(prev.weapons || []), { name: '', type: '', damage: '', currentAmmo: 0, maxAmmo: 0, range: '', attack: '' }],
        }));
    };

    const removeWeapon = index => {
        const newWeapons = [...(character.weapons || [])];
        newWeapons.splice(index, 1);
        setCharacter(prev => ({ ...prev, weapons: newWeapons }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await characterAPI.update(id, { ...character, diceHistory });
            alert('Ficha salva com sucesso!');
        } catch (err) {
            setError('Erro ao salvar ficha.');
        }
        setSaving(false);
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

        // Always roll 1d12 for damage
        setIsRollingDice(true);
        setShowDiceModal(true);
        setRollResult(null);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 12) + 1;

            // Determine marks based on roll
            let marksDealt = 0;
            if (roll >= 10) marksDealt = 2;
            else if (roll >= 7) marksDealt = 1;
            else marksDealt = 0;

            // Determine success level
            let successLevel = 'Fracasso';
            if (roll >= 10) successLevel = 'Sucesso Total';
            else if (roll >= 7) successLevel = 'Sucesso Parcial';
            else successLevel = 'Fracasso';

            // Reduce ammo for firearms or bows
            if (weapon.type === 'Armas de fogo' || weapon.type === 'Arcos') {
                const newWeapons = [...character.weapons];
                newWeapons[index] = { ...newWeapons[index], currentAmmo: Math.max(0, (newWeapons[index].currentAmmo || 0) - 1) };
                setCharacter(prev => ({ ...prev, weapons: newWeapons }));
            }

            const newRoll = {
                diceType: '1d12',
                numDice: 1,
                total: roll,
                rolls: [roll],
                constants: [],
                isDamage: true,
                successLevel,
                marksDealt,
                description: `${successLevel} - ${marksDealt} marca(s)`,
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
                diceType: selectedDice,
                numDice,
                total,
                rolls,
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
            setDouradoRoll(0);

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

    const handleRollAttribute = (modifier, name, isSkill = false) => {
        setIsRolling(true);
        setShowModal(true);
        setModalMessage("Rolando dados...");
        setIsSkillRoll(isSkill);

        // Infer category for skills
        let category = '';
        if (isSkill) {
            if (name.toLowerCase().includes('arco') || name.toLowerCase().includes('armas de fogo') || name.toLowerCase().includes('fogo')) {
                category = 'PERÍCIAS DE FOGO';
            } else if (name.toLowerCase().includes('luta') || name.toLowerCase().includes('combate')) {
                category = 'PERÍCIAS DE LUTA';
            } else {
                category = name.toUpperCase(); // Fallback to skill name
            }
        } else {
            category = name; // For attributes, use name as title
        }
        setRollCategory(category);
        setRollName(name);

        // Check if attribute is dourado
        let isDourado = false;
        if (!isSkill) {
            if (name === translations.body.move) isDourado = character.body?.moveDourado || false;
            else if (name === translations.body.attack) isDourado = character.body?.attackDourado || false;
            else if (name === translations.body.control) isDourado = character.body?.controlDourado || false;
            else if (name === translations.cunning.sway) isDourado = character.cunning?.swayDourado || false;
            else if (name === translations.cunning.read) isDourado = character.cunning?.readDourado || false;
            else if (name === translations.cunning.hide) isDourado = character.cunning?.hideDourado || false;
            else if (name === translations.intuition.search) isDourado = character.intuition?.searchDourado || false;
            else if (name === translations.intuition.focus) isDourado = character.intuition?.focusDourado || false;
            else if (name === translations.intuition.sense) isDourado = character.intuition?.senseDourado || false;
        }

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            setRollValue(total); // Now showing total instead of just roll
            setRollDie(roll);
            setRollModifier(modifier);

            let dourado = 0;
            if (isDourado) {
                dourado = Math.floor(Math.random() * 20) + 1;
            }
            setDouradoRoll(dourado);

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

            // Keep modalMessage for backward compatibility, but new data is in states
            const message = `Resultado de ${name}: Dado ${roll} + Mod ${modifier} = ${total} - ${level}`;
            setModalMessage(message);
            setIsRolling(false);

            // Add roll to history
            const rollType = name === 'Sanidade' ? 'sanity' : (isSkill ? 'skill' : 'attribute');
            const newRoll = {
                rollType,
                rollName: name,
                diceType: 'd20',
                total: total,
                successLevel: level,
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
                            <label className="label">Papel</label>
                            <input
                                type="text"
                                value={character.basicInfo.role || ''}
                                onChange={e => handleBasicInfoChange('role', e.target.value)}
                                className="input"
                                placeholder="Papel"
                            />
                            <label className="label">Especialidade</label>
                            <input
                                type="text"
                                value={character.basicInfo.specialty || ''}
                                onChange={e => handleBasicInfoChange('specialty', e.target.value)}
                                className="input"
                                placeholder="Especialidade"
                            />
                            {!isMonster && (
                                <>
                                    <label className="label">Círculo</label>
                                    <input
                                        type="text"
                                        value={character.basicInfo.circle || ''}
                                        onChange={e => handleBasicInfoChange('circle', e.target.value)}
                                        className="input"
                                        placeholder="Círculo"
                                    />
                                </>
                            )}
                            <label className="label">Local de Nascimento</label>
                            <input
                                type="text"
                                value={character.basicInfo.birthplace || ''}
                                onChange={e => handleBasicInfoChange('birthplace', e.target.value)}
                                className="input"
                                placeholder="Local de Nascimento"
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
                                {/* Marks */}
                                <div className="marksContainer">
                                    <div className="marksLabel">Marcas</div>
                                    <div className="marksCategories">
                                        {/* Body Marks */}
                                        <div className="marksCategory">
                                            <label className="marksCategoryLabel">Corpo</label>
                                            <div className="marksInputs">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="99"
                                                    value={character.status?.marks?.body?.maxMarks || 0}
                                                    onChange={e => {
                                                        const newStatus = { ...character.status };
                                                        const newMax = Number(e.target.value);
                                                        newStatus.marks = { ...newStatus.marks };
                                                        newStatus.marks.body = { ...newStatus.marks.body, maxMarks: newMax };
                                                        // Ensure marks array has correct length
                                                        const currentMarks = newStatus.marks.body.marks || [];
                                                        newStatus.marks.body.marks = currentMarks.slice(0, newMax).concat(new Array(Math.max(0, newMax - currentMarks.length)).fill(false));
                                                        setCharacter(prev => ({ ...prev, status: newStatus }));
                                                    }}
                                                    className="smallInput"
                                                    placeholder="Max"
                                                />
                                                <div className="checkboxesContainer">
                                                    {(character.status?.marks?.body?.marks || []).map((checked, index) => (
                                                        <input
                                                            key={`body-${index}`}
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={e => {
                                                                const newStatus = { ...character.status };
                                                                newStatus.marks = { ...newStatus.marks };
                                                                newStatus.marks.body = { ...newStatus.marks.body };
                                                                newStatus.marks.body.marks = [...newStatus.marks.body.marks];
                                                                newStatus.marks.body.marks[index] = e.target.checked;
                                                                setCharacter(prev => ({ ...prev, status: newStatus }));
                                                            }}
                                                            className="markCheckbox"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mind Marks */}
                                        <div className="marksCategory">
                                            <label className="marksCategoryLabel">Mente</label>
                                            <div className="marksInputs">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="99"
                                                    value={character.status?.marks?.mind?.maxMarks || 0}
                                                    onChange={e => {
                                                        const newStatus = { ...character.status };
                                                        const newMax = Number(e.target.value);
                                                        newStatus.marks = { ...newStatus.marks };
                                                        newStatus.marks.mind = { ...newStatus.marks.mind, maxMarks: newMax };
                                                        const currentMarks = newStatus.marks.mind.marks || [];
                                                        newStatus.marks.mind.marks = currentMarks.slice(0, newMax).concat(new Array(Math.max(0, newMax - currentMarks.length)).fill(false));
                                                        setCharacter(prev => ({ ...prev, status: newStatus }));
                                                    }}
                                                    className="smallInput"
                                                    placeholder="Max"
                                                />
                                                <div className="checkboxesContainer">
                                                    {(character.status?.marks?.mind?.marks || []).map((checked, index) => (
                                                        <input
                                                            key={`mind-${index}`}
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={e => {
                                                                const newStatus = { ...character.status };
                                                                newStatus.marks = { ...newStatus.marks };
                                                                newStatus.marks.mind = { ...newStatus.marks.mind };
                                                                newStatus.marks.mind.marks = [...newStatus.marks.mind.marks];
                                                                newStatus.marks.mind.marks[index] = e.target.checked;
                                                                setCharacter(prev => ({ ...prev, status: newStatus }));
                                                            }}
                                                            className="markCheckbox"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Blood Marks */}
                                        <div className="marksCategory">
                                            <label className="marksCategoryLabel">Sangria</label>
                                            <div className="marksInputs">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="99"
                                                    value={character.status?.marks?.blood?.maxMarks || 0}
                                                    onChange={e => {
                                                        const newStatus = { ...character.status };
                                                        const newMax = Number(e.target.value);
                                                        newStatus.marks = { ...newStatus.marks };
                                                        newStatus.marks.blood = { ...newStatus.marks.blood, maxMarks: newMax };
                                                        const currentMarks = newStatus.marks.blood.marks || [];
                                                        newStatus.marks.blood.marks = currentMarks.slice(0, newMax).concat(new Array(Math.max(0, newMax - currentMarks.length)).fill(false));
                                                        setCharacter(prev => ({ ...prev, status: newStatus }));
                                                    }}
                                                    className="smallInput"
                                                    placeholder="Max"
                                                />
                                                <div className="checkboxesContainer">
                                                    {(character.status?.marks?.blood?.marks || []).map((checked, index) => (
                                                        <input
                                                            key={`blood-${index}`}
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={e => {
                                                                const newStatus = { ...character.status };
                                                                newStatus.marks = { ...newStatus.marks };
                                                                newStatus.marks.blood = { ...newStatus.marks.blood };
                                                                newStatus.marks.blood.marks = [...newStatus.marks.blood.marks];
                                                                newStatus.marks.blood.marks[index] = e.target.checked;
                                                                setCharacter(prev => ({ ...prev, status: newStatus }));
                                                            }}
                                                            className="markCheckbox"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scars */}
                                <div className="scarsContainer">
                                    <div className="scarsLabel">Cicatrizes</div>
                                    <div className="scarsList">
                                        {(character.status?.scars || []).map((scar, index) => (
                                            <div key={index} className="scarItem">
                                                <input
                                                    type="checkbox"
                                                    checked={scar.checked}
                                                    onChange={e => {
                                                        const newStatus = { ...character.status };
                                                        newStatus.scars = [...newStatus.scars];
                                                        newStatus.scars[index] = { ...newStatus.scars[index], checked: e.target.checked };
                                                        setCharacter(prev => ({ ...prev, status: newStatus }));
                                                    }}
                                                    className="scarCheckbox"
                                                />
                                                <input
                                                    type="text"
                                                    value={scar.description}
                                                    onChange={e => {
                                                        const newStatus = { ...character.status };
                                                        newStatus.scars = [...newStatus.scars];
                                                        newStatus.scars[index] = { ...newStatus.scars[index], description: e.target.value };
                                                        setCharacter(prev => ({ ...prev, status: newStatus }));
                                                    }}
                                                    className="scarInput"
                                                    placeholder="Descrição da cicatriz"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Luck */}
                                <div className="barContainer">
                                    <div className="barLabel">Sorte</div>
                                    <button
                                        onClick={handleRollLuck}
                                        className="diceButton"
                                        title="Rolar D20 para Sorte"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconSmall" />
                                    </button>
                                </div>
                            </div>


                        </div>
                    </div>
                </section>



                {/* Atributos */}
                {(!isNPCOrMonster || (isNPCOrMonster && (character.characterType === 'npc' || character.characterType === 'monster'))) && (
                <section className="section">
                    <div className="sectionHeader">Atributos</div>
                    <div className="attributesBorder">
                        <div className="attributesGrid">
                            {/* Corpo */}
                            <div className="attributeColumn corpoColumn">
                                {/* Impulsos acima do título */}
                                <div className="impulsosContainer">
                                    <label className="label">Impulsos</label>
                                    <div className="impulsosInputs">
                                        <input
                                            type="number"
                                            min="0"
                                            max="9"
                                            value={character.body?.maxImpulsos || 0}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const newMax = val === '' ? 0 : Math.max(0, Math.min(9, Number(val)));
                                                setCharacter(prev => ({
                                                    ...prev,
                                                    body: {
                                                        ...prev.body,
                                                        maxImpulsos: newMax,
                                                        impulsos: newMax >= 1 ? (prev.body.impulsos || []).slice(0, newMax).concat(new Array(Math.max(0, newMax - (prev.body.impulsos || []).length)).fill(false)) : [],
                                                        resistencias: newMax >= 1 ? (prev.body.resistencias || []).slice(0, Math.floor(newMax / 3)).concat(new Array(Math.max(0, Math.floor(newMax / 3) - (prev.body.resistencias || []).length)).fill(false)) : []
                                                    }
                                                }));
                                            }}
                                            className="smallInput"
                                            placeholder="Max"
                                        />
                                        <div className="checkboxesContainer">
                                            {(character.body?.impulsos || []).map((checked, index) => (
                                                <input
                                                    key={`body-impulso-${index}`}
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={index >= (character.body?.maxImpulsos || 1)}
                                                    onChange={e => {
                                                        const newImpulsos = [...(character.body?.impulsos || [])];
                                                        newImpulsos[index] = e.target.checked;
                                                        setCharacter(prev => ({
                                                            ...prev,
                                                            body: {
                                                                ...prev.body,
                                                                impulsos: newImpulsos,
                                                                resistencias: prev.body.resistencias.slice(0, Math.floor((prev.body.maxImpulsos || 1) / 3)).concat(new Array(Math.max(0, Math.floor((prev.body.maxImpulsos || 1) / 3) - prev.body.resistencias.length)).fill(false))
                                                            }
                                                        }));
                                                    }}
                                                    className="impulsoCheckbox"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="attributeHeader">Corpo</h3>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.body?.move || 0, translations.body.move, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconSmall" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.body?.moveDourado || false}
                                            onChange={e => handleChange('body', 'moveDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.body.move}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.body?.move || 0}
                                        onChange={e => handleChange('body', 'move', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.body?.attack || 0, translations.body.attack, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconSmall" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.body?.attackDourado || false}
                                            onChange={e => handleChange('body', 'attackDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.body.attack}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.body?.attack || 0}
                                        onChange={e => handleChange('body', 'attack', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.body?.control || 0, translations.body.control, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconSmall" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.body?.controlDourado || false}
                                            onChange={e => handleChange('body', 'controlDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.body.control}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.body?.control || 0}
                                        onChange={e => handleChange('body', 'control', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                {/* Resistências abaixo */}
                                <div className="resistenciasContainer">
                                    <label className="label">Resistências</label>
                                    <div className="checkboxesContainer">
                                        {(character.body?.resistencias || []).map((checked, index) => (
                                            <input
                                                key={`body-resistencia-${index}`}
                                                type="checkbox"
                                                checked={checked}
                                                onChange={e => {
                                                    const newResistencias = [...(character.body?.resistencias || [])];
                                                    newResistencias[index] = e.target.checked;
                                                    setCharacter(prev => ({
                                                        ...prev,
                                                        body: {
                                                            ...prev.body,
                                                            resistencias: newResistencias
                                                        }
                                                    }));
                                                }}
                                                className="resistenciaCheckbox"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Astúcia */}
                            <div className="attributeColumn astuciaColumn">
                                {/* Impulsos acima do título */}
                                <div className="impulsosContainer">
                                    <label className="label">Impulsos</label>
                                    <div className="impulsosInputs">
                                        <input
                                            type="number"
                                            min="0"
                                            max="9"
                                            value={character.cunning?.maxImpulsos || 0}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const newMax = val === '' ? 0 : Math.max(0, Math.min(9, Number(val)));
                                                setCharacter(prev => ({
                                                    ...prev,
                                                    cunning: {
                                                        ...prev.cunning,
                                                        maxImpulsos: newMax,
                                                        impulsos: newMax >= 1 ? (prev.cunning.impulsos || []).slice(0, newMax).concat(new Array(Math.max(0, newMax - (prev.cunning.impulsos || []).length)).fill(false)) : [],
                                                        resistencias: newMax >= 1 ? (prev.cunning.resistencias || []).slice(0, Math.floor(newMax / 3)).concat(new Array(Math.max(0, Math.floor(newMax / 3) - (prev.cunning.resistencias || []).length)).fill(false)) : []
                                                    }
                                                }));
                                            }}
                                            className="smallInput"
                                            placeholder="Max"
                                        />
                                        <div className="checkboxesContainer">
                                            {(character.cunning?.impulsos || []).map((checked, index) => (
                                                <input
                                                    key={`cunning-impulso-${index}`}
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={index >= (character.cunning?.maxImpulsos || 1)}
                                                    onChange={e => {
                                                        const newImpulsos = [...(character.cunning?.impulsos || [])];
                                                        newImpulsos[index] = e.target.checked;
                                                        setCharacter(prev => ({
                                                            ...prev,
                                                            cunning: {
                                                                ...prev.cunning,
                                                                impulsos: newImpulsos,
                                                                resistencias: prev.cunning.resistencias.slice(0, Math.floor((prev.cunning.maxImpulsos || 1) / 3)).concat(new Array(Math.max(0, Math.floor((prev.cunning.maxImpulsos || 1) / 3) - prev.cunning.resistencias.length)).fill(false))
                                                            }
                                                        }));
                                                    }}
                                                    className="impulsoCheckbox"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="attributeHeader">Astúcia</h3>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.cunning?.sway || 0, translations.cunning.sway, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconSmall" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.cunning?.swayDourado || false}
                                            onChange={e => handleChange('cunning', 'swayDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.cunning.sway}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.cunning?.sway || 0}
                                        onChange={e => handleChange('cunning', 'sway', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.cunning?.read || 0, translations.cunning.read, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconInline" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.cunning?.readDourado || false}
                                            onChange={e => handleChange('cunning', 'readDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.cunning.read}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.cunning?.read || 0}
                                        onChange={e => handleChange('cunning', 'read', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.cunning?.hide || 0, translations.cunning.hide, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconInline" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.cunning?.hideDourado || false}
                                            onChange={e => handleChange('cunning', 'hideDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.cunning.hide}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.cunning?.hide || 0}
                                        onChange={e => handleChange('cunning', 'hide', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                {/* Resistências abaixo */}
                                <div className="resistenciasContainer">
                                    <label className="label">Resistências</label>
                                    <div className="checkboxesContainer">
                                        {(character.cunning?.resistencias || []).map((checked, index) => (
                                            <input
                                                key={`cunning-resistencia-${index}`}
                                                type="checkbox"
                                                checked={checked}
                                                onChange={e => {
                                                    const newResistencias = [...(character.cunning?.resistencias || [])];
                                                    newResistencias[index] = e.target.checked;
                                                    setCharacter(prev => ({
                                                        ...prev,
                                                        cunning: {
                                                            ...prev.cunning,
                                                            resistencias: newResistencias
                                                        }
                                                    }));
                                                }}
                                                className="resistenciaCheckbox"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Intuição */}
                            <div className="attributeColumn intuicaoColumn">
                                {/* Impulsos acima do título */}
                                <div className="impulsosContainer">
                                    <label className="label">Impulsos</label>
                                    <div className="impulsosInputs">
                                        <input
                                            type="number"
                                            min="0"
                                            max="9"
                                            value={character.intuition?.maxImpulsos || 0}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const newMax = val === '' ? 0 : Math.max(0, Math.min(9, Number(val)));
                                                setCharacter(prev => ({
                                                    ...prev,
                                                    intuition: {
                                                        ...prev.intuition,
                                                        maxImpulsos: newMax,
                                                        impulsos: newMax >= 1 ? (prev.intuition.impulsos || []).slice(0, newMax).concat(new Array(Math.max(0, newMax - (prev.intuition.impulsos || []).length)).fill(false)) : [],
                                                        resistencias: newMax >= 1 ? (prev.intuition.resistencias || []).slice(0, Math.floor(newMax / 3)).concat(new Array(Math.max(0, Math.floor(newMax / 3) - (prev.intuition.resistencias || []).length)).fill(false)) : []
                                                    }
                                                }));
                                            }}
                                            className="smallInput"
                                            placeholder="Max"
                                        />
                                        <div className="checkboxesContainer">
                                            {(character.intuition?.impulsos || []).map((checked, index) => (
                                                <input
                                                    key={`intuition-impulso-${index}`}
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={index >= (character.intuition?.maxImpulsos || 1)}
                                                    onChange={e => {
                                                        const newImpulsos = [...(character.intuition?.impulsos || [])];
                                                        newImpulsos[index] = e.target.checked;
                                                        setCharacter(prev => ({
                                                            ...prev,
                                                            intuition: {
                                                                ...prev.intuition,
                                                                impulsos: newImpulsos,
                                                                resistencias: prev.intuition.resistencias.slice(0, Math.floor((prev.intuition.maxImpulsos || 1) / 3)).concat(new Array(Math.max(0, Math.floor((prev.intuition.maxImpulsos || 1) / 3) - prev.intuition.resistencias.length)).fill(false))
                                                            }
                                                        }));
                                                    }}
                                                    className="impulsoCheckbox"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="attributeHeader">Intuição</h3>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.intuition?.search || 0, translations.intuition.search, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconInline" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.intuition?.searchDourado || false}
                                            onChange={e => handleChange('intuition', 'searchDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.intuition.search}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.intuition?.search || 0}
                                        onChange={e => handleChange('intuition', 'search', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.intuition?.focus || 0, translations.intuition.focus, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconInline" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.intuition?.focusDourado || false}
                                            onChange={e => handleChange('intuition', 'focusDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.intuition.focus}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.intuition?.focus || 0}
                                        onChange={e => handleChange('intuition', 'focus', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                <div className="attribute-item">
                                    <button
                                        onClick={() => handleRollAttribute(character.intuition?.sense || 0, translations.intuition.sense, false)}
                                        className="diceButton"
                                        title="Rolar D20"
                                    >
                                        <img src="/images/unnamed(1).png" alt="Dados" className="diceIconInline" />
                                    </button>
                                    <div className="attributeLabelContainer">
                                        <input
                                            type="checkbox"
                                            checked={character.intuition?.senseDourado || false}
                                            onChange={e => handleChange('intuition', 'senseDourado', e.target.checked)}
                                            className="douradoCheckbox"
                                            title="Dourado"
                                        />
                                        <label className="fullLabel">{translations.intuition.sense}</label>
                                    </div>
                                    <input
                                        type="number"
                                        min="-7"
                                        max="7"
                                        value={character.intuition?.sense || 0}
                                        onChange={e => handleChange('intuition', 'sense', Number(e.target.value))}
                                        className="valueInput"
                                    />
                                </div>
                                {/* Resistências abaixo */}
                                <div className="resistenciasContainer">
                                    <label className="label">Resistências</label>
                                    <div className="checkboxesContainer">
                                        {(character.intuition?.resistencias || []).map((checked, index) => (
                                            <input
                                                key={`intuition-resistencia-${index}`}
                                                type="checkbox"
                                                checked={checked}
                                                onChange={e => {
                                                    const newResistencias = [...(character.intuition?.resistencias || [])];
                                                    newResistencias[index] = e.target.checked;
                                                    setCharacter(prev => ({
                                                        ...prev,
                                                        intuition: {
                                                            ...prev.intuition,
                                                            resistencias: newResistencias
                                                        }
                                                    }));
                                                }}
                                                className="resistenciaCheckbox"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                )}

                {/* Habilidades */}
                <section className="section">
                    <div className="sectionHeader">Habilidades</div>
                    <div className="sectionBorder">
                        <div className="skillsContainer">
                            <div className="skillItem">
                                <label className="label">Habilidades de Função</label>
                                <textarea
                                    value={character.skills?.roleskills || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        skills: {
                                            ...prev.skills,
                                            roleskills: e.target.value
                                        }
                                    }))}
                                    className="textarea skillTextarea"
                                    placeholder="Liste as habilidades de função..."
                                />
                            </div>
                            <div className="skillItem">
                                <label className="label">Habilidades de Especialidade</label>
                                <textarea
                                    value={character.skills?.specialtyskills || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        skills: {
                                            ...prev.skills,
                                            specialtyskills: e.target.value
                                        }
                                    }))}
                                    className="textarea skillTextarea"
                                    placeholder="Liste as habilidades de especialidade..."
                                />
                            </div>
                            {!isMonster && (
                                <div className="skillItem">
                                    <label className="label">Habilidades de Círculo</label>
                                    <textarea
                                        value={character.skills?.circleskills || ''}
                                        onChange={e => setCharacter(prev => ({
                                            ...prev,
                                            skills: {
                                                ...prev.skills,
                                                circleskills: e.target.value
                                            }
                                        }))}
                                        className="textarea skillTextarea"
                                        placeholder="Liste as Habilidades de círculo..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Combate */}
                <section className="section">
                    <div className="sectionHeader">Combate</div>
                    {(character.weapons && character.weapons.length > 0) ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="th">Nome</th>
                                    <th className="th">Tipo</th>
                                    <th className="th">Dano</th>
                                    <th className="th">Mun Atual</th>
                                    <th className="th">Mun Max</th>
                                    <th className="th">Alcance</th>
                                    <th className="th">Ataques</th>
                                </tr>
                            </thead>
                            <tbody>
                                {character.weapons.map((weapon, index) => (
                                    <tr key={index}>
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
                                                <option value="Briga">Briga</option>
                                                <option value="Arcos">Arcos</option>
                                                <option value="Armas de fogo">Armas de fogo</option>
                                            </select>
                                        </td>
                                        <td className="td">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    rollDamageDice(index);
                                                }}
                                                className="diceButton"
                                                title="Rolar Dano"
                                            >
                                                <img src="/images/unnamed(1).png" alt="Rolar Dado" className="damageRollImg24" />
                                            </button>
                                        </td>
                                        <td className="td">
                                            <input
                                                type="number"
                                                min={0}
                                                value={weapon.currentAmmo || 0}
                                                onChange={e => handleWeaponChange(index, 'currentAmmo', Number(e.target.value))}
                                                className="tableInput"
                                                placeholder="Atual"
                                            />
                                        </td>
                                        <td className="td">
                                            <input
                                                type="number"
                                                min={0}
                                                value={weapon.maxAmmo || 0}
                                                onChange={e => handleWeaponChange(index, 'maxAmmo', Number(e.target.value))}
                                                className="tableInput"
                                                placeholder="Máx"
                                            />
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
                                                placeholder="Ata"
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

                {/* Mágicka */}
                <section className="section">
                    <div className="sectionHeader">Mágicka</div>
                    <div className="sectionBorder">
                        <div className="skillsContainer">
                            <div className="skillItem">
                                <label className="label">Posses Sangria</label>
                                <textarea
                                    value={character.notes?.treasuredPossessions || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, treasuredPossessions: e.target.value }
                                    }))}
                                    className="textarea skillTextarea"
                                    placeholder="Posses preciosas..."
                                />
                            </div>
                            <div className="skillItem">
                                <label className="label">Rituais</label>
                                <textarea
                                    value={character.notes?.rituals || ''}
                                    onChange={e => setCharacter(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, rituals: e.target.value }
                                    }))}
                                    className="textarea skillTextarea"
                                    placeholder="Rituais..."
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
                                className="textarea textarea80x400"
                                placeholder="Descreva o personagem..."
                            />

                            <label className="label">Família e Amigos</label>
                            <textarea
                                value={character.basicInfo.familyAndFriends || ''}
                                onChange={e => handleBasicInfoChange('familyAndFriends', e.target.value)}
                                className="textarea textarea80x400"
                                placeholder="Família, amigos, contatos..."
                            />
                        </div>

                        <div className="flexCol">
                            <label className="label">Episódios de Insanidade</label>
                            <textarea
                                value={character.basicInfo.insanityEpisodes || ''}
                                onChange={e => handleBasicInfoChange('insanityEpisodes', e.target.value)}
                                className="textarea textarea80x400"
                                placeholder="Detalhes sobre insanidade..."
                            />

                            <label className="label">Ferimentos</label>
                            <textarea
                                value={character.basicInfo.wounds || ''}
                                onChange={e => handleBasicInfoChange('wounds', e.target.value)}
                                className="textarea textarea80x400"
                                placeholder="Ferimentos e lesões..."
                            />
                        </div>
                    </div>
                </section>
                )}

                {/* História do Personagem */}
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



                {/* Renda e Economias */}
                {!isNPCOrMonster && (
                <section className="section">
                    <div className="sectionHeader">Renda e Economias</div>
                    <div className="sectionBorder">
                        <div className="skillsContainer">
                            <div className="skillItem">
                                <label className="label">Posses</label>
                                <textarea
                                    value={character.incomeAndEconomy?.possessions || ''}
                                    onChange={e => handleIncomeChange('possessions', e.target.value)}
                                    className="textarea skillTextarea"
                                    placeholder="Lista de posses..."
                                />
                            </div>
                            <div className="skillItem">
                                <label className="label">Imóveis</label>
                                <textarea
                                    value={character.incomeAndEconomy?.properties || ''}
                                    onChange={e => handleIncomeChange('properties', e.target.value)}
                                    className="textarea skillTextarea"
                                    placeholder="Imóveis e propriedades..."
                                />
                            </div>
                        </div>
                    </div>
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
                                    <div className="diceBoxBlack">{rollModifier}</div>
                                    {douradoRoll > 0 && <div className="diceBoxYellow">{douradoRoll}</div>}
                                </div>
                                <div className="successIndicator">
                                    Total: {rollValue} - {isSuccess ? '✓' : '✗'} {successLevel}
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