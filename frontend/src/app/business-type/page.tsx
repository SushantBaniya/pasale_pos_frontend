import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { FiUser, FiBriefcase } from 'react-icons/fi';

export default function BusinessTypePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUserType, logout } = useAuthStore();
  const [selected, setSelected] = useState<'personal' | 'business' | null>(null);

  const handleSelect = (type: 'personal' | 'business') => {
    setSelected(type);
  };

  const handleContinue = () => {
    if (!selected) return;
    setUserType(selected);
    if (selected === 'personal') {
      navigate('/personal-verification');
    } else {
      navigate('/business-verification');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-3 sm:p-4">
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout();
            navigate('/welcome');
          }}
        >
          <span className="hidden sm:inline">{t('common.back')}</span>
        </Button>
      </div>

      <div className="w-full max-w-4xl pt-12 sm:pt-0">
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-center mb-6 sm:mb-8 lg:mb-12 text-[#101B55] dark:text-[#EAE5DF] px-2 uppercase tracking-wide">
          {t('userType.title')}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card
            className={`p-6 sm:p-8 cursor-pointer transition-all border border-[#E2E8F0] dark:border-[#2A2B36] ${selected === 'personal'
              ? 'ring-4 ring-[#101B55] dark:ring-[#F2DD50] scale-[1.02] sm:scale-105 bg-slate-50 dark:bg-[#101B55]/10'
              : 'hover:scale-[1.02] bg-white dark:bg-[#15161C]'
              }`}
            onClick={() => handleSelect('personal')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-slate-100 dark:bg-[#1C1D24] mb-4">
                <FiUser className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#101B55] dark:text-[#F2DD50]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2 text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider">
                {t('userType.personal')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                {t('userType.personalDesc')}
              </p>
            </div>
          </Card>

          <Card
            className={`p-6 sm:p-8 cursor-pointer transition-all border border-[#E2E8F0] dark:border-[#2A2B36] ${selected === 'business'
              ? 'ring-4 ring-[#101B55] dark:ring-[#F2DD50] scale-[1.02] sm:scale-105 bg-slate-50 dark:bg-[#101B55]/10'
              : 'hover:scale-[1.02] bg-white dark:bg-[#15161C]'
              }`}
            onClick={() => handleSelect('business')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-slate-100 dark:bg-[#1C1D24] mb-4">
                <FiBriefcase className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#101B55] dark:text-[#F2DD50]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2 text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider">
                {t('userType.business')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                {t('userType.businessDesc')}
              </p>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="px-8 py-3 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border-none cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
