import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { Button } from '../../components/ui/Button';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowLeft,
  FiPhone,
  FiCheck,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

type Step = 'request' | 'verify' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<Step>('request');
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Clear API error when form data changes
  useEffect(() => {
    if (apiError) {
      setApiError(null);
    }
  }, [formData.email, formData.phone, formData.otp, formData.newPassword, formData.confirmPassword]);

  const validateRequest = () => {
    const newErrors: Record<string, string> = {};
    
    if (method === 'email') {
      if (!formData.email) {
        newErrors.email = t('validation.required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('validation.invalidEmail');
      }
    } else {
      if (!formData.phone) {
        newErrors.phone = t('validation.required');
      } else if (!/^[0-9]{10}$/.test(formData.phone)) {
        newErrors.phone = t('validation.invalidPhone');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    const otp = formData.otp.join('');
    if (otp.length !== 6) {
      setErrors({ otp: t('verification.enterOTP') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = t('validation.required');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('validation.minLength').replace('{0}', '8');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = t('forgotPassword.passwordRequirements');
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.required');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateRequest()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendTimer(60);
        setStep('verify');
      } else {
        setApiError(data.message || data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify-reset-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
          otp: formData.otp.join(''),
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('reset');
      } else {
        setApiError(data.message || data.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
          otp: formData.otp.join(''),
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('success');
      } else {
        setApiError(data.message || data.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.email : undefined,
          phone: method === 'phone' ? formData.phone : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendTimer(60);
        setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
      } else {
        setApiError(data.message || data.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setApiError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOTP = [...formData.otp];
    newOTP[index] = value.slice(-1);
    setFormData({ ...formData, otp: newOTP });
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOTP = [...formData.otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOTP[i] = char;
    });
    setFormData({ ...formData, otp: newOTP });
    if (pastedData.length >= 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'request':
        return (
          <>
            <div className="text-center mb-6">
              <img src="/pasale_logo.png" alt="Logo" className="w-16 h-16 object-cover rounded-2xl shadow-sm mb-4 bg-white border border-[#E2E8F0] dark:border-[#2A2B36] mx-auto" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-2">
                {t('forgotPassword.title')}
              </h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {t('forgotPassword.subtitle')}
              </p>
            </div>

            {/* Method Toggle */}
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-[#1C1D24]/40 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border-none cursor-pointer ${
                  method === 'phone'
                    ? 'bg-white dark:bg-[#15161C] text-[#101B55] dark:text-[#F2DD50] shadow-sm'
                    : 'text-slate-400 bg-transparent'
                }`}
              >
                <FiPhone className="inline w-3.5 h-3.5 mr-1" />
                {t('login.phone')}
              </button>
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border-none cursor-pointer ${
                  method === 'email'
                    ? 'bg-white dark:bg-[#15161C] text-[#101B55] dark:text-[#F2DD50] shadow-sm'
                    : 'text-slate-400 bg-transparent'
                }`}
              >
                <FiMail className="inline w-3.5 h-3.5 mr-1" />
                {t('profile.email')}
              </button>
            </div>

            {method === 'email' ? (
              <div className="mb-6">
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
                      errors.email ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#2A2B36]'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.email}</p>}
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('login.phone')}
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="98XXXXXXXX"
                    className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-lg border bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none ${
                      errors.phone ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#2A2B36]'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.phone}</p>}
              </div>
            )}

            {/* API Error Display */}
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">{apiError}</p>
              </div>
            )}

            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full py-3 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer shadow-sm transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                t('forgotPassword.sendCode')
              )}
            </button>
          </>
        );

      case 'verify':
        return (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <FiPhone className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-2">
                {t('verification.verifyOTP')}
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed px-2">
                {t('forgotPassword.codeSentTo')} {method === 'email' ? formData.email : formData.phone}
              </p>
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                {t('forgotPassword.enterOTP')}
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOTPPaste}>
                {formData.otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className={`w-10 h-12 text-center text-xl font-bold rounded-lg border bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none ${
                      errors.otp ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#2A2B36]'
                    }`}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 text-center">{errors.otp}</p>}
            </div>

            {/* Resend OTP */}
            <div className="text-center mb-6">
              {resendTimer > 0 ? (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('forgotPassword.resendIn')} <span className="text-[#101B55] dark:text-[#F2DD50]">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-xs text-[#101B55] dark:text-[#F2DD50] font-bold uppercase tracking-wider hover:underline flex items-center gap-1.5 mx-auto border-none bg-transparent cursor-pointer"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  {t('verification.resendOTP')}
                </button>
              )}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading}
              className="w-full py-3 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer shadow-sm transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                t('verification.verifyOTP')
              )}
            </button>

            <button
              onClick={() => setStep('request')}
              className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider flex items-center justify-center gap-2 border-none bg-transparent cursor-pointer"
            >
              <FiArrowLeft className="w-4 h-4" />
              {t('forgotPassword.changeMethod')} {method === 'email' ? t('profile.email').toLowerCase() : t('login.phone').toLowerCase()}
            </button>
          </>
        );

      case 'reset':
        return (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 dark:bg-[#1C1D24] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E2E8F0] dark:border-[#2A2B36]">
                <FiLock className="w-8 h-8 text-[#101B55] dark:text-[#F2DD50]" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-2">
                {t('forgotPassword.createNewPassword')}
              </h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {t('forgotPassword.newPasswordHint')}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('forgotPassword.newPassword')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder={t('forgotPassword.enterNewPassword')}
                    className={`w-full pl-9 pr-10 py-2.5 text-xs rounded-lg border bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none ${
                      errors.newPassword ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#2A2B36]'
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
                {errors.newPassword && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('forgotPassword.confirmPassword')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={t('forgotPassword.confirmNewPassword')}
                    className={`w-full pl-9 pr-10 py-2.5 text-xs rounded-lg border bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none ${
                      errors.confirmPassword ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#2A2B36]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Password Requirements */}
              <div className="bg-slate-50 dark:bg-[#1C1D24]/30 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t('forgotPassword.passwordMustContain')}:</p>
                <ul className="space-y-1 text-[11px] font-bold uppercase tracking-wider list-none pl-0">
                  <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-slate-400'}`}>
                    <FiCheck className="w-4 h-4 flex-shrink-0" />
                    {t('forgotPassword.atLeast8Chars')}
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                    <FiCheck className="w-4 h-4 flex-shrink-0" />
                    {t('forgotPassword.oneUppercase')}
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                    <FiCheck className="w-4 h-4 flex-shrink-0" />
                    {t('forgotPassword.oneLowercase')}
                  </li>
                  <li className={`flex items-center gap-2 ${/\d/.test(formData.newPassword) ? 'text-green-600' : 'text-slate-400'}`}>
                    <FiCheck className="w-4 h-4 flex-shrink-0" />
                    {t('forgotPassword.oneNumber')}
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="w-full py-3 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer shadow-sm transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                t('forgotPassword.resetPassword')
              )}
            </button>
          </>
        );

      case 'success':
        return (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
              <FiCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-2">
              {t('forgotPassword.successTitle')}
            </h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
              {t('forgotPassword.successMessage')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer shadow-sm transition-all"
            >
              {t('forgotPassword.goToLogin')}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D0E12] p-3 sm:p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-64 sm:w-96 h-64 sm:h-96 bg-[#101B55]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme/Language Switchers */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className={`w-full max-w-md transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Back to Login */}
        {step !== 'success' && (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 mb-6"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        )}

        <div className="bg-white dark:bg-[#15161C] rounded-2xl shadow-sm p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#2A2B36]">
          {renderStep()}
        </div>

        {/* Progress Indicator */}
        {step !== 'success' && (
          <div className="flex justify-center gap-2 mt-6">
            {['request', 'verify', 'reset'].map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  ['request', 'verify', 'reset'].indexOf(step) >= i
                    ? 'w-8 bg-[#101B55] dark:bg-[#F2DD50]'
                    : 'w-2 bg-slate-200 dark:bg-[#22232C]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
