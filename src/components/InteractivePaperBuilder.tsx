import React, { useState, useMemo, useEffect } from 'react';
import {
  PUNJAB_BOARDS,
  EXAM_TYPES,
  PTBBSubject,
  PTBBChapter,
} from '../data/ptbbData';
import {
  MASTER_PTBB_SUBJECTS,
  getQuestionsForSubjectAndChapters,
} from '../data/questionBankStore';
import { getSLOsForChapter, ChapterSLO } from '../data/sloData';
import {
  ClassLevel,
  DifficultyLevel,
  GeneratedExamPaper,
  LanguageMode,
  MCQItem,
  ShortQuestionGroup,
  ShortQuestionItem,
  LongQuestionItem,
} from '../types/paper';
import { UserAccount } from '../types/user';
import {
  CheckSquare,
  Square,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Layers,
  HelpCircle,
  Clock,
  Calculator,
  Award,
  Search,
  Sliders,
  FileCheck2,
  GraduationCap,
  Flame,
  Feather,
  Scale,
  Building,
  CircleDot,
  CircleOff,
} from 'lucide-react';

interface InteractivePaperBuilderProps {
  currentUser: UserAccount | null;
  initialClass?: ClassLevel;
  onPaperCreated: (paper: GeneratedExamPaper) => void;
  onCancel: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const InteractivePaperBuilder: React.FC<InteractivePaperBuilderProps> = ({
  currentUser,
  initialClass = '9th',
  onPaperCreated,
  onCancel,
}) => {
  // Current active step (1 to 8)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // STEP 1: Class
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(initialClass);

  // STEP 2: Subject
  const classSubjects = useMemo(
    () => MASTER_PTBB_SUBJECTS.filter((s) => s.classLevel === selectedClass),
    [selectedClass]
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    classSubjects[0]?.id || '9th-physics'
  );
  const currentSubject: PTBBSubject = useMemo(
    () => MASTER_PTBB_SUBJECTS.find((s) => s.id === selectedSubjectId) || classSubjects[0],
    [selectedSubjectId, classSubjects]
  );

  // STEP 3: Chapters
  const [selectedChapters, setSelectedChapters] = useState<number[]>([1]);

  // STEP 4: SLOs
  const [selectedSloIds, setSelectedSloIds] = useState<string[]>([]);

  // STEP 5: MCQs
  const [selectedMcqIds, setSelectedMcqIds] = useState<string[]>([]);
  const [mcqSearchQuery, setMcqSearchQuery] = useState('');
  const [mcqCategoryFilter, setMcqCategoryFilter] = useState('all');

  // STEP 6: Short Questions
  const [selectedShortIds, setSelectedShortIds] = useState<string[]>([]);
  const [shortSearchQuery, setShortSearchQuery] = useState('');
  const [shortCategoryFilter, setShortCategoryFilter] = useState('all');

  // STEP 7: Long Questions
  const [selectedLongIds, setSelectedLongIds] = useState<string[]>([]);
  const [longSearchQuery, setLongSearchQuery] = useState('');

  // STEP 8: Marks & Difficulty Level
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('standard');
  const [marksPerMcq, setMarksPerMcq] = useState<number>(1);
  const [marksPerShort, setMarksPerShort] = useState<number>(2);
  const [marksPerLong, setMarksPerLong] = useState<number>(9);
  const [customTotalMarks, setCustomTotalMarks] = useState<number>(
    currentSubject?.defaultMarks || 60
  );
  const [customTimeAllowed, setCustomTimeAllowed] = useState<string>('2:15 Hours');
  const [examTitle, setExamTitle] = useState<string>('Evaluation Examination 2026');
  const [instituteName, setInstituteName] = useState<string>(
    currentUser?.schoolName || 'PUNJAB GROUP OF SCIENCE ACADEMIES'
  );
  const [campusName, setCampusName] = useState<string>(currentUser?.campusName || 'Main Campus');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(currentUser?.logoUrl);
  const [teacherName, setTeacherName] = useState<string>('Prof. M. Imran');
  const [selectedBoard, setSelectedBoard] = useState<string>(currentUser?.targetBoard || 'lahore');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('bilingual');
  const [includeBubbleSheet, setIncludeBubbleSheet] = useState<boolean>(true);

  // Teacher Choice & Attempt Settings (طلباء کو دی جانے والی چوائس)
  const [shortAttemptChoice, setShortAttemptChoice] = useState<number>(5);
  const [longAttemptChoice, setLongAttemptChoice] = useState<number>(2);
  const [isCustomMarksOverride, setIsCustomMarksOverride] = useState<boolean>(false);

  // When class changes, reset subject & chapters
  const handleClassSelect = (cls: ClassLevel) => {
    setSelectedClass(cls);
    const firstSub = MASTER_PTBB_SUBJECTS.find((s) => s.classLevel === cls);
    if (firstSub) {
      setSelectedSubjectId(firstSub.id);
      setSelectedChapters(firstSub.chapters.slice(0, 2).map((c) => c.number));
    }
  };

  // When subject changes, reset chapters & targets
  const handleSubjectSelect = (subId: string) => {
    setSelectedSubjectId(subId);
    const sub = MASTER_PTBB_SUBJECTS.find((s) => s.id === subId);
    if (sub) {
      setSelectedChapters(sub.chapters.slice(0, 2).map((c) => c.number));
      setCustomTotalMarks(sub.defaultMarks || 60);
      setCustomTimeAllowed(sub.timeAllowed || '2:15 Hours');
    }
  };

  // Active chapter objects
  const activeChapterObjects: PTBBChapter[] = useMemo(() => {
    return (currentSubject?.chapters || []).filter((ch) => selectedChapters.includes(ch.number));
  }, [currentSubject, selectedChapters]);

  // Compute all SLOs for active chapters
  const availableSLOs: ChapterSLO[] = useMemo(() => {
    const list: ChapterSLO[] = [];
    activeChapterObjects.forEach((ch) => {
      const slos = getSLOsForChapter(currentSubject, ch);
      list.push(...slos);
    });
    return list;
  }, [currentSubject, activeChapterObjects]);

  // Auto-select all SLOs when chapters change
  useEffect(() => {
    setSelectedSloIds(availableSLOs.map((s) => s.id));
  }, [availableSLOs]);

  // Auto-sync school profile details whenever user profile is updated
  useEffect(() => {
    if (currentUser) {
      if (currentUser.schoolName) setInstituteName(currentUser.schoolName);
      if (currentUser.campusName) setCampusName(currentUser.campusName);
      if (currentUser.logoUrl) setCustomLogoUrl(currentUser.logoUrl);
      if (currentUser.name) setTeacherName(currentUser.name);
      if (currentUser.targetBoard) setSelectedBoard(currentUser.targetBoard);
    }
  }, [currentUser]);

  // Fetch question pool from question bank for chosen chapters
  const questionsPool = useMemo(() => {
    return getQuestionsForSubjectAndChapters(currentSubject.id, selectedChapters);
  }, [currentSubject.id, selectedChapters]);

  // Auto-seed recommended question count when entering steps
  const targetMCQCount = currentSubject.mcqMarks || 12;
  const targetShortCount = Math.round((currentSubject.shortQMarks || 30) / 2);
  const targetLongCount = Math.round((currentSubject.longQMarks || 18) / 9) || 3;

  // Auto-pick helpers
  const handleAutoPickMCQs = () => {
    const shuffled = [...questionsPool.mcqs].sort(() => 0.5 - Math.random());
    setSelectedMcqIds(shuffled.slice(0, targetMCQCount).map((m) => m.id));
  };

  const handleAutoPickShorts = () => {
    const shuffled = [...questionsPool.shortQuestions].sort(() => 0.5 - Math.random());
    setSelectedShortIds(shuffled.slice(0, targetShortCount).map((s) => s.id));
  };

  const handleAutoPickLongs = () => {
    const shuffled = [...questionsPool.longQuestions].sort(() => 0.5 - Math.random());
    setSelectedLongIds(shuffled.slice(0, targetLongCount).map((l) => l.id));
  };

  // Auto-pick all questions across sections strictly according to official board exam pattern
  const handleAutoPickAllAccordingToBoardScheme = () => {
    const shuffledMcqs = [...questionsPool.mcqs].sort(() => 0.5 - Math.random());
    setSelectedMcqIds(shuffledMcqs.slice(0, targetMCQCount).map((m) => m.id));

    const shuffledShorts = [...questionsPool.shortQuestions].sort(() => 0.5 - Math.random());
    setSelectedShortIds(shuffledShorts.slice(0, targetShortCount).map((s) => s.id));

    const shuffledLongs = [...questionsPool.longQuestions].sort(() => 0.5 - Math.random());
    setSelectedLongIds(shuffledLongs.slice(0, targetLongCount).map((l) => l.id));
  };

  // Chapter selection helpers
  const toggleChapter = (num: number) => {
    setSelectedChapters((prev) =>
      prev.includes(num)
        ? prev.length > 1
          ? prev.filter((n) => n !== num)
          : prev
        : [...prev, num].sort((a, b) => a - b)
    );
  };

  const selectAllChapters = () => {
    setSelectedChapters((currentSubject?.chapters || []).map((c) => c.number));
  };

  const selectHalf1 = () => {
    const total = currentSubject?.chapters?.length || 1;
    const half = Math.ceil(total / 2);
    setSelectedChapters((currentSubject?.chapters || []).slice(0, half).map((c) => c.number));
  };

  const selectHalf2 = () => {
    const total = currentSubject?.chapters?.length || 1;
    const half = Math.ceil(total / 2);
    setSelectedChapters((currentSubject?.chapters || []).slice(half).map((c) => c.number));
  };

  // SLO toggle
  const toggleSlo = (id: string) => {
    setSelectedSloIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Live Marks Calculation considering student choice attempt
  const totalMcqMarks = selectedMcqIds.length * marksPerMcq;
  const totalShortMarks = (selectedShortIds.length > 0 ? Math.min(selectedShortIds.length, shortAttemptChoice) : 0) * marksPerShort;
  const totalLongMarks = (selectedLongIds.length > 0 ? Math.min(selectedLongIds.length, longAttemptChoice) : 0) * marksPerLong;
  const calculatedGrandTotal = totalMcqMarks + totalShortMarks + totalLongMarks;

  // Filtered lists for MCQs, Shorts, Longs
  const filteredMCQs = useMemo(() => {
    return questionsPool.mcqs.filter((m: any) => {
      const matchesSearch =
        !mcqSearchQuery.trim() ||
        m.statementEn.toLowerCase().includes(mcqSearchQuery.toLowerCase()) ||
        (m.statementUr && m.statementUr.includes(mcqSearchQuery));
      const matchesCat =
        mcqCategoryFilter === 'all' ||
        (m.category && m.category.toLowerCase() === mcqCategoryFilter.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [questionsPool.mcqs, mcqSearchQuery, mcqCategoryFilter]);

  const filteredShorts = useMemo(() => {
    return questionsPool.shortQuestions.filter((s: any) => {
      const matchesSearch =
        !shortSearchQuery.trim() ||
        s.statementEn.toLowerCase().includes(shortSearchQuery.toLowerCase()) ||
        (s.statementUr && s.statementUr.includes(shortSearchQuery));
      const matchesCat =
        shortCategoryFilter === 'all' ||
        (s.category && s.category.toLowerCase() === shortCategoryFilter.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [questionsPool.shortQuestions, shortSearchQuery, shortCategoryFilter]);

  const filteredLongs = useMemo(() => {
    return questionsPool.longQuestions.filter((l: any) => {
      return (
        !longSearchQuery.trim() ||
        l.statementEn?.toLowerCase().includes(longSearchQuery.toLowerCase()) ||
        l.parts?.some((p: any) => p.statementEn.toLowerCase().includes(longSearchQuery.toLowerCase()))
      );
    });
  }, [questionsPool.longQuestions, longSearchQuery]);

  // Final Paper Assembly & Generation
  const handleFinalizePaper = () => {
    const boardObj = PUNJAB_BOARDS.find((b) => b.id === selectedBoard);
    const boardName = boardObj ? boardObj.nameEn : 'BISE Punjab';

    const chosenMcqs: MCQItem[] = questionsPool.mcqs
      .filter((m) => selectedMcqIds.includes(m.id))
      .map((m, idx) => ({
        id: m.id,
        qNo: idx + 1,
        statementEn: m.statementEn,
        statementUr: m.statementUr,
        options: m.options,
        correctOption: m.correctOption,
      }));

    const chosenShorts: ShortQuestionItem[] = questionsPool.shortQuestions.filter((s) =>
      selectedShortIds.includes(s.id)
    );

    // Group short questions into Q.2, Q.3, Q.4 with customizable choice
    const shortGroups: ShortQuestionGroup[] = [];
    const grpCapacity = shortAttemptChoice >= 6 ? 9 : 8;
    const grpCount = Math.max(1, Math.ceil(chosenShorts.length / grpCapacity));
    for (let g = 0; g < grpCount; g++) {
      const slice = chosenShorts.slice(g * grpCapacity, (g + 1) * grpCapacity);
      if (slice.length > 0) {
        const attempt = Math.min(slice.length, shortAttemptChoice);
        shortGroups.push({
          id: `sq-grp-${g + 2}`,
          qNo: g + 2,
          instructionEn: `Write short answers to any ${attempt} questions out of ${slice.length}:`,
          instructionUr: `درج ذیل میں سے کوئی سے ${attempt} سوالات کے مختصر جوابات لکھیں (کل ${slice.length} سوالات):`,
          attemptCount: attempt,
          totalCount: slice.length,
          marksEach: marksPerShort,
          questions: slice.map((q, idx) => ({
            id: q.id,
            subNo: idx + 1,
            statementEn: q.statementEn,
            statementUr: q.statementUr,
            marks: marksPerShort,
          })),
        });
      }
    }

    const chosenLongs: LongQuestionItem[] = questionsPool.longQuestions
      .filter((l) => selectedLongIds.includes(l.id))
      .map((l, idx) => ({
        id: l.id,
        qNo: idx + 5,
        totalMarks: l.totalMarks || marksPerLong,
        parts: (l.parts || []).map((p) => ({
          partLabel: p.partLabel,
          statementEn: p.statementEn,
          statementUr: p.statementUr,
          marks: p.marks,
          isNumerical: p.isNumerical,
        })),
        chapterRef: l.chapterRef,
      }));

    const longAttempt = Math.min(chosenLongs.length, longAttemptChoice);

    const totalMcqMarks = chosenMcqs.length * marksPerMcq;
    const totalShortMarks = shortGroups.reduce((acc, g) => acc + (g.attemptCount * g.marksEach), 0);
    const totalLongMarks = longAttempt * marksPerLong;
    const calculatedGrandTotal = isCustomMarksOverride ? customTotalMarks : (totalMcqMarks + totalShortMarks + totalLongMarks);

    const fullPaper: GeneratedExamPaper = {
      id: `paper-wizard-${Date.now()}`,
      createdAt: new Date().toISOString(),
      languageMode,
      difficulty,
      header: {
        instituteName: instituteName || 'PUNJAB GROUP OF SCIENCE ACADEMIES',
        campusName: campusName || 'Main Campus',
        examTitle: examTitle || `${currentSubject.nameEn} Evaluation Test`,
        classLevel: selectedClass,
        subjectName: currentSubject.nameEn,
        syllabusCovered: activeChapterObjects
          .map((c) => `Unit ${c.number}: ${c.titleEn}`)
          .join(', '),
        dateStr: new Date().toLocaleDateString('en-GB'),
        timeAllowed: customTimeAllowed || '2:15 Hours',
        totalMarks: calculatedGrandTotal > 0 ? calculatedGrandTotal : customTotalMarks,
        teacherName: teacherName || '',
        showWatermark: true,
        watermarkText: instituteName || 'BISE PUNJAB',
        logoType: 'crest',
        customLogoUrl: customLogoUrl || currentUser?.logoUrl,
        boardPattern: `${boardName} Pattern (${difficulty.toUpperCase()} LEVEL)`,
        includeBubbleSheet: includeBubbleSheet,
        studentFields: {
          showRollNo: true,
          showName: true,
          showSection: true,
          showObtainedMarks: true,
        },
      },
      objectiveSection: {
        enabled: chosenMcqs.length > 0,
        titleEn: 'SECTION - A (OBJECTIVE TYPE)',
        titleUr: 'حصہ اول (معروضی طرز)',
        totalMarks: totalMcqMarks,
        timeAllowed: `${Math.max(15, Math.round(chosenMcqs.length * 1.25))} Minutes`,
        instructionsEn:
          'Note: Four possible answers A, B, C and D to each question are given. Fill the correct bubble.',
        instructionsUr:
          'نوٹ: ہر سوال کے چار ممکنہ جوابات دیے گئے ہیں۔ درست جواب کے دائرے کو مارکر سے بھریں۔',
        questions: chosenMcqs,
      },
      subjectiveSection: {
        enabled: shortGroups.length > 0 || chosenLongs.length > 0,
        titleEn: 'SECTION - B & C (SUBJECTIVE TYPE)',
        titleUr: 'حصہ دوم و سوم (انشائیہ طرز)',
        totalMarks: totalShortMarks + totalLongMarks,
        timeAllowed: customTimeAllowed || '2:00 Hours',
        part1_shortQuestions: shortGroups,
        part2_longQuestions: {
          instructionEn: `Note: Attempt any ${longAttempt} questions out of ${chosenLongs.length}. All questions carry equal marks (${marksPerLong} Marks each).`,
          instructionUr: `نوٹ: کل ${chosenLongs.length} سوالات میں سے کوئی سے ${longAttempt} سوالات کے تفصیلی جوابات تحریر کریں۔ تمام سوالات کے نمبر برابر ہیں (${marksPerLong} نمبر فی سوال)۔`,
          attemptCount: longAttempt,
          totalCount: chosenLongs.length,
          questions: chosenLongs,
        },
      },
    };

    onPaperCreated(fullPaper);
  };

  // Steps configuration
  const stepsMeta = [
    { num: 1, title: 'Class & Medium', subtitle: 'Target & Language' },
    { num: 2, title: 'Subject', subtitle: 'Choose Book' },
    { num: 3, title: 'Chapters', subtitle: 'Select Units' },
    { num: 4, title: 'SLOs', subtitle: 'Outcomes' },
    { num: 5, title: 'MCQs', subtitle: 'Section A' },
    { num: 6, title: 'Shorts & Choice', subtitle: 'Section B' },
    { num: 7, title: 'Longs & Choice', subtitle: 'Section C' },
    { num: 8, title: 'Difficulty & Finalize', subtitle: 'Marks & Tier' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans text-slate-800 pb-12">
      {/* ===================== STEPPER HEADER ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Step-by-Step Examination Paper Builder</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow the 8 guided steps or click Auto-Pick to automatically select questions conforming to PTBB pattern.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoPickAllAccordingToBoardScheme}
              className="btn-3d btn-3d-emerald flex items-center gap-1.5 px-3.5 py-2 text-white font-black rounded-xl text-xs cursor-pointer shadow-md"
              title="Automatically select MCQs, Short Questions, and Long Questions strictly according to official board pairing scheme"
            >
              <Sparkles className="w-4 h-4 text-emerald-100" />
              <span>Auto-Pick Questions (بورڈ پیٹرن آٹو منتخب کریں)</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ALWAYS-VISIBLE MEDIUM SELECTION BAR (انگلش میڈیم / اردو میڈیم / دونوں دو لسانی) */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Paper Medium (امتحانی میڈیم):
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Switch anytime between English, Urdu, or Bilingual format
            </span>
          </div>

          <div className="inline-flex rounded-xl p-1 bg-white border border-slate-300 shadow-xs gap-1">
            <button
              type="button"
              onClick={() => setLanguageMode('english')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                languageMode === 'english'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              English Medium
            </button>

            <button
              type="button"
              onClick={() => setLanguageMode('urdu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                languageMode === 'urdu'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Urdu Medium
            </button>

            <button
              type="button"
              onClick={() => setLanguageMode('bilingual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                languageMode === 'bilingual'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Bilingual (English + Urdu)
            </button>
          </div>
        </div>

        {/* Stepper Navigation Pills - Responsive on Laptops and Tablets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
          {stepsMeta.map((s) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num as WizardStep)}
                className={`btn-3d p-2.5 rounded-xl text-center border-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'btn-3d-blue text-white ring-2 ring-blue-400/50 shadow-md'
                    : isCompleted
                    ? 'btn-3d-emerald text-white font-bold shadow-xs'
                    : 'bg-white border-2 border-slate-300 text-slate-800 hover:bg-slate-100 font-bold'
                }`}
              >
                <div className="text-[10px] font-black uppercase flex items-center justify-center gap-1">
                  <span>Step {s.num}</span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                </div>
                <div className="font-extrabold text-xs truncate mt-0.5">{s.title}</div>
                <div
                  className={`text-[9px] ${
                    isCurrent || isCompleted ? 'text-white/80' : 'text-slate-500'
                  } font-medium truncate mt-0.5`}
                >
                  {s.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================== STEP CONTENT WORKSPACE ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: SELECT CLASS                                                      */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Step 1 of 8: Select Target Class
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Choose Class Level
              </h2>
              <p className="text-xs text-slate-500">
                Select Matric Part-I (9th Class) or Matric Part-II (10th Class) Science Group board examination.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-3xl">
              {[
                {
                  level: '9th' as ClassLevel,
                  name: '9th Class (Matric Part-I)',
                  subTitle: 'Secondary School Certificate - Science Group',
                  desc: 'Physics, Chemistry, Biology, Computer Science, Mathematics, English, Urdu, Islamiat, Tarjuma-tul-Quran, Pakistan Studies',
                },
                {
                  level: '10th' as ClassLevel,
                  name: '10th Class (Matric Part-II)',
                  subTitle: 'Secondary School Certificate - Science Group',
                  desc: 'Physics, Chemistry, Biology, Computer Science, Mathematics, English, Urdu, Islamiat, Tarjuma-tul-Quran, Pakistan Studies',
                },
              ].map((c) => {
                const isSelected = selectedClass === c.level;
                return (
                  <div
                    key={c.level}
                    onClick={() => handleClassSelect(c.level)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.level}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <h3 className="font-black text-base text-slate-900">{c.name}</h3>
                    <div className="text-[11px] text-blue-700 font-bold mt-0.5">{c.subTitle}</div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{c.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* MEDIUM SELECTION CARDS IN STEP 1 */}
            <div className="pt-6 border-t border-slate-200 max-w-3xl space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Select Paper Medium
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Choose Examination Medium (امتحانی زبان / میڈیم)
                </h3>
                <p className="text-xs text-slate-500">
                  Select whether you want your examination paper in English, Urdu, or Bilingual (Both) format.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. English Medium */}
                <div
                  onClick={() => setLanguageMode('english')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    languageMode === 'english'
                      ? 'bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-blue-700 uppercase">English</span>
                    {languageMode === 'english' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">English Medium</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Questions, instructions, and options generated purely in English.
                  </p>
                </div>

                {/* 2. Urdu Medium */}
                <div
                  onClick={() => setLanguageMode('urdu')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    languageMode === 'urdu'
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-emerald-700 uppercase font-urdu">اردو</span>
                    {languageMode === 'urdu' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 font-urdu">اردو میڈیم (Urdu)</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    سوالات، ہدایات اور معروضی آپشنز مکمل طور پر خوبصورت اردو نستعلیق میں۔
                  </p>
                </div>

                {/* 3. Both Bilingual */}
                <div
                  onClick={() => setLanguageMode('bilingual')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    languageMode === 'bilingual'
                      ? 'bg-indigo-50/80 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase">Both / دو لسانی</span>
                    {languageMode === 'bilingual' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">Bilingual (Both)</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    English on left and Urdu on right without overlapping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SELECT BOOK / SUBJECT                                             */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 2 of 8: Choose Subject
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Choose Subject / Book ({selectedClass} Class)
                </h2>
                <p className="text-xs text-slate-500">
                  Select the textbook for which you want to create the paper ({classSubjects.length} books available).
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs">
                Selected Class: {selectedClass}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {classSubjects.map((sub) => {
                const isSelected = selectedSubjectId === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSubjectSelect(sub.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-extrabold text-slate-900 text-sm">{sub.nameEn}</div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                      <span>{sub.chapters.length} Units</span>
                      <span>·</span>
                      <span>{sub.defaultMarks} Marks</span>
                      <span>·</span>
                      <span>{sub.timeAllowed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SELECT CHAPTERS WITH CHECKBOXES                                  */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 3 of 8: Tick Chapters
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Select Chapters ({selectedChapters.length} Selected)
                </h2>
                <p className="text-xs text-slate-500">
                  Tick which chapters will be included in this test paper.
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={selectAllChapters}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg cursor-pointer"
                >
                  All Chapters
                </button>
                <button
                  type="button"
                  onClick={selectHalf1}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  1st Half
                </button>
                <button
                  type="button"
                  onClick={selectHalf2}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  2nd Half
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {(currentSubject?.chapters || []).map((ch) => {
                const isTicked = selectedChapters.includes(ch.number);
                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChapter(ch.number)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      isTicked
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isTicked ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-mono font-bold text-blue-700">
                        Unit {ch.number}
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs leading-snug">
                        {ch.titleEn}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SELECT SLOs (STUDENT LEARNING OUTCOMES)                            */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 4 of 8: Student Learning Outcomes (SLOs)
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Select Learning Outcomes (SLOs) ({selectedSloIds.length} Selected)
                </h2>
                <p className="text-xs text-slate-500">
                  Choose specific conceptual topics and learning outcomes to evaluate from the selected chapters.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedSloIds(availableSLOs.map((s) => s.id))}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg cursor-pointer"
                >
                  Select All SLOs
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSloIds([])}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2 max-h-[500px] overflow-y-auto p-1">
              {availableSLOs.map((slo) => {
                const isChecked = selectedSloIds.includes(slo.id);
                return (
                  <div
                    key={slo.id}
                    onClick={() => toggleSlo(slo.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {slo.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            slo.bloomLevel === 'Knowledge'
                              ? 'bg-emerald-100 text-emerald-800'
                              : slo.bloomLevel === 'Understanding'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {slo.bloomLevel}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {slo.titleEn}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: SELECT MCQs                                                       */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 5 of 8: Multiple Choice Questions
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Select MCQs ({selectedMcqIds.length} Selected / {questionsPool.mcqs.length} Available)
                </h2>
                <p className="text-xs text-slate-500">
                  Standard board exam typically requires {targetMCQCount} MCQs. Tick your preferred questions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoPickMCQs}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Pick Board Set ({targetMCQCount} MCQs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMcqIds(questionsPool.mcqs.map((m) => m.id))}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMcqIds([])}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-300 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={mcqSearchQuery}
                  onChange={(e) => setMcqSearchQuery(e.target.value)}
                  placeholder="Search MCQs by keywords..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                {['all', 'Past Board Papers', 'Textbook Exercises', 'SLO Conceptual'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMcqCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      mcqCategoryFilter === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* MCQs List */}
            <div className="space-y-3 pt-1 max-h-[500px] overflow-y-auto p-1">
              {filteredMCQs.map((m: any, idx) => {
                const isSelected = selectedMcqIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() =>
                      setSelectedMcqIds((prev) =>
                        prev.includes(m.id) ? prev.filter((i) => i !== m.id) : [...prev, m.id]
                      )
                    }
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-700 text-xs">
                            MCQ #{idx + 1}
                          </span>
                          {m.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {m.category}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {m.statementEn}
                        </div>
                        {m.statementUr && (
                          <div className="font-urdu text-[12px] text-slate-700" dir="rtl">
                            {m.statementUr}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-8 pt-1">
                      {m.options?.map((opt: any) => (
                        <div
                          key={opt.key}
                          className={`p-1.5 rounded-md border text-[11px] ${
                            opt.key === m.correctOption
                              ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <strong>({opt.key})</strong> {opt.textEn}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: SELECT SHORT QUESTIONS                                            */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 6 of 8: Short Questions & Choice
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Select Short Questions ({selectedShortIds.length} Selected / {questionsPool.shortQuestions.length} Available)
                </h2>
                <p className="text-xs text-slate-500">
                  Standard board exam typically requires {targetShortCount} Short Questions (divided into Q.2, Q.3, Q.4).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoPickShorts}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Pick Board Set ({targetShortCount} Shorts)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShortIds(questionsPool.shortQuestions.map((s) => s.id))}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShortIds([])}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* STUDENT CHOICE CONTROL BOX */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Student Choice Settings (مختصر سوالات میں چوائس):</span>
                </div>
                <p className="text-[11px] text-indigo-800">
                  Paper instructions will specify attempting any <strong>{shortAttemptChoice}</strong> questions per section group.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-xs">
                <span className="text-xs font-bold text-slate-700">Attempt Any:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, selectedShortIds.length || 15)}
                  value={shortAttemptChoice}
                  onChange={(e) => setShortAttemptChoice(Math.max(1, Number(e.target.value)))}
                  className="w-14 px-2 py-0.5 border border-slate-300 rounded font-bold text-center text-xs text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600 font-medium">Questions</span>
              </div>
            </div>

            {/* Short Questions List */}
            <div className="space-y-3 pt-1 max-h-[500px] overflow-y-auto p-1">
              {filteredShorts.map((s: any, idx) => {
                const isSelected = selectedShortIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() =>
                      setSelectedShortIds((prev) =>
                        prev.includes(s.id) ? prev.filter((i) => i !== s.id) : [...prev, s.id]
                      )
                    }
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-700 text-xs">
                          Short Question #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {s.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {s.category}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            {s.marks || 2} Marks
                          </span>
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 text-xs leading-snug">
                        {s.statementEn}
                      </div>
                      {s.statementUr && (
                        <div className="font-urdu text-[12px] text-slate-700" dir="rtl">
                          {s.statementUr}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: SELECT LONG QUESTIONS                                             */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 7 of 8: Long Questions & Numericals
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Select Long Questions ({selectedLongIds.length} Selected / {questionsPool.longQuestions.length} Available)
                </h2>
                <p className="text-xs text-slate-500">
                  Standard board exam typically requires {targetLongCount} Long Questions with part (a) theory & part (b) numerical.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoPickLongs}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Pick Board Set ({targetLongCount} Longs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLongIds(questionsPool.longQuestions.map((l) => l.id))}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLongIds([])}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* STUDENT CHOICE CONTROL BOX FOR LONGS */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>Student Choice Settings (تفصیلی سوالات میں چوائس):</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  Paper instructions will specify attempting any <strong>{longAttemptChoice}</strong> long questions out of {selectedLongIds.length}.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-xs">
                <span className="text-xs font-bold text-slate-700">Attempt Any:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, selectedLongIds.length || 5)}
                  value={longAttemptChoice}
                  onChange={(e) => setLongAttemptChoice(Math.max(1, Number(e.target.value)))}
                  className="w-14 px-2 py-0.5 border border-slate-300 rounded font-bold text-center text-xs text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <span className="text-xs text-slate-600 font-medium">Long Questions</span>
              </div>
            </div>

            {/* Long Questions List */}
            <div className="space-y-3 pt-1 max-h-[500px] overflow-y-auto p-1">
              {filteredLongs.map((l: any, idx) => {
                const isSelected = selectedLongIds.includes(l.id);
                return (
                  <div
                    key={l.id}
                    onClick={() =>
                      setSelectedLongIds((prev) =>
                        prev.includes(l.id) ? prev.filter((i) => i !== l.id) : [...prev, l.id]
                      )
                    }
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2.5 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                        <span className="font-extrabold text-slate-900 text-xs">
                          Long Question #{idx + 5}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        {l.totalMarks || 9} Marks
                      </span>
                    </div>

                    <div className="pl-7 space-y-2">
                      {l.parts?.map((p: any) => (
                        <div key={p.partLabel} className="border-l-2 border-slate-200 pl-3 py-0.5 space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs">
                            <span className="text-purple-700 font-extrabold mr-1">({p.partLabel})</span>
                            {p.statementEn}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">[{p.marks} Marks]</span>
                          </div>
                          {p.statementUr && (
                            <div className="font-urdu text-[12px] text-slate-700" dir="rtl">
                              {p.statementUr}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: MARKS CALCULATION & 3 DIFFICULTY LEVELS                           */}
        {/* ========================================================================= */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Step 8 of 8: Marks Calculation & Difficulty Tier
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Marks Calculation & Difficulty Tier
              </h2>
              <p className="text-xs text-slate-500">
                Review live marks calculation and select the student difficulty tier (Easy, Medium, or Difficult).
              </p>
            </div>

            {/* 1. THREE DIFFICULTY TIERS AS REQUESTED BY USER */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Difficulty Tier (Target Student Level):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* EASY TIER */}
                <div
                  onClick={() => setDifficulty('easy')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    difficulty === 'easy'
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white flex items-center gap-1">
                      <Feather className="w-3.5 h-3.5" />
                      <span>Easy Paper</span>
                    </span>
                    {difficulty === 'easy' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Foundation Level</h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Fundamental definitions, straightforward textbook questions, and basic review exercises for foundation learners.
                  </p>
                </div>

                {/* MEDIUM TIER */}
                <div
                  onClick={() => setDifficulty('standard')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    difficulty === 'standard'
                      ? 'bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" />
                      <span>Medium Paper</span>
                    </span>
                    {difficulty === 'standard' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Standard Board Pattern</h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Balanced examination pattern (50% Knowledge, 30% Understanding, 20% Application) conforming to BISE standards.
                  </p>
                </div>

                {/* DIFFICULT / HARD TIER */}
                <div
                  onClick={() => setDifficulty('conceptual_slo')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    difficulty === 'conceptual_slo'
                      ? 'bg-rose-50/80 border-rose-600 shadow-md ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Difficult / Hard Paper</span>
                    </span>
                    {difficulty === 'conceptual_slo' && <CheckCircle2 className="w-5 h-5 text-rose-600" />}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Advanced SLO & Top Scorers</h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Challenging SLO conceptual reasoning, higher-order analytical problems, and multi-step derivations for top achievers.
                  </p>
                </div>
              </div>
            </div>

            {/* MEDIUM SELECTOR (URDU / ENGLISH / BOTH) IN STEP 8 AS WELL */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Selected Paper Medium (امتحانی میڈیم کی تصدیق):
                  </label>
                  <p className="text-[11px] text-slate-500">
                    You can switch the examination paper output language here anytime before finalization.
                  </p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black rounded-lg uppercase">
                  Current: {languageMode}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setLanguageMode('english')}
                  className={`p-3 rounded-xl border-2 text-left font-sans transition-all cursor-pointer ${
                    languageMode === 'english'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className="font-black text-xs">English Medium Only</div>
                  <div className={`text-[10px] mt-0.5 ${languageMode === 'english' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Purely in English without Urdu
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguageMode('urdu')}
                  className={`p-3 rounded-xl border-2 text-left font-sans transition-all cursor-pointer ${
                    languageMode === 'urdu'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-400'
                  }`}
                >
                  <div className="font-black text-xs">Urdu Medium (Urdu Only)</div>
                  <div className={`text-[10px] mt-0.5 ${languageMode === 'urdu' ? 'text-emerald-100' : 'text-slate-500'}`}>
                    Exclusively in Urdu Nastaliq font
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguageMode('bilingual')}
                  className={`p-3 rounded-xl border-2 text-left font-sans transition-all cursor-pointer ${
                    languageMode === 'bilingual'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <div className="font-black text-xs">Bilingual (English + Urdu)</div>
                  <div className={`text-[10px] mt-0.5 ${languageMode === 'bilingual' ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Left English, Right Urdu (No overlap)
                  </div>
                </button>
              </div>
            </div>

            {/* 2. LIVE MARKS CALCULATION DASHBOARD WITH CUSTOM EDIT OPTION */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-sm">Marks Calculator & Breakdown</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCustomMarksOverride(!isCustomMarksOverride)}
                    className="btn-3d btn-3d-amber px-2.5 py-1 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                  >
                    {isCustomMarksOverride ? '✓ Custom Mode Active' : '✏️ Custom Edit Marks'}
                  </button>
                  <div className="text-xl font-black text-emerald-400">
                    Total Marks: {isCustomMarksOverride ? customTotalMarks : calculatedGrandTotal} Marks
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="text-slate-400 font-bold">Objective Section (MCQs)</div>
                  <div className="text-base font-black text-white">
                    {selectedMcqIds.length} Qs × {marksPerMcq} M = {totalMcqMarks} Marks
                  </div>
                  {isCustomMarksOverride && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                      <span className="text-[10px] text-slate-300">Marks Each:</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={marksPerMcq}
                        onChange={(e) => setMarksPerMcq(Math.max(1, Number(e.target.value)))}
                        className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-600 rounded text-center text-white font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="text-slate-400 font-bold">Subjective Part-I (Shorts)</div>
                  <div className="text-base font-black text-white">
                    {selectedShortIds.length > 0 ? Math.min(selectedShortIds.length, shortAttemptChoice) : 0} Qs × {marksPerShort} M = {totalShortMarks} Marks
                  </div>
                  {isCustomMarksOverride && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                      <span className="text-[10px] text-slate-300">Marks Each:</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={marksPerShort}
                        onChange={(e) => setMarksPerShort(Math.max(1, Number(e.target.value)))}
                        className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-600 rounded text-center text-white font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="text-slate-400 font-bold">Subjective Part-II (Longs)</div>
                  <div className="text-base font-black text-white">
                    {selectedLongIds.length > 0 ? Math.min(selectedLongIds.length, longAttemptChoice) : 0} Qs × {marksPerLong} M = {totalLongMarks} Marks
                  </div>
                  {isCustomMarksOverride && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                      <span className="text-[10px] text-slate-300">Marks Each:</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={marksPerLong}
                        onChange={(e) => setMarksPerLong(Math.max(1, Number(e.target.value)))}
                        className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-600 rounded text-center text-white font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {isCustomMarksOverride && (
                <div className="bg-slate-800 p-3 rounded-xl border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-amber-300">Overall Paper Total Marks Custom Override:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customTotalMarks}
                      onChange={(e) => setCustomTotalMarks(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-slate-900 border border-amber-400 rounded-lg text-center text-amber-300 font-bold"
                    />
                    <span className="text-slate-300 font-medium">Marks</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. INSTITUTIONAL HEADER & TITLE SETTINGS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Institutional Header & School Monogram (سکول کا نام اور مونوگرام)</span>
                <span className="text-[10px] text-slate-500 font-normal">Appears in a single pristine line at the top of the question paper</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Institute / School Name (ایک ہی لائن میں پرنٹ ہوگا)
                  </label>
                  <input
                    type="text"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    placeholder="Enter school or college name..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Campus / Branch</label>
                  <input
                    type="text"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    placeholder="e.g. Main Campus / Boys Wing"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Title</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Allowed</label>
                  <input
                    type="text"
                    value={customTimeAllowed}
                    onChange={(e) => setCustomTimeAllowed(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                {/* School Monogram / Logo Upload */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    School Monogram / Logo (مونوگرام)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {customLogoUrl ? (
                        <img src={customLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <GraduationCap className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <label className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setCustomLogoUrl(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {customLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomLogoUrl(undefined)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BUBBLE SHEET OPTION - TWO SEPARATE BUTTONS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Bubble Sheet Option (پیپر پر ببل شیٹ لگانے کا آپشن)</span>
                <span className="text-[10px] text-slate-500 font-semibold">Choose whether to attach the OMR bubble response sheet to the question paper</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIncludeBubbleSheet(true)}
                  className={`btn-3d flex items-center justify-center gap-2 p-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    includeBubbleSheet
                      ? 'btn-3d-emerald text-white shadow-md'
                      : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <CircleDot className="w-4 h-4" />
                  <span>With Bubble Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeBubbleSheet(false)}
                  className={`btn-3d flex items-center justify-center gap-2 p-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    !includeBubbleSheet
                      ? 'btn-3d-rose text-white shadow-md'
                      : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <CircleOff className="w-4 h-4" />
                  <span>Without Bubble Sheet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== BOTTOM NAVIGATION CONTROLS (STICKY ACTION BAR) ===================== */}
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-xs p-3 sm:p-4 border-t-2 border-slate-200 shadow-xl -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep)}
              disabled={currentStep === 1}
              className="btn-3d btn-3d-slate flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Live Stats Pill permanently visible while scrolling */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
              <span className="text-blue-700">Questions: {selectedMcqIds.length + selectedShortIds.length + selectedLongIds.length}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700">
                Marks: {isCustomMarksOverride ? customTotalMarks : (selectedMcqIds.length * marksPerMcq + Math.min(selectedShortIds.length, shortAttemptChoice) * marksPerShort + Math.min(selectedLongIds.length, longAttemptChoice) * marksPerLong)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoPickAllAccordingToBoardScheme}
              className="btn-3d btn-3d-amber hidden md:flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
              title="Automatically select recommended board pattern questions in one click"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Auto-Pick All</span>
            </button>

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1) as WizardStep)}
                className="btn-3d btn-3d-blue flex items-center gap-1.5 px-5 py-2 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
              >
                <span>Continue (Step {currentStep + 1})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleFinalizePaper}
              className="btn-3d btn-3d-emerald flex items-center gap-2 px-5 py-2 text-white rounded-xl text-xs sm:text-sm font-black cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Generate Paper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

