import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Layers,
  CreditCard,
  User,
  Sliders,
  Menu,
  X,
  Sparkles,
  Info,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import type { UserAccount } from '../types/index.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenPricing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenPricing,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'scanner', label: 'فحص الحساب', icon: Shield },
    { id: 'compare', label: 'مقارنة الحسابات', icon: Layers },
    { id: 'monitor', label: 'المراقبة الذكية', icon: Activity },
    { id: 'pricing', label: 'الأسعار والاشتراكات', icon: CreditCard },
    { id: 'dashboard', label: 'لوحتي', icon: User },
    { id: 'info', label: 'عن المنصة', icon: Info },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: 'إدارة الموقع', icon: Sliders }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,242,254,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('scanner')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.3)] group-hover:shadow-[0_0_25px_rgba(0,242,254,0.5)] transition-all duration-300">
              <Shield className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent font-mono-cyber">
                  TK_SABR
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                  v2.6
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block font-medium">
                محلل حسابات تيك توك الذكي
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                      : 'text-gray-300 hover:text-white hover:bg-gray-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User & Action Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900/90 border border-cyan-500/30 hover:border-cyan-400/60 transition-all text-right"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover border border-cyan-400/40"
                  />
                  <div className="hidden lg:block text-xs">
                    <p className="font-semibold text-gray-200">{currentUser.name}</p>
                    <span className="text-[11px] text-cyan-400 font-semibold">
                      باقة {currentUser.plan.toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-xl bg-gray-900 border border-cyan-500/30 shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <p className="text-sm font-bold text-white">{currentUser.name}</p>
                      <p className="text-xs text-gray-400 truncate">حساب مسجّل وآمن</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('dashboard');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-300 text-right"
                    >
                      <User className="w-4 h-4 text-cyan-400" />
                      لوحة التحكم والإحصائيات
                    </button>
                    <button
                      onClick={() => {
                        onOpenPricing();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-300 text-right"
                    >
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      ترقية الباقة والاشتراك
                    </button>
                    <div className="border-t border-gray-800 my-1" />
                    <button
                      onClick={() => {
                        onLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 text-right"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-800 bg-gray-950/95 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-gray-300 hover:bg-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};
