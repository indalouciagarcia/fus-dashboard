/**
 * Grille d'évaluation Scout FUS par Poste
 * 9 Profils tactiques avec 4 piliers : Technique, Tactique, Physique, Mental.
 * Support de personnalisation dynamique pour la session Super Admin.
 */

export type ScoutPillarKey = 'technique' | 'tactique' | 'physique' | 'mental';

export interface ScoutPositionConfig {
  id: string;
  code: string;
  name: string;
  emoji: string;
  category: 'GK' | 'DF' | 'MF' | 'FW';
  criteria: {
    technique: string[];
    tactique: string[];
    physique: string[];
    mental: string[];
  };
}

export const SCOUT_POSITION_CONFIGS: Record<string, ScoutPositionConfig> = {
  GK: {
    id: 'GK',
    code: 'GK',
    name: 'Gardien',
    emoji: '🧤',
    category: 'GK',
    criteria: {
      technique: [
        'Prise de balle',
        'Jeu au pied',
        'Passe courte',
        'Passe longue',
        'Sorties aériennes',
        '1 contre 1',
        'Arrêts',
      ],
      tactique: [
        'Placement',
        'Positionnement',
        'Anticipation',
        'Lecture des trajectoires',
        'Gestion profondeur',
        'Relance',
        'Organisation défense',
      ],
      physique: [
        'Explosivité',
        'Détente',
        'Agilité',
        'Vitesse',
        'Coordination',
        'Souplesse',
        'Force',
      ],
      mental: [
        'Concentration',
        'Réactivité',
        'Confiance',
        'Gestion de pression',
        'Communication',
        'Prise de décision',
        'Leadership',
      ],
    },
  },

  CB: {
    id: 'CB',
    code: 'CB',
    name: 'Défenseur central',
    emoji: '🛡️',
    category: 'DF',
    criteria: {
      technique: [
        'Contrôle',
        'Passe courte',
        'Passe longue',
        'Jeu aérien',
        'Conduite',
        'Tacle',
        'Duel 1v1',
      ],
      tactique: [
        'Placement',
        'Marquage',
        'Couverture',
        'Anticipation',
        'Gestion profondeur',
        'Défense de zone',
        'Sortie de balle',
      ],
      physique: [
        'Vitesse',
        'Force',
        'Puissance',
        'Détente',
        'Endurance',
        'Agilité',
        'Coordination',
      ],
      mental: [
        'Concentration',
        'Courage',
        'Calme',
        'Communication',
        'Leadership',
        'Prise de décision',
        'Résilience',
      ],
    },
  },

  RB_LB: {
    id: 'RB_LB',
    code: 'RB/LB',
    name: 'Latéral droit/gauche',
    emoji: '🏃',
    category: 'DF',
    criteria: {
      technique: [
        'Contrôle',
        'Passe',
        'Centre',
        'Conduite',
        'Dribble',
        'Tacle',
        'Finition',
      ],
      tactique: [
        'Positionnement',
        'Placement défensif',
        'Couverture',
        'Gestion 1v1',
        'Projection offensive',
        'Repli défensif',
        'Combinaisons',
      ],
      physique: [
        'Vitesse',
        'Accélération',
        'Endurance',
        'Explosivité',
        'Agilité',
        'Puissance',
        'Coordination',
      ],
      mental: [
        'Concentration',
        'Discipline',
        'Combativité',
        'Décision',
        'Courage',
        'Persévérance',
        'Intelligence',
      ],
    },
  },

  CDM: {
    id: 'CDM',
    code: 'CDM / 6',
    name: 'Milieu défensif',
    emoji: '⚙️',
    category: 'MF',
    criteria: {
      technique: [
        'Contrôle',
        'Passe courte',
        'Passe longue',
        'Contrôle orienté',
        'Conduite',
        'Jeu sous pression',
        'Récupération technique',
      ],
      tactique: [
        'Placement',
        'Couverture',
        'Lecture du jeu',
        'Transition défensive',
        'Pressing',
        'Équilibre équipe',
        'Orientation du jeu',
      ],
      physique: [
        'Endurance',
        'Force',
        'Vitesse',
        'Explosivité',
        'Agilité',
        'Puissance',
        'Résistance',
      ],
      mental: [
        'Concentration',
        'Intelligence',
        'Calme',
        'Prise de décision',
        'Discipline',
        'Leadership',
        'Personnalité',
      ],
    },
  },

  CM: {
    id: 'CM',
    code: 'CM / 8',
    name: 'Milieu central',
    emoji: '🎯',
    category: 'MF',
    criteria: {
      technique: [
        'Contrôle',
        'Passe courte',
        'Passe longue',
        'Contrôle orienté',
        'Conduite',
        'Tir',
        'Dribble',
      ],
      tactique: [
        'Positionnement',
        'Occupation espaces',
        'Transition',
        'Jeu entre lignes',
        'Pressing',
        'Projection',
        'Soutien offensif',
      ],
      physique: [
        'Endurance',
        'Vitesse',
        'Agilité',
        'Explosivité',
        'Force',
        'Coordination',
        'Résistance',
      ],
      mental: [
        'Intelligence',
        'Concentration',
        'Prise de décision',
        'Calme',
        'Discipline',
        'Créativité',
        'Leadership',
      ],
    },
  },

  CAM: {
    id: 'CAM',
    code: 'CAM / 10',
    name: 'Milieu offensif',
    emoji: '🎨',
    category: 'MF',
    criteria: {
      technique: [
        'Contrôle',
        'Passe',
        'Passe décisive',
        'Dribble',
        'Contrôle orienté',
        'Tir',
        'Finition',
      ],
      tactique: [
        'Positionnement entre lignes',
        'Lecture du jeu',
        'Déplacement',
        'Création espaces',
        'Dernière passe',
        'Transition offensive',
        'Jeu combiné',
      ],
      physique: [
        'Accélération',
        'Agilité',
        'Vitesse',
        'Explosivité',
        'Endurance',
        'Coordination',
        'Mobilité',
      ],
      mental: [
        'Créativité',
        'Intelligence',
        'Prise de décision',
        'Confiance',
        'Sang-froid',
        'Personnalité',
        'Vision',
      ],
    },
  },

  RW_LW: {
    id: 'RW_LW',
    code: 'RW / LW',
    name: 'Ailier',
    emoji: '🪽',
    category: 'FW',
    criteria: {
      technique: [
        'Dribble',
        'Contrôle',
        'Centre',
        'Passe',
        'Finition',
        'Tir',
        'Conduite',
      ],
      tactique: [
        '1v1 offensif',
        'Largeur',
        'Déplacement',
        'Appels',
        'Attaque profondeur',
        'Repli défensif',
        'Entrée dans l\'axe',
      ],
      physique: [
        'Accélération',
        'Vitesse',
        'Explosivité',
        'Agilité',
        'Endurance',
        'Coordination',
        'Mobilité',
      ],
      mental: [
        'Créativité',
        'Confiance',
        'Audace',
        'Prise de décision',
        'Concentration',
        'Persévérance',
        'Sang-froid',
      ],
    },
  },

  ST: {
    id: 'ST',
    code: 'ST / CF',
    name: 'Avant-centre',
    emoji: '⚽',
    category: 'FW',
    criteria: {
      technique: [
        'Finition',
        'Tir',
        'Contrôle',
        'Contrôle orienté',
        'Dribble',
        'Jeu de tête',
        'Passe',
      ],
      tactique: [
        'Placement',
        'Déplacement',
        'Appels',
        'Jeu dos au but',
        'Attaque profondeur',
        'Pressing',
        'Combinaisons',
      ],
      physique: [
        'Force',
        'Vitesse',
        'Accélération',
        'Explosivité',
        'Détente',
        'Endurance',
        'Coordination',
      ],
      mental: [
        'Sang-froid',
        'Confiance',
        'Concentration',
        'Combativité',
        'Persévérance',
        'Prise de décision',
        'Mentalité',
      ],
    },
  },

  SS: {
    id: 'SS',
    code: 'SS',
    name: 'Second attaquant',
    emoji: '🔄',
    category: 'FW',
    criteria: {
      technique: [
        'Contrôle',
        'Passe',
        'Dribble',
        'Finition',
        'Tir',
        'Passe décisive',
      ],
      tactique: [
        'Déplacement',
        'Jeu entre lignes',
        'Combinaisons',
        'Création espaces',
        'Soutien attaquant',
        'Pressing',
      ],
      physique: [
        'Accélération',
        'Vitesse',
        'Agilité',
        'Explosivité',
        'Endurance',
        'Mobilité',
      ],
      mental: [
        'Créativité',
        'Intelligence',
        'Prise de décision',
        'Confiance',
        'Sang-froid',
        'Persévérance',
      ],
    },
  },
};

const STORAGE_KEY_CUSTOM_CRITERIA = 'fus_scout_custom_criteria_v1';
export const SCOUT_CRITERIA_UPDATED_EVENT = 'fus_scout_criteria_updated';

/**
 * Récupère les configurations de scouting personnalisées (ou les grilles par défaut).
 */
export function getCustomScoutPositionConfigs(): Record<string, ScoutPositionConfig> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return SCOUT_POSITION_CONFIGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_CRITERIA);
    if (!raw) return SCOUT_POSITION_CONFIGS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const merged: Record<string, ScoutPositionConfig> = { ...SCOUT_POSITION_CONFIGS };
      Object.keys(SCOUT_POSITION_CONFIGS).forEach(key => {
        if (parsed[key]?.criteria) {
          merged[key] = {
            ...SCOUT_POSITION_CONFIGS[key],
            ...parsed[key],
            criteria: {
              technique: parsed[key].criteria.technique || SCOUT_POSITION_CONFIGS[key].criteria.technique,
              tactique: parsed[key].criteria.tactique || SCOUT_POSITION_CONFIGS[key].criteria.tactique,
              physique: parsed[key].criteria.physique || SCOUT_POSITION_CONFIGS[key].criteria.physique,
              mental: parsed[key].criteria.mental || SCOUT_POSITION_CONFIGS[key].criteria.mental,
            }
          };
        }
      });
      return merged;
    }
  } catch (err) {
    console.warn('[scoutCriteriaByPosition] Erreur lecture custom criteria:', err);
  }
  return SCOUT_POSITION_CONFIGS;
}

/**
 * Sauvegarde les configurations personnalisées et émet un événement global de mise à jour.
 */
export function saveCustomScoutPositionConfigs(configs: Record<string, ScoutPositionConfig>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_CRITERIA, JSON.stringify(configs));
    window.dispatchEvent(new CustomEvent(SCOUT_CRITERIA_UPDATED_EVENT, { detail: configs }));
  } catch (err) {
    console.warn('[scoutCriteriaByPosition] Erreur sauvegarde custom criteria:', err);
  }
}

/**
 * Réinitialise aux grilles officielles de critères par défaut FUS.
 */
export function resetToDefaultScoutConfigs(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CRITERIA);
    window.dispatchEvent(new CustomEvent(SCOUT_CRITERIA_UPDATED_EVENT, { detail: SCOUT_POSITION_CONFIGS }));
  } catch (err) {
    console.warn('[scoutCriteriaByPosition] Erreur reset custom criteria:', err);
  }
}

/**
 * Ajoute un critère à un poste et un pilier donnés (Réservé Super Admin).
 */
export function addScoutCriterion(positionId: string, pillar: ScoutPillarKey, criterionName: string): boolean {
  const cleanName = criterionName.trim();
  if (!cleanName) return false;
  const configs = getCustomScoutPositionConfigs();
  const pos = configs[positionId];
  if (!pos) return false;

  const currentList = pos.criteria[pillar] || [];
  if (currentList.some(c => c.toLowerCase() === cleanName.toLowerCase())) return false;

  const updated: Record<string, ScoutPositionConfig> = {
    ...configs,
    [positionId]: {
      ...pos,
      criteria: {
        ...pos.criteria,
        [pillar]: [...currentList, cleanName],
      }
    }
  };
  saveCustomScoutPositionConfigs(updated);
  return true;
}

/**
 * Modifie/renomme un critère existant (Réservé Super Admin).
 */
export function updateScoutCriterion(positionId: string, pillar: ScoutPillarKey, oldName: string, newName: string): boolean {
  const cleanNew = newName.trim();
  if (!cleanNew || cleanNew === oldName) return false;
  const configs = getCustomScoutPositionConfigs();
  const pos = configs[positionId];
  if (!pos) return false;

  const currentList = pos.criteria[pillar] || [];
  const updatedList = currentList.map(c => c === oldName ? cleanNew : c);

  const updated: Record<string, ScoutPositionConfig> = {
    ...configs,
    [positionId]: {
      ...pos,
      criteria: {
        ...pos.criteria,
        [pillar]: updatedList,
      }
    }
  };
  saveCustomScoutPositionConfigs(updated);
  return true;
}

/**
 * Supprime un critère (Réservé Super Admin).
 */
export function deleteScoutCriterion(positionId: string, pillar: ScoutPillarKey, criterionName: string): boolean {
  const configs = getCustomScoutPositionConfigs();
  const pos = configs[positionId];
  if (!pos) return false;

  const currentList = pos.criteria[pillar] || [];
  const updatedList = currentList.filter(c => c !== criterionName);

  const updated: Record<string, ScoutPositionConfig> = {
    ...configs,
    [positionId]: {
      ...pos,
      criteria: {
        ...pos.criteria,
        [pillar]: updatedList,
      }
    }
  };
  saveCustomScoutPositionConfigs(updated);
  return true;
}

/**
 * Associe n'importe quel code ou libellé de poste à l'une des 9 configurations de scouting.
 * Prend en compte les critères personnalisés enregistrés par le Super Admin.
 */
export function getScoutPositionConfig(rawPosition?: string | null): ScoutPositionConfig {
  const configs = getCustomScoutPositionConfigs();
  if (!rawPosition) {
    return configs.CM || SCOUT_POSITION_CONFIGS.CM;
  }

  const clean = rawPosition.trim().toUpperCase();
  const lower = rawPosition.toLowerCase();

  // 1. Gardien — GK
  if (clean === 'GK' || clean === 'G' || clean === 'GB' || lower.includes('gardien')) {
    return configs.GK || SCOUT_POSITION_CONFIGS.GK;
  }

  // 2. Défenseur central — CB
  if (
    clean === 'CB' ||
    clean === 'DC' ||
    lower.includes('central') ||
    lower.includes('stoppeur') ||
    lower.includes('libero')
  ) {
    return configs.CB || SCOUT_POSITION_CONFIGS.CB;
  }

  // 3. Latéral droit/gauche — RB/LB
  if (
    clean === 'RB' ||
    clean === 'LB' ||
    clean === 'RWB' ||
    clean === 'LWB' ||
    clean === 'DD' ||
    clean === 'DG' ||
    lower.includes('latéral') ||
    lower.includes('lateral') ||
    lower.includes('arrière') ||
    lower.includes('arriere')
  ) {
    return configs.RB_LB || SCOUT_POSITION_CONFIGS.RB_LB;
  }

  // 4. Milieu défensif — CDM / 6
  if (
    clean === 'CDM' ||
    clean === 'DM' ||
    clean === 'MDC' ||
    clean === '6' ||
    lower.includes('défensif') ||
    lower.includes('defensif') ||
    lower.includes('sentinelle') ||
    lower.includes('recuperateur')
  ) {
    return configs.CDM || SCOUT_POSITION_CONFIGS.CDM;
  }

  // 6. Milieu offensif — CAM / 10 (vérifié avant CM pour capter 'offensif' ou '10')
  if (
    clean === 'CAM' ||
    clean === 'AM' ||
    clean === 'MOC' ||
    clean === 'MO' ||
    clean === '10' ||
    lower.includes('offensif') ||
    lower.includes('meneur')
  ) {
    return configs.CAM || SCOUT_POSITION_CONFIGS.CAM;
  }

  // 5. Milieu central — CM / 8
  if (
    clean === 'CM' ||
    clean === 'MC' ||
    clean === 'MF' ||
    clean === '8' ||
    lower.includes('central') ||
    lower.includes('milieu') ||
    lower.includes('relayeur')
  ) {
    return configs.CM || SCOUT_POSITION_CONFIGS.CM;
  }

  // 7. Ailier — RW / LW
  if (
    clean === 'RW' ||
    clean === 'LW' ||
    clean === 'RM' ||
    clean === 'LM' ||
    clean === 'AD' ||
    clean === 'AG' ||
    clean === 'MD' ||
    clean === 'MG' ||
    lower.includes('ailier')
  ) {
    return configs.RW_LW || SCOUT_POSITION_CONFIGS.RW_LW;
  }

  // 9. Second attaquant — SS
  if (
    clean === 'SS' ||
    clean === 'SA' ||
    clean === 'AT' ||
    clean === '9.5' ||
    lower.includes('second') ||
    lower.includes('soutien')
  ) {
    return configs.SS || SCOUT_POSITION_CONFIGS.SS;
  }

  // 8. Avant-centre — ST / CF
  if (
    clean === 'ST' ||
    clean === 'CF' ||
    clean === 'BU' ||
    clean === 'AC' ||
    clean === '9' ||
    lower.includes('centre') ||
    lower.includes('buteur') ||
    lower.includes('attaquant') ||
    lower.includes('pointe')
  ) {
    return configs.ST || SCOUT_POSITION_CONFIGS.ST;
  }

  // Fallback par défaut sur CM
  return configs.CM || SCOUT_POSITION_CONFIGS.CM;
}

export const SCOUT_POSITION_PROFILES = SCOUT_POSITION_CONFIGS;
