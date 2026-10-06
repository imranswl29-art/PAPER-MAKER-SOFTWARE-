import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, ShieldCheck, School, MessageCircle, X, Globe, Lock } from 'lucide-react';
import { UserAccount } from '../types/user';
import { getAppPublicOrigin, getPrincipalPortalLink } from '../utils/publicUrl';

interface PrincipalShareModalProps {
  currentUser: UserAccount | null;
  accounts?: UserAccount[];
  onClose: () => void;
  onOpenAdminPortal?: () => void;
}

export const PrincipalShareModal: React.FC<PrincipalShareModalProps> = ({
  currentUser,
  accounts = [],
  onClose,
  onOpenAdminPortal,
}) => {
  const [copied, setCopied] = useState(false);
  const principalAccounts = accounts.filter((a) => a.role === 'principal');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    principalAccounts[0]?.id || ''
  );

  const selectedAccount = principalAccounts.find((a) => a.id === selectedAccountId);

  const publicOrigin = getAppPublicOrigin();
  const portalUrl = selectedAccount
    ? getPrincipalPortalLink(selectedAccount.username)
    : publicOrigin;

  const defaultInvitationText = selectedAccount
    ? `*PUNJAB EXAMINATION BOARD - OFFICIAL PORTAL ACCESS NOTICE*

To: Respected Principal / Head of Institution
*${selectedAccount.name}*
*${selectedAccount.schoolName}*
Campus / Location: ${selectedAccount.campusName || selectedAccount.city}, ${selectedAccount.city}

Greetings,

We are pleased to inform you that your school has been officially registered on the *PUNJAB EXAMINATION BOARD (PTBB & BISE) PAPER MAKER SOFTWARE*. Your dedicated institution portal is activated for Matric 9th and 10th Classes (Science Group & Compulsory Subjects).

==================================================
🌐 *OFFICIAL DIRECT PORTAL ACCESS LINK:*
${portalUrl}

🔐 *YOUR CONFIDENTIAL LOGIN CREDENTIALS:*
• Institution Portal ID (Username): *${selectedAccount.username}*
• Confidential Password: *${selectedAccount.password}*
• Target BISE Examination Board: *${selectedAccount.targetBoard.toUpperCase()} BOARD*
• Allocated Paper Generation Quota: *${selectedAccount.paperLimit} Question Papers*
• Authorized Class Levels: *Matric 9th Class & 10th Class*
• Portal Status: *ACTIVE* (Valid until ${selectedAccount.expiryDate || '2027-12-31'})
==================================================

📋 *STEP-BY-STEP INSTRUCTIONS TO START CREATING PAPERS:*
1. Click on your dedicated portal link above or open it in your desktop/laptop browser.
2. Enter your Institution ID (*${selectedAccount.username}*) and Password (*${selectedAccount.password}*).
3. Click "New Paper" (8-Step Wizard) or "Manual Selection" to handpick questions from the verified question bank.
4. Choose your preferred medium: English Medium, Urdu Medium, or Bilingual (side-by-side).
5. Choose whether to attach the official OMR Bubble Sheet or print without it with dedicated 1-click buttons.
6. Instantly download the complete paper in High-Resolution A4 PDF or editable Microsoft Word (.doc) format.
7. Print with automatic institutional header containing your school name, campus address, and official monogram.

🎯 *VERIFIED BOARD FEATURES INCLUDED:*
• Full alignment with PTBB Curriculum & Official Board Pairing Schemes.
• Physics, Chemistry, Biology, Mathematics, Computer Science, English, Urdu, Islamiat, Tarjuma-tul-Quran, and Pakistan Studies.
• Specialized English and Urdu board formats with Grammar, Translation, Pair of Words, Stanza explanations, and Essays.
• Authentic multi-option Answer Keys (A, B, C, D) with grading schemes.
• Complete question bank containing thousands of past board questions from all Punjab BISE boards (2020-2025).

🔒 *CONFIDENTIALITY & SECURITY NOTICE:*
Please keep your institutional login credentials confidential. Do not forward these credentials to unauthorized persons or outside organizations.

📞 *CENTRAL ADMINISTRATIVE & TECHNICAL HELPLINE:*
Software Engineering & Operations: MUHAMMAD IMRAN KHAN (MSc Computer Science)
Official Helpline Contacts:
• Phone / WhatsApp: +92 300 7603964
• Alternate Helpline: +92 314 7603964
• Central Support Office: Lahore & Sahiwal, Punjab, Pakistan`
    : `*PUNJAB EXAMINATION BOARD - OFFICIAL PORTAL ACCESS NOTICE*

To: Respected Principal / Academic Administrator

Greetings,

The official *PUNJAB EXAMINATION BOARD (PTBB & BISE) PAPER MAKER SOFTWARE* is now active for Matric Part-I (9th Class) and Part-II (10th Class).

==================================================
🌐 *CENTRAL PORTAL WEB ADDRESS:*
${publicOrigin}

🔐 *LOGIN INSTRUCTIONS:*
Please use your official Institution User ID and Password to sign in. Upon login, your school name, campus details, and monogram will automatically appear on all generated examination papers.
==================================================

🎯 *CORE SOFTWARE FEATURES:*
• Official BISE Punjab Board Pairing Schemes & Model Papers
• All Science & Compulsory Subjects (English, Urdu, Math, Physics, Chemistry, Biology, Computer)
• Separate 1-click toggles for OMR Bubble Response Sheets
• Realistic randomized Answer Keys (A, B, C, D) and grading matrices
• Instant High-Resolution A4 PDF and fully editable Microsoft Word downloads

📞 *CENTRAL TECHNICAL HELPLINE:*
Lead Software Engineer: MUHAMMAD IMRAN KHAN (MSc Computer Science)
Helpline Numbers: 0300-7603964 / 0314-7603964`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyFullMessage = () => {
    navigator.clipboard.writeText(defaultInvitationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(defaultInvitationText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print font-sans text-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-xs">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">
                Share Link with Principals & Schools
              </h2>
              <p className="text-xs text-blue-200">
                Send official portal address and invitations to school heads & academies
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700">
          {/* School Selector for Dedicated Link */}
          {principalAccounts.length > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase text-blue-900">
                  Select School to Issue Dedicated Unique Link:
                </label>
                {onOpenAdminPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminPortal();
                    }}
                    className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer"
                  >
                    + Register New School
                  </button>
                )}
              </div>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {principalAccounts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.schoolName} — {p.name} ({p.city}) [ID: {p.username}] {p.status === 'suspended' ? '⚠️ FROZEN' : '✓ ACTIVE'}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <div className="text-[11px] text-blue-900 flex items-center justify-between pt-1">
                  <span>
                    Direct Link for: <strong>{selectedAccount.schoolName}</strong> (ID: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-800">{selectedAccount.username}</code>)
                  </span>
                  {selectedAccount.status === 'suspended' ? (
                    <span className="text-rose-700 font-black bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                      Account Frozen / Suspended
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Active
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Public Link Box */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-slate-500">
              {selectedAccount ? `Dedicated Link for ${selectedAccount.schoolName}` : 'Official Portal Web Address'}
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2.5">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="bg-transparent flex-1 font-mono text-[11px] text-slate-900 font-bold focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick WhatsApp Invitation Action */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <span>Send Ready Invitation on WhatsApp</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Clicking this button opens a pre-composed professional invitation message directly in WhatsApp to share with any school principal or educator.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyFullMessage}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Message Text</span>
              </button>
            </div>
          </div>

          {/* Security & Password Guidelines */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Important Security & Account Guidelines:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside leading-relaxed">
              <li>
                <strong>Never share Super Admin password:</strong> The Super Admin account password belongs solely to you; school principals do not have access to admin controls.
              </li>
              <li>
                <strong>Register separate school accounts:</strong> Open Admin Portal and click <strong>&quot;Register School Account&quot;</strong> to generate custom login credentials for each school.
              </li>
              <li>
                <strong>Custom institute name & monogram:</strong> When a school logs in, their examination papers automatically print with their own school name and logo.
              </li>
            </ul>

            {onOpenAdminPortal && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPortal();
                  }}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Open Admin Portal to Manage Accounts &rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
