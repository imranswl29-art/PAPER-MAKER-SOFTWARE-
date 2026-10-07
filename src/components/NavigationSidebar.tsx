import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  BookOpen,
  FolderArchive,
  FileCheck2,
  CircleDot,
  Building2,
  ShieldCheck,
  LogOut,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Phone,
  Code2,
  Share2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { UserAccount } from '../types/user';

export type ActiveNavTab =
  | 'dashboard'
  | 'create_paper'
  | 'question_bank'
  | 'saved_papers'
  | 'answer_key'
  | 'bubble_sheet'
  | 'school_profile'
  | 'admin_portal';

interface NavigationSidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  currentUser: UserAccount | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenLogin,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Home',
    },
    {
      id: 'create_paper',
      label: 'Create Paper',
      icon: FilePlus2,
      badge: 'AI & Manual',
      highlight: true,
    },
    {
      id: 'question_bank',
      label: 'Question Bank',
      icon: BookOpen,
      badge: 'Matric 9-10',
    },
    {
      id: 'saved_papers',
      label: 'Saved Papers',
      icon: FolderArchive,
    },
    {
      id: 'answer_key',
      label: 'Answer Keys',
      icon: FileCheck2,
    },
    {
      id: 'bubble_sheet',
      label: 'OMR Bubble Sheets',
      icon: CircleDot,
    },
    {
      id: 'school_profile',
      label: 'School Branding',
      icon: Building2,
      badge: 'Monogram',
    },
  ];

  if (isAdmin) {
    menuItems.push({
      id: 'admin_portal',
      label: 'Admin Portal',
      icon: ShieldCheck,
      badge: 'Super Admin',
      highlight: false,
    });
  }

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 no-print text-white transition-all duration-200 shadow-xl`}
      style={{ backgroundColor: '#090d16', color: '#ffffff' }}
    >
      {/* Brand Header: Exact required heading "PAPER MAKER SOFTWARE" */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-950/60 text-white font-black text-lg shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-black text-xs tracking-tight text-white uppercase truncate">
                PAPER MAKER SOFTWARE
              </h1>
              <div className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase truncate">
                Matric Science (9th & 10th)
              </div>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-1"
            title={isCollapsed ? 'Expand Sidebar (Space for Laptops)' : 'Collapse Sidebar (More Space for Laptops)'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* User Status Card */}
      {!isCollapsed ? (
        <div className="p-3 mx-3 my-2.5 bg-slate-900 rounded-xl border border-slate-800">
          {currentUser ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {isAdmin ? 'Master Admin' : 'School Principal'}
                </span>
              </div>
              <div className="font-bold text-xs text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{currentUser.schoolName}</div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-300">Guest Teacher</div>
                <div className="text-[10px] text-slate-500">Sign in for School Logo</div>
              </div>
              <button
                onClick={onOpenLogin}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Login
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-2 text-center border-b border-slate-800">
          {currentUser ? (
            <div
              className="w-8 h-8 mx-auto rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase"
              title={`${currentUser.name} (${currentUser.schoolName})`}
            >
              {currentUser.username.slice(0, 2)}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-8 h-8 mx-auto rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold"
              title="Login"
            >
              IN
            </button>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as ActiveNavTab)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'btn-3d btn-3d-blue text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!isCollapsed && item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? 'bg-blue-800 text-blue-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Developer Card (Web & Desktop ONLY - tagged with no-print so it NEVER prints on exam papers) */}
      {!isCollapsed && (
        <div className="p-2.5 mx-2.5 mb-2.5 bg-slate-900/90 rounded-xl border border-slate-800/90 text-slate-400 text-xs space-y-1 no-print">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-blue-400">
            <Code2 className="w-3 h-3 text-blue-400" />
            <span>Software Developer</span>
          </div>
          <div>
            <div className="font-extrabold text-white text-[11px] tracking-wide">
              MUHAMMAD IMRAN KHAN
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              MSc Computer Science
            </div>
          </div>
          <div className="pt-1 border-t border-slate-800 flex flex-col gap-0.5 text-[10px] font-mono text-slate-300">
            <div className="flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <a href="tel:03007603964" className="hover:text-blue-300 transition-colors">03007603964</a>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <a href="tel:03147603964" className="hover:text-blue-300 transition-colors">03147603964</a>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
