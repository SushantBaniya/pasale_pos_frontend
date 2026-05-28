import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowRight,
  FiAlertCircle
} from 'react-icons/fi';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authStore = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Clear API error when form data changes
  useEffect(() => {
    if (apiError) {
      setApiError(null);
    }
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateCredentials = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.required');
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCredentials()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const access = data?.tokens?.access || data?.access;
        const refresh = data?.tokens?.refresh || data?.refresh;

        if (!access || !refresh) {
          setApiError('Login succeeded but token payload is missing');
          return;
        }

        authStore.setTokens(access, refresh);
        localStorage.setItem('auth_token', access);
        localStorage.setItem('refresh_token', refresh);
        
        // Also set access_token for older pages
        localStorage.setItem('access_token', access);

        if (data.business_id) {
          localStorage.setItem('business_id', String(data.business_id));
        }

        authStore.updateUserProfile({
          name: formData.email.split('@')[0],
          email: formData.email,
          phone: '',
          photo: null,
        });
        authStore.login();
        authStore.completeOnboarding();
        navigate('/dashboard');
      } else {
        setApiError(data.error || data.message || 'Login failed');
      }
    } catch (err) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D0E12] p-3 sm:p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 bg-[#101B55]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme/Language Switchers */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className={`w-full max-w-md transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Logo */}
        <div className="text-center mb-6 flex flex-col items-center justify-center">
          <img src="/pasale_logo.png" alt="Logo" className="w-16 h-16 object-cover rounded-2xl shadow-sm mb-3 bg-white border border-[#E2E8F0] dark:border-[#2A2B36]" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101B55] dark:text-[#F2DD50] uppercase tracking-wider">Pasale</h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider mt-1">{t('welcome.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-[#15161C] rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#2A2B36]">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-1">
              {t('login.title')}
            </h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t('login.subtitle')}
            </p>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('profile.email')}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none ${
                    errors.email 
                      ? 'border-red-500' 
                      : 'border-[#E2E8F0] dark:border-[#2A2B36]'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder=""
                  className={`w-full pl-9 pr-10 py-2.5 text-xs rounded-lg border bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none ${
                    errors.password 
                      ? 'border-red-500' 
                      : 'border-[#E2E8F0] dark:border-[#2A2B36]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#101B55] dark:text-[#F2DD50] focus:ring-none accent-[#101B55]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('login.rememberMe')}</span>
              </label>
              <Link 
                to="/forgot-password"
                className="text-[10px] font-bold text-[#101B55] dark:text-[#F2DD50] uppercase tracking-wider hover:underline"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('login.submit')}
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t('login.noAccount')}{' '}
              <Link 
                to="/welcome"
                className="text-[#101B55] dark:text-[#F2DD50] hover:underline"
              >
                {t('login.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
