export const MATCH_STATUS = {
  PLANNED: 'planned',
  ONGOING: 'ongoing',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
} as const;

export const MATCH_TRACKING_STATUS = {
  PLANNED: 'planned',
  ONGOING: 'ongoing',
  FINISHED: 'finished',
  VALIDATED: 'validated',
} as const;

export const PLAYER_CATEGORIES = [
  'SENIOR',
  'PRO',
  'U23',
  'U21',
  'U19',
  'U17',
  'U16',
  'U15',
  'U13',
  'U11',
  'U9',
  'U7',
] as const;

export const MATCH_EVENT_TYPES = {
  KICKOFF: 'kickoff',
  HALFTIME: 'halftime',
  FULLTIME: 'fulltime',
  GOAL: 'goal',
  OWN_GOAL: 'own_goal',
  ASSIST: 'assist',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  PENALTY_SCORED: 'penalty_scored',
  PENALTY_MISSED: 'penalty_missed',
  INJURY: 'injury',
  SHOT: 'shot',
  VAR: 'var',
} as const;

export const PITCH_DESIGNS = ['classic', 'modern', 'minimal', 'striped'] as const;

export const PREFERRED_FOOT = ['Left', 'Right', 'Both'] as const;
