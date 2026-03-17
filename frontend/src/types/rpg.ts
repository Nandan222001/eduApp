export interface CharacterStats {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats: {
    attack?: number;
    defense?: number;
    health?: number;
    mana?: number;
  };
  iconUrl?: string;
}

export interface SubjectRegion {
  id: string;
  name: string;
  subject: string;
  status: 'locked' | 'in-progress' | 'complete';
  completionPercentage: number;
  bossDefeated: boolean;
  chapterCount: number;
  completedChapters: number;
  color: string;
  iconUrl?: string;
}

export interface BossBattle {
  id: string;
  bossName: string;
  bossLevel: number;
  bossHealth: number;
  bossMaxHealth: number;
  currentQuestion: Question | null;
  turn: 'player' | 'boss';
  playerHealth: number;
  playerMana: number;
  battleLog: BattleLogEntry[];
  isVictory: boolean;
  isDefeat: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  methods: Method[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

export interface Method {
  id: string;
  name: string;
  description: string;
  attackType: 'physical' | 'magic' | 'hybrid';
  manaCost: number;
  baseDamage: number;
  correctAnswer: boolean;
}

export interface BattleLogEntry {
  id: string;
  timestamp: Date;
  actor: 'player' | 'boss';
  action: string;
  damage?: number;
  healing?: number;
  xpGained?: number;
  message: string;
}

export interface LootDrop {
  id: string;
  items: LootItem[];
  xpGained: number;
  goldGained: number;
  levelUp: boolean;
  newLevel?: number;
}

export interface LootItem {
  id: string;
  name: string;
  type: 'equipment' | 'consumable' | 'material';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  iconUrl?: string;
  equipment?: Equipment;
}

export interface PassportStamp {
  id: string;
  chapterId: string;
  chapterName: string;
  subject: string;
  entryDate: string;
  exitDate: string | null;
  masteryLevel: number;
  masteryStars: number;
  duration: number;
  questionsCompleted: number;
  accuracy: number;
}

export interface VisaBadge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedDate: string;
  special: boolean;
  category: string;
}

export interface BorderCrossingTest {
  id: string;
  fromChapter: string;
  toChapter: string;
  subject: string;
  required: boolean;
  status: 'not-taken' | 'passed' | 'failed' | 'in-progress';
  attempts: number;
  maxAttempts: number;
  score?: number;
  passingScore: number;
}

export interface TravelJournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  chapterId: string;
  chapterName: string;
  subject: string;
  mood: 'excellent' | 'good' | 'neutral' | 'struggling';
  achievements: string[];
  reflections: string;
}

export interface SubjectPassport {
  id: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  stamps: PassportStamp[];
  visaBadges: VisaBadge[];
  borderCrossingTests: BorderCrossingTest[];
  travelJournal: TravelJournalEntry[];
  overallProgress: number;
  totalChaptersCompleted: number;
  totalSubjects: number;
}
