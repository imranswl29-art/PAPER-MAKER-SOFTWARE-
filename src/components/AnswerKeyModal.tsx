import React, { useState } from 'react';
import { CheckCircle2, Printer, X, Copy, Check, FileDown, Download, Loader2, BookOpen, MessageCircle } from 'lucide-react';
import { GeneratedExamPaper } from '../types/paper';
import { exportAnswerKeyToPdf } from '../utils/exportPdf';
import { exportAnswerKeyToWord } from '../utils/exportWord';

interface AnswerKeyModalProps {
  paper: GeneratedExamPaper;
  onClose: () => void;
}

export const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({ paper, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState('');

  const handlePrint = () => {
    const prevTitle = document.title;
    const cleanSubject = (paper.header.subjectName || 'Paper').replace(/\s+/g, '_');
    const cleanClass = paper.header.classLevel || '9th';
    document.title = `${cleanClass}_Class_${cleanSubject}_Official_Answer_Key`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setPdfStatus('Generating Answer Key PDF...');
    try {
      await exportAnswerKeyToPdf(paper, 'answer-key-print-content', (s) => setPdfStatus(s));
    } finally {
      setIsExportingPdf(false);
      setPdfStatus('');
    }
  };

  const handleDownloadWord = () => {
    exportAnswerKeyToWord(paper);
  };

  const copyToClipboard = () => {
    const text = paper.objectiveSection.questions
      .map((q) => {
        const correctOpt = q.options.find((o) => o.key === q.correctOption) || q.options[0];
        return `Q.${q.qNo}: (${q.correctOption}) - ${correctOpt?.textEn || ''} ${correctOpt?.textUr ? `[${correctOpt.textUr}]` : ''}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const mcqSummary = paper.objectiveSection.questions
      .map((q) => `Q.${q.qNo}: (${q.correctOption})`)
      .join(', ');
    const text = `*SOLVED ANSWER KEY*\n*${paper.header.instituteName}*\n${paper.header.classLevel} - ${paper.header.subjectName}\nExam: ${paper.header.examTitle}\nTotal Marks: ${paper.header.totalMarks}\n\n*MCQs Key:* ${mcqSummary}\n\nGenerated with PAPER MAKER SOFTWARE.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg">Solved Answer Key & Evaluation Rubrics</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  Official Key
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {paper.header.classLevel} Class &bull; {paper.header.subjectName} &bull; {paper.header.instituteName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3 py-1.5 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
              title="Copy MCQ Key List"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="btn-3d btn-3d-indigo flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              title="Download Answer Key as A4 PDF"
            >
              {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              <span>{isExportingPdf ? 'Saving PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="btn-3d btn-3d-blue flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold cursor-pointer"
              title="Download Answer Key as Microsoft Word (.doc)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>MS Word</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="btn-3d btn-3d-emerald flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold cursor-pointer"
              title="Share Answer Key directly on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold cursor-pointer"
              title="Print Answer Sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div id="answer-key-print-content" className="p-4 sm:p-7 overflow-y-auto space-y-6 text-slate-900 bg-white">
          {/* Institutional Header */}
          <div className="border-2 border-slate-900 p-4 rounded-xs text-center space-y-1 bg-slate-50/60">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 font-serif">
              {paper.header.instituteName}
            </h2>
            <div className="text-xs sm:text-sm font-black text-indigo-900 uppercase tracking-wide">
              Official Solved Answer Key & Solution Guidelines (حل شدہ جوابی پرچہ و مارکنگ گائیڈ)
            </div>
            <div className="text-xs text-slate-700 font-semibold pt-1">
              Class: <strong>{paper.header.classLevel}</strong> &nbsp;|&nbsp; Subject: <strong>{paper.header.subjectName}</strong> &nbsp;|&nbsp; Examination: <strong>{paper.header.examTitle}</strong> &nbsp;|&nbsp; Total Marks: <strong>{paper.header.totalMarks}</strong>
            </div>
          </div>

          {/* MCQs Section: Solved Matrix Grid */}
          <div className="space-y-3">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xs flex items-center justify-between text-xs font-black uppercase tracking-wider">
              <span>SECTION - A: SOLVED MULTIPLE CHOICE QUESTIONS (MCQs)</span>
              <span>{paper.objectiveSection.totalMarks} Marks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {paper.objectiveSection.questions.map((q) => {
                const correctOpt = q.options.find((o) => o.key === q.correctOption) || q.options[0];
                return (
                  <div
                    key={q.id}
                    className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 flex items-start gap-2 shadow-2xs hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {q.correctOption}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-black text-[11px] text-slate-900">
                        Q.{q.qNo} Correct Option ({q.correctOption})
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                        {correctOpt?.textEn}
                      </div>
                      {correctOpt?.textUr && correctOpt.textUr !== correctOpt.textEn && (
                        <div className="font-urdu text-[11px] text-slate-700 text-right truncate" dir="rtl">
                          {correctOpt.textUr}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solved Question Statements & Explanations */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Detailed MCQ Solutions & Board Syllabus References</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {paper.objectiveSection.questions.map((q) => {
                const correctOpt = q.options.find((o) => o.key === q.correctOption) || q.options[0];
                return (
                  <div key={q.id} className="border border-slate-200 rounded-lg p-3 bg-white text-xs space-y-1 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        Q.{q.qNo}. {q.statementEn}
                      </span>
                      <span className="font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono shrink-0">
                        ({q.correctOption})
                      </span>
                    </div>
                    {q.statementUr && (
                      <div className="font-urdu text-[12.5px] text-slate-700 text-right leading-relaxed" dir="rtl">
                        {q.statementUr}
                      </div>
                    )}
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5 text-emerald-950 font-semibold text-[11px]">
                      &bull; Correct Answer: <strong>{correctOpt?.textEn}</strong> {correctOpt?.textUr ? `(${correctOpt.textUr})` : ''}
                    </div>
                    {q.explanationEn && (
                      <div className="text-slate-600 italic text-[11px]">
                        Reason: {q.explanationEn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION - B: SUBJECTIVE GUIDELINES */}
          <div className="space-y-4 pt-2">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xs flex items-center justify-between text-xs font-black uppercase tracking-wider">
              <span>SECTION - B: SUBJECTIVE MARKING RUBRICS & MODEL GUIDELINES</span>
              <span>{paper.subjectiveSection.totalMarks} Marks</span>
            </div>

            {/* Short Questions Groups */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-900">
                Part - I: Short Questions Solution Rubrics (2 Marks Each)
              </h4>

              {paper.subjectiveSection.part1_shortQuestions.map((grp) => (
                <div key={grp.id} className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-100 p-2 font-bold text-slate-900 flex justify-between items-center border-b border-slate-200">
                    <span>Q.{grp.qNo}: {grp.instructionEn}</span>
                    <span className="text-slate-600 text-[11px]">Any {grp.attemptCount} × {grp.marksEach} = {grp.attemptCount * grp.marksEach} Marks</span>
                  </div>
                  <div className="p-3 space-y-2 bg-white">
                    {grp.questions.map((q, idx) => (
                      <div key={q.id} className="border-b border-slate-100 pb-2 last:border-b-0 space-y-1">
                        <div className="font-bold text-slate-900">
                          ({idx + 1}) {q.statementEn}
                        </div>
                        {q.statementUr && (
                          <div className="font-urdu text-[12px] text-slate-700 text-right" dir="rtl">
                            {q.statementUr}
                          </div>
                        )}
                        <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[11px] text-slate-700 flex flex-wrap justify-between gap-1">
                          <span>
                            <strong>Marking Criteria: </strong>
                            1 Mark for precise definition / core scientific principle + 1 Mark for formula, standard SI unit, or valid textbook example.
                          </span>
                          <span className="font-mono font-bold text-indigo-700">Max: {q.marks} Marks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Long Questions Guidelines */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-900">
                Part - II: Long Questions Evaluation Criteria
              </h4>

              <div className="space-y-3">
                {paper.subjectiveSection.part2_longQuestions.questions.map((lq) => (
                  <div key={lq.id} className="border border-slate-300 rounded-lg p-3 bg-white text-xs space-y-2">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex justify-between items-center">
                      <span>Question {lq.qNo}</span>
                      <span className="text-indigo-800 font-bold font-mono">Total: {lq.totalMarks} Marks</span>
                    </div>

                    <div className="space-y-2">
                      {lq.parts.map((p) => (
                        <div key={p.partLabel} className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1">
                          <div className="font-bold text-slate-900">
                            Part ({p.partLabel}): {p.statementEn}
                          </div>
                          {p.statementUr && (
                            <div className="font-urdu text-[12px] text-slate-700 text-right" dir="rtl">
                              {p.statementUr}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-600 italic">
                            &bull; <strong>Evaluation Rubric ({p.marks} Marks): </strong>
                            Theory / conceptual statement (2 Marks) + complete step-by-step derivation / calculation (2 Marks) + final result with proper SI units & diagram (1 Mark).
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
