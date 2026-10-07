import React, { useState, useRef } from 'react';
import { UserAccount, SchoolBranch } from '../types/user';
import { PaperHeaderInfo } from '../types/paper';
import { PUNJAB_BOARDS } from '../data/ptbbData';
import { Building2, Upload, Check, X, Shield, Sparkles, Image as ImageIcon, Plus, Trash2, MapPin, Phone } from 'lucide-react';

interface SchoolProfileModalProps {
  currentUser: UserAccount | null;
  header: PaperHeaderInfo;
  onSaveHeader: (updated: PaperHeaderInfo) => void;
  onUpdateCurrentUser: (updated: UserAccount) => void;
  onClose: () => void;
}

export const SchoolProfileModal: React.FC<SchoolProfileModalProps> = ({
  currentUser,
  header,
  onSaveHeader,
  onUpdateCurrentUser,
  onClose,
}) => {
  const [instituteName, setInstituteName] = useState(header.instituteName);
  const [campusName, setCampusName] = useState(header.campusName);
  const [boardPattern, setBoardPattern] = useState(header.boardPattern);
  const [teacherName, setTeacherName] = useState(header.teacherName);
  const [phone, setPhone] = useState(currentUser?.phone || header.phone || '');
  const [showWatermark, setShowWatermark] = useState(header.showWatermark);
  const [watermarkText, setWatermarkText] = useState(header.watermarkText);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(header.customLogoUrl || currentUser?.logoUrl);

  // Multi-branch state
  const defaultBranches: SchoolBranch[] = currentUser?.branches && currentUser.branches.length > 0
    ? currentUser.branches
    : [
        { id: 'b-1', name: campusName || 'Main Campus', phone: phone || '', city: currentUser?.city || 'Punjab' }
      ];
  const [branches, setBranches] = useState<SchoolBranch[]>(defaultBranches);
  const [activeBranchId, setActiveBranchId] = useState<string>(currentUser?.activeBranchId || defaultBranches[0]?.id || 'b-1');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectBranch = (branchId: string) => {
    setActiveBranchId(branchId);
    const selected = branches.find((b) => b.id === branchId);
    if (selected) {
      setCampusName(selected.name);
      if (selected.phone) {
        setPhone(selected.phone);
      }
    }
  };

  const handleAddBranch = () => {
    if (!newBranchName.trim()) return;
    const newB: SchoolBranch = {
      id: `branch-${Date.now()}`,
      name: newBranchName.trim(),
      phone: newBranchPhone.trim() || phone,
    };
    const updated = [...branches, newB];
    setBranches(updated);
    setActiveBranchId(newB.id);
    setCampusName(newB.name);
    if (newB.phone) setPhone(newB.phone);
    setNewBranchName('');
    setNewBranchPhone('');
  };

  const handleDeleteBranch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (branches.length <= 1) return;
    const updated = branches.filter((b) => b.id !== id);
    setBranches(updated);
    if (activeBranchId === id) {
      setActiveBranchId(updated[0].id);
      setCampusName(updated[0].name);
      if (updated[0].phone) setPhone(updated[0].phone);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedHeader: PaperHeaderInfo = {
      ...header,
      instituteName,
      campusName,
      boardPattern,
      teacherName,
      phone,
      showWatermark,
      watermarkText: watermarkText || instituteName,
      customLogoUrl: logoPreview,
    };

    onSaveHeader(updatedHeader);

    if (currentUser) {
      const updatedUser: UserAccount = {
        ...currentUser,
        name: teacherName || currentUser.name,
        schoolName: instituteName,
        campusName,
        phone,
        branches,
        activeBranchId,
        logoUrl: logoPreview,
      };
      onUpdateCurrentUser(updatedUser);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">School Profile & Monogram</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Logo / Monogram Upload */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
              {logoPreview ? (
                <img src={logoPreview} alt="School Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <span className="font-bold text-slate-800 block">School Monogram / Logo</span>
              <p className="text-[11px] text-slate-500">
                Upload your school emblem or crest to appear on printed papers
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-indigo-600" />
                  <span>Upload Logo</span>
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => setLogoPreview(undefined)}
                    className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              School / College Name *
            </label>
            <input
              type="text"
              required
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. PUNJAB GROUP OF SCIENCE ACADEMIES"
            />
          </div>

          {/* Multi-Branch Management Section */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Multi-Branch School Management</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Select active branch for papers</span>
            </div>

            {/* Existing branches selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {branches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBranch(b.id)}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    activeBranchId === b.id
                      ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs truncate">{b.name}</div>
                    {b.phone && <div className="text-[10px] text-slate-500 font-mono">{b.phone}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeBranchId === b.id && (
                      <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                        Active
                      </span>
                    )}
                    {branches.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteBranch(b.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Delete this branch"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add new branch row */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="New branch name (e.g. Okara Campus)..."
                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
              <input
                type="text"
                value={newBranchPhone}
                onChange={(e) => setNewBranchPhone(e.target.value)}
                placeholder="Branch phone..."
                className="w-32 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddBranch}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Branch</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Campus / Branch Name</label>
              <input
                type="text"
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. City Campus, Sahiwal"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Education Board Pattern</label>
              <select
                value={boardPattern}
                onChange={(e) => setBoardPattern(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {PUNJAB_BOARDS.map((b) => (
                  <option key={b.id} value={`${b.nameEn} Pattern`}>
                    {b.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Paper Setter / Principal Name</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Prof. Muhammad Imran"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">School / Principal Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="e.g. 03007603964, 03147603964"
              />
            </div>
          </div>

          {/* Watermark */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800">Background Watermark on Printed Paper</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            {showWatermark && (
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Watermark text (e.g. BISE PUNJAB or School Name)"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile & Apply to Papers</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
