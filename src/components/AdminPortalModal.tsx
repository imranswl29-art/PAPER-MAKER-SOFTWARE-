import React, { useState } from 'react';
import {
  UserAccount,
  UserRole,
} from '../types/user';
import { PUNJAB_BOARDS } from '../data/ptbbData';
import { ClassLevel } from '../types/paper';
import { getPrincipalPortalLink } from '../utils/publicUrl';
import { deleteAccountFromFirestore } from '../firebase';
import {
  ShieldAlert,
  Users,
  Plus,
  Trash2,
  Edit,
  Key,
  Copy,
  Check,
  Building2,
  Calendar,
  Phone,
  Lock,
  Unlock,
  BookOpen,
  Share2,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AdminPortalModalProps {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  onUpdateAccounts: (updated: UserAccount[]) => void;
  onLoginAsUser: (account: UserAccount) => void;
  onClose: () => void;
  onOpenShareModal?: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  currentUser,
  accounts,
  onUpdateAccounts,
  onLoginAsUser,
  onClose,
  onOpenShareModal,
}) => {
  const [activeTab, setActiveTab] = useState<'principals' | 'create' | 'guide' | 'security'>('principals');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form for creating new school
  const [schoolName, setSchoolName] = useState('');
  const [campusName, setCampusName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [city, setCity] = useState('Lahore');
  const [phone, setPhone] = useState('');
  const [targetBoard, setTargetBoard] = useState('lahore');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [paperLimit, setPaperLimit] = useState(500);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [allowedClasses, setAllowedClasses] = useState<ClassLevel[]>(['9th', '10th']);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Admin Security Settings
  const adminAccount = accounts.find((a) => a.role === 'admin') || accounts[0];
  const [adminUsername, setAdminUsername] = useState(adminAccount.username);
  const [adminPassword, setAdminPassword] = useState(adminAccount.password);
  const [adminName, setAdminName] = useState(adminAccount.name);
  const [adminPhone, setAdminPhone] = useState(adminAccount.phone || '03007603964');
  const [showAdminPass, setShowAdminPass] = useState(true);

  const handleGenerateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !schoolName) {
      alert('Please fill School Name, Username and Password');
      return;
    }

    // Check duplicate
    if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
      alert('Username already exists! Please pick a unique username.');
      return;
    }

    const newAccount: UserAccount = {
      id: `school-${Date.now()}`,
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role: 'principal',
      name: principalName || 'School Principal',
      schoolName: schoolName.trim(),
      campusName: campusName.trim(),
      city: city.trim(),
      phone: phone.trim(),
      targetBoard,
      allowedClasses,
      status: 'active',
      expiryDate,
      paperLimit: Number(paperLimit) || 500,
      papersCreated: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newAccount, ...accounts];
    onUpdateAccounts(updated);
    setSuccessToast(`Account created for "${newAccount.schoolName}"! Credentials ready to copy.`);
    setActiveTab('principals');

    // Reset fields
    setSchoolName('');
    setCampusName('');
    setPrincipalName('');
    setUsername('');
    setPassword('');
  };

  const handleDeleteAccount = (id: string) => {
    if (id === 'user-admin-01') {
      alert('Cannot delete the Super Admin account.');
      return;
    }
    if (confirm('Are you sure you want to delete this school account?')) {
      const updated = accounts.filter((a) => a.id !== id);
      deleteAccountFromFirestore(id).catch((err) =>
        console.warn('Failed to delete account from Firestore:', err)
      );
      onUpdateAccounts(updated);
    }
  };

  const handleToggleStatus = (id: string) => {
    if (id === 'user-admin-01') return;
    const updated = accounts.map((a) =>
      a.id === id ? { ...a, status: a.status === 'active' ? ('suspended' as const) : ('active' as const) } : a
    );
    onUpdateAccounts(updated);
  };

  const handleCopyCredentials = (acc: UserAccount) => {
    const dedicatedLink = getPrincipalPortalLink(acc.username);
    const text = `*PUNJAB EXAMINATION BOARD - OFFICIAL PORTAL ACCESS NOTICE*

To: Respected Principal / Head of Institution
*${acc.name}*
*${acc.schoolName}*
Campus / Location: ${acc.campusName || acc.city}, ${acc.city}

Greetings,

We are pleased to inform you that your school has been officially registered on the *PUNJAB EXAMINATION BOARD (PTBB & BISE) PAPER MAKER SOFTWARE*. Your dedicated institution portal is activated for Matric 9th and 10th Classes (Science Group & Compulsory Subjects).

==================================================
🌐 *OFFICIAL DIRECT PORTAL ACCESS LINK:*
${dedicatedLink}

🔐 *YOUR CONFIDENTIAL LOGIN CREDENTIALS:*
• Institution Portal ID (Username): *${acc.username}*
• Confidential Password: *${acc.password}*
• Target BISE Examination Board: *${acc.targetBoard.toUpperCase()} BOARD*
• Allocated Paper Generation Quota: *${acc.paperLimit} Question Papers*
• Authorized Class Levels: *Matric 9th Class & 10th Class*
• Portal Status: *ACTIVE* (Valid until ${acc.expiryDate || '2027-12-31'})
==================================================

📋 *STEP-BY-STEP INSTRUCTIONS TO START CREATING PAPERS:*
1. Click on your dedicated portal link above or open it in your desktop/laptop browser:
   ${dedicatedLink}
2. Enter your Institution ID (*${acc.username}*) and Password (*${acc.password}*).
3. Click "New Paper" or "Manual Selection" to handpick questions from the verified question bank.
4. Choose your preferred medium: English Medium, Urdu Medium, or Bilingual (side-by-side).
5. Choose whether to attach the official OMR Bubble Sheet or print without it with dedicated 1-click buttons.
6. Instantly download the complete paper in High-Resolution A4 PDF or editable Microsoft Word (.doc) format.
7. Print with automatic institutional header containing your school name, campus address, and official monogram.

🎯 *VERIFIED BOARD FEATURES INCLUDED:*
• Full alignment with PTBB Curriculum & Official Board Pairing Schemes.
• Physics, Chemistry, Biology, Mathematics, Computer Science, English, Urdu, Islamiat, Tarjuma-tul-Quran, and Pakistan Studies.
• Authentic multi-option Answer Keys (A, B, C, D) with grading schemes.
• Complete question bank containing thousands of past board questions from all Punjab BISE boards (2020-2025).

🔒 *CONFIDENTIALITY & SECURITY NOTICE:*
Please keep your institutional login credentials confidential. Do not forward these credentials to unauthorized persons.

📞 *CENTRAL ADMINISTRATIVE & TECHNICAL HELPLINE:*
Software Engineering & Operations: MUHAMMAD IMRAN KHAN (MSc Computer Science)
• Phone / WhatsApp: +92 300 7603964
• Alternate Helpline: +92 314 7603964
• Central Support Office: Lahore & Sahiwal, Punjab, Pakistan`;

    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setSuccessToast(`Detailed WhatsApp notice copied for "${acc.schoolName}" with link: ${dedicatedLink}`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCopyDedicatedLinkOnly = (acc: UserAccount) => {
    const dedicatedLink = getPrincipalPortalLink(acc.username);
    navigator.clipboard.writeText(dedicatedLink);
    setCopiedId(`link-${acc.id}`);
    setSuccessToast(`Dedicated Portal Link copied: ${dedicatedLink}`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg">
                  Super Admin Management Portal
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  Master Control
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                  ☁️ Firestore Cloud Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Issue and manage school credentials, accounts, and board permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between text-xs">
          <div className="flex gap-1 py-2">
            <button
              onClick={() => setActiveTab('principals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'principals'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Registered Schools ({accounts.filter((a) => a.role === 'principal').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Create New School ID</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'guide'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Setup & Instructions</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'security'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-4 h-4 text-amber-600" />
              <span>Admin Password & Security</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            Logged in as: <strong>{currentUser?.name || 'Super Admin'}</strong>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 font-medium flex items-center justify-between">
            <span>✓ {successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-700 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800 flex-1">
          {/* TAB 1: LIST PRINCIPALS */}
          {activeTab === 'principals' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Active School Principals & Academy Accounts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage registered school credentials, active subscriptions, and board configurations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenShareModal && (
                    <button
                      type="button"
                      onClick={onOpenShareModal}
                      className="btn-3d btn-3d-emerald flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Generate Full WhatsApp Invitation Notices for Registered Schools"
                    >
                      <Share2 className="w-4 h-4 text-emerald-100" />
                      <span>WhatsApp Notice Generator</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('create')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New School</span>
                  </button>
                </div>
              </div>

              {/* Table of accounts */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">School / Academy</th>
                        <th className="py-2.5 px-3 font-bold">Principal / City</th>
                        <th className="py-2.5 px-3 font-bold">Login ID</th>
                        <th className="py-2.5 px-3 font-bold">Password</th>
                        <th className="py-2.5 px-3 font-bold">Board</th>
                        <th className="py-2.5 px-3 font-bold">Papers</th>
                        <th className="py-2.5 px-3 font-bold">Status</th>
                        <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accounts.map((acc) => {
                        const isMainAdmin = acc.role === 'admin';
                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{acc.schoolName}</div>
                              <div className="text-[11px] text-slate-500">{acc.campusName}</div>
                              {!isMainAdmin && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                    ?principal={acc.username}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDedicatedLinkOnly(acc)}
                                    title="Copy Dedicated URL for this Principal"
                                    className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded"
                                  >
                                    {copiedId === `link-${acc.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-blue-600" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-800">{acc.name}</div>
                              <div className="text-[11px] text-slate-500">{acc.city || 'Punjab'}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                              {acc.username}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 bg-slate-50/80 rounded">
                              {acc.password}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[11px] font-bold text-slate-600">
                              {acc.targetBoard}
                            </td>
                            <td className="py-2.5 px-3 text-[11px]">
                              <span className="font-bold text-slate-800">{acc.papersCreated}</span> / {acc.paperLimit}
                            </td>
                            <td className="py-2.5 px-3">
                              {acc.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                  <Lock className="w-2.5 h-2.5 text-rose-600" />
                                  Frozen
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isMainAdmin && (
                                  <>
                                    <button
                                      title="Copy Direct Login Link for this School"
                                      onClick={() => handleCopyDedicatedLinkOnly(acc)}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedId === `link-${acc.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                                      )}
                                      <span className="text-[10px] font-bold hidden sm:inline">Copy Login Link</span>
                                    </button>

                                    <button
                                      title="Copy WhatsApp Invitation with Dedicated Link"
                                      onClick={() => handleCopyCredentials(acc)}
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedId === acc.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-indigo-600" />
                                      )}
                                      <span className="text-[10px] hidden sm:inline">WhatsApp Info</span>
                                    </button>

                                    <button
                                      title={acc.status === 'active' ? 'Freeze / Suspend this School Account' : 'Unfreeze / Reactivate School Account'}
                                      onClick={() => handleToggleStatus(acc.id)}
                                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 border transition-colors cursor-pointer ${
                                        acc.status === 'active'
                                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                      }`}
                                    >
                                      {acc.status === 'active' ? (
                                        <>
                                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Freeze</span>
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Unfreeze</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      title="Switch Login to this School"
                                      onClick={() => {
                                        onLoginAsUser(acc);
                                        onClose();
                                      }}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer"
                                    >
                                      Login As
                                    </button>

                                    <button
                                      title="Delete Account"
                                      onClick={() => handleDeleteAccount(acc.id)}
                                      className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW SCHOOL ACCOUNT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSchool} className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-xl text-xs text-indigo-950">
                <span className="font-bold">Register School / Principal Account: </span>
                Use this form to issue a dedicated login ID and password for any school, college, or academy.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    School / College / Academy Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                    placeholder="e.g. Unique Science Academy"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Campus / Branch Name
                  </label>
                  <input
                    type="text"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Main Campus, Sahiwal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Principal / Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Prof. M. Aslam"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / District</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Lahore / Sahiwal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp / Phone No</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0300-1234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Education Board
                  </label>
                  <select
                    value={targetBoard}
                    onChange={(e) => setTargetBoard(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {PUNJAB_BOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Paper Generation Limit
                  </label>
                  <input
                    type="number"
                    value={paperLimit}
                    onChange={(e) => setPaperLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Login Credentials Box */}
              <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl text-xs space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Login Credentials for School Principal</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">User ID / Username *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      placeholder="e.g. unique_academy"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold">Password *</label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomPassword}
                        className="text-[10px] text-indigo-600 hover:underline font-bold"
                      >
                        Auto Generate Password
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      placeholder="e.g. pass1234"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('principals')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Create School Account & Generate ID
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ONLINE HOSTING & DEPLOYMENT GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 max-w-3xl mx-auto text-xs text-slate-700 leading-relaxed font-sans">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <h4 className="font-bold text-sm text-emerald-950 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Online Deployment & School Operations Guide</span>
                </h4>
                <p className="text-emerald-900">
                  This application is a complete, production-ready Full-Stack portal (Express + React + Gemini AI + Punjab Board Bank) designed for live hosting and multi-school management.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  1. Super Admin Roles & Responsibilities:
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>You are the Super Admin; only you have the authority to create school accounts and issue credentials.</li>
                  <li>Set designated educational boards (Lahore, Gujranwala, Rawalpindi, Multan, Faisalabad, Sahiwal, etc.) for each school.</li>
                  <li>Allocate license validity expiry dates and paper generation quotas per school.</li>
                  <li>One-click copy and dispatch of credentials to schools via WhatsApp or SMS.</li>
                </ul>

                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide pt-2">
                  2. Principal & Teacher Workflow:
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>The principal or designated teacher accesses the portal with their unique username and password.</li>
                  <li>Their school logo, name, and address automatically populate on every exam paper header.</li>
                  <li>Select Class, Subject, Chapters, and SLOs to generate single chapter tests, term tests, or full-book board exams.</li>
                  <li>Instant export to high-resolution A4 PDF, Microsoft Word (.doc) with clean tables, or direct printing.</li>
                  <li>Automatic Answer Keys and OMR Bubble Sheets generated simultaneously for every exam paper.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN SECURITY & CHANGE CREDENTIALS */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-950">
                <span className="font-bold">🔒 Confidential Super Admin Credentials: </span>
                This login ID and Password is strictly private to you. It is never displayed publicly on the website or given to schools. You can change your password below at any time.
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const updated = accounts.map((a) =>
                    a.role === 'admin'
                      ? {
                          ...a,
                          username: adminUsername.trim(),
                          password: adminPassword.trim(),
                          name: adminName.trim(),
                          phone: adminPhone.trim(),
                        }
                      : a
                  );
                  onUpdateAccounts(updated);
                  setSuccessToast('Super Admin credentials updated successfully! Keep this password secure.');
                }}
                className="space-y-4 bg-white p-5 border border-slate-200 rounded-xl"
              >
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Super Admin Username
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800">
                      Super Admin Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      {showAdminPass ? 'Hide Password' : 'Show Password'}
                    </button>
                  </div>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Contact / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                  >
                    Save New Admin Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
