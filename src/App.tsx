import React, { useState, useEffect, useRef } from 'react';
import { SAMPLE_9TH_PHYSICS_PAPER } from './data/samplePapers';
import { PTBB_SUBJECTS } from './data/ptbbData';
import { INITIAL_ACCOUNTS } from './data/initialAccounts';
import { GeneratedExamPaper, ClassLevel } from './types/paper';
import { UserAccount } from './types/user';
import {
  fetchAccountsFromFirestore,
  saveAccountToFirestore,
  saveAllAccountsToFirestore,
  deleteAccountFromFirestore,
  fetchPapersFromFirestore,
  savePaperToFirestore,
  deletePaperFromFirestore,
} from './firebase';

// Components
import { NavigationSidebar, ActiveNavTab } from './components/NavigationSidebar';
import { DashboardView } from './components/DashboardView';
import { InteractivePaperBuilder } from './components/InteractivePaperBuilder';
import { QuestionBankView } from './components/QuestionBankView';
import { ExamPaperView } from './components/ExamPaperView';
import { AnswerKeyModal } from './components/AnswerKeyModal';
import { BubbleSheetView } from './components/BubbleSheetView';
import { SchoolProfileModal } from './components/SchoolProfileModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { LoginModal } from './components/LoginModal';
import { ManualQuestionSelectorModal } from './components/ManualQuestionSelectorModal';
import { PrincipalShareModal } from './components/PrincipalShareModal';

import {
  FilePlus2,
  Printer,
  Download,
  Building2,
  Sparkles,
  User,
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  Share2,
  FileDown,
  CheckSquare,
  Loader2,
  Phone,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  LogOut,
  FolderArchive,
} from 'lucide-react';
import { exportPaperToWord } from './utils/exportWord';
import { exportPaperToPdf } from './utils/exportPdf';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [builderInitialClass, setBuilderInitialClass] = useState<ClassLevel>('9th');
  const [viewingPaperDetail, setViewingPaperDetail] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Accounts & Authentication State
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('ptbb_accounts_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('ptbb_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear any default or hardcoded admin sessions on load as strictly requested
        if (parsed?.role === 'admin' || parsed?.username === 'admin') {
          localStorage.removeItem('ptbb_current_user');
          return null;
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Fetch accounts from Firebase Firestore on mount (with Express/localStorage backup)
  useEffect(() => {
    fetchAccountsFromFirestore()
      .then((cloudAccounts) => {
        if (Array.isArray(cloudAccounts) && cloudAccounts.length > 0) {
          setAccounts((prev) => {
            const mergedMap = new Map<string, UserAccount>();
            // Ensure default initial accounts (Admin & Seeded Demo Schools) always exist
            INITIAL_ACCOUNTS.forEach((acc) => mergedMap.set(acc.id, acc));
            // Add cloud accounts from Firestore
            cloudAccounts.forEach((acc: UserAccount) => mergedMap.set(acc.id, acc));
            // Add any local accounts not yet in cloud
            prev.forEach((acc) => {
              if (!mergedMap.has(acc.id)) {
                mergedMap.set(acc.id, acc);
              }
            });
            const merged = Array.from(mergedMap.values());
            localStorage.setItem('ptbb_accounts_list', JSON.stringify(merged));
            return merged;
          });
        } else {
          // First time cloud initialization: Seed default accounts to Firebase Firestore
          saveAllAccountsToFirestore(INITIAL_ACCOUNTS).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Firebase Firestore accounts fetch fallback:', err);
        // Fallback to Express backend if Firestore is temporarily offline
        fetch('/api/accounts')
          .then((res) => res.json())
          .then((serverAccounts) => {
            if (Array.isArray(serverAccounts) && serverAccounts.length > 0) {
              setAccounts((prev) => {
                const mergedMap = new Map<string, UserAccount>();
                serverAccounts.forEach((acc: UserAccount) => mergedMap.set(acc.id, acc));
                prev.forEach((acc) => {
                  if (!mergedMap.has(acc.id)) mergedMap.set(acc.id, acc);
                });
                const merged = Array.from(mergedMap.values());
                localStorage.setItem('ptbb_accounts_list', JSON.stringify(merged));
                return merged;
              });
            }
          })
          .catch(() => {});
      });
  }, []);

  // Sync accounts to Firebase Firestore (permanent cloud database), localStorage, and backend
  const syncAccounts = (updatedAccounts: UserAccount[]) => {
    setAccounts(updatedAccounts);
    localStorage.setItem('ptbb_accounts_list', JSON.stringify(updatedAccounts));
    // Save to Firebase Firestore cloud database
    saveAllAccountsToFirestore(updatedAccounts).catch((err) =>
      console.warn('Firebase Firestore accounts batch save failed:', err)
    );
    // Also sync to local server API
    fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedAccounts),
    }).catch((err) => console.warn('Backend accounts save failed:', err));
  };

  // Active Paper & User-Specific Saved Papers (ZERO fake dummy papers)
  const [activePaper, setActivePaper] = useState<GeneratedExamPaper>(() => {
    const saved = localStorage.getItem('ptbb_active_paper');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return SAMPLE_9TH_PHYSICS_PAPER;
  });

  const [savedPapers, setSavedPapers] = useState<GeneratedExamPaper[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('ptbb_current_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      if (savedUser?.id) {
        const saved = localStorage.getItem(`ptbb_saved_papers_${savedUser.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  });

  // Load user-specific papers from Firebase Firestore whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      // Restore cached profile if available
      try {
        const savedProf = localStorage.getItem(`ptbb_profile_${currentUser.id}`);
        if (savedProf) {
          const parsedProf = JSON.parse(savedProf);
          if (parsedProf && parsedProf.schoolName) {
            setCurrentUser((prev) => (prev ? { ...prev, ...parsedProf } : parsedProf));
          }
        }
      } catch (e) {}

      // Fetch user-specific papers from Firebase Firestore
      fetchPapersFromFirestore(currentUser.id)
        .then((cloudPapers) => {
          if (Array.isArray(cloudPapers)) {
            setSavedPapers(cloudPapers);
            localStorage.setItem(`ptbb_saved_papers_${currentUser.id}`, JSON.stringify(cloudPapers));
          }
        })
        .catch(() => {
          // Fallback to Express backend or localStorage
          fetch(`/api/papers?userId=${encodeURIComponent(currentUser.id)}`)
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                setSavedPapers(data);
                localStorage.setItem(`ptbb_saved_papers_${currentUser.id}`, JSON.stringify(data));
              }
            })
            .catch(() => {
              const saved = localStorage.getItem(`ptbb_saved_papers_${currentUser.id}`);
              if (saved) {
                try {
                  setSavedPapers(JSON.parse(saved));
                } catch (e) {
                  setSavedPapers([]);
                }
              } else {
                setSavedPapers([]);
              }
            });
        });
    } else {
      setSavedPapers([]);
    }
  }, [currentUser?.id]);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState<boolean>(false);
  const [isBubbleSheetModalOpen, setIsBubbleSheetModalOpen] = useState<boolean>(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [isManualSelectorOpen, setIsManualSelectorOpen] = useState<boolean>(false);
  const [manualSelectorClass, setManualSelectorClass] = useState<ClassLevel>('9th');
  const [manualSelectorSubjectId, setManualSelectorSubjectId] = useState<string>('9th-physics');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTopDownloadingPdf, setIsTopDownloadingPdf] = useState<boolean>(false);

  // Dedicated Principal URL Detection & Account Freeze Status
  const [isFrozenLocked, setIsFrozenLocked] = useState<boolean>(false);
  const [frozenPrincipalInfo, setFrozenPrincipalInfo] = useState<UserAccount | null>(null);
  const [loginInitialUsername, setLoginInitialUsername] = useState<string>('');
  const [loginTargetSchool, setLoginTargetSchool] = useState<string>('');

  // Check URL parameter (?principal=xyz or ?school=id) STRICTLY ONCE on initial mount & prompt ID/Password authentication ONLY then
  const initialUrlCheckedRef = useRef(false);
  useEffect(() => {
    if (initialUrlCheckedRef.current) return;
    initialUrlCheckedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const principalKey = params.get('principal') || params.get('school');
    if (principalKey) {
      const savedAccounts = localStorage.getItem('ptbb_accounts_list');
      const allAccounts: UserAccount[] = savedAccounts ? JSON.parse(savedAccounts) : INITIAL_ACCOUNTS;
      const match = allAccounts.find(
        (a) =>
          a.username.toLowerCase() === principalKey.toLowerCase() ||
          a.id.toLowerCase() === principalKey.toLowerCase()
      );
      if (match) {
        if (match.status === 'suspended') {
          setIsFrozenLocked(true);
          setFrozenPrincipalInfo(match);
        } else {
          // As requested by user: Mandatory password authentication required to open software
          setCurrentUser(null);
          setLoginInitialUsername(match.username);
          setLoginTargetSchool(`${match.schoolName} (${match.city})`);
          setIsLoginModalOpen(true);
        }
      }
    }
  }, []);

  // Live account freeze enforcement: if currently logged-in principal gets frozen
  useEffect(() => {
    if (currentUser && currentUser.role === 'principal') {
      const liveAcc = accounts.find((a) => a.id === currentUser.id);
      if (liveAcc && liveAcc.status === 'suspended') {
        setIsFrozenLocked(true);
        setFrozenPrincipalInfo(liveAcc);
      } else if (liveAcc && liveAcc.status === 'active') {
        setIsFrozenLocked(false);
        setFrozenPrincipalInfo(null);
      }
    } else {
      setIsFrozenLocked(false);
      setFrozenPrincipalInfo(null);
    }
  }, [currentUser, accounts]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('ptbb_accounts_list', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ptbb_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ptbb_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ptbb_active_paper', JSON.stringify(activePaper));
  }, [activePaper]);

  // Handlers
  const handlePaperCreated = (newPaper: GeneratedExamPaper) => {
    let customizedHeader = { ...newPaper.header };
    if (currentUser) {
      if (currentUser.schoolName) customizedHeader.instituteName = currentUser.schoolName;
      if (currentUser.campusName) customizedHeader.campusName = currentUser.campusName;
      if (currentUser.phone) customizedHeader.phone = currentUser.phone;
      if (currentUser.logoUrl) customizedHeader.customLogoUrl = currentUser.logoUrl;
      try {
        const savedSettings = localStorage.getItem(`ptbb_header_settings_${currentUser.id}`);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          customizedHeader = { ...customizedHeader, ...parsed };
        }
      } catch (e) {}
    }

    const paperWithUser: GeneratedExamPaper = {
      ...newPaper,
      userId: currentUser ? currentUser.id : 'guest',
      createdByUserId: currentUser ? currentUser.id : 'guest',
      header: customizedHeader,
    };

    setActivePaper(paperWithUser);
    const updated = [paperWithUser, ...savedPapers.filter((p) => p.id !== paperWithUser.id)];
    setSavedPapers(updated);

    if (currentUser) {
      localStorage.setItem(`ptbb_saved_papers_${currentUser.id}`, JSON.stringify(updated));
      const updatedUser = {
        ...currentUser,
        papersCreated: (currentUser.papersCreated || 0) + 1,
      };
      setCurrentUser(updatedUser);
      const updatedAccounts = accounts.map((a) => (a.id === updatedUser.id ? updatedUser : a));
      syncAccounts(updatedAccounts);
    }

    // Persist to Firebase Firestore cloud database
    savePaperToFirestore(paperWithUser).catch((err) =>
      console.warn('Firebase Firestore paper save failed:', err)
    );

    // Also persist to backend server API
    fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paperWithUser),
    }).catch((err) => console.warn('Backend paper save failed:', err));

    setIsLoginModalOpen(false);
    setViewingPaperDetail(true);
    showToast('Question paper generated successfully and saved to cloud!');
  };

  const handleUpdateActivePaper = (updated: GeneratedExamPaper) => {
    setActivePaper(updated);
    const updatedList = savedPapers.map((p) => (p.id === updated.id ? updated : p));
    setSavedPapers(updatedList);
    if (currentUser) {
      localStorage.setItem(`ptbb_saved_papers_${currentUser.id}`, JSON.stringify(updatedList));
    }
    // Update in Firebase Firestore cloud database
    savePaperToFirestore(updated).catch((err) =>
      console.warn('Firebase Firestore paper update failed:', err)
    );
    // Update on backend
    fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((err) => console.warn('Backend paper update failed:', err));
  };

  const handleDeleteSavedPaper = (paperId: string) => {
    const updated = savedPapers.filter((p) => p.id !== paperId);
    setSavedPapers(updated);
    if (currentUser) {
      localStorage.setItem(`ptbb_saved_papers_${currentUser.id}`, JSON.stringify(updated));
    }
    if (activePaper.id === paperId) {
      if (updated.length > 0) {
        setActivePaper(updated[0]);
      }
    }
    // Delete from Firebase Firestore cloud database
    deletePaperFromFirestore(paperId).catch((err) =>
      console.warn('Firebase Firestore paper delete failed:', err)
    );
    // Delete from backend API
    fetch(`/api/papers/${encodeURIComponent(paperId)}`, { method: 'DELETE' }).catch((err) =>
      console.warn('Backend paper delete failed:', err)
    );
    showToast('Paper deleted successfully from saved list');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ptbb_current_user');
    setSavedPapers([]);
    setIsLoginModalOpen(true);
    showToast('Signed out successfully. Please sign in with ID and password.');
  };

  const handleUpdateCurrentUser = (updated: UserAccount) => {
    setCurrentUser(updated);
    localStorage.setItem('ptbb_current_user', JSON.stringify(updated));
    localStorage.setItem(`ptbb_profile_${updated.id}`, JSON.stringify(updated));
    const updatedAccounts = accounts.map((a) => (a.id === updated.id ? updated : a));
    syncAccounts(updatedAccounts);
    showToast('School profile and details permanently updated!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartTestFromBank = (classLevel: ClassLevel, subjectId: string, chapterNo: number) => {
    setBuilderInitialClass(classLevel);
    setActiveTab('create_paper');
  };

  const handleViewPaper = (p: GeneratedExamPaper) => {
    setActivePaper(p);
    setViewingPaperDetail(true);
  };

  const handleOpenCreateWithClass = (c: ClassLevel = '9th') => {
    setBuilderInitialClass(c);
    setViewingPaperDetail(false);
    setActiveTab('create_paper');
  };

  const handleOpenManualSelector = (classLevel: ClassLevel = '9th', subjectId: string = '9th-physics') => {
    setManualSelectorClass(classLevel);
    setManualSelectorSubjectId(subjectId);
    setIsManualSelectorOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      {/* Navigation Sidebar */}
      <NavigationSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'school_profile') {
            setIsProfileModalOpen(true);
          } else if (tab === 'answer_key') {
            setIsAnswerKeyModalOpen(true);
          } else if (tab === 'bubble_sheet') {
            setIsBubbleSheetModalOpen(true);
          } else if (tab === 'admin_portal') {
            setIsAdminPortalOpen(true);
          } else {
            setActiveTab(tab);
            setViewingPaperDetail(false);
          }
        }}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar (Desktop & Mobile & Laptop Optimized) */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-20 shadow-2xs no-print flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Sidebar Toggle for Laptops / Desktop */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="p-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shrink-0 shadow-xs"
              title={isSidebarCollapsed ? 'Expand Sidebar (Space for Laptops)' : 'Collapse Sidebar (More Space for Laptops)'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-blue-600" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {viewingPaperDetail && (
              <button
                onClick={() => setViewingPaperDetail(false)}
                className="flex items-center gap-1.5 text-xs font-black text-white bg-slate-800 hover:bg-slate-900 px-3 py-2 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            )}
            <div className="min-w-0">
              <span className="font-black text-xs sm:text-sm text-slate-900 tracking-tight uppercase truncate block">
                PAPER MAKER SOFTWARE
              </span>
              <span className="text-[11px] text-slate-600 font-semibold truncate block">
                {currentUser?.schoolName || 'PTBB Matric (9th & 10th) Examination System'}
              </span>
            </div>
          </div>

          {/* Right Header Controls - Vibrant, 3D & Distinct Buttons with Universal Color Fallbacks */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => handleOpenManualSelector('9th')}
              className="btn-3d btn-3d-indigo flex items-center gap-1.5 px-3 py-2 text-white rounded-xl text-xs font-black cursor-pointer"
              title="Handpick Questions Manually from Question Bank in 6 Guided Steps"
            >
              <CheckSquare className="w-4 h-4 text-indigo-100" />
              <span className="hidden lg:inline">Manual Selection</span>
            </button>

            <button
              onClick={() => handleOpenCreateWithClass('9th')}
              className="btn-3d btn-3d-blue flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-black cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4 text-blue-100" />
              <span>New Paper</span>
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsAdminPortalOpen(true)}
                className="btn-3d btn-3d-amber flex items-center gap-1.5 px-3 py-2 text-white rounded-xl text-xs font-black cursor-pointer"
                title="Super Admin Portal"
              >
                <ShieldAlert className="w-4 h-4 text-amber-100" />
                <span className="hidden xl:inline">Admin</span>
              </button>
            )}

            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="School Monogram & Details"
              className="btn-3d btn-3d-slate flex items-center gap-1.5 px-3 py-2 text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Monogram</span>
            </button>

            {/* User Profile & Direct Prominent Logout Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title={`${currentUser.name} (${currentUser.schoolName})`}
                >
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  >
                    {currentUser.username.slice(0, 2)}
                  </div>
                  <div className="hidden 2xl:block text-left text-xs">
                    <div className="font-extrabold text-slate-900 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-blue-700 font-semibold truncate max-w-[120px]">
                      {currentUser.schoolName}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-3d btn-3d-rose flex items-center gap-1.5 px-3 py-2 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                  title="Direct Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-white" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-3d px-3.5 py-2 text-white font-black rounded-xl text-xs cursor-pointer"
                style={{ backgroundColor: '#2563eb', border: '1px solid #1d4ed8', color: '#ffffff' }}
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 no-print">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Views Container */}
        <main className="p-3 sm:p-5 lg:p-6 flex-1 min-w-0">
          {/* DETAIL VIEW: Examining or Printing the Active Paper */}
          {viewingPaperDetail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 no-print max-w-5xl mx-auto">
                <button
                  onClick={() => setViewingPaperDetail(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Portal</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isTopDownloadingPdf}
                    onClick={async () => {
                      setIsTopDownloadingPdf(true);
                      showToast('Generating high-resolution A4 PDF... Please wait!');
                      try {
                        const ok = await exportPaperToPdf(activePaper, 'exam-paper-container');
                        if (!ok) {
                          setTimeout(() => window.print(), 300);
                        } else {
                          showToast('PDF downloaded successfully!');
                        }
                      } catch {
                        setTimeout(() => window.print(), 300);
                      } finally {
                        setIsTopDownloadingPdf(false);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    title="Direct PDF Download"
                  >
                    {isTopDownloadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>{isTopDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                  </button>

                  <button
                    onClick={() => exportPaperToWord(activePaper)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download MS Word</span>
                  </button>

                  <button
                    onClick={() => setIsAnswerKeyModalOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer"
                  >
                    Answer Key
                  </button>

                  <button
                    onClick={() => {
                      const prevTitle = document.title;
                      const cleanSubject = (activePaper.header.subjectName || 'Paper').replace(/\s+/g, '_');
                      const cleanClass = activePaper.header.classLevel || '9th';
                      document.title = `${cleanClass}_Class_${cleanSubject}_Exam_Paper`;
                      window.print();
                      setTimeout(() => {
                        document.title = prevTitle;
                      }, 1500);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Paper</span>
                  </button>
                </div>
              </div>

              <ExamPaperView
                paper={activePaper}
                onUpdatePaper={handleUpdateActivePaper}
                printSection="all"
                onOpenBubbleSheetModal={() => setIsBubbleSheetModalOpen(true)}
                onOpenAnswerKeyModal={() => setIsAnswerKeyModalOpen(true)}
              />
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  currentUser={currentUser}
                  savedPapers={savedPapers}
                  onOpenCreatePaper={handleOpenCreateWithClass}
                  onOpenManualSelector={(c) => handleOpenManualSelector(c || '9th')}
                  onOpenQuestionBank={() => setActiveTab('question_bank')}
                  onViewPaper={handleViewPaper}
                  onOpenSchoolProfile={() => setIsProfileModalOpen(true)}
                  onOpenBubbleSheet={(p) => {
                    setActivePaper(p);
                    setIsBubbleSheetModalOpen(true);
                  }}
                  onOpenAnswerKey={(p) => {
                    setActivePaper(p);
                    setIsAnswerKeyModalOpen(true);
                  }}
                  onDeletePaper={handleDeleteSavedPaper}
                />
              )}

              {/* TAB 2: CREATE PAPER (Interactive Builder) */}
              {activeTab === 'create_paper' && (
                <InteractivePaperBuilder
                  currentUser={currentUser}
                  initialClass={builderInitialClass}
                  onPaperCreated={handlePaperCreated}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {/* TAB 3: QUESTION BANK */}
              {activeTab === 'question_bank' && (
                <QuestionBankView
                  onStartTestWithChapter={handleStartTestFromBank}
                  onOpenManualBuilder={(c, s) => handleOpenManualSelector(c, s)}
                />
              )}

              {/* TAB 4: SAVED PAPERS ARCHIVE */}
              {activeTab === 'saved_papers' && (
                <div className="space-y-4 max-w-7xl mx-auto">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Saved Examination Papers Archive</h2>
                      <p className="text-xs text-slate-500">Access, edit, print or download past board papers</p>
                    </div>
                    <button
                      onClick={() => handleOpenCreateWithClass()}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors"
                    >
                      + Generate New Paper
                    </button>
                  </div>

                  {savedPapers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedPapers.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                {p.header.classLevel}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {p.header.totalMarks} Marks
                              </span>
                            </div>
                            <h3 className="font-extrabold text-base text-slate-900 mt-1">
                              {p.header.subjectName}
                            </h3>
                            <div className="text-xs text-slate-600 font-medium">{p.header.examTitle}</div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Date: {p.header.dateStr} · Time: {p.header.timeAllowed}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleViewPaper(p)}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors text-center shadow-xs cursor-pointer"
                            >
                              View & Print
                            </button>
                            <button
                              onClick={() => exportPaperToWord(p)}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                              title="Download MS Word (.doc)"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActivePaper(p);
                                setIsAnswerKeyModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                              title="View Answer Key"
                            >
                              Answer Key
                            </button>
                            <button
                              onClick={() => {
                                setActivePaper(p);
                                setIsBubbleSheetModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                              title="View OMR Bubble Sheet"
                            >
                              Bubble Sheet
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${p.header.subjectName}" paper?`)) {
                                  handleDeleteSavedPaper(p.id);
                                }
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                              title="Delete this saved paper"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <FolderArchive className="w-8 h-8" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm">No Previous Papers Found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        You have not generated any exam papers yet. Use the Paper Generator or AI smart creator to generate and save your question papers.
                      </p>
                      <button
                        onClick={() => handleOpenCreateWithClass()}
                        className="btn-3d btn-3d-blue px-4 py-2 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        + Create Your First Paper
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {(isLoginModalOpen || !currentUser) && (
        <LoginModal
          accounts={accounts}
          isMandatory={!currentUser || !!loginInitialUsername}
          initialUsername={loginInitialUsername}
          targetSchoolName={loginTargetSchool}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
            setLoginInitialUsername('');
            setLoginTargetSchool('');
            if (window.location.search) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            showToast(`Logged in successfully as ${user.name} (${user.schoolName})`);
          }}
          onClose={() => {
            if (!currentUser) return; // Cannot close without logging in!
            setIsLoginModalOpen(false);
            setLoginInitialUsername('');
            setLoginTargetSchool('');
            if (window.location.search) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }}
        />
      )}

      {isProfileModalOpen && (
        <SchoolProfileModal
          currentUser={currentUser}
          header={activePaper.header}
          onSaveHeader={(updated) => {
            handleUpdateActivePaper({ ...activePaper, header: updated });
            if (currentUser) {
              localStorage.setItem(`ptbb_header_settings_${currentUser.id}`, JSON.stringify(updated));
            }
          }}
          onUpdateCurrentUser={handleUpdateCurrentUser}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {isAnswerKeyModalOpen && (
        <AnswerKeyModal paper={activePaper} onClose={() => setIsAnswerKeyModalOpen(false)} />
      )}

      {isBubbleSheetModalOpen && (
        <BubbleSheetView paper={activePaper} onClose={() => setIsBubbleSheetModalOpen(false)} />
      )}

      {isAdminPortalOpen && (
        <AdminPortalModal
          currentUser={currentUser}
          accounts={accounts}
          onUpdateAccounts={syncAccounts}
          onLoginAsUser={(user) => {
            setCurrentUser(user);
            showToast(`Switched account to ${user.schoolName}`);
          }}
          onClose={() => setIsAdminPortalOpen(false)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
      )}

      {isShareModalOpen && (
        <PrincipalShareModal
          currentUser={currentUser}
          accounts={accounts}
          onClose={() => setIsShareModalOpen(false)}
          onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        />
      )}

      {/* ACCOUNT FROZEN / SUSPENDED NOTIFICATION SCREEN */}
      {isFrozenLocked && frozenPrincipalInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-rose-300 animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 text-white p-5 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 mx-auto flex items-center justify-center text-rose-300 shadow-inner">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-wide">
                Account Suspended / Frozen
              </h2>
              <p className="text-xs text-rose-200 font-urdu" dir="rtl">
                اکاؤنٹ عارضی طور پر فریز کر دیا گیا ہے
              </p>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-500">Institute / School Name:</div>
                <div className="text-sm font-black text-slate-900">{frozenPrincipalInfo.schoolName}</div>
                <div className="text-xs text-slate-600">{frozenPrincipalInfo.campusName} — {frozenPrincipalInfo.city}</div>
                <div className="text-[11px] font-mono font-bold text-indigo-700 pt-1">
                  Login ID: {frozenPrincipalInfo.username}
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2 text-rose-950">
                <p className="font-bold leading-relaxed">
                  Notice from Central Administration:
                </p>
                <p className="leading-relaxed">
                  This school account has been temporarily frozen by the Super Administrator. Access to examination paper generation and question banks is temporarily blocked.
                </p>
                <p className="font-urdu text-[13px] leading-relaxed text-right font-medium text-rose-900 pt-1" dir="rtl">
                  محترم پرنسپل صاحب، آپ کے ادارے کا پورٹل اکاؤنٹ مین ایڈمنسٹریٹر کی طرف سے عارضی طور پر فریز کر دیا گیا ہے۔ مزید پیپرز بنانے یا ڈیٹا بینک تک رسائی کے لیے مین ایڈمن سے فوری رابطہ فرمائیں۔
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href="tel:03001234567"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Contact Main Admin: 0300-1234567</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-center cursor-pointer transition-colors"
                >
                  Login with Admin Master Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isManualSelectorOpen && (
        <ManualQuestionSelectorModal
          initialClass={manualSelectorClass}
          initialSubjectId={manualSelectorSubjectId}
          currentUser={currentUser}
          onPaperGenerated={handlePaperCreated}
          onClose={() => setIsManualSelectorOpen(false)}
        />
      )}
    </div>
  );
}
