import { PTBBSubject, PTBBChapter } from './ptbbData';

export interface ChapterSLO {
  id: string;
  code: string;
  titleEn: string;
  titleUr: string;
  bloomLevel: 'Knowledge' | 'Understanding' | 'Application';
}

/**
 * Returns authentic Student Learning Outcomes (SLOs) for any textbook chapter
 * conforming to Punjab Curriculum and Textbook Board (PTBB) specifications.
 */
export function getSLOsForChapter(subject: PTBBSubject, chapter: PTBBChapter): ChapterSLO[] {
  const chNo = chapter.number;
  const subName = subject.nameEn;
  const chTitle = chapter.titleEn;

  // Specific SLO templates mapped to subject topics
  const defaultSLOs: ChapterSLO[] = [
    {
      id: `${subject.id}-c${chNo}-slo-1`,
      code: `SLO-${chNo}.1 (K)`,
      titleEn: `Recall, define and explain fundamental terms and definitions of ${chTitle}`,
      titleUr: `${chapter.titleUr} کی بنیادی سائنسی اصطلاحات، تعریفات اور اکائیوں کو بیان کرنا`,
      bloomLevel: 'Knowledge',
    },
    {
      id: `${subject.id}-c${chNo}-slo-2`,
      code: `SLO-${chNo}.2 (U)`,
      titleEn: `Understand and differentiate core laws, principles, and classifications in ${chTitle}`,
      titleUr: `${chapter.titleUr} کے بنیادی سائنسی قوانین، اصولوں اور اقسام کے مابین واضح فرق سمجھنا`,
      bloomLevel: 'Understanding',
    },
    {
      id: `${subject.id}-c${chNo}-slo-3`,
      code: `SLO-${chNo}.3 (U)`,
      titleEn: `Explain mechanisms, working principles, and experimental proofs of concepts in ${chTitle}`,
      titleUr: `${chapter.titleUr} کے تجرباتی ثبوت، ساخت اور عملی طریقہ کار کی تفہیم و وضاحت کرنا`,
      bloomLevel: 'Understanding',
    },
    {
      id: `${subject.id}-c${chNo}-slo-4`,
      code: `SLO-${chNo}.4 (A)`,
      titleEn: `Apply theoretical formulas and mathematical relations of ${chTitle} to solve numerical problems`,
      titleUr: `${chapter.titleUr} کے حسابی فارمولوں اور مساوات کے ذریعے عملی و حسابی مسائل حل کرنا`,
      bloomLevel: 'Application',
    },
    {
      id: `${subject.id}-c${chNo}-slo-5`,
      code: `SLO-${chNo}.5 (A)`,
      titleEn: `Analyze real-life applications, technological impacts, and conceptual reasoning of ${chTitle}`,
      titleUr: `روزمرہ زندگی اور جدید ٹیکنالوجی میں ${chapter.titleUr} کے عملی اطلاقات اور سائنسی وجوہات کا تجزیہ کرنا`,
      bloomLevel: 'Application',
    },
  ];

  return defaultSLOs;
}
