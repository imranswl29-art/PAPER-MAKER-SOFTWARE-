export type LanguageMode = 'bilingual' | 'english' | 'urdu';
export type ClassLevel = '9th' | '10th';
export type DifficultyLevel = 'easy' | 'standard' | 'conceptual_slo';

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  textEn: string;
  textUr: string;
}

export interface MCQItem {
  id: string;
  qNo: number;
  statementEn: string;
  statementUr: string;
  options: MCQOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanationEn?: string;
  explanationUr?: string;
  chapterRef?: number;
}

export interface ShortQuestionItem {
  id: string;
  subNo: number;
  statementEn: string;
  statementUr: string;
  marks: number;
  chapterRef?: number;
  modelAnswerEn?: string;
  modelAnswerUr?: string;
}

export interface ShortQuestionGroup {
  id: string;
  qNo: number; // e.g. Q2, Q3, Q4
  instructionEn: string; // "Attempt any 5 parts"
  instructionUr: string; // "کوئی سے پانچ اجزاء کے مختصر جوابات لکھیں۔"
  attemptCount: number;
  totalCount: number;
  marksEach: number;
  questions: ShortQuestionItem[];
}

export interface LongQuestionPart {
  partLabel: 'a' | 'b' | 'c';
  statementEn: string;
  statementUr: string;
  marks: number;
  isNumerical?: boolean;
}

export interface LongQuestionItem {
  id: string;
  qNo: number; // e.g. Q5, Q6, Q7
  totalMarks: number;
  parts: LongQuestionPart[];
  chapterRef?: string;
}

export interface PaperHeaderInfo {
  instituteName: string;
  campusName: string;
  examTitle: string;
  classLevel: ClassLevel;
  subjectName: string;
  syllabusCovered: string;
  dateStr: string;
  timeAllowed: string;
  totalMarks: number;
  teacherName: string;
  showWatermark: boolean;
  watermarkText: string;
  logoType: 'crest' | 'shield' | 'book' | 'star' | 'custom';
  customLogoUrl?: string;
  boardPattern: string; // e.g. "BISE Lahore / Punjab Board"
  phone?: string;
  includeBubbleSheet?: boolean; // Toggle whether Bubble Sheet / OMR response grid is attached to exam paper
  studentFields: {
    showRollNo: boolean;
    showName: boolean;
    showSection: boolean;
    showObtainedMarks: boolean;
  };
}

export interface GeneratedExamPaper {
  id: string;
  userId?: string;
  createdByUserId?: string;
  createdAt: string;
  header: PaperHeaderInfo;
  languageMode: LanguageMode;
  difficulty: DifficultyLevel;
  objectiveSection: {
    enabled: boolean;
    titleEn: string;
    titleUr: string;
    totalMarks: number;
    timeAllowed: string;
    instructionsEn: string;
    instructionsUr: string;
    questions: MCQItem[];
  };
  subjectiveSection: {
    enabled: boolean;
    titleEn: string;
    titleUr: string;
    totalMarks: number;
    timeAllowed: string;
    part1_shortQuestions: ShortQuestionGroup[];
    part2_longQuestions: {
      instructionEn: string;
      instructionUr: string;
      attemptCount: number;
      totalCount: number;
      questions: LongQuestionItem[];
    };
  };
}
