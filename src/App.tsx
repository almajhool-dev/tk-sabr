import React, { useState, useEffect } from 'react';
import { watchAuth, logout } from './utils/firebaseAuth.ts';
import { CyberBackground } from './components/CyberBackground.tsx';
import { Navbar } from './components/Navbar.tsx';
import { TikTokScanner } from './components/TikTokScanner.tsx';
import { ProfileResultCard } from './components/ProfileResultCard.tsx';
import { SecurityScoreGauge } from './components/SecurityScoreGauge.tsx';
import { ProblemsDiagnostic } from './components/ProblemsDiagnostic.tsx';
import { AIAnalysisReport } from './components/AIAnalysisReport.tsx';
import { AccountCompare } from './components/AccountCompare.tsx';
import { AccountMonitor } from './components/AccountMonitor.tsx';
import { PricingModal } from './components/PricingModal.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { PrintReportModal } from './components/PrintReportModal.tsx';
import { StaticPages } from './components/StaticPages.tsx';
import { AuthModal } from './components/AuthModal.tsx';

import type {
  TikTokProfile,
  SecurityScore,
  DiagnosticProblem,
  GeminiAIReport,
  UserAccount,
} from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scanned profile state
  const [currentProfile, setCurrentProfile] = useState<TikTokProfile | null>(null);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [problems, setProblems] = useState<DiagnosticProblem[]>([]);
  const [aiReport, setAiReport] = useState<GeminiAIReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  useEffect(() => watchAuth(setCurrentUser), []);


  // Execute account scan
  const handleScanStart = async (username: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentProfile(null);
    setSecurityScore(null);
    setProblems([]);
    setAiReport(null);
    setScanStep('1. التحقق من صيغة اسم المستخدم...');

    // Progress updates
    const t1 = setTimeout(() => {
      setScanStep('2. الاتصال بخوادم TikTok وجلب البيانات الحقيقية...');
    }, 400);

    const t2 = setTimeout(() => {
      setScanStep('3. استخراج الإحصائيات العامة ومعدل التفاعل...');
    }, 900);

    const t3 = setTimeout(() => {
      setScanStep('4. حساب مؤشر الأمان وتشخيص المشاكل والحلول...');
    }, 1400);

    try {
      const res = await fetch('/api/tiktok/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (data.success && data.profile) {
        setCurrentProfile(data.profile);
        setSecurityScore(data.securityScore);
        setProblems(data.problems || []);
        setAiReport(null); // Reset AI report for new user

        // Update scan quota
        if (currentUser) {
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  scansUsedToday: prev.scansUsedToday + 1,
                  totalScans: prev.totalScans + 1,
                }
              : null
          );
        }

        // Scroll smoothly to results
        setTimeout(() => {
          const el = document.getElementById('scan-results');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      } else {
        setErrorMessage(data.message || 'تعذر استخراج بيانات الحساب.');
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setErrorMessage('حدث خطأ في الاتصال بالخادم. يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI Report via Gemini
  const handleGenerateAIReport = async () => {
    if (!currentProfile) return;
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: currentProfile,
          securityScore,
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setAiReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Add account to monitoring
  const handleAddToMonitor = async () => {
    if (!currentProfile) return;
    try {
      const res = await fetch('/api/monitor/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentProfile.username }),
      });
      const data = await res.json();
      alert(data.message || 'تعذر تفعيل المراقبة.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-gray-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Background Matrix Mesh */}
      <CyberBackground />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => { void logout(); setCurrentUser(null); }}
        onOpenPricing={() => setIsPricingOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 relative z-10">
        {activeTab === 'scanner' && (
          <div className="space-y-12 pb-16">
            {/* Hero Input Section */}
            <TikTokScanner
              onScanStart={handleScanStart}
              isLoading={isLoading}
              scanStep={scanStep}
              errorMessage={errorMessage}
            />

            {/* Results Section */}
            {currentProfile && securityScore && (
              <div id="scan-results" className="max-w-6xl mx-auto px-4 space-y-10">
                {/* 1. Account Profile Card */}
                <ProfileResultCard
                  profile={currentProfile}
                  onOpenAIReport={() => {
                    handleGenerateAIReport();
                    const el = document.getElementById('ai-report-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onOpenPdfReport={() => setIsPrintModalOpen(true)}
                  onAddToMonitor={handleAddToMonitor}
                  onCompareAccount={() => setActiveTab('compare')}
                />

                {/* 2. Security Score Circular Gauge */}
                <SecurityScoreGauge securityScore={securityScore} />

                {/* 3. Discovered Problems & Solutions */}
                <ProblemsDiagnostic problems={problems} />

                {/* 4. TK_SABR AI Engine via Gemini */}
                <div id="ai-report-section">
                  <AIAnalysisReport
                    report={aiReport}
                    isLoading={isAiLoading}
                    onGenerateReport={handleGenerateAIReport}
                    profile={currentProfile}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <AccountCompare
            initialProfiles={currentProfile ? [currentProfile] : []}
          />
        )}

        {activeTab === 'monitor' && (
          <AccountMonitor
            onScanAccount={(user) => {
              setActiveTab('scanner');
              handleScanStart(user);
            }}
          />
        )}

        {activeTab === 'pricing' && (
          <div className="py-6">
            <PricingModal
              isOpen={true}
              onClose={() => setActiveTab('scanner')}
              currentUser={currentUser}
              onPlanUpgraded={(plan) => {
                if (currentUser) {
                  setCurrentUser({ ...currentUser, plan });
                }
              }}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          </div>
        )}

        {activeTab === 'dashboard' && currentUser && (
          <UserDashboard
            user={currentUser}
            onScanAccount={(user) => {
              setActiveTab('scanner');
              handleScanStart(user);
            }}
            onOpenPricing={() => setIsPricingOpen(true)}
          />
        )}

        {activeTab === 'admin' && <div className="max-w-xl mx-auto my-24 p-8 rounded-2xl border border-amber-500/30 bg-gray-950 text-center text-amber-200">لوحة الإدارة المالية متوقفة مؤقتاً حتى تجهيز مصادقة إدارية موثقة وربط المدفوعات الحقيقية.</div>}

        {activeTab === 'info' && <StaticPages initialSubTab="about" />}
        {activeTab === 'privacy' && <StaticPages initialSubTab="privacy" />}
        {activeTab === 'terms' && <StaticPages initialSubTab="terms" />}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(usr) => setCurrentUser(usr)}
      />

      {/* Global Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentUser={currentUser}
        onPlanUpgraded={(plan) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, plan });
          }
        }}
        onRequireAuth={() => setIsAuthOpen(true)}
      />

      {/* PDF Printable Report Modal */}
      {currentProfile && securityScore && (
        <PrintReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          profile={currentProfile}
          securityScore={securityScore}
          problems={problems}
          aiReport={aiReport}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900 bg-gray-950/95 py-10 text-center text-xs text-gray-400 print:hidden">
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-300">
            <button
              onClick={() => setActiveTab('scanner')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              فاحص الحسابات
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              أداة المقارنة
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              المراقبة الذكية
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              الباقات والدفع المصرفي
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              سياسة الخصوصية
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              شروط الاستخدام
            </button>
          </div>

          <p className="text-gray-400 max-w-xl mx-auto text-[11px] leading-relaxed">
            منصة TK_SABR الاستخباراتية لفحص وتحليل حسابات TikTok العامة. لا تتبع المنصة شركة TikTok أو ByteDance بشكل رسمي، وتعتمد في الفحص على البيانات العامة المصرح بها قانونياً.
          </p>

          {/* Mandatory user footer specification */}
          <div className="pt-2 border-t border-gray-900 text-cyan-400 text-sm font-bold tracking-wide">
            تم التطوير بواسطة المبرمج المجهول
          </div>
        </div>
      </footer>
    </div>
  );
}
