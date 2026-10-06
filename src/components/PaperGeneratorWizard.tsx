import React, { useState } from 'react';
import { Sparkles, BookOpen, Layers, CheckSquare, Square, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, CheckCheck } from 'lucide-react';
import { EXAM_TYPES } from '../data/ptbbData';
import { MASTER_PTBB_SUBJECTS, getQuestionsForSubjectAndChapters } from '../data/questionBankStore';
import { ClassLevel, DifficultyLevel, GeneratedExamPaper, LanguageMode, PaperHeaderInfo } from '../types/paper';

interface PaperGeneratorWizardProps {
  onPaperGenerated: (paper: GeneratedExamPaper) => void;
  onOpenManualSelector?: (classLevel: ClassLevel, subjectId: string) => void;
  onClose: () => void;
}

export const PaperGeneratorWizard: React.FC<PaperGeneratorWizardProps> = ({
  onPaperGenerated,
  onOpenManualSelector,
  onClose,
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('9th');
  const classSubjects = MASTER_PTBB_SUBJECTS.filter((s) => s.classLevel === selectedClass);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('9th-physics');
  const currentSubject = MASTER_PTBB_SUBJECTS.find((s) => s.id === selectedSubjectId) || classSubjects[0];

  const [selectedChapters, setSelectedChapters] = useState<number[]>([1, 2]);
  const [examType, setExamType] = useState<string>('chapter');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('bilingual');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('standard');
  const [totalMarks, setTotalMarks] = useState<number>(60);
  const [instituteName, setInstituteName] = useState<string>('PUNJAB GROUP OF SCIENCE ACADEMIES');
  const [campusName, setCampusName] = useState<string>('Main Campus, Lahore');
  const [examTitle, setExamTitle] = useState<string>('Evaluation Examination 2026');
  const [teacherName, setTeacherName] = useState<string>('Senior Subject Specialist');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClassChange = (newClass: ClassLevel) => {
    setSelectedClass(newClass);
    const firstSubj = MASTER_PTBB_SUBJECTS.find((s) => s.classLevel === newClass);
    if (firstSubj) {
      setSelectedSubjectId(firstSubj.id);
      setSelectedChapters(firstSubj.chapters.slice(0, 2).map((c) => c.number));
      setTotalMarks(firstSubj.defaultMarks);
    }
  };

  const handleSubjectChange = (subjId: string) => {
    setSelectedSubjectId(subjId);
    const subj = MASTER_PTBB_SUBJECTS.find((s) => s.id === subjId);
    if (subj) {
      setSelectedChapters(subj.chapters.slice(0, 2).map((c) => c.number));
      setTotalMarks(subj.defaultMarks);
    }
  };

  const toggleChapter = (num: number) => {
    if (selectedChapters.includes(num)) {
      if (selectedChapters.length > 1) {
        setSelectedChapters(selectedChapters.filter((c) => c !== num));
      }
    } else {
      setSelectedChapters([...selectedChapters, num].sort((a, b) => a - b));
    }
  };

  const selectAllChapters = () => {
    if (currentSubject) {
      setSelectedChapters(currentSubject.chapters.map((c) => c.number));
    }
  };

  const selectHalfBook1 = () => {
    if (currentSubject) {
      const half = Math.ceil(currentSubject.chapters.length / 2);
      setSelectedChapters(currentSubject.chapters.slice(0, half).map((c) => c.number));
    }
  };

  const selectHalfBook2 = () => {
    if (currentSubject) {
      const half = Math.ceil(currentSubject.chapters.length / 2);
      setSelectedChapters(currentSubject.chapters.slice(half).map((c) => c.number));
    }
  };

  const handleGenerateAI = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const chapterTitles = currentSubject.chapters
      .filter((c) => selectedChapters.includes(c.number))
      .map((c) => `Unit ${c.number}: ${c.titleEn} (${c.titleUr})`);

    try {
      const response = await fetch('/api/generate-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classLevel: selectedClass,
          subjectName: currentSubject.nameEn,
          chapters: chapterTitles,
          examType,
          totalMarks,
          languageMode,
          difficulty,
          instituteName,
          campusName,
          examTitle,
          teacherName,
          customPromptInstructions: customPrompt,
          mcqCount: currentSubject.mcqMarks || 12,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Server error while generating paper');
      }

      const generatedPaper = await response.json();
      onPaperGenerated(generatedPaper);
      onClose();
    } catch (err: any) {
      console.warn('AI generation failed, fallback available:', err.message);
      setErrorMsg(`${err.message || 'Generation failed'}. You can also use the instant offline template or manual question picker.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePresetTemplate = () => {
    // Generate an authentic paper from the question bank for the exact selected subject & chapters
    const pool = getQuestionsForSubjectAndChapters(currentSubject.id, selectedChapters);
    const mcqTarget = currentSubject.mcqMarks || 12;
    const shortTarget = Math.round((currentSubject.shortQMarks || 30) / 2);
    const longTarget = 3;

    const chosenMCQs = pool.mcqs.slice(0, mcqTarget).map((m, i) => ({ ...m, qNo: i + 1 }));
    const chosenShorts = pool.shortQuestions.slice(0, shortTarget).map((s, i) => ({ ...s, subNo: i + 1 }));
    const chosenLongs = pool.longQuestions.slice(0, longTarget).map((l, i) => ({ ...l, qNo: i + 5 }));

    const syllabusStr =
      selectedChapters.length === currentSubject.chapters.length
        ? 'Complete Book'
        : `Unit(s): ${selectedChapters.join(', ')}`;

    const header: PaperHeaderInfo = {
      instituteName: instituteName || 'PUNJAB GROUP OF SCIENCE ACADEMIES',
      campusName: campusName || 'Main Campus',
      examTitle: examTitle || `${currentSubject.nameEn} Examination`,
      classLevel: selectedClass,
      subjectName: currentSubject.nameEn,
      syllabusCovered: syllabusStr,
      dateStr: new Date().toLocaleDateString('en-GB'),
      timeAllowed: currentSubject.timeAllowed || '2:15 Hours',
      totalMarks: totalMarks || currentSubject.defaultMarks,
      teacherName: teacherName || 'Senior Subject Specialist',
      showWatermark: false,
      watermarkText: 'CONFIDENTIAL',
      logoType: 'shield',
      boardPattern: 'BISE Punjab Board Pattern',
      studentFields: {
        showRollNo: true,
        showName: true,
        showSection: true,
        showObtainedMarks: true,
      },
    };

    const shortGroups = [];
    const grpCount = Math.max(1, Math.ceil(chosenShorts.length / 5));
    for (let i = 0; i < grpCount; i++) {
      const slice = chosenShorts.slice(i * 8, (i + 1) * 8);
      if (slice.length > 0) {
        shortGroups.push({
          id: `wiz-grp-${i + 1}`,
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

    const template: GeneratedExamPaper = {
      id: `paper-preset-${Date.now()}`,
      createdAt: new Date().toISOString(),
      languageMode,
      difficulty,
      header,
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

    onPaperGenerated(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl">AI Paper Generator</h2>
              <p className="text-xs text-blue-200">
                PTBB & BISE Punjab Board Exam Paper Maker for Matric (9th & 10th) Science Group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Wizard Form */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-slate-800">
          {errorMsg && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMsg}</p>
                <p className="text-amber-700">
                  Tip: Click &quot;Load Instant Board Template&quot; below to generate directly from the question bank.
                </p>
              </div>
            </div>
          )}

          {/* Quick Switch to Manual Question Selection Banner */}
          {onOpenManualSelector && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-blue-950">
              <div>
                <span className="font-extrabold block">Prefer to select questions yourself?</span>
                <span className="text-blue-700 text-[11px]">
                  Tick chapters and handpick each MCQ, short question, and numerical from the bank.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManualSelector(selectedClass, currentSubject.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Open Manual Question Picker</span>
              </button>
            </div>
          )}

          {/* Step 1: Select Class */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              1. Select Class
            </label>
            <div className="grid grid-cols-2 gap-2.5 max-w-md">
              {(['9th', '10th'] as ClassLevel[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleClassChange(c)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    selectedClass === c
                      ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="text-sm font-extrabold">{c} Class</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {c === '9th' ? 'Matric Part 1 (Science)' : 'Matric Part 2 (Science)'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Subject */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              2. Select Subject ({classSubjects.length} Books Available)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {classSubjects.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubjectChange(sub.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedSubjectId === sub.id
                      ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold truncate text-slate-900">{sub.nameEn}</div>
                  <div className="text-[10px] text-slate-500">{sub.chapters.length} Units · {sub.defaultMarks} Marks</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Select Chapters */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold uppercase text-slate-500">
                3. Chapters / Units to Include ({selectedChapters.length} Selected)
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={selectAllChapters}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-[11px]"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={selectHalfBook1}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-[11px]"
                >
                  1st Half
                </button>
                <button
                  type="button"
                  onClick={selectHalfBook2}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-[11px]"
                >
                  2nd Half
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto space-y-1.5">
              {currentSubject.chapters.map((ch) => {
                const isChecked = selectedChapters.includes(ch.number);
                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChapter(ch.number)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      isChecked
                        ? 'bg-blue-100/70 border border-blue-300 text-blue-950 font-medium'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-700 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>
                        <strong className="mr-1">Unit {ch.number}:</strong> {ch.titleEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Paper Pattern & Formatting */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Exam Type
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Language / Script
              </label>
              <select
                value={languageMode}
                onChange={(e) => setLanguageMode(e.target.value as LanguageMode)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="bilingual">Bilingual (English + Urdu Nastaliq)</option>
                <option value="english">English Medium Only</option>
                <option value="urdu">Urdu Medium Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard Board Pattern (60% Know, 40% App)</option>
                <option value="conceptual_slo">Conceptual / SLO Based (25% High Order)</option>
                <option value="easy">Easy / Revision Test (Basic Definitions)</option>
              </select>
            </div>
          </div>

          {/* Step 5: Institute Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                School / College / Academy Name
              </label>
              <input
                type="text"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. PUNJAB GROUP OF SCIENCE ACADEMIES"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Campus / Address
              </label>
              <input
                type="text"
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Main Campus, Lahore"
              />
            </div>
          </div>

          {/* Custom Prompt Instructions for AI */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Custom AI Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Include 1 numerical from Chapter 2, focus on definitions and formulas, add a question on Newton second law..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleUsePresetTemplate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Load Instant Board Template (Offline)</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isLoading || selectedChapters.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-700/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>AI Generating Exam Paper...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Generate Paper with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
