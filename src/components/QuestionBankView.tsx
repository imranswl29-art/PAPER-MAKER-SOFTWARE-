import React, { useState, useMemo } from 'react';
import {
  MASTER_PTBB_SUBJECTS,
  getQuestionsForSubjectAndChapters,
  saveUserCustomQuestion,
} from '../data/questionBankStore';
import { ClassLevel, MCQItem, ShortQuestionItem, LongQuestionItem } from '../types/paper';
import {
  BookOpen,
  Search,
  Sparkles,
  ChevronRight,
  Plus,
  FileCheck2,
  Filter,
  CheckCircle2,
  Layers,
  ChevronLeft,
  Loader2,
  Database,
  Award,
} from 'lucide-react';

interface QuestionBankViewProps {
  onStartTestWithChapter: (classLevel: ClassLevel, subjectId: string, chapterNo: number) => void;
  onOpenManualBuilder?: (classLevel: ClassLevel, subjectId: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  onStartTestWithChapter,
  onOpenManualBuilder,
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('9th');
  const subjects = useMemo(
    () => MASTER_PTBB_SUBJECTS.filter((s) => s.classLevel === selectedClass),
    [selectedClass]
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('9th-physics');
  const currentSubject = useMemo(
    () => MASTER_PTBB_SUBJECTS.find((s) => s.id === selectedSubjectId) || subjects[0],
    [selectedSubjectId, subjects]
  );

  const [selectedChapters, setSelectedChapters] = useState<number[]>([1]);

  const toggleChapterSelection = (chNum: number) => {
    setSelectedChapters((prev) => {
      if (prev.includes(chNum)) {
        const next = prev.filter((n) => n !== chNum);
        return next.length > 0 ? next : [chNum]; // keep at least one
      } else {
        return [...prev, chNum].sort((a, b) => a - b);
      }
    });
    setCurrentPage(1);
  };

  const selectAllUnits = () => {
    if (currentSubject) {
      setSelectedChapters(currentSubject.chapters.map((c) => c.number));
      setCurrentPage(1);
    }
  };

  const currentChapter = useMemo(
    () =>
      currentSubject?.chapters?.find((c) => selectedChapters.includes(c.number)) ||
      currentSubject?.chapters?.[0],
    [currentSubject, selectedChapters]
  );

  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all' | 'mcq' | 'short' | 'long'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // AI batch generation state
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // Fetch full questions pool from questionBankStore across ALL selected chapters
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const chapterQuestions = useMemo(() => {
    if (!currentSubject) {
      return { mcqs: [], shortQuestions: [], longQuestions: [] };
    }
    const chs = selectedChapters.length > 0 ? selectedChapters : [1];
    return getQuestionsForSubjectAndChapters(currentSubject.id, chs);
  }, [currentSubject, selectedChapters, refreshTrigger]);

  const mcqs = chapterQuestions.mcqs;
  const shorts = chapterQuestions.shortQuestions;
  const longs = chapterQuestions.longQuestions;

  // Category counts
  const availableCategories = ['all', 'Past Board Papers', 'SLO Conceptual', 'Textbook Exercises', 'Numerical Problems', 'Definitions & Laws'];

  // Filtered lists by search query & category
  const filteredMCQs = useMemo(() => {
    return mcqs.filter((m: any) => {
      const matchesSearch =
        !searchQuery.trim() ||
        m.statementEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.statementUr && m.statementUr.includes(searchQuery));
      const matchesCat =
        categoryFilter === 'all' ||
        (m.category && m.category.toLowerCase() === categoryFilter.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [mcqs, searchQuery, categoryFilter]);

  const filteredShorts = useMemo(() => {
    return shorts.filter((s: any) => {
      const matchesSearch =
        !searchQuery.trim() ||
        s.statementEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.statementUr && s.statementUr.includes(searchQuery));
      const matchesCat =
        categoryFilter === 'all' ||
        (s.category && s.category.toLowerCase() === categoryFilter.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [shorts, searchQuery, categoryFilter]);

  const filteredLongs = useMemo(() => {
    return longs.filter((l: any) => {
      const matchesSearch =
        !searchQuery.trim() ||
        l.statementEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.parts?.some((p: any) => p.statementEn.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat =
        categoryFilter === 'all' ||
        (l.category && l.category.toLowerCase() === categoryFilter.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [longs, searchQuery, categoryFilter]);

  // Active list for pagination based on questionTypeFilter
  const totalItemsInActiveView =
    questionTypeFilter === 'mcq'
      ? filteredMCQs.length
      : questionTypeFilter === 'short'
      ? filteredShorts.length
      : questionTypeFilter === 'long'
      ? filteredLongs.length
      : filteredMCQs.length + filteredShorts.length + filteredLongs.length;

  const totalPages = Math.max(1, Math.ceil(totalItemsInActiveView / itemsPerPage));

  // Reset pagination when filters change
  const handleFilterChange = (filter: 'all' | 'mcq' | 'short' | 'long') => {
    setQuestionTypeFilter(filter);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  // AI Batch Generation handler
  const handleBatchGenerateWithAI = async () => {
    if (!currentSubject || !currentChapter) return;
    setIsGeneratingBatch(true);
    setBatchSuccessMsg(null);

    try {
      const res = await fetch('/api/batch-generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classLevel: selectedClass,
          subjectName: currentSubject.nameEn,
          chapterNo: currentChapter.number,
          chapterTitle: currentChapter.titleEn,
          count: 15,
        }),
      });

      if (!res.ok) throw new Error('Batch generation failed');
      const data = await res.json();

      let addedCount = 0;
      if (Array.isArray(data.mcqs)) {
        data.mcqs.forEach((m: any) => {
          saveUserCustomQuestion({
            subjectId: currentSubject.id,
            chapterNo: currentChapter.number,
            type: 'mcq',
            statementEn: m.statementEn,
            statementUr: m.statementUr,
            marks: 1,
            options: m.options,
            correctOption: m.correctOption,
          });
          addedCount++;
        });
      }

      if (Array.isArray(data.shortQuestions)) {
        data.shortQuestions.forEach((s: any) => {
          saveUserCustomQuestion({
            subjectId: currentSubject.id,
            chapterNo: currentChapter.number,
            type: 'short',
            statementEn: s.statementEn,
            statementUr: s.statementUr,
            marks: s.marks || 2,
          });
          addedCount++;
        });
      }

      setRefreshTrigger((prev) => prev + 1);
      setBatchSuccessMsg(`Successfully generated and added ${addedCount} questions into Unit ${currentChapter.number}!`);
      setTimeout(() => setBatchSuccessMsg(null), 5000);
    } catch (err: any) {
      console.warn('Batch generation notice:', err.message);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  // Slice paginated items
  const paginatedMCQs = useMemo(() => {
    if (questionTypeFilter !== 'all' && questionTypeFilter !== 'mcq') return [];
    if (questionTypeFilter === 'mcq') {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredMCQs.slice(start, start + itemsPerPage);
    }
    return filteredMCQs.slice(0, 15);
  }, [filteredMCQs, questionTypeFilter, currentPage]);

  const paginatedShorts = useMemo(() => {
    if (questionTypeFilter !== 'all' && questionTypeFilter !== 'short') return [];
    if (questionTypeFilter === 'short') {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredShorts.slice(start, start + itemsPerPage);
    }
    return filteredShorts.slice(0, 15);
  }, [filteredShorts, questionTypeFilter, currentPage]);

  const paginatedLongs = useMemo(() => {
    if (questionTypeFilter !== 'all' && questionTypeFilter !== 'long') return [];
    if (questionTypeFilter === 'long') {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredLongs.slice(start, start + itemsPerPage);
    }
    return filteredLongs.slice(0, 8);
  }, [filteredLongs, questionTypeFilter, currentPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* Top Banner / Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl shadow-lg text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
              PTBB BOARD QUESTION BANK 2026
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[11px] font-bold border border-blue-500/30">
              Over 5,000+ Questions Per Subject
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-2 flex items-center gap-2 text-white">
            <Database className="w-6 h-6 text-blue-400" />
            <span>Punjab Textbook Board Question Repository</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Exhaustive database covering all 9 BISE Punjab boards (2020–2025), Textbook Exercises, Student Learning Outcomes (SLO), Numerical Problems, and Long Theory Derivations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchGenerateWithAI}
            disabled={isGeneratingBatch}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Generate and permanently save 15-25 fresh questions for this unit"
          >
            {isGeneratingBatch ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-950" />
            )}
            <span>{isGeneratingBatch ? 'Generating with AI...' : 'AI Auto-Generate More (+15)'}</span>
          </button>

          {onOpenManualBuilder && (
            <button
              type="button"
              onClick={() => onOpenManualBuilder(selectedClass, currentSubject.id)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-white" />
              <span>Select Questions & Build Paper</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onStartTestWithChapter(selectedClass, currentSubject.id, currentChapter.number)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Award className="w-4 h-4 text-emerald-200" />
            <span>Fast Paper (Unit {currentChapter?.number})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {batchSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{batchSuccessMsg}</span>
          </div>
          <button onClick={() => setBatchSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            ✕
          </button>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Class</label>
          <div className="grid grid-cols-2 gap-2">
            {(['9th', '10th'] as ClassLevel[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedClass(c);
                  const firstSub = MASTER_PTBB_SUBJECTS.find((s) => s.classLevel === c);
                  if (firstSub) {
                    setSelectedSubjectId(firstSub.id);
                    setSelectedChapters([firstSub.chapters[0]?.number || 1]);
                  }
                  setCurrentPage(1);
                }}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedClass === c
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c === '9th' ? '9th Class (Matric-I)' : '10th Class (Matric-II)'}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Subject ({subjects.length} Books Available)
          </label>
          <select
            value={currentSubject?.id}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedChapters([1]);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameEn} ({s.chapters.length} Units)
              </option>
            ))}
          </select>
        </div>

        {/* Selected Units Summary Box */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Selected Units ({selectedChapters.length} of {currentSubject?.chapters?.length || 0} Ticked)
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllUnits}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Select All Units
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentSubject) {
                  const half = Math.ceil(currentSubject.chapters.length / 2);
                  setSelectedChapters(currentSubject.chapters.slice(0, half).map((c) => c.number));
                  setCurrentPage(1);
                }
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
            >
              1st Half
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentSubject) {
                  const half = Math.ceil(currentSubject.chapters.length / 2);
                  setSelectedChapters(currentSubject.chapters.slice(half).map((c) => c.number));
                  setCurrentPage(1);
                }
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
            >
              2nd Half
            </button>
          </div>
        </div>
      </div>

      {/* Chapters Checkboxes Grid */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-700">
            Tick Chapters to View Questions:
          </span>
          <span className="text-slate-500 font-medium text-[11px]">
            Tick any combination of chapters to view all questions together
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50/50">
          {currentSubject?.chapters?.map((ch) => {
            const isTicked = selectedChapters.includes(ch.number);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleChapterSelection(ch.number)}
                className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                  isTicked
                    ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                  isTicked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {isTicked ? '✓' : ''}
                </div>
                <span className="truncate">
                  Unit {ch.number}: {ch.titleEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Repository Stats Summary */}
      <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex flex-wrap items-center justify-between text-xs text-blue-950 font-semibold gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span>
            <strong>Active Units ({selectedChapters.length}):</strong> Units {selectedChapters.join(', ')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>MCQs: <strong>{mcqs.length}</strong></span>
          <span>Short Questions: <strong>{shorts.length}</strong></span>
          <span>Long Questions: <strong>{longs.length}</strong></span>
          <span className="bg-blue-200 text-blue-900 px-2.5 py-0.5 rounded-full font-extrabold">
            Total Questions: {mcqs.length + shorts.length + longs.length}
          </span>
        </div>
      </div>

      {/* Filter Tabs, Categories and Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 text-xs">
          {/* Main Question Types */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                questionTypeFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types ({mcqs.length + shorts.length + longs.length})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('mcq')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                questionTypeFilter === 'mcq' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MCQs ({mcqs.length})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('short')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                questionTypeFilter === 'short' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Short Questions ({shorts.length})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('long')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                questionTypeFilter === 'long' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Long Questions ({longs.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in English or Urdu..."
              className="w-full pl-8 pr-3 py-1.5 border-2 border-slate-300 rounded-lg text-xs font-bold text-slate-950 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-700 font-extrabold uppercase mr-1">Categories:</span>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border-2 border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-6">
        {/* MCQs Section */}
        {(questionTypeFilter === 'all' || questionTypeFilter === 'mcq') && paginatedMCQs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Multiple Choice Questions (Showing {paginatedMCQs.length} of {filteredMCQs.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">1 Mark each</span>
            </div>

            <div className="space-y-3">
              {paginatedMCQs.map((m: any, idx) => (
                <div
                  key={m.id || idx}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-xs hover:border-blue-300 hover:bg-white transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-slate-900 leading-snug">
                      <span className="text-blue-600 font-extrabold mr-1">Q.{m.qNo || idx + 1}.</span> {m.statementEn}
                    </div>
                    {m.category && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                        {m.category}
                      </span>
                    )}
                  </div>

                  {m.statementUr && (
                    <div className="font-urdu text-[13px] text-slate-800 leading-relaxed text-right" dir="rtl">
                      {m.statementUr}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                    {m.options.map((opt: any) => (
                      <div
                        key={opt.key}
                        className={`p-2 rounded-lg border text-[11px] transition-colors ${
                          opt.key === m.correctOption
                            ? 'bg-emerald-100/80 border-emerald-300 font-bold text-emerald-950 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            <strong>({opt.key})</strong> {opt.textEn}
                          </span>
                          {opt.key === m.correctOption && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                          )}
                        </div>
                        {opt.textUr && opt.textUr !== opt.textEn && (
                          <div className="font-urdu text-[11px] text-slate-600 text-right mt-0.5" dir="rtl">
                            {opt.textUr}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Short Questions Section */}
        {(questionTypeFilter === 'all' || questionTypeFilter === 'short') && paginatedShorts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Short Questions (Showing {paginatedShorts.length} of {filteredShorts.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">2 Marks each</span>
            </div>

            <div className="space-y-3">
              {paginatedShorts.map((s: any, idx) => (
                <div
                  key={s.id || idx}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-xs hover:border-blue-300 hover:bg-white transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600 text-[11px]">
                      Question #{s.subNo || idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {s.category && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                          {s.category}
                        </span>
                      )}
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        {s.marks || 2} Marks
                      </span>
                    </div>
                  </div>

                  <div className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                    {s.statementEn}
                  </div>

                  {s.statementUr && (
                    <div className="font-urdu text-[13px] text-slate-800 text-right leading-relaxed mt-1" dir="rtl">
                      {s.statementUr}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Long Questions Section */}
        {(questionTypeFilter === 'all' || questionTypeFilter === 'long') && paginatedLongs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Long & Numerical Questions (Showing {paginatedLongs.length} of {filteredLongs.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">Theory (5M) + Numerical (4M)</span>
            </div>

            <div className="space-y-3">
              {paginatedLongs.map((l: any, idx) => (
                <div
                  key={l.id || idx}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-xs space-y-2.5 hover:border-purple-300 hover:bg-white transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="font-extrabold text-slate-900 text-xs">
                      Question #{l.qNo || idx + 5}
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                      {l.totalMarks || 9} Marks
                    </span>
                  </div>

                  {l.parts?.map((p: any) => (
                    <div key={p.partLabel} className="pl-3 border-l-2 border-slate-300 py-1 space-y-1">
                      <div className="font-bold text-slate-900 text-xs">
                        <span className="text-purple-700 font-extrabold mr-1">({p.partLabel})</span>
                        {p.statementEn}
                        <span className="text-[10px] text-slate-500 font-normal ml-1.5">[{p.marks} Marks]</span>
                      </div>
                      {p.statementUr && (
                        <div className="font-urdu text-[13px] text-slate-800 text-right leading-relaxed" dir="rtl">
                          {p.statementUr}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItemsInActiveView} Total Filtered Questions)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
