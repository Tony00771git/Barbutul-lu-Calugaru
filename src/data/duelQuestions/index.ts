import { DuelDifficulty, DuelQuestion, DuelSubmode } from '../../types';
import { generalEasyQuestions } from './generalEasy';
import { generalMediumQuestions } from './generalMedium';
import { generalMediumExtraQuestions } from './generalMediumExtra';
import { generalHardQuestions } from './generalHard';
import { generalHardExtraQuestions } from './generalHardExtra';
import { footballEasyQuestions } from './footballEasy';
import { footballMediumQuestions } from './footballMedium';
import { footballMediumExtraQuestions } from './footballMediumExtra';
import { footballHardQuestions } from './footballHard';
import { footballHardExtraQuestions } from './footballHardExtra';

export const allDuelQuestionsMap: Record<DuelSubmode, Record<DuelDifficulty, DuelQuestion[]>> = {
  general: {
    easy: generalEasyQuestions,
    medium: [...generalMediumQuestions, ...generalMediumExtraQuestions],
    hard: [...generalHardQuestions, ...generalHardExtraQuestions],
  },
  football: {
    easy: footballEasyQuestions,
    medium: [...footballMediumQuestions, ...footballMediumExtraQuestions],
    hard: [...footballHardQuestions, ...footballHardExtraQuestions],
  },
};

export function getDuelQuestionPool(submode: DuelSubmode, difficulty: DuelDifficulty): DuelQuestion[] {
  const pool = allDuelQuestionsMap[submode]?.[difficulty];
  if (pool && pool.length > 0) {
    return pool;
  }
  return generalEasyQuestions;
}

export function shuffleDeck<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
