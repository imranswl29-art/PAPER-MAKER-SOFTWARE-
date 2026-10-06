import React from 'react';
import {
  Sparkles,
  Printer,
  FileCheck2,
  CircleDot,
  Sliders,
  PlusCircle,
  Download,
  BookOpen,
  Share2,
  CheckSquare,
  LogOut,
  Layers,
  User,
} from 'lucide-react';
import { ClassLevel } from '../types/paper';
import { UserAccount } from '../types/user';

interface HeaderNavbarProps {
  currentClass: ClassLevel;
  onSelectClass: (c: ClassLevel) => void;
  onOpenWizard: () => void;
  onOpenQuestionBank?: () => void;
  onOpenManualSelector?: () => void;
  onOpenCustomizer: () => void;
  onOpenAnswerKey: () => void;
  onOpenBubbleSheet: () => void;
  onPrint: (mode: 'all' | 'objective' | 'subjective') => void;
  uiLang: 'en' | 'ur';
  onToggleUiLang: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onOpenLogin?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentClass,
  onSelectClass,
  onOpenWizard,
  onOpenQuestionBank,
  onOpenManualSelector,
  onOpenCustomizer,
  onOpenAnswerKey,
  onOpenBubbleSheet,
  onPrint,
  uiLang,
  onToggleUiLang,
  currentUser,
  onLogout,
  onOpenLogin,
}) => {
  const [printDropdownOpen, setPrintDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30 text-white font-black text-lg">
              PT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  PTBB Paper Maker AI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  BISE Punjab
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                Matric (9th & 10th) Science Group Board Examination Portal
              </p>
            </div>
          </div>

          {/* Class Quick Selection Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {(['9th', '10th'] as ClassLevel[]).map((c) => (
              <button
                key={c}
                onClick={() => onSelectClass(c)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentClass === c
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {c === '9th' ? '9th Class (Matric-I)' : '10th Class (Matric-II)'}
              </button>
            ))}
          </div>

          {/* Right Action Buttons with Distinct Separation */}
          <div className="flex items-center gap-2">
            {/* 1. Dedicated AI Generator Button */}
            <button
              onClick={onOpenWizard}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-purple-950/40 transition-all cursor-pointer"
              title="Generate full exam paper using Gemini AI"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span className="hidden sm:inline">AI Generation</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* 2. Dedicated Question Bank Builder Button */}
            {onOpenQuestionBank && (
              <button
                onClick={onOpenQuestionBank}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                title="Create paper step-by-step from verified PTBB Question Bank"
              >
                <Layers className="w-4 h-4 text-emerald-200" />
                <span className="hidden sm:inline">Question Bank Paper</span>
                <span className="sm:hidden">Bank</span>
              </button>
            )}

            {/* 3. Manual Question Picker */}
            {onOpenManualSelector && (
              <button
                onClick={onOpenManualSelector}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-950/40 transition-all cursor-pointer"
                title="Handpick individual questions manually"
              >
                <CheckSquare className="w-4 h-4 text-blue-200" />
                <span className="hidden lg:inline">Manual Selection</span>
              </button>
            )}

            {/* Answer Key */}
            <button
              onClick={onOpenAnswerKey}
              title="View & Print Official Answer Key"
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">Key</span>
            </button>

            {/* Bubble Sheet */}
            <button
              onClick={onOpenBubbleSheet}
              title="Print BISE OMR Bubble Sheet"
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <CircleDot className="w-4 h-4 text-blue-400" />
              <span className="hidden xl:inline">OMR</span>
            </button>

            {/* Header Settings */}
            <button
              onClick={onOpenCustomizer}
              title="Customize School/College Header"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Print / PDF Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPrintDropdownOpen(!printDropdownOpen)}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>

              {printDropdownOpen && (
                <div
                  onMouseLeave={() => setPrintDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-1.5 text-xs z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <button
                    onClick={() => {
                      setPrintDropdownOpen(false);
                      onPrint('all');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 font-medium flex items-center justify-between"
                  >
                    <span>Print Complete Paper</span>
                    <span className="text-[10px] text-slate-400">All</span>
                  </button>
                  <button
                    onClick={() => {
                      setPrintDropdownOpen(false);
                      onPrint('objective');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 font-medium flex items-center justify-between"
                  >
                    <span>Objective Sheet Only</span>
                    <span className="text-[10px] text-slate-400">MCQs</span>
                  </button>
                  <button
                    onClick={() => {
                      setPrintDropdownOpen(false);
                      onPrint('subjective');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 font-medium flex items-center justify-between"
                  >
                    <span>Subjective Sheet Only</span>
                    <span className="text-[10px] text-slate-400">Subj</span>
                  </button>
                </div>
              )}
            </div>

            {/* Prominent User Profile & LOGOUT Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 pl-2.5 pr-1 py-1 rounded-xl border border-slate-700 shrink-0">
                <div className="text-left hidden 2xl:block pr-1">
                  <div className="text-xs font-extrabold text-white truncate max-w-[130px]">{currentUser.name}</div>
                  <div className="text-[10px] text-blue-300 font-medium truncate max-w-[130px]">{currentUser.schoolName}</div>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="btn-3d btn-3d-rose flex items-center gap-1 px-2.5 py-1.5 text-white rounded-lg text-xs font-black cursor-pointer shadow-sm"
                    title="Log out of current session securely"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            ) : (
              onOpenLogin && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="btn-3d btn-3d-blue px-3 py-1.5 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

