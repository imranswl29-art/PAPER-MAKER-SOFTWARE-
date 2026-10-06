import React, { useState, useMemo } from 'react';
import {
  MASTER_PTBB_SUBJECTS,
  getQuestionsForSubjectAndChapters,
  PTBBSubject,
  PTBBChapter,
} from '../data/questionBankStore';
import {
  ClassLevel,
  GeneratedExamPaper,
  MCQItem,
  PaperHeaderInfo,
  LanguageMode,
} from '../types/paper';
import { UserAccount } from '../types/user';
import {
  X,
  CheckSquare,
  Square,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  ChevronRight,
  ChevronLeft,
  Search,
  BookOpen,
  GraduationCap,
  Layers,
  Upload,
  Calendar,
  CircleDot,
  CircleOff,
} from 'lucide-react';

interface ManualQuestionSelectorModalProps {
  initialClass?: ClassLevel;
  initialSubjectId?: string;
  currentUser: UserAccount | null;
  onPaperGenerated: (paper: GeneratedExamPaper) => void;
  onClose: () => void;
}

type ManualStep = 1 | 2 | 3 | 4 | 5 | 6;

export const ManualQuestionSelectorModal: React.FC<ManualQuestionSelectorModalProps> = ({
  initialClass = '9th',
  initialSubjectId,
  currentUser,
  onPaperGenerated,
  onClose,
}) => {
  // 6-Step guided wizard flow for authentic board paper creation from Question Bank
  const [currentStep, setCurrentStep] = useState<ManualStep>(1);

  // STEP 1: Class & Medium
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(initialClass);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('bilingual');

  // STEP 2: Subject & Chapters
  const classSubjects = useMemo(
    () => MASTER_PTBB_SUBJECTS.filter((s) => s.classLevel === selectedClass),
    [selectedClass]
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || classSubjects[0]?.id || '9th-physics'
  );

  const currentSubject: PTBBSubject = useMemo(
    () => MASTER_PTBB_SUBJECTS.find((s) => s.id === selectedSubjectId) || classSubjects[0],
    [selectedSubjectId, classSubjects]
  );

  // Chapter selection (defaults to all chapters of the subject)
  const [selectedChapters, setSelectedChapters] = useState<number[]>(
    currentSubject?.chapters?.map((c: PTBBChapter) => c.number) || [1]
  );

  // STEP 3, 4, 5: Question Selections
  const [selectedMCQIds, setSelectedMCQIds] = useState<string[]>([]);
  const [selectedShortIds, setSelectedShortIds] = useState<string[]>([]);
  const [selectedLongIds, setSelectedLongIds] = useState<string[]>([]);

  // Search & Filter queries
  const [mcqSearch, setMcqSearch] = useState('');
  const [mcqCatFilter, setMcqCatFilter] = useState('all');
  const [shortSearch, setShortSearch] = useState('');
  const [shortCatFilter, setShortCatFilter] = useState('all');
  const [longSearch, setLongSearch] = useState('');

  // STEP 6: Institutional Header & Settings
  const [examTitle, setExamTitle] = useState('Evaluation Examination 2026');
  const [instituteName, setInstituteName] = useState(
    currentUser?.schoolName || 'PUNJAB GROUP OF SCIENCE ACADEMIES'
  );
  const [campusName, setCampusName] = useState(
    currentUser?.campusName || (currentUser?.city ? `${currentUser.city} Campus` : 'Main Campus')
  );
  const [teacherName, setTeacherName] = useState('Prof. Subject Specialist');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(currentUser?.logoUrl);
  const [includeBubbleSheet, setIncludeBubbleSheet] = useState<boolean>(true);

  // Targets based on standard Punjab Board pattern
  const targetMCQCount = currentSubject.mcqMarks || 12;
  const targetShortCount = Math.round((currentSubject.shortQMarks || 30) / 2); // each short is 2 marks
  const targetLongCount = Math.round((currentSubject.longQMarks || 18) / 9) || 3;

  // When class changes, reset subject & chapters
  const handleClassChange = (c: ClassLevel) => {
    setSelectedClass(c);
    const firstSub = MASTER_PTBB_SUBJECTS.find((s) => s.classLevel === c);
    if (firstSub) {
      setSelectedSubjectId(firstSub.id);
      setSelectedChapters(firstSub.chapters.map((ch: PTBBChapter) => ch.number));
    }
    setSelectedMCQIds([]);
    setSelectedShortIds([]);
    setSelectedLongIds([]);
  };

  // When subject changes, reset chapters & selections
  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);
    const sub = MASTER_PTBB_SUBJECTS.find((s) => s.id === subId);
    if (sub) {
      setSelectedChapters(sub.chapters.map((ch: PTBBChapter) => ch.number));
    }
    setSelectedMCQIds([]);
    setSelectedShortIds([]);
    setSelectedLongIds([]);
  };

  // Chapter toggle helpers
  const toggleChapter = (chNo: number) => {
    setSelectedChapters((prev) =>
      prev.includes(chNo)
        ? prev.length > 1
          ? prev.filter((n) => n !== chNo)
          : prev
        : [...prev, chNo].sort((a, b) => a - b)
    );
  };

  const selectAllChapters = () => {
    setSelectedChapters(currentSubject.chapters.map((c: PTBBChapter) => c.number));
  };

  const selectHalf1 = () => {
    const half = Math.ceil(currentSubject.chapters.length / 2);
    setSelectedChapters(currentSubject.chapters.slice(0, half).map((c: PTBBChapter) => c.number));
  };

  const selectHalf2 = () => {
    const half = Math.ceil(currentSubject.chapters.length / 2);
    setSelectedChapters(currentSubject.chapters.slice(half).map((c: PTBBChapter) => c.number));
  };

  // Available questions pool from selected chapters
  const questionsPool = useMemo(() => {
    return getQuestionsForSubjectAndChapters(currentSubject.id, selectedChapters);
  }, [currentSubject.id, selectedChapters]);

  // Toggle selection
  const toggleMCQ = (id: string) => {
    setSelectedMCQIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleShort = (id: string) => {
    setSelectedShortIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleLong = (id: string) => {
    setSelectedLongIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Auto-pick helpers
  const autoPickMCQs = () => {
    const shuffled = [...questionsPool.mcqs].sort(() => 0.5 - Math.random());
    setSelectedMCQIds(shuffled.slice(0, targetMCQCount).map((m) => m.id));
  };

  const autoPickShorts = () => {
    const shuffled = [...questionsPool.shortQuestions].sort(() => 0.5 - Math.random());
    setSelectedShortIds(shuffled.slice(0, targetShortCount).map((s) => s.id));
  };

  const autoPickLongs = () => {
    const shuffled = [...questionsPool.longQuestions].sort(() => 0.5 - Math.random());
    setSelectedLongIds(shuffled.slice(0, targetLongCount).map((l) => l.id));
  };

  // Filtered lists
  const filteredMCQs = useMemo(() => {
    return questionsPool.mcqs.filter((m: any) => {
      const matchSearch =
        !mcqSearch.trim() ||
        m.statementEn.toLowerCase().includes(mcqSearch.toLowerCase()) ||
        (m.statementUr && m.statementUr.includes(mcqSearch));
      const matchCat = mcqCatFilter === 'all' || m.category === mcqCatFilter;
      return matchSearch && matchCat;
    });
  }, [questionsPool.mcqs, mcqSearch, mcqCatFilter]);

  const filteredShorts = useMemo(() => {
    return questionsPool.shortQuestions.filter((s: any) => {
      const matchSearch =
        !shortSearch.trim() ||
        s.statementEn.toLowerCase().includes(shortSearch.toLowerCase()) ||
        (s.statementUr && s.statementUr.includes(shortSearch));
      const matchCat = shortCatFilter === 'all' || s.category === shortCatFilter;
      return matchSearch && matchCat;
    });
  }, [questionsPool.shortQuestions, shortSearch, shortCatFilter]);

  const filteredLongs = useMemo(() => {
    return questionsPool.longQuestions.filter((l: any) => {
      return (
        !longSearch.trim() ||
        l.statementEn?.toLowerCase().includes(longSearch.toLowerCase()) ||
        l.parts?.some((p: any) => p.statementEn.toLowerCase().includes(longSearch.toLowerCase()))
      );
    });
  }, [questionsPool.longQuestions, longSearch]);

  // Quick total marks calculation
  const calculatedTotalMarks =
    selectedMCQIds.length * 1 +
    (selectedShortIds.length > 0 ? Math.min(selectedShortIds.length, 10) : 0) * 2 +
    (selectedLongIds.length > 0 ? Math.min(selectedLongIds.length, 2) : 0) * 9;

  // Assemble and generate final paper
  const handleGeneratePaper = () => {
    const chosenMCQs: MCQItem[] = questionsPool.mcqs
      .filter((m) => selectedMCQIds.includes(m.id))
      .map((m, idx) => ({ ...m, qNo: idx + 1 }));

    const chosenShorts = questionsPool.shortQuestions
      .filter((s) => selectedShortIds.includes(s.id))
      .map((s, idx) => ({ ...s, subNo: idx + 1 }));

    const chosenLongs = questionsPool.longQuestions
      .filter((l) => selectedLongIds.includes(l.id))
      .map((l, idx) => ({ ...l, qNo: idx + 5 }));

    // Group short questions into Q2, Q3, Q4 like Punjab Board
    const groupSize = 8;
    const shortGroups = [];
    const grpCount = Math.max(1, Math.ceil(chosenShorts.length / 5));

    for (let i = 0; i < grpCount; i++) {
      const slice = chosenShorts.slice(i * groupSize, (i + 1) * groupSize);
      if (slice.length > 0) {
        shortGroups.push({
          id: `manual-grp-${i + 1}`,
          qNo: i + 2,
          instructionEn: `Write short answers to any ${Math.min(slice.length, 5)} questions:`,
          instructionUr: `کوئی سے ${Math.min(slice.length, 5)} سوالات کے مختصر جوابات لکھیں:`,
          attemptCount: Math.min(slice.length, 5),
          totalCount: slice.length,
          marksEach: 2,
          questions: slice,
        });
      }
    }

    const syllabusStr =
      selectedChapters.length === currentSubject.chapters.length
        ? 'Full Book'
        : `Unit(s): ${selectedChapters.join(', ')}`;

    const header: PaperHeaderInfo = {
      instituteName: instituteName || 'PUNJAB GROUP OF SCIENCE ACADEMIES',
      campusName: campusName || 'Main Campus',
      examTitle: examTitle || 'Custom Board Pattern Examination',
      classLevel: selectedClass,
      subjectName: currentSubject.nameEn,
      syllabusCovered: syllabusStr,
      dateStr: new Date().toLocaleDateString('en-GB'),
      timeAllowed: currentSubject.timeAllowed || '2:15 Hours',
      totalMarks: calculatedTotalMarks || currentSubject.defaultMarks,
      teacherName: teacherName || 'Senior Subject Specialist',
      showWatermark: true,
      watermarkText: instituteName || 'CONFIDENTIAL',
      logoType: 'crest',
      customLogoUrl: customLogoUrl || currentUser?.logoUrl,
      boardPattern: currentUser?.targetBoard ? `${currentUser.targetBoard.toUpperCase()} Board` : 'BISE Punjab',
      includeBubbleSheet: includeBubbleSheet,
      studentFields: {
        showRollNo: true,
        showName: true,
        showSection: true,
        showObtainedMarks: true,
      },
    };

    const paper: GeneratedExamPaper = {
      id: `manual-paper-${Date.now()}`,
      createdAt: new Date().toISOString(),
      header,
      languageMode,
      difficulty: 'standard',
      objectiveSection: {
        enabled: chosenMCQs.length > 0,
        titleEn: 'OBJECTIVE TYPE',
        titleUr: 'حصہ اول (معروضی طرز)',
        totalMarks: chosenMCQs.length,
        timeAllowed: '15 Minutes',
        instructionsEn:
          'Each question has four possible choices (A, B, C, D). Fill the relevant circle on the response sheet.',
        instructionsUr:
          'ہر سوال کے چار ممکنہ جوابات A, B, C اور D دیے گئے ہیں۔ جوابی شیٹ پر متعلقہ دائرہ کو مارکر سے بھریں۔',
        questions: chosenMCQs,
      },
      subjectiveSection: {
        enabled: chosenShorts.length > 0 || chosenLongs.length > 0,
        titleEn: 'SUBJECTIVE TYPE',
        titleUr: 'حصہ دوم (انشائیہ طرز)',
        totalMarks: chosenShorts.length * 2 + chosenLongs.length * 8,
        timeAllowed: currentSubject.timeAllowed || '2:00 Hours',
        part1_shortQuestions: shortGroups,
        part2_longQuestions: {
          instructionEn: `Attempt any ${Math.min(chosenLongs.length, 2)} questions. All questions carry equal marks.`,
          instructionUr: `کوئی سے ${Math.min(chosenLongs.length, 2)} سوالات کے تفصیلی جوابات تحریر کریں۔ تمام سوالات کے نمبر برابر ہیں۔`,
          attemptCount: Math.min(chosenLongs.length, 2),
          totalCount: chosenLongs.length,
          questions: chosenLongs,
        },
      },
    };

    onPaperGenerated(paper);
    onClose();
  };

  const stepsMeta = [
    { num: 1, title: 'Class & Medium', subtitle: 'Target & Language' },
    { num: 2, title: 'Subject & Units', subtitle: 'Book & Chapters' },
    { num: 3, title: 'MCQs Selection', subtitle: 'Section A' },
    { num: 4, title: 'Short Questions', subtitle: 'Section B' },
    { num: 5, title: 'Long Questions', subtitle: 'Section C' },
    { num: 6, title: 'Header & Finalize', subtitle: 'Institute & Print' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print font-sans text-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[96vh] flex flex-col overflow-hidden border-2 border-slate-300 animate-in fade-in zoom-in-95">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-md">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg">
                  Manual Step-by-Step Question Selector
                </h2>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Teacher Bank Mode
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Create your exam paper by following guided steps and handpicking questions from the PTBB bank
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation Pills - Rich, high contrast colors */}
        <div className="bg-slate-100 p-2.5 border-b border-slate-300 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {stepsMeta.map((s) => {
              const isCurrent = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num as ManualStep)}
                  className={`p-2 rounded-xl text-center border-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
                      : isDone
                      ? 'bg-emerald-600 border-emerald-700 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase flex items-center justify-center gap-1">
                    <span>Step {s.num}</span>
                    {isDone && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
                  </div>
                  <div className="font-extrabold text-xs truncate mt-0.5">{s.title}</div>
                  <div
                    className={`text-[9px] ${
                      isCurrent || isDone ? 'text-white/80' : 'text-slate-500'
                    } truncate`}
                  >
                    {s.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Workspace */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-slate-50/50">
          {/* ========================================================================= */}
          {/* STEP 1: CLASS & MEDIUM                                                    */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 1 of 6: Target Class & Language Medium
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Choose Class and Examination Medium
                </h3>
              </div>

              {/* Class Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-slate-700">
                  1. Target Class:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                  {[
                    {
                      level: '9th' as ClassLevel,
                      name: '9th Class (Matric Part-I)',
                      desc: 'Physics, Chemistry, Biology, Mathematics, Computer, English, Urdu, Islamiat, Tarjuma-tul-Quran, Pak Studies',
                      color: 'from-blue-700 to-indigo-800',
                    },
                    {
                      level: '10th' as ClassLevel,
                      name: '10th Class (Matric Part-II)',
                      desc: 'Physics, Chemistry, Biology, Mathematics, Computer, English, Urdu, Islamiat, Tarjuma-tul-Quran, Pak Studies',
                      color: 'from-indigo-700 to-purple-800',
                    },
                  ].map((c) => {
                    const isSelected = selectedClass === c.level;
                    return (
                      <div
                        key={c.level}
                        onClick={() => handleClassChange(c.level)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 shadow-lg ring-2 ring-blue-500/30'
                            : 'bg-white border-slate-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold text-xs">
                            {c.level} Class
                          </span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </div>
                        <h4 className="font-black text-base text-slate-900 mt-1">{c.name}</h4>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{c.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Language Medium Cards */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-black uppercase text-slate-700">
                  2. Examination Language Medium:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-4xl">
                  {/* English */}
                  <div
                    onClick={() => setLanguageMode('english')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      languageMode === 'english'
                        ? 'bg-blue-50 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-blue-700 uppercase">English Medium</span>
                      {languageMode === 'english' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">English Language</div>
                    <p className="text-[11px] text-slate-500 mt-1">Questions and choices in English only.</p>
                  </div>

                  {/* Urdu */}
                  <div
                    onClick={() => setLanguageMode('urdu')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      languageMode === 'urdu'
                        ? 'bg-emerald-50 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-emerald-700 uppercase">Urdu Medium</span>
                      {languageMode === 'urdu' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">Urdu Nastaliq Script</div>
                    <p className="text-[11px] text-slate-500 mt-1">Questions and choices in authentic Urdu.</p>
                  </div>

                  {/* Bilingual */}
                  <div
                    onClick={() => setLanguageMode('bilingual')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      languageMode === 'bilingual'
                        ? 'bg-purple-50 border-purple-600 shadow-md ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-purple-700 uppercase">Bilingual</span>
                      {languageMode === 'bilingual' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">Bilingual (English + Urdu)</div>
                    <p className="text-[11px] text-slate-500 mt-1">English on left and Urdu on right.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: SUBJECT & UNITS SELECTION                                         */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Step 2 of 6: Book & Chapters Selection
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Select Subject & Units ({selectedClass} Class)
                  </h3>
                </div>
                <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-full text-xs">
                  {selectedClass} Class
                </span>
              </div>

              {/* Subject Selection Cards */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-2">
                  Select Textbook ({classSubjects.length} Books Available):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {classSubjects.map((s) => {
                    const isSelected = selectedSubjectId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSubjectChange(s.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <BookOpen className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="font-extrabold text-xs text-slate-900">{s.nameEn}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {s.chapters.length} Units · {s.defaultMarks} Marks
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Units / Chapters Checkboxes with Quick Action Buttons */}
              <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Tick Units to Include in Question Pool:
                    </label>
                    <span className="text-xs text-blue-700 font-bold ml-2">
                      ({selectedChapters.length} of {currentSubject.chapters.length} Selected)
                    </span>
                  </div>

                  {/* Colorful Quick Selection Buttons */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={selectAllChapters}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                    >
                      All Units
                    </button>
                    <button
                      type="button"
                      onClick={selectHalf1}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                    >
                      1st Half
                    </button>
                    <button
                      type="button"
                      onClick={selectHalf2}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                    >
                      2nd Half
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChapters([1])}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                    >
                      Reset (Unit 1)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {currentSubject.chapters.map((ch) => {
                    const isChecked = selectedChapters.includes(ch.number);
                    return (
                      <div
                        key={ch.id}
                        onClick={() => toggleChapter(ch.number)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer border-2 transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate text-xs">
                          Unit {ch.number}: {ch.titleEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: MCQs SELECTION (SECTION A)                                        */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Step 3 of 6: Section A - Objective MCQs Selection
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Select Multiple Choice Questions
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white font-black rounded-lg text-xs">
                    Target: {targetMCQCount} MCQs
                  </span>
                  <span
                    className={`px-3 py-1 font-black rounded-lg text-xs text-white ${
                      selectedMCQIds.length >= targetMCQCount ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    Selected: {selectedMCQIds.length} / {targetMCQCount}
                  </span>
                </div>
              </div>

              {/* Action Toolbar with Colorful Buttons */}
              <div className="bg-white p-3 rounded-xl border-2 border-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={mcqSearch}
                    onChange={(e) => setMcqSearch(e.target.value)}
                    placeholder="Search MCQs by English or Urdu text..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autoPickMCQs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Pick {targetMCQCount} MCQs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMCQIds(questionsPool.mcqs.map((m) => m.id))}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMCQIds([])}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* MCQs List */}
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto p-1">
                {filteredMCQs.map((m: any, idx) => {
                  const isChecked = selectedMCQIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMCQ(m.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${
                        isChecked
                          ? 'bg-blue-50 border-blue-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-blue-700 text-xs">MCQ #{idx + 1}</span>
                            {m.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {m.category}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 text-xs">{m.statementEn}</div>
                          {m.statementUr && (
                            <div className="font-urdu text-[13px] text-slate-800" dir="rtl">
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
                            className={`p-1.5 rounded-lg border text-[11px] ${
                              opt.isCorrect
                                ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-mono font-bold mr-1">({opt.key})</span>
                            <span>{opt.textEn}</span>
                            {opt.textUr && (
                              <span className="font-urdu block text-[11px]" dir="rtl">
                                {opt.textUr}
                              </span>
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
          {/* STEP 4: SHORT QUESTIONS SELECTION (SECTION B)                             */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Step 4 of 6: Section B - Short Questions Selection
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Select Short Answer Questions
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-600 text-white font-black rounded-lg text-xs">
                    Target: {targetShortCount} Questions
                  </span>
                  <span
                    className={`px-3 py-1 font-black rounded-lg text-xs text-white ${
                      selectedShortIds.length >= targetShortCount ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    Selected: {selectedShortIds.length} / {targetShortCount}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-white p-3 rounded-xl border-2 border-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={shortSearch}
                    onChange={(e) => setShortSearch(e.target.value)}
                    placeholder="Search short questions..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autoPickShorts}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Pick {targetShortCount} Shorts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShortIds(questionsPool.shortQuestions.map((s) => s.id))}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShortIds([])}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Short Questions List */}
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto p-1">
                {filteredShorts.map((s: any, idx) => {
                  const isChecked = selectedShortIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleShort(s.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-indigo-700 text-xs">Short Q #{idx + 1}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              2 Marks
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs leading-relaxed">{s.statementEn}</div>
                          {s.statementUr && (
                            <div className="font-urdu text-[13px] text-slate-800" dir="rtl">
                              {s.statementUr}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: LONG QUESTIONS SELECTION (SECTION C)                              */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Step 5 of 6: Section C - Long Questions & Numerical Problems
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Select Detailed / Long Questions
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-600 text-white font-black rounded-lg text-xs">
                    Target: {targetLongCount} Questions
                  </span>
                  <span
                    className={`px-3 py-1 font-black rounded-lg text-xs text-white ${
                      selectedLongIds.length >= targetLongCount ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    Selected: {selectedLongIds.length} / {targetLongCount}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-white p-3 rounded-xl border-2 border-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={longSearch}
                    onChange={(e) => setLongSearch(e.target.value)}
                    placeholder="Search long questions..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={autoPickLongs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Pick {targetLongCount} Longs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLongIds(questionsPool.longQuestions.map((l) => l.id))}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLongIds([])}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Long Questions List */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto p-1">
                {filteredLongs.map((l: any, idx) => {
                  const isChecked = selectedLongIds.includes(l.id);
                  return (
                    <div
                      key={l.id}
                      onClick={() => toggleLong(l.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-50 border-purple-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-purple-700 text-xs">
                              Long Question #{idx + 5}
                            </span>
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                              {l.totalMarks || 9} Marks
                            </span>
                          </div>
                          {l.parts?.map((p: any) => (
                            <div key={p.partLabel} className="pl-3 border-l-2 border-slate-300 py-1 space-y-0.5">
                              <div className="font-semibold text-slate-800 text-xs">
                                <strong>({p.partLabel})</strong> {p.statementEn} ({p.marks} Marks)
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: INSTITUTIONAL HEADER, LOGO & GENERATE                             */}
          {/* ========================================================================= */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step 6 of 6: Institutional Header & Generate Paper
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Customize School Details & Finalize
                </h3>
              </div>

              {/* Marks Summary Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-blue-900 to-indigo-900 p-4 rounded-xl text-white shadow-md">
                <div>
                  <span className="text-[10px] text-blue-200 uppercase font-bold block">MCQs</span>
                  <span className="font-black text-lg">{selectedMCQIds.length} Marks</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-200 uppercase font-bold block">Short Questions</span>
                  <span className="font-black text-lg">{selectedShortIds.length * 2} Marks</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-200 uppercase font-bold block">Long Questions</span>
                  <span className="font-black text-lg">{selectedLongIds.length * 9} Marks</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase font-bold block">Grand Total</span>
                  <span className="font-black text-xl text-emerald-300">{calculatedTotalMarks} Marks</span>
                </div>
              </div>

              {/* School Details Form */}
              <div className="bg-white p-4 rounded-xl border-2 border-slate-300 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      School / Academy Name (پرنٹ ہونے والا نام):
                    </label>
                    <input
                      type="text"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Campus / City Name:
                    </label>
                    <input
                      type="text"
                      value={campusName}
                      onChange={(e) => setCampusName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Exam Title (عنوان امتحانی پرچہ):
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Teacher / Examiner Name:
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Monogram Upload */}
                <div className="border-t border-slate-200 pt-3">
                  <label className="block text-xs font-black text-slate-800 mb-2">
                    Official School Monogram / Emblem:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-slate-400 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {customLogoUrl ? (
                        <img src={customLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <GraduationCap className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Upload Monogram</span>
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
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

                {/* Bubble Sheet Attachment Option - Two Separate Buttons as requested */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black text-slate-800">
                      Bubble Sheet Option (پیپر پر ببل شیٹ لگانے کا آپشن):
                    </label>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Select whether to attach the OMR bubble response grid to the paper
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIncludeBubbleSheet(true)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                        includeBubbleSheet
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <CircleDot className="w-4 h-4" />
                      <span>With Bubble Sheet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludeBubbleSheet(false)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                        !includeBubbleSheet
                          ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <CircleOff className="w-4 h-4" />
                      <span>Without Bubble Sheet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================== BOTTOM NAVIGATION DOCK ===================== */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as ManualStep)}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-3">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1) as ManualStep)}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGeneratePaper}
                disabled={
                  selectedMCQIds.length === 0 &&
                  selectedShortIds.length === 0 &&
                  selectedLongIds.length === 0
                }
                className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-sm shadow-xl transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>Generate & Finalize Paper</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
