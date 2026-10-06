import React from 'react';
import {
  FilePlus2,
  BookOpen,
  Printer,
  FileCheck2,
  CircleDot,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Download,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Phone,
  Code2,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import { UserAccount } from '../types/user';
import { GeneratedExamPaper, ClassLevel } from '../types/paper';
import { exportPaperToWord } from '../utils/exportWord';

interface DashboardViewProps {
  currentUser: UserAccount | null;
  savedPapers: GeneratedExamPaper[];
  onOpenCreatePaper: (initialClass?: ClassLevel) => void;
  onOpenAiGenerator?: (initialClass?: ClassLevel) => void;
  onOpenManualSelector?: (initialClass?: ClassLevel) => void;
  onOpenQuestionBank: () => void;
  onViewPaper: (paper: GeneratedExamPaper) => void;
  onOpenSchoolProfile: () => void;
  onOpenBubbleSheet: (paper: GeneratedExamPaper) => void;
  onOpenAnswerKey: (paper: GeneratedExamPaper) => void;
  onDeletePaper?: (paperId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  savedPapers,
  onOpenCreatePaper,
  onOpenAiGenerator,
  onOpenManualSelector,
  onOpenQuestionBank,
  onViewPaper,
  onOpenSchoolProfile,
  onOpenBubbleSheet,
  onOpenAnswerKey,
  onDeletePaper,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* Welcome Banner with 3D Depth and explicit background fallback */}
      <div
        className="rounded-2xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-700/80"
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #0f172a 60%, #1e1b4b 100%)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>PAPER MAKER SOFTWARE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {currentUser?.schoolName || 'Punjab Board Examination System'}
          </h1>

          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Generate authentic board pattern question papers for 9th and 10th Matric Science Group & Compulsory Subjects (English & Urdu) in English, Urdu Nastaliq, or Bilingual format. Complete with official pairing schemes, OMR bubble sheets, answer keys, and MS Word export.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onOpenAiGenerator && (
              <button
                type="button"
                onClick={() => onOpenAiGenerator()}
                className="btn-3d flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer shadow-lg"
                style={{ backgroundColor: '#7c3aed', border: '1px solid #6d28d9' }}
                title="Generate paper using Google Gemini AI"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>🤖 AI Smart Generation</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenCreatePaper()}
              className="btn-3d flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer shadow-md"
              style={{ backgroundColor: '#059669', border: '1px solid #047857' }}
              title="Create paper step-by-step from verified PTBB Question Bank"
            >
              <FilePlus2 className="w-4 h-4 text-emerald-100" />
              <span>📚 Question Bank Builder</span>
            </button>

            {onOpenManualSelector && (
              <button
                type="button"
                onClick={() => onOpenManualSelector()}
                className="btn-3d flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
                style={{ backgroundColor: '#2563eb', border: '1px solid #1d4ed8' }}
                title="Handpick individual questions manually"
              >
                <CheckSquare className="w-4 h-4 text-blue-100" />
                <span>✍️ Manual Selection</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="btn-3d flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
              style={{ backgroundColor: '#4338ca', border: '1px solid #3730a3' }}
            >
              <BookOpen className="w-4 h-4 text-indigo-100" />
              <span>Browse Question Bank</span>
            </button>

            <button
              type="button"
              onClick={onOpenSchoolProfile}
              className="btn-3d flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
              style={{ backgroundColor: '#d97706', border: '1px solid #b45309' }}
            >
              <Building2 className="w-4 h-4 text-amber-100" />
              <span>School Monogram & Profile</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative emblem */}
        <div className="absolute right-6 -bottom-8 opacity-10 pointer-events-none select-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-3d p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Total Papers Created
          </span>
          <div className="text-2xl font-black text-slate-900">{savedPapers.length}</div>
          <span className="text-[10px] text-blue-600 font-semibold">Ready to print & export</span>
        </div>

        <div className="card-3d p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Target Board Pattern
          </span>
          <div className="text-base font-bold text-slate-900 truncate">
            {currentUser?.targetBoard ? currentUser.targetBoard.toUpperCase() + ' Board' : 'BISE Punjab'}
          </div>
          <span className="text-[10px] text-slate-500">PTBB Pairing Scheme</span>
        </div>

        <div className="card-3d p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Active Classes
          </span>
          <div className="text-base font-bold text-slate-900">9th & 10th Class</div>
          <span className="text-[10px] text-blue-600 font-semibold">Matric Science Group</span>
        </div>

        <div className="card-3d p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            System License
          </span>
          <div className="text-base font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Active</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Valid till {currentUser?.expiryDate || '2027-12-31'}
          </span>
        </div>
      </div>

      {/* Quick Launch Cards by Class */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Fast Paper Generator by Class
          </h2>
          <span className="text-xs text-slate-500">Select class to start builder</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
          {[
            {
              level: '9th' as ClassLevel,
              name: '9th Class (Matric Part-I)',
              subTitle: 'Secondary School Certificate - Science Group',
              subjects: 'Physics, Chemistry, Biology, Math, Computer, English, Urdu, Islamiat, Tarjuma-tul-Quran, Pak Studies',
              color: 'from-blue-700 to-indigo-800',
              btnClass: 'btn-3d-blue',
            },
            {
              level: '10th' as ClassLevel,
              name: '10th Class (Matric Part-II)',
              subTitle: 'Secondary School Certificate - Science Group',
              subjects: 'Physics, Chemistry, Biology, Math, Computer, English, Urdu, Islamiat, Tarjuma-tul-Quran, Pak Studies',
              color: 'from-indigo-700 to-slate-800',
              btnClass: 'btn-3d-indigo',
            },
          ].map((c) => (
            <div
              key={c.level}
              className="card-3d overflow-hidden flex flex-col justify-between"
            >
              <div className={`p-4 bg-gradient-to-r ${c.color} text-white`}>
                <div className="text-xs font-mono font-bold uppercase opacity-80">{c.level} PTBB</div>
                <h3 className="font-extrabold text-base mt-0.5">{c.name}</h3>
                <div className="text-xs opacity-80 mt-1">{c.subTitle}</div>
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  <strong>Available Subjects: </strong>{c.subjects}
                </p>
                <button
                  onClick={() => onOpenCreatePaper(c.level)}
                  className={`btn-3d ${c.btnClass} w-full py-2.5 text-white font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer`}
                >
                  <span>Build {c.level} Paper</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Generated Papers Section */}
      <div className="card-3d p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Generated Question Papers</h3>
            <p className="text-xs text-slate-500">1-click Print, MS Word download, Answer Key & Bubble Sheet</p>
          </div>
          <button
            onClick={() => onOpenCreatePaper()}
            className="btn-3d btn-3d-blue text-xs font-black text-white px-3 py-1.5 rounded-lg cursor-pointer"
          >
            + Create Another Paper
          </button>
        </div>

        {savedPapers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {savedPapers.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{p.header.subjectName}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                      {p.header.classLevel}
                    </span>
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="text-slate-600 font-normal">{p.header.examTitle}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.header.dateStr} · Total Marks: <strong>{p.header.totalMarks}</strong> · Syllabus: {p.header.syllabusCovered || 'All chapters'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => onViewPaper(p)}
                    className="btn-3d btn-3d-blue px-3 py-1.5 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    View Paper
                  </button>
                  <button
                    onClick={() => exportPaperToWord(p)}
                    className="btn-3d btn-3d-indigo flex items-center gap-1 px-3 py-1.5 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>MS Word</span>
                  </button>
                  <button
                    onClick={() => onOpenAnswerKey(p)}
                    className="btn-3d btn-3d-emerald px-3 py-1.5 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Answer Key
                  </button>
                  <button
                    onClick={() => onOpenBubbleSheet(p)}
                    className="btn-3d btn-3d-amber px-3 py-1.5 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Bubble Sheet
                  </button>
                  {onDeletePaper && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${p.header.subjectName}" paper?`)) {
                          onDeletePaper(p.id);
                        }
                      }}
                      className="btn-3d btn-3d-rose flex items-center gap-1 px-2.5 py-1.5 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                      title="Delete this paper from saved list"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No papers generated yet. Click &quot;Create New Exam Paper&quot; above to start.
          </div>
        )}
      </div>

      {/* Developer Banner in Desktop / Website View (no-print: NEVER shows on printed paper) */}
      <footer className="no-print pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-600" />
          <span>Developed by: <strong className="text-slate-800">MUHAMMAD IMRAN KHAN</strong> (MSc Computer Science)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-blue-600" />
            03007603964
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-blue-600" />
            03147603964
          </span>
        </div>
      </footer>
    </div>
  );
};
