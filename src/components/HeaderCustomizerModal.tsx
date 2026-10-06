import React from 'react';
import { Sliders, X, Check } from 'lucide-react';
import { PaperHeaderInfo } from '../types/paper';

interface HeaderCustomizerModalProps {
  header: PaperHeaderInfo;
  onSave: (updated: PaperHeaderInfo) => void;
  onClose: () => void;
}

export const HeaderCustomizerModal: React.FC<HeaderCustomizerModalProps> = ({
  header,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = React.useState<PaperHeaderInfo>({ ...header });

  const presets = [
    { name: 'PUNJAB GROUP OF COLLEGES', campus: 'City Campus, Lahore' },
    { name: 'SUPERIOR GROUP OF COLLEGES', campus: 'Main Campus, Sahiwal' },
    { name: 'KIPS ACADEMY', campus: 'Evening Coaching Center' },
    { name: 'UNIQUE SCIENCE ACADEMY', campus: 'Gulberg Campus' },
    { name: 'GOVERNMENT GRADUATE COLLEGE', campus: 'Civil Lines' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Customize Board Paper Header</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
              Quick Institute Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData({ ...formData, instituteName: p.name, campusName: p.campus })}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800 text-[11px] transition-colors"
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Institution / School / Academy Name</label>
            <input
              type="text"
              value={formData.instituteName}
              onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-900"
              placeholder="e.g. PUNJAB GROUP OF SCIENCE ACADEMIES"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Campus / Address</label>
              <input
                type="text"
                value={formData.campusName}
                onChange={(e) => setFormData({ ...formData, campusName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Sahiwal Campus"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Exam Title / Test Name</label>
              <input
                type="text"
                value={formData.examTitle}
                onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Chapter Test (Unit 1 & 2)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Date</label>
              <input
                type="text"
                value={formData.dateStr}
                onChange={(e) => setFormData({ ...formData, dateStr: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Time Allowed</label>
              <input
                type="text"
                value={formData.timeAllowed}
                onChange={(e) => setFormData({ ...formData, timeAllowed: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. 2:30 Hours"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Total Marks</label>
              <input
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Teacher / Paper Setter Name</label>
            <input
              type="text"
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Prof. Muhammad Imran (Subject Specialist)"
            />
          </div>

          {/* Watermark options */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Watermark on Paper</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showWatermark}
                  onChange={(e) => setFormData({ ...formData, showWatermark: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {formData.showWatermark && (
              <input
                type="text"
                value={formData.watermarkText}
                onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Watermark text (e.g. BISE PUNJAB or School Name)"
              />
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
