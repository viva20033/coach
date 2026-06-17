import type { Difficulty } from '../types';
import { DIFFICULTY_LABELS } from '../types';
import { difficultyColor } from '../utils/helpers';

interface Props {
  difficulty: Difficulty;
}

export default function DifficultyBadge({ difficulty }: Props) {
  return (
    <span className={`badge ${difficultyColor(difficulty)}`}>
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}
