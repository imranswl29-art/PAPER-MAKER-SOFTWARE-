import React, { useState } from 'react';
import {
  GeneratedExamPaper,
  MCQItem,
  ShortQuestionGroup,
  ShortQuestionItem,
  LongQuestionItem,
  LongQuestionPart,
} from '../types/paper';
import {
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  Download,
  Printer,
  CircleDot,
  CircleOff,
  Share2,
  FileDown,
  HelpCircle,
  FileText,
  FileCheck2,
  Layers,
  Files,
  GraduationCap,
  Book,
  Loader2,
  Upload,
  MessageCircle,
} from 'lucide-react';
import { exportPaperToWord } from '../utils/exportWord';
import { exportPaperToPdf } from '../utils/exportPdf';

interface ExamPaperViewProps {
  paper: GeneratedExamPaper;
  onUpdatePaper: (updated: GeneratedExamPaper) => void;
  printSection: 'all' | 'objective' | 'subjective';
  onOpenBubbleSheetModal?: () => void;
  onOpenAnswerKeyModal?: () => void;
}

export const ExamPaperView: React.FC<ExamPaperViewProps> = ({
  paper,
  onUpdatePaper,
  printSection,
  onOpenBubbleSheetModal,
  onOpenAnswerKeyModal,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<'objective' | 'subjective' | 'all'>(
    printSection === 'objective' || printSection === 'subjective' ? printSection : 'all'
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showMobilePdfTip, setShowMobilePdfTip] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfStatusText, setPdfStatusText] = useState<string>('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [paperCode] = useState(() => '50' + (Math.floor(Math.random() * 89) + 10));

  const logoInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync document.title with Class Name and Paper Name so browser Print / Save as PDF uses exact Paper name
  React.useEffect(() => {
    const prevTitle = document.title;
    const cleanSubject = paper.header.subjectName || 'Paper';
    const cleanClass = paper.header.classLevel || '9th';
    document.title = `${cleanClass}_Class_${cleanSubject.replace(/\s+/g, '_')}_Exam_Paper`;
    return () => {
      document.title = prevTitle;
    };
  }, [paper.header.classLevel, paper.header.subjectName]);

  const handlePrintPaper = () => {
    const prevTitle = document.title;
    const cleanSubject = (paper.header.subjectName || 'Paper').replace(/\s+/g, '_');
    const cleanClass = paper.header.classLevel || '9th';
    const sheetSuffix = selectedSheet === 'objective' ? '_Objective' : selectedSheet === 'subjective' ? '_Subjective' : '';
    document.title = `${cleanClass}_Class_${cleanSubject}${sheetSuffix}_Exam_Paper`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdatePaper({
            ...paper,
            header: {
              ...paper.header,
              customLogoUrl: reader.result,
            },
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectPdfDownload = async () => {
    setIsExportingPdf(true);
    setPdfStatusText('Preparing high-resolution PDF...');
    try {
      const ok = await exportPaperToPdf(paper, 'exam-paper-container', (msg) => {
        setPdfStatusText(msg);
      });
      if (!ok) {
        setShowMobilePdfTip(true);
      }
    } catch {
      setShowMobilePdfTip(true);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSharePaper = async () => {
    const shareText = `*${paper.header.instituteName}*\n${paper.header.classLevel} - ${paper.header.subjectName}\nExam: ${paper.header.examTitle}\nTotal Marks: ${paper.header.totalMarks}\nDate: ${paper.header.dateStr}\n\nGenerated with PAPER MAKER SOFTWARE.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${paper.header.classLevel} ${paper.header.subjectName} Exam Paper`,
          text: shareText,
          url: window.location.href,
        });
      } catch (e) {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
      }
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    const shareText = `*${paper.header.instituteName}*\n${paper.header.classLevel} - ${paper.header.subjectName}\nExam: ${paper.header.examTitle}\nTotal Marks: ${paper.header.totalMarks}\nDate: ${paper.header.dateStr}\n\n*Check or Download the complete Exam Paper & Answer Key online:*\n${window.location.href}\n\n_Official PTBB Examination System_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const { header, objectiveSection, subjectiveSection, languageMode } = paper;

  // Handle regenerating a single question with server AI
  const handleRegenerateQuestion = async (
    type: 'mcq' | 'short' | 'long',
    targetId: string
  ) => {
    setRegeneratingId(targetId);
    try {
      const res = await fetch('/api/regenerate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          classLevel: header.classLevel,
          subjectName: header.subjectName,
          languageMode,
        }),
      });

      if (!res.ok) throw new Error('Regeneration request failed');
      const data = await res.json();

      if (type === 'mcq') {
        const updatedMCQs = objectiveSection.questions.map((m) =>
          m.id === targetId
            ? {
                ...m,
                statementEn: data.statementEn || m.statementEn,
                statementUr: data.statementUr || m.statementUr,
                options: data.options || m.options,
                correctOption: data.correctOption || m.correctOption,
              }
            : m
        );
        onUpdatePaper({
          ...paper,
          objectiveSection: { ...objectiveSection, questions: updatedMCQs },
        });
      } else if (type === 'short') {
        const updatedGroups = subjectiveSection.part1_shortQuestions.map((grp) => ({
          ...grp,
          questions: grp.questions.map((q) =>
            q.id === targetId
              ? {
                  ...q,
                  statementEn: data.statementEn || q.statementEn,
                  statementUr: data.statementUr || q.statementUr,
                }
              : q
          ),
        }));
        onUpdatePaper({
          ...paper,
          subjectiveSection: { ...subjectiveSection, part1_shortQuestions: updatedGroups },
        });
      } else if (type === 'long') {
        const updatedLQs = subjectiveSection.part2_longQuestions.questions.map((lq) =>
          lq.id === targetId
            ? {
                ...lq,
                parts: data.parts || lq.parts,
              }
            : lq
        );
        onUpdatePaper({
          ...paper,
          subjectiveSection: {
            ...subjectiveSection,
            part2_longQuestions: {
              ...subjectiveSection.part2_longQuestions,
              questions: updatedLQs,
            },
          },
        });
      }
    } catch (err: any) {
      console.warn('Regeneration error:', err.message);
    } finally {
      setRegeneratingId(null);
    }
  };

  // Delete handlers
  const handleDeleteMCQ = (id: string) => {
    const updated = objectiveSection.questions.filter((q) => q.id !== id);
    onUpdatePaper({
      ...paper,
      objectiveSection: {
        ...objectiveSection,
        questions: updated,
        totalMarks: updated.length,
      },
    });
  };

  const handleDeleteShortQuestion = (groupId: string, qId: string) => {
    const updatedGroups = subjectiveSection.part1_shortQuestions.map((grp) => {
      if (grp.id === groupId) {
        return {
          ...grp,
          questions: grp.questions.filter((q) => q.id !== qId),
        };
      }
      return grp;
    });
    onUpdatePaper({
      ...paper,
      subjectiveSection: {
        ...subjectiveSection,
        part1_shortQuestions: updatedGroups,
      },
    });
  };

  const handleDeleteLongQuestion = (lqId: string) => {
    const updatedLQs = subjectiveSection.part2_longQuestions.questions.filter((q) => q.id !== lqId);
    onUpdatePaper({
      ...paper,
      subjectiveSection: {
        ...subjectiveSection,
        part2_longQuestions: {
          ...subjectiveSection.part2_longQuestions,
          questions: updatedLQs,
        },
      },
    });
  };

  const handleAddMCQ = () => {
    const newNo = objectiveSection.questions.length + 1;
    const newMCQ: MCQItem = {
      id: `mcq-custom-${Date.now()}`,
      qNo: newNo,
      statementEn: 'Enter statement here...',
      statementUr: 'یہاں سوال درج کریں...',
      options: [
        { key: 'A', textEn: 'Option A', textUr: 'آپشن الف' },
        { key: 'B', textEn: 'Option B', textUr: 'آپشن ب' },
        { key: 'C', textEn: 'Option C', textUr: 'آپشن ج' },
        { key: 'D', textEn: 'Option D', textUr: 'آپشن د' },
      ],
      correctOption: 'A',
    };
    onUpdatePaper({
      ...paper,
      objectiveSection: {
        ...objectiveSection,
        questions: [...objectiveSection.questions, newMCQ],
        totalMarks: objectiveSection.questions.length + 1,
      },
    });
  };

  const handleAddShortQuestion = (grpId: string) => {
    const updatedGroups = subjectiveSection.part1_shortQuestions.map((grp) => {
      if (grp.id === grpId) {
        const newSubNo = grp.questions.length + 1;
        const newSQ: ShortQuestionItem = {
          id: `sq-custom-${Date.now()}`,
          subNo: newSubNo,
          statementEn: 'Enter short question statement...',
          statementUr: 'مختصر سوال درج کریں...',
          marks: grp.marksEach || 2,
        };
        return {
          ...grp,
          questions: [...grp.questions, newSQ],
        };
      }
      return grp;
    });
    onUpdatePaper({
      ...paper,
      subjectiveSection: {
        ...subjectiveSection,
        part1_shortQuestions: updatedGroups,
      },
    });
  };

  const handleAddLongQuestion = () => {
    const nextQNo = subjectiveSection.part2_longQuestions.questions.length + 5;
    const newLQ: LongQuestionItem = {
      id: `lq-custom-${Date.now()}`,
      qNo: nextQNo,
      totalMarks: 9,
      parts: [
        {
          partLabel: 'a',
          statementEn: 'Describe comprehensive theoretical concept...',
          statementUr: 'تفصیلی سوال کا جز (الف) بیان کریں...',
          marks: 5,
          isNumerical: false,
        },
        {
          partLabel: 'b',
          statementEn: 'Solve standard numerical problem with given data...',
          statementUr: 'حسابی سوال کا جز (ب) حل کریں...',
          marks: 4,
          isNumerical: true,
        },
      ],
    };
    onUpdatePaper({
      ...paper,
      subjectiveSection: {
        ...subjectiveSection,
        part2_longQuestions: {
          ...subjectiveSection.part2_longQuestions,
          questions: [...subjectiveSection.part2_longQuestions.questions, newLQ],
        },
      },
    });
  };

  const romanNumerals = [
    '(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)',
    '(vii)', '(viii)', '(ix)', '(x)', '(xi)', '(xii)',
  ];

  // Set Variant Generator (Set A, Set B, Set C) with question & choice shuffling
  const handleGenerateVariantSet = (targetSet: 'A' | 'B' | 'C') => {
    const currentSet = paper.header.paperSet || 'A';
    if (currentSet === targetSet) return;

    // Helper for deterministic shuffle
    const shuffle = <T,>(array: T[], seedOffset: number): T[] => {
      const arr = [...array];
      let seed = (targetSet === 'B' ? 47 : targetSet === 'C' ? 89 : 13) + seedOffset;
      for (let i = arr.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Shuffle MCQs and re-index
    const shuffledMCQs = shuffle(paper.objectiveSection.questions, 1).map((q, idx) => {
      // Shuffle options and re-assign keys A, B, C, D
      const shuffledOptions = shuffle(q.options, idx + 5);
      const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      let newCorrect: 'A' | 'B' | 'C' | 'D' = 'A';
      const remappedOptions = shuffledOptions.map((opt, oIdx) => {
        const newKey: 'A' | 'B' | 'C' | 'D' = keys[oIdx] || 'A';
        if (opt.key === q.correctOption) {
          newCorrect = newKey;
        }
        return { ...opt, key: newKey };
      });
      return {
        ...q,
        qNo: idx + 1,
        options: remappedOptions,
        correctOption: newCorrect,
      };
    });

    // Shuffle short questions in each group
    const shuffledSQs = paper.subjectiveSection.part1_shortQuestions.map((grp, gIdx) => ({
      ...grp,
      questions: shuffle(grp.questions, gIdx * 7 + 3).map((sq, sIdx) => ({
        ...sq,
        subNo: sIdx + 1,
      })),
    }));

    onUpdatePaper({
      ...paper,
      header: {
        ...paper.header,
        paperSet: targetSet,
        paperCode: `CODE-${targetSet === 'B' ? '7284' : targetSet === 'C' ? '7392' : '7105'}`,
      },
      objectiveSection: {
        ...paper.objectiveSection,
        questions: shuffledMCQs,
      },
      subjectiveSection: {
        ...paper.subjectiveSection,
        part1_shortQuestions: shuffledSQs,
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none max-w-5xl mx-auto my-4 print:my-0 print:mx-0 print:max-w-none print:w-full">
      {/* ===================== CONTROL TOOLBAR (Clean English Only) ===================== */}
      <div className="no-print bg-slate-900 border-b border-slate-800 p-3 sm:p-4 text-xs flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Sheet Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setSelectedSheet('all')}
            className={`btn-3d flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              selectedSheet === 'all'
                ? 'btn-3d-blue text-white shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800'
            }`}
          >
            <Files className="w-3.5 h-3.5" />
            <span>Full Paper (All)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSheet('objective')}
            className={`btn-3d flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              selectedSheet === 'objective'
                ? 'btn-3d-blue text-white shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Objective (MCQs)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSheet('subjective')}
            className={`btn-3d flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              selectedSheet === 'subjective'
                ? 'btn-3d-indigo text-white shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subjective</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Medium Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 hidden md:inline">
              Medium:
            </span>
            <button
              type="button"
              onClick={() => onUpdatePaper({ ...paper, languageMode: 'english' })}
              className={`btn-3d px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                languageMode === 'english'
                  ? 'btn-3d-blue text-white'
                  : 'text-slate-300 hover:text-white bg-slate-800/80'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onUpdatePaper({ ...paper, languageMode: 'urdu' })}
              className={`btn-3d px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                languageMode === 'urdu'
                  ? 'btn-3d-emerald text-white'
                  : 'text-slate-300 hover:text-white bg-slate-800/80'
              }`}
            >
              Urdu
            </button>
            <button
              type="button"
              onClick={() => onUpdatePaper({ ...paper, languageMode: 'bilingual' })}
              className={`btn-3d px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                languageMode === 'bilingual'
                  ? 'btn-3d-indigo text-white'
                  : 'text-slate-300 hover:text-white bg-slate-800/80'
              }`}
            >
              Bilingual
            </button>
          </div>

          {/* Bubble Sheet Option: Two Separate Buttons as requested */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 hidden md:inline">
              Bubble Sheet:
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdatePaper({
                  ...paper,
                  header: { ...paper.header, includeBubbleSheet: true },
                })
              }
              className={`btn-3d flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paper.header.includeBubbleSheet !== false
                  ? 'btn-3d-emerald text-white'
                  : 'text-slate-300 hover:text-white bg-slate-800/80'
              }`}
              title="Attach integrated OMR bubble response grid to the objective exam paper"
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>With Bubble Sheet</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdatePaper({
                  ...paper,
                  header: { ...paper.header, includeBubbleSheet: false },
                })
              }
              className={`btn-3d flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                paper.header.includeBubbleSheet === false
                  ? 'btn-3d-rose text-white'
                  : 'text-slate-300 hover:text-white bg-slate-800/80'
              }`}
              title="Do not attach bubble response sheet to the paper"
            >
              <CircleOff className="w-3.5 h-3.5" />
              <span>Without Bubble Sheet</span>
            </button>
          </div>

          {/* Paper Sets (Set A, Set B, Set C) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 hidden md:inline">
              Paper Set:
            </span>
            {(['A', 'B', 'C'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleGenerateVariantSet(s)}
                className={`btn-3d px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  (paper.header.paperSet || 'A') === s
                    ? 'btn-3d-amber text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white bg-slate-800/80'
                }`}
                title={`Generate randomized Set ${s} variant with shuffled questions and choices`}
              >
                Set {s}
              </button>
            ))}
          </div>

          {/* Watermark Toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdatePaper({
                ...paper,
                header: { ...paper.header, showWatermark: !paper.header.showWatermark },
              })
            }
            className={`btn-3d flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs ${
              paper.header.showWatermark
                ? 'btn-3d-blue text-white'
                : 'btn-3d-slate text-slate-300'
            }`}
            title="Toggle subtle watermark on generated exam paper"
          >
            <span>Watermark: {paper.header.showWatermark ? 'ON' : 'OFF'}</span>
          </button>

          {/* Upload Monogram button */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3 py-1.5 text-amber-300 rounded-xl font-bold cursor-pointer text-xs"
            title="Upload official school logo or monogram to display on exam paper"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Monogram</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`btn-3d flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs ${
              isEditing
                ? 'btn-3d-amber text-slate-950 font-black'
                : 'btn-3d-slate text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit Paper'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportPaperToWord(paper, selectedSheet)}
            className="btn-3d btn-3d-blue flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl font-bold cursor-pointer"
            title="Download editable Microsoft Word document for the active sheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Word</span>
          </button>

          <button
            type="button"
            onClick={handleDirectPdfDownload}
            disabled={isExportingPdf}
            className="btn-3d btn-3d-indigo flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
            title="Download direct PDF file to your device"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
          </button>

          {onOpenAnswerKeyModal && (
            <button
              type="button"
              onClick={onOpenAnswerKeyModal}
              className="btn-3d btn-3d-emerald flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl font-bold cursor-pointer"
              title="Download & Print Solved Answer Key / Sheet in PDF, Word and Print formats"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-200" />
              <span>Answer Key / Sheet</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintPaper}
            className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl font-bold cursor-pointer"
            title="Print Full A4 Paper directly"
          >
            <Printer className="w-3.5 h-3.5 text-blue-300" />
            <span>Print Paper</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="btn-3d btn-3d-emerald flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-500"
            title="Share directly via WhatsApp with teachers, principals, or groups"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            <span>Share via WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleSharePaper}
            className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3 py-1.5 text-slate-200 rounded-xl font-bold cursor-pointer"
            title="Copy or share link via device share"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {onOpenBubbleSheetModal && (
            <button
              type="button"
              onClick={onOpenBubbleSheetModal}
              className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3 py-1.5 text-slate-200 rounded-xl font-semibold cursor-pointer"
            >
              <CircleDot className="w-3.5 h-3.5 text-purple-400" />
              <span>Full OMR Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Exporting Progress Bar */}
      {isExportingPdf && (
        <div className="no-print bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-pulse shadow-md">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>{pdfStatusText || 'Generating High-Resolution PDF... Please wait a few seconds'}</span>
        </div>
      )}

      {/* Mobile PDF Guide Toast (no-print) */}
      {showMobilePdfTip && (
        <div className="no-print bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-blue-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">PDF Direct Download Note: </span>
              If direct download was blocked by browser permissions, select <strong>&quot;Save as PDF&quot;</strong> in the print dialog.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMobilePdfTip(false)}
            className="text-blue-800 font-bold ml-2 text-sm hover:text-blue-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================== PAPER BODY (A4 Board Formatting) ===================== */}
      <div id="exam-paper-container" className="p-4 sm:p-5 md:p-6 relative text-slate-900 font-sans bg-white print:p-0 print:m-0 print:w-full">
        {/* Background Watermark */}
        {header.showWatermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 opacity-[0.04]">
            {header.customLogoUrl ? (
              <div className="flex flex-col items-center justify-center">
                <img
                  src={header.customLogoUrl}
                  alt="School Watermark"
                  className="w-72 h-72 object-contain grayscale"
                />
                <div className="text-4xl sm:text-5xl font-black font-serif text-slate-950 text-center uppercase tracking-wider mt-3">
                  {header.watermarkText || header.instituteName}
                </div>
              </div>
            ) : (
              <div className="text-6xl sm:text-7xl font-black font-serif text-slate-950 -rotate-45 text-center leading-tight uppercase">
                {header.watermarkText || header.instituteName}
              </div>
            )}
          </div>
        )}

        <div className="relative z-10 space-y-8">
          {/* ========================================================================= */}
          {/* SHEET 1: OBJECTIVE TYPE (معروضی پرچہ)                                    */}
          {/* ========================================================================= */}
          {(selectedSheet === 'objective' || selectedSheet === 'all') && (
            <div className="space-y-6 page-break-inside-avoid">
              {/* Authentic Board Double-Border Header */}
              <div className="border-2 border-slate-900 p-3 sm:p-4 rounded-xs bg-white text-center space-y-2">
                {/* Top Row: School Monogram (Left) + School Name (Center, Unclipped & Prominent) + Roll No (Right, NO Paper Code) */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  {/* Left: School Monogram */}
                  <div className="w-14 h-14 sm:w-20 sm:h-20 border-2 border-slate-900 rounded-full p-1 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {header.customLogoUrl ? (
                      <img
                        src={header.customLogoUrl}
                        alt="School Monogram"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 text-white flex flex-col items-center justify-center p-1 text-center">
                        <GraduationCap className="w-7 h-7 text-amber-400" />
                        <span className="text-[7px] font-black uppercase tracking-tighter">PTBB SEAL</span>
                      </div>
                    )}
                  </div>

                  {/* Center: School Name (LARGE, ELEGANT, UNCLIPPED, FULL PROMINENCE FOR PRINT & SCREEN) */}
                  <div className="flex-1 min-w-0 text-center px-1 sm:px-3">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight font-serif text-slate-950 leading-tight">
                      {header.instituteName}
                    </h1>
                    <div className="text-[11px] sm:text-sm font-bold text-slate-800 uppercase tracking-wider mt-1">
                      {header.campusName ? `${header.campusName} • ` : ''}
                      {header.boardPattern || 'BISE PUNJAB BOARD EXAMINATION'}
                      {header.phone ? ` • Ph: ${header.phone}` : ''}
                    </div>
                    <div className="text-[11px] sm:text-sm font-black text-slate-950 mt-0.5">
                      {header.classLevel.toUpperCase()} CLASS — {header.subjectName.toUpperCase()}
                    </div>
                  </div>

                  {/* Right: Roll Number Box & Set Identifier */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="border border-slate-900 bg-slate-950 text-white px-2 py-0.5 text-center rounded-xs shadow-2xs">
                        <span className="block text-[7px] font-bold uppercase tracking-wider text-amber-300">
                          SET
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white">
                          {header.paperSet || 'A'}
                        </span>
                      </div>
                      <div className="border border-slate-900 p-1 sm:p-1.5 text-left bg-slate-50/80">
                        <span className="block text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-900 mb-0.5">
                          Roll Number
                        </span>
                        <div className="flex gap-0.5 sm:gap-1">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                              key={i}
                              className="w-3.5 h-4.5 sm:w-4.5 sm:h-5.5 border border-slate-900 bg-white flex items-center justify-center font-mono font-bold text-[10px] sm:text-xs"
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-700">
                      Date: {header.dateStr}
                    </div>
                  </div>
                </div>

                {/* Meta details bar */}
                <div className="bg-slate-950 text-white font-bold text-[11px] sm:text-xs py-1 px-3 flex flex-wrap items-center justify-between gap-1">
                  <span>PAPER: OBJECTIVE TYPE</span>
                  <span>TIME ALLOWED: {objectiveSection.timeAllowed || '15 Minutes'}</span>
                  <span>MAXIMUM MARKS: {objectiveSection.totalMarks}</span>
                </div>

                {/* Instructions */}
                <div className="text-[11px] text-left border-t border-slate-300 pt-2 text-slate-800 space-y-1 bg-slate-50/50 p-2">
                  {languageMode !== 'urdu' && (
                    <p>
                      <strong>NOTE: </strong>
                      Write your Roll No. in the specified box. Four choices (A, B, C, D) are given for each question. Fill the relevant circle on the response grid with blue/black pen or marker. Cutting, erasing or filling multiple circles will receive zero credit.
                    </p>
                  )}
                  {languageMode !== 'english' && (
                    <p className="font-urdu text-[12px] text-right font-medium" dir="rtl">
                      نوٹ: ہر سوال کے چار ممکنہ جوابات A, B, C اور D دیے گئے ہیں۔ جوابی شیٹ پر متعلقہ دائرہ کو مارکر سے بھریں۔ ایک سے زیادہ دائروں کو پر کرنے یا کاٹنے کی صورت میں کوئی نمبر نہیں ملے گا۔
                    </p>
                  )}
                </div>
              </div>

              {/* INTEGRATED OMR RESPONSE BUBBLE GRID AT FRONT PAGE (BEFORE MCQs START) */}
              {paper.header.includeBubbleSheet !== false && (
                <div className="omr-bubble-grid-container my-3.5 border-2 border-slate-900 p-3 sm:p-3.5 rounded-lg bg-slate-50/95 page-break-inside-avoid space-y-2.5 shadow-xs overflow-visible">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-300 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-blue-800 shrink-0" />
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
                        Official OMR Bubble Response Grid
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-700 font-semibold shrink-0 bg-white border border-slate-300 px-2 py-0.5 rounded shadow-2xs">
                      Fill Bubble: ⬤ Correct &nbsp;|&nbsp; ✕ ⨂ Incorrect
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 text-xs">
                    {objectiveSection.questions.map((m) => (
                      <div
                        key={m.id}
                        className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white flex items-center justify-between gap-2 shadow-2xs overflow-visible hover:border-blue-400 transition-colors"
                      >
                        <span className="font-black font-mono text-[11px] sm:text-xs text-slate-900 shrink-0 min-w-[36px]">
                          Q.{m.qNo}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                            <div
                              key={letter}
                              className="w-4.5 h-4.5 rounded-full border border-slate-900 flex items-center justify-center text-[9px] font-black text-slate-900 bg-white shrink-0"
                            >
                              {letter}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-300 pt-2 flex flex-wrap items-center justify-between text-[10px] text-slate-700 font-medium gap-2">
                    <div>Candidate Signature: ____________________</div>
                    <div>Invigilator Signature: ____________________</div>
                  </div>
                </div>
              )}

              {/* MCQs Table Grid */}
              <div className="space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>Q.1 Choose the correct option:</span>
                  <span className="font-normal text-slate-600 text-[11px]">
                    ({objectiveSection.totalMarks} × 1 = {objectiveSection.totalMarks} Marks)
                  </span>
                </div>

                <div className="space-y-3">
                  {objectiveSection.questions.map((mcq) => (
                    <div
                      key={mcq.id}
                      className="border border-slate-300 rounded p-3 bg-white text-xs space-y-2.5 page-break-inside-avoid relative group"
                    >
                      {isEditing && (
                        <div className="no-print absolute top-1 right-1 flex items-center gap-1 bg-white border border-slate-300 rounded shadow-xs p-1 z-20">
                          <button
                            type="button"
                            title="Regenerate this MCQ with AI"
                            onClick={() => handleRegenerateQuestion('mcq', mcq.id)}
                            disabled={regeneratingId === mcq.id}
                            className="p-1 hover:bg-blue-50 text-blue-700 rounded transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete question"
                            onClick={() => handleDeleteMCQ(mcq.id)}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Question Statement in English & Urdu (Zero Overlap) */}
                      {languageMode === 'english' && (
                        <div className="font-bold text-slate-950 text-xs sm:text-sm leading-snug">
                          <span className="font-mono text-blue-900 mr-1.5">({mcq.qNo})</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={mcq.statementEn}
                              onChange={(e) => {
                                const updated = objectiveSection.questions.map((q) =>
                                  q.id === mcq.id ? { ...q, statementEn: e.target.value } : q
                                );
                                onUpdatePaper({
                                  ...paper,
                                  objectiveSection: { ...objectiveSection, questions: updated },
                                });
                              }}
                              className="w-full border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40 mt-1"
                            />
                          ) : (
                            <span>{mcq.statementEn}</span>
                          )}
                        </div>
                      )}

                      {languageMode === 'urdu' && (
                        <div className="font-urdu text-[14px] font-bold text-slate-950 text-right w-full leading-[2.6]" dir="rtl">
                          <span className="font-sans font-bold ml-2">({mcq.qNo})</span>
                          {isEditing ? (
                            <input
                              type="text"
                              dir="rtl"
                              value={mcq.statementUr}
                              onChange={(e) => {
                                const updated = objectiveSection.questions.map((q) =>
                                  q.id === mcq.id ? { ...q, statementUr: e.target.value } : q
                                );
                                onUpdatePaper({
                                  ...paper,
                                  objectiveSection: { ...objectiveSection, questions: updated },
                                });
                              }}
                              className="w-full font-urdu border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40 mt-1"
                            />
                          ) : (
                            <span>{mcq.statementUr || mcq.statementEn}</span>
                          )}
                        </div>
                      )}

                      {languageMode === 'bilingual' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="font-bold text-slate-950 text-xs sm:text-sm leading-relaxed pr-2 border-r md:border-slate-200">
                            <span className="font-mono text-blue-900 mr-1.5">({mcq.qNo})</span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={mcq.statementEn}
                                onChange={(e) => {
                                  const updated = objectiveSection.questions.map((q) =>
                                    q.id === mcq.id ? { ...q, statementEn: e.target.value } : q
                                  );
                                  onUpdatePaper({
                                    ...paper,
                                    objectiveSection: { ...objectiveSection, questions: updated },
                                  });
                                }}
                                className="w-full border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                              />
                            ) : (
                              <span>{mcq.statementEn}</span>
                            )}
                          </div>
                          <div className="font-urdu text-[13.5px] font-semibold text-slate-950 text-right leading-[2.6] pl-2" dir="rtl">
                            {isEditing ? (
                              <input
                                type="text"
                                dir="rtl"
                                value={mcq.statementUr}
                                onChange={(e) => {
                                  const updated = objectiveSection.questions.map((q) =>
                                    q.id === mcq.id ? { ...q, statementUr: e.target.value } : q
                                  );
                                  onUpdatePaper({
                                    ...paper,
                                    objectiveSection: { ...objectiveSection, questions: updated },
                                  });
                                }}
                                className="w-full font-urdu border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                              />
                            ) : (
                              <span>{mcq.statementUr}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {mcq.options.map((opt) => (
                          <div
                            key={opt.key}
                            className="border border-slate-300 rounded-md p-2 bg-slate-50/70 flex items-start gap-1.5 text-slate-900 text-xs overflow-visible"
                          >
                            <span className="font-black font-mono text-slate-900 shrink-0">({opt.key})</span>
                            {languageMode === 'english' && (
                              <span className="font-semibold text-slate-900 leading-snug flex-1">{opt.textEn}</span>
                            )}
                            {languageMode === 'urdu' && (
                              <span className="font-urdu text-[12.5px] font-semibold text-slate-950 text-right flex-1 leading-snug" dir="rtl">
                                {opt.textUr || opt.textEn}
                              </span>
                            )}
                            {languageMode === 'bilingual' && (
                              <div className="flex flex-col items-start w-full gap-0.5 overflow-visible">
                                <span className="font-semibold text-slate-900 text-[11px] sm:text-xs leading-snug">{opt.textEn}</span>
                                {opt.textUr && opt.textUr !== opt.textEn && (
                                  <span className="font-urdu text-[12px] font-bold text-slate-900 text-right w-full leading-snug pt-0.5 border-t border-slate-200" dir="rtl">
                                    {opt.textUr}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="no-print pt-2">
                    <button
                      type="button"
                      onClick={handleAddMCQ}
                      className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-blue-500 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New MCQ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page break divider when combined full paper is viewed */}
          {selectedSheet === 'all' && (
            <div className="page-break-before my-8 border-b-4 border-dashed border-slate-300 text-center py-2 no-print">
              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-bold uppercase">
                End of Objective Paper · Start of Subjective Paper
              </span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SHEET 2: SUBJECTIVE TYPE                                                  */}
          {/* ========================================================================= */}
          {(selectedSheet === 'subjective' || selectedSheet === 'all') && (
            <div className="space-y-6 page-break-inside-avoid">
              {/* Authentic Board Header for Subjective Paper */}
              <div className="border-2 border-slate-900 p-3 sm:p-4 rounded-xs bg-white text-center space-y-2">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {/* Left: Monogram */}
                  <div className="w-14 h-14 sm:w-18 sm:h-18 border-2 border-slate-900 rounded-full p-1 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {header.customLogoUrl ? (
                      <img
                        src={header.customLogoUrl}
                        alt="School Monogram"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 text-white flex flex-col items-center justify-center p-1 text-center">
                        <GraduationCap className="w-6 h-6 text-amber-400" />
                        <span className="text-[6.5px] font-black uppercase tracking-tighter">PTBB SEAL</span>
                      </div>
                    )}
                  </div>

                  {/* Center: School Name (LARGE, ELEGANT, UNCLIPPED, FULL PROMINENCE FOR PRINT & SCREEN) */}
                  <div className="flex-1 min-w-0 text-center px-1 sm:px-3">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight font-serif text-slate-950 leading-tight">
                      {header.instituteName}
                    </h1>
                    <div className="text-[11px] sm:text-sm font-bold text-slate-800 uppercase tracking-wider mt-1">
                      {header.campusName ? `${header.campusName} • ` : ''}
                      {header.boardPattern || 'BISE PUNJAB BOARD EXAMINATION'}
                      {header.phone ? ` • Ph: ${header.phone}` : ''}
                    </div>
                    <div className="text-[11px] sm:text-sm font-black text-slate-950 mt-0.5">
                      {header.classLevel.toUpperCase()} CLASS — {header.subjectName.toUpperCase()}
                    </div>
                  </div>

                  {/* Right: Roll Number & Date Box */}
                  <div className="flex flex-col items-end gap-1 shrink-0 text-xs font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <div className="border border-slate-900 bg-slate-950 text-white px-2 py-0.5 text-center rounded-xs shadow-2xs">
                        <span className="block text-[7px] font-bold uppercase tracking-wider text-amber-300">
                          SET
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white">
                          {header.paperSet || 'A'}
                        </span>
                      </div>
                      <div className="border border-slate-900 px-2.5 py-1 bg-slate-50/80 text-[11px] whitespace-nowrap">
                        Roll No: _______________
                      </div>
                    </div>
                    <div className="border border-slate-900 px-2.5 py-0.5 bg-slate-100 text-[10px] sm:text-[11px] w-full text-center">
                      Date: {header.dateStr}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 text-white font-bold text-[11px] sm:text-xs py-1 px-3 flex flex-wrap items-center justify-between gap-1">
                  <span>PAPER: SUBJECTIVE TYPE</span>
                  <span>TIME ALLOWED: {subjectiveSection.timeAllowed || '1:45 Hours'}</span>
                  <span>MAXIMUM MARKS: {subjectiveSection.totalMarks}</span>
                </div>

                {header.syllabusCovered && (
                  <div className="text-[11px] text-left text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="font-bold text-slate-800">Syllabus / Units Covered: </span>
                    <span>{header.syllabusCovered}</span>
                  </div>
                )}
              </div>

              {/* SECTION - I: SHORT QUESTIONS */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest py-1.5 px-3 flex items-center justify-between">
                  <span>SECTION - I (SHORT QUESTIONS)</span>
                </div>

                {subjectiveSection.part1_shortQuestions.map((grp) => (
                  <div key={grp.id} className="space-y-2 border border-slate-200 rounded p-3 bg-white">
                    <div className="bg-slate-100 p-2 rounded border-l-4 border-r-4 border-slate-900 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900">
                          Q.{grp.qNo}:
                        </span>
                        {isEditing ? (
                          <div className="no-print flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300">
                            <span>Attempt any:</span>
                            <input
                              type="number"
                              min={1}
                              max={grp.questions.length}
                              value={grp.attemptCount}
                              onChange={(e) => {
                                const count = Math.max(1, Math.min(grp.questions.length, Number(e.target.value)));
                                const updatedGroups = subjectiveSection.part1_shortQuestions.map((g) =>
                                  g.id === grp.id
                                    ? {
                                        ...g,
                                        attemptCount: count,
                                        instructionEn: `Write short answers to any ${count} questions out of ${grp.questions.length}:`,
                                        instructionUr: `درج ذیل میں سے کوئی سے ${count} سوالات کے مختصر جوابات لکھیں (کل ${grp.questions.length} سوالات):`,
                                      }
                                    : g
                                );
                                onUpdatePaper({
                                  ...paper,
                                  subjectiveSection: { ...subjectiveSection, part1_shortQuestions: updatedGroups },
                                });
                              }}
                              className="w-12 text-center border rounded font-black text-indigo-700"
                            />
                            <span>out of {grp.questions.length}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-xs text-slate-900">
                            {languageMode !== 'urdu' && grp.instructionEn} ({grp.attemptCount} × {grp.marksEach} = {grp.attemptCount * grp.marksEach} Marks)
                          </span>
                        )}
                      </div>

                      {languageMode !== 'english' && (
                        <div className="font-urdu text-xs font-bold text-slate-900 text-right" dir="rtl">
                          {grp.instructionUr}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {grp.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="border-b border-slate-100 pb-2 text-xs flex items-start justify-between gap-3 group relative"
                        >
                          {isEditing && (
                            <div className="no-print absolute top-0 right-0 flex items-center gap-1 bg-white border border-slate-300 rounded shadow-xs p-1 z-20">
                              <button
                                type="button"
                                title="Regenerate this question with AI"
                                onClick={() => handleRegenerateQuestion('short', q.id)}
                                disabled={regeneratingId === q.id}
                                className="p-1 text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Delete question"
                                onClick={() => handleDeleteShortQuestion(grp.id, q.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="w-8 font-bold text-slate-900 shrink-0 font-mono">
                            {romanNumerals[idx] || `(${idx + 1})`}
                          </div>

                          {languageMode === 'english' && (
                            <div className="flex-1 font-medium text-slate-900 leading-relaxed text-xs sm:text-sm">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={q.statementEn}
                                  onChange={(e) => {
                                    const updatedGroups = subjectiveSection.part1_shortQuestions.map((g) => {
                                      if (g.id === grp.id) {
                                        return {
                                          ...g,
                                          questions: g.questions.map((quest) =>
                                            quest.id === q.id ? { ...quest, statementEn: e.target.value } : quest
                                          ),
                                        };
                                      }
                                      return g;
                                    });
                                    onUpdatePaper({
                                      ...paper,
                                      subjectiveSection: { ...subjectiveSection, part1_shortQuestions: updatedGroups },
                                    });
                                  }}
                                  className="w-full border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                />
                              ) : (
                                <span>{q.statementEn}</span>
                              )}
                            </div>
                          )}

                          {languageMode === 'urdu' && (
                            <div
                              className="font-urdu text-[13.5px] text-slate-950 font-semibold text-right flex-1 leading-[2.6]"
                              dir="rtl"
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={q.statementUr}
                                  onChange={(e) => {
                                    const updatedGroups = subjectiveSection.part1_shortQuestions.map((g) => {
                                      if (g.id === grp.id) {
                                        return {
                                          ...g,
                                          questions: g.questions.map((quest) =>
                                            quest.id === q.id ? { ...quest, statementUr: e.target.value } : quest
                                          ),
                                        };
                                      }
                                      return g;
                                    });
                                    onUpdatePaper({
                                      ...paper,
                                      subjectiveSection: { ...subjectiveSection, part1_shortQuestions: updatedGroups },
                                    });
                                  }}
                                  className="w-full font-urdu border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                />
                              ) : (
                                <span>{q.statementUr || q.statementEn}</span>
                              )}
                            </div>
                          )}

                          {languageMode === 'bilingual' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-center">
                              <div className="font-medium text-slate-900 leading-relaxed text-xs sm:text-sm pr-2 border-r sm:border-slate-100">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={q.statementEn}
                                    onChange={(e) => {
                                      const updatedGroups = subjectiveSection.part1_shortQuestions.map((g) => {
                                        if (g.id === grp.id) {
                                          return {
                                            ...g,
                                            questions: g.questions.map((quest) =>
                                              quest.id === q.id ? { ...quest, statementEn: e.target.value } : quest
                                            ),
                                          };
                                        }
                                        return g;
                                      });
                                      onUpdatePaper({
                                        ...paper,
                                        subjectiveSection: { ...subjectiveSection, part1_shortQuestions: updatedGroups },
                                      });
                                    }}
                                    className="w-full border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                  />
                                ) : (
                                  <span>{q.statementEn}</span>
                                )}
                              </div>
                              <div className="font-urdu text-[13.5px] text-slate-950 font-semibold text-right leading-[2.6] pl-2" dir="rtl">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    dir="rtl"
                                    value={q.statementUr}
                                    onChange={(e) => {
                                      const updatedGroups = subjectiveSection.part1_shortQuestions.map((g) => {
                                        if (g.id === grp.id) {
                                          return {
                                            ...g,
                                            questions: g.questions.map((quest) =>
                                              quest.id === q.id ? { ...quest, statementUr: e.target.value } : quest
                                            ),
                                          };
                                        }
                                        return g;
                                      });
                                      onUpdatePaper({
                                        ...paper,
                                        subjectiveSection: { ...subjectiveSection, part1_shortQuestions: updatedGroups },
                                      });
                                    }}
                                    className="w-full font-urdu border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                  />
                                ) : (
                                  <span>{q.statementUr}</span>
                                )}
                              </div>
                            </div>
                          )}

                          <span className="text-[11px] font-bold text-slate-600 shrink-0">
                            ({q.marks})
                          </span>
                        </div>
                      ))}
                    </div>

                    {isEditing && (
                      <div className="no-print pt-2">
                        <button
                          type="button"
                          onClick={() => handleAddShortQuestion(grp.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-blue-500 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Short Question to Group</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* SECTION - II: LONG QUESTIONS */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest py-1.5 px-3 flex items-center justify-between">
                  <span>SECTION - II (LONG QUESTIONS)</span>
                </div>

                <div className="bg-slate-50 border border-slate-300 p-2.5 rounded text-xs text-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {languageMode !== 'urdu' && (
                    <p>
                      <strong>Note: </strong>
                      {subjectiveSection.part2_longQuestions.instructionEn}
                    </p>
                  )}
                  {languageMode !== 'english' && (
                    <p className="font-urdu text-[12px] font-bold text-right" dir="rtl">
                      {subjectiveSection.part2_longQuestions.instructionUr}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {subjectiveSection.part2_longQuestions.questions.map((lq) => (
                    <div
                      key={lq.id}
                      className="border border-slate-300 rounded p-3 bg-white space-y-2 relative group page-break-inside-avoid"
                    >
                      {isEditing && (
                        <div className="no-print absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            title="Regenerate this Long Question"
                            onClick={() => handleRegenerateQuestion('long', lq.id)}
                            disabled={regeneratingId === lq.id}
                            className="p-1 text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Long Question"
                            onClick={() => handleDeleteLongQuestion(lq.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
                        <span>Q.{lq.qNo}</span>
                        <span className="text-[11px] text-slate-600 font-normal">
                          Total Marks: {lq.totalMarks}
                        </span>
                      </div>

                      <div className="space-y-3 pt-1">
                        {lq.parts.map((p) => (
                          <div key={p.partLabel} className="text-xs">
                            <div className="flex items-start justify-between gap-3">
                              <div className="w-6 font-bold text-slate-900 uppercase shrink-0">
                                ({p.partLabel})
                              </div>

                              {languageMode === 'english' && (
                                <div className="flex-1 font-medium text-slate-900 leading-relaxed">
                                  {isEditing ? (
                                    <textarea
                                      value={p.statementEn}
                                      onChange={(e) => {
                                        const updatedLQ = subjectiveSection.part2_longQuestions.questions.map((q) => {
                                          if (q.id === lq.id) {
                                            return {
                                              ...q,
                                              parts: q.parts.map((part) =>
                                                part.partLabel === p.partLabel ? { ...part, statementEn: e.target.value } : part
                                              ),
                                            };
                                          }
                                          return q;
                                        });
                                        onUpdatePaper({
                                          ...paper,
                                          subjectiveSection: {
                                            ...subjectiveSection,
                                            part2_longQuestions: {
                                              ...subjectiveSection.part2_longQuestions,
                                              questions: updatedLQ,
                                            },
                                          },
                                        });
                                      }}
                                      rows={2}
                                      className="w-full border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                    />
                                  ) : (
                                    <span>{p.statementEn}</span>
                                  )}
                                </div>
                              )}

                              {languageMode === 'urdu' && (
                                <div
                                  className="font-urdu text-[13.5px] text-slate-950 font-semibold text-right flex-1 leading-[2.6]"
                                  dir="rtl"
                                >
                                  {isEditing ? (
                                    <textarea
                                      dir="rtl"
                                      value={p.statementUr}
                                      onChange={(e) => {
                                        const updatedLQ = subjectiveSection.part2_longQuestions.questions.map((q) => {
                                          if (q.id === lq.id) {
                                            return {
                                              ...q,
                                              parts: q.parts.map((part) =>
                                                part.partLabel === p.partLabel ? { ...part, statementUr: e.target.value } : part
                                              ),
                                            };
                                          }
                                          return q;
                                        });
                                        onUpdatePaper({
                                          ...paper,
                                          subjectiveSection: {
                                            ...subjectiveSection,
                                            part2_longQuestions: {
                                              ...subjectiveSection.part2_longQuestions,
                                              questions: updatedLQ,
                                            },
                                          },
                                        });
                                      }}
                                      rows={2}
                                      className="w-full font-urdu border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                    />
                                  ) : (
                                    <span>{p.statementUr || p.statementEn}</span>
                                  )}
                                </div>
                              )}

                              {languageMode === 'bilingual' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-start">
                                  <div className="font-medium text-slate-900 leading-relaxed pr-2 border-r sm:border-slate-100">
                                    {isEditing ? (
                                      <textarea
                                        value={p.statementEn}
                                        onChange={(e) => {
                                          const updatedLQ = subjectiveSection.part2_longQuestions.questions.map((q) => {
                                            if (q.id === lq.id) {
                                              return {
                                                ...q,
                                                parts: q.parts.map((part) =>
                                                  part.partLabel === p.partLabel ? { ...part, statementEn: e.target.value } : part
                                                ),
                                              };
                                            }
                                            return q;
                                          });
                                          onUpdatePaper({
                                            ...paper,
                                            subjectiveSection: {
                                              ...subjectiveSection,
                                              part2_longQuestions: {
                                                ...subjectiveSection.part2_longQuestions,
                                                questions: updatedLQ,
                                              },
                                            },
                                          });
                                        }}
                                        rows={2}
                                        className="w-full border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                      />
                                    ) : (
                                      <span>{p.statementEn}</span>
                                    )}
                                  </div>
                                  <div
                                    className="font-urdu text-[13.5px] text-slate-950 font-semibold text-right leading-[2.6] pl-2"
                                    dir="rtl"
                                  >
                                    {isEditing ? (
                                      <textarea
                                        dir="rtl"
                                        value={p.statementUr}
                                        onChange={(e) => {
                                          const updatedLQ = subjectiveSection.part2_longQuestions.questions.map((q) => {
                                            if (q.id === lq.id) {
                                              return {
                                                ...q,
                                                parts: q.parts.map((part) =>
                                                  part.partLabel === p.partLabel ? { ...part, statementUr: e.target.value } : part
                                                ),
                                              };
                                            }
                                            return q;
                                          });
                                          onUpdatePaper({
                                            ...paper,
                                            subjectiveSection: {
                                              ...subjectiveSection,
                                              part2_longQuestions: {
                                                ...subjectiveSection.part2_longQuestions,
                                                questions: updatedLQ,
                                              },
                                            },
                                          });
                                        }}
                                        rows={2}
                                        className="w-full font-urdu border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-blue-50/40"
                                      />
                                    ) : (
                                      <span>{p.statementUr || p.statementEn}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              <span className="text-[11px] font-bold text-slate-700 shrink-0">
                                ({p.marks})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="no-print pt-2">
                    <button
                      type="button"
                      onClick={handleAddLongQuestion}
                      className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-blue-500 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Long Question</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Subjective Paper Footer */}
              <div className="pt-8 border-t border-slate-300 text-xs text-slate-700 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-slate-500">
                    * Best of Luck · Punjab Textbook Board Pairing Scheme Compliant *
                  </div>
                  {header.teacherName && (
                    <div className="font-semibold text-slate-800">
                      Paper Setter: {header.teacherName}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-900 h-8 mb-1"></div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                    Examiner Signature / Stamp
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
