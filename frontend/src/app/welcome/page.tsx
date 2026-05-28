import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { ThemeSwitcher } from '../../components/layout/ThemeSwitcher';
import {
  FiBarChart2, FiPackage, FiCreditCard, FiTrendingUp,
  FiShield, FiArrowRight, FiLogIn, FiZap,
  FiCheckCircle, FiCheckSquare
} from 'react-icons/fi';

const TRUST_ITEMS = [
  { icon: <FiShield size={12} />, text: 'Secure & Encrypted' },
  { icon: <FiZap size={12} />, text: 'Fast & Reliable' },
  { icon: <FiCheckSquare size={12} />, text: 'VAT Compliant' },
  { icon: <FiTrendingUp size={12} />, text: 'Grow Your Business' },
  { icon: <FiShield size={12} />, text: 'Secure & Encrypted' },
  { icon: <FiZap size={12} />, text: 'Fast & Reliable' },
  { icon: <FiCheckSquare size={12} />, text: 'VAT Compliant' },
  { icon: <FiTrendingUp size={12} />, text: 'Grow Your Business' },
];

const FEATURES = [
  {
    Icon: FiBarChart2,
    tag: 'Analytics',
    title: 'Real-time Analytics',
    desc: 'Track sales, expenses, and performance metrics with beautiful dashboards built for Nepali businesses.',
    checks: ['Sales tracking', 'Expense reports', 'Visual dashboards'],
    color: '#F2DD50',
  },
  {
    Icon: FiPackage,
    tag: 'Inventory',
    title: 'Smart Inventory',
    desc: 'Manage products, track stock levels, and receive automated low-stock alerts before you run out.',
    checks: ['Stock management', 'Low-stock alerts', 'Product catalog'],
    color: '#60A5FA',
  },
  {
    Icon: FiCreditCard,
    tag: 'Billing',
    title: 'Professional Billing',
    desc: 'Create tax-compliant invoices in seconds, manage payments, and never miss a due date again.',
    checks: ['VAT invoices', 'Payment tracking', 'Due date alerts'],
    color: '#34D399',
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => { const id = setTimeout(() => setMounted(true), 50); return () => clearTimeout(id); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pw {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background: #F7F8FC;
          color: #0D1642;
          overflow-x: hidden;
          position: relative;
        }
        .dark .pw { background: #080B1A; color: #E8E4DE; }

        /* BG */
        .pw-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 70% 55% at 0% 0%, rgba(16,27,85,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(242,221,80,0.06) 0%, transparent 60%);
        }
        .dark .pw-bg {
          background:
            radial-gradient(ellipse 70% 55% at 0% 0%, rgba(242,221,80,0.03) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(242,221,80,0.05) 0%, transparent 60%);
        }

        /* NAVBAR */
        .pw-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 64px;
          background: rgba(247,248,252,0.85);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(16,27,85,0.07);
        }
        .dark .pw-nav {
          background: rgba(8,11,26,0.85);
          border-bottom: 1px solid rgba(242,221,80,0.08);
        }
        .pw-brand { display: flex; align-items: center; gap: 10px; }
        .pw-logo {
          width: 34px; height: 34px; border-radius: 9px;
          border: 1px solid rgba(16,27,85,0.1);
          object-fit: cover; background: #fff;
        }
        .dark .pw-logo { border-color: rgba(242,221,80,0.1); }
        .pw-wordmark {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #101B55;
        }
        .dark .pw-wordmark { color: #F2DD50; }
        .pw-beta {
          font-size: 8px; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; padding: 2px 7px;
          border-radius: 99px; background: rgba(16,27,85,0.07);
          color: #101B55; margin-left: 2px;
        }
        .dark .pw-beta { background: rgba(242,221,80,0.1); color: #F2DD50; }
        .pw-nav-r { display: flex; align-items: center; gap: 8px; }

        /* HERO */
        .pw-hero {
          position: relative; z-index: 1;
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 100px 24px 64px;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .pw-hero.visible { opacity: 1; transform: translateY(0); }

        /* BADGE */
        .pw-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 18px;
          border-radius: 99px;
          border: 1px solid rgba(16,27,85,0.12);
          background: rgba(255,255,255,0.9);
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #101B55;
          margin-bottom: 32px;
          backdrop-filter: blur(8px);
        }
        .dark .pw-badge {
          background: rgba(255,255,255,0.04);
          border-color: rgba(242,221,80,0.18);
          color: #F2DD50;
        }
        .pw-badge-icon {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(16,27,85,0.08);
          display: flex; align-items: center; justify-content: center;
          color: #101B55;
          flex-shrink: 0;
        }
        .dark .pw-badge-icon { background: rgba(242,221,80,0.12); color: #F2DD50; }

        /* HEADLINE */
        .pw-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(54px, 9vw, 108px);
          font-weight: 800; line-height: 0.95;
          letter-spacing: -0.03em;
          color: #101B55;
          margin-bottom: 4px;
        }
        .dark .pw-title { color: #EAE5DF; }
        .pw-title-brand { color: #101B55; display: inline-block; }
        .dark .pw-title-brand { color: #F2DD50; }

        .pw-sub {
          font-size: clamp(14px, 1.8vw, 17px);
          color: #64748b; font-weight: 400;
          max-width: 480px; line-height: 1.75;
          margin: 22px auto 0;
        }
        .dark .pw-sub { color: #8895A7; }

        /* BUTTONS */
        .pw-btns {
          display: flex; flex-wrap: wrap;
          justify-content: center; gap: 12px;
          margin-top: 40px;
        }
        .pw-btn-p {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 30px;
          background: #101B55; color: #fff;
          border: none; border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; position: relative; overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 2px 12px rgba(16,27,85,0.25), 0 6px 24px rgba(16,27,85,0.15);
        }
        .pw-btn-p::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .pw-btn-p:hover { transform: translateY(-2px); box-shadow: 0 4px 18px rgba(16,27,85,0.35), 0 10px 32px rgba(16,27,85,0.2); }
        .pw-btn-p:active { transform: translateY(0); }
        .dark .pw-btn-p { background: #F2DD50; color: #101B55; box-shadow: 0 2px 12px rgba(242,221,80,0.25), 0 6px 24px rgba(242,221,80,0.12); }
        .dark .pw-btn-p:hover { box-shadow: 0 4px 18px rgba(242,221,80,0.4), 0 10px 32px rgba(242,221,80,0.2); }

        .pw-btn-s {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 30px;
          background: rgba(255,255,255,0.9); color: #0D1642;
          border: 1px solid rgba(16,27,85,0.12); border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
          backdrop-filter: blur(8px);
        }
        .pw-btn-s:hover { transform: translateY(-2px); background: #fff; border-color: rgba(16,27,85,0.2); }
        .dark .pw-btn-s { background: rgba(255,255,255,0.04); color: #E8E4DE; border-color: rgba(255,255,255,0.1); }
        .dark .pw-btn-s:hover { background: rgba(255,255,255,0.08); border-color: rgba(242,221,80,0.25); }

        /* FEATURES */
        .pw-features {
          position: relative; z-index: 1;
          padding: 0 24px 80px;
          max-width: 1120px; margin: 0 auto;
        }
        .pw-sec-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #101B55;
          margin-bottom: 14px;
        }
        .dark .pw-sec-eyebrow { color: #F2DD50; }
        .pw-sec-eyebrow-line { width: 28px; height: 1.5px; background: currentColor; border-radius: 1px; }
        .pw-sec-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(28px, 4vw, 46px);
          font-weight: 700; line-height: 1.12;
          color: #0D1642; max-width: 520px; margin-bottom: 52px;
        }
        .dark .pw-sec-title { color: #EAE5DF; }

        .pw-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 18px;
        }

        .pw-card {
          background: #fff;
          border: 1px solid rgba(16,27,85,0.07);
          border-radius: 20px; padding: 30px;
          position: relative; overflow: hidden;
          cursor: default;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s, box-shadow 0.25s;
          box-shadow: 0 1px 3px rgba(16,27,85,0.04), 0 4px 16px rgba(16,27,85,0.05);
        }
        .dark .pw-card {
          background: #0F1220;
          border-color: rgba(255,255,255,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.2);
        }
        .pw-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 2px 8px rgba(16,27,85,0.07), 0 16px 40px rgba(16,27,85,0.1);
        }
        .dark .pw-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.3); }



        .pw-card-tag {
          display: inline-block;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 99px;
          background: rgba(16,27,85,0.06); color: #101B55;
          margin-bottom: 20px;
        }
        .dark .pw-card-tag { background: rgba(242,221,80,0.09); color: #F2DD50; }

        .pw-icon-box {
          width: 48px; height: 48px; border-radius: 13px;
          border: 1px solid rgba(16,27,85,0.08);
          background: #F7F8FC;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: transform 0.2s ease;
        }
        .dark .pw-icon-box { background: #181A2E; border-color: rgba(255,255,255,0.07); }
        .pw-card:hover .pw-icon-box { transform: scale(1.08); }

        .pw-card-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 19px; font-weight: 600;
          color: #0D1642; margin-bottom: 10px;
        }
        .dark .pw-card-title { color: #EAE5DF; }
        .pw-card-desc {
          font-size: 13px; color: #64748b;
          line-height: 1.72; margin-bottom: 22px;
        }
        .dark .pw-card-desc { color: #8895A7; }

        .pw-checks { display: flex; flex-direction: column; gap: 7px; }
        .pw-check {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 500;
          color: #94a3b8; letter-spacing: 0.02em;
        }
        .dark .pw-check { color: #6B7793; }

        /* CTA BANNER */
        .pw-cta {
          position: relative; z-index: 1;
          margin: 0 24px 80px; border-radius: 24px;
          max-width: 1072px; margin-left: auto; margin-right: auto;
          padding: 72px 56px; text-align: center;
          background: #101B55; overflow: hidden;
        }
        .dark .pw-cta { background: #12172E; border: 1px solid rgba(242,221,80,0.12); }
        .pw-cta-orb1 {
          position: absolute; top: -80px; right: -60px;
          width: 320px; height: 320px; border-radius: 50%;
          background: rgba(242,221,80,0.1); filter: blur(70px);
          pointer-events: none;
        }
        .pw-cta-orb2 {
          position: absolute; bottom: -100px; left: -50px;
          width: 260px; height: 260px; border-radius: 50%;
          background: rgba(96,165,250,0.07); filter: blur(70px);
          pointer-events: none;
        }
        .pw-cta-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(26px, 4vw, 44px);
          font-weight: 700; color: #fff;
          line-height: 1.15; margin-bottom: 12px;
          position: relative;
        }
        .pw-cta-sub {
          font-size: 14px; color: rgba(255,255,255,0.5);
          margin-bottom: 32px; position: relative;
        }
        .pw-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 34px;
          background: #F2DD50; color: #101B55;
          border: none; border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 800;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; position: relative;
          box-shadow: 0 4px 20px rgba(242,221,80,0.35);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .pw-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(242,221,80,0.5); }

        /* FOOTER */
        .pw-footer {
          position: relative; z-index: 1;
          text-align: center; padding-bottom: 36px;
          font-size: 10px; color: #94a3b8;
          font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .dark .pw-footer { color: #4B5563; }

        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @media (max-width: 640px) {
          .pw-nav { padding: 0 20px; }
          .pw-cta { padding: 48px 28px; margin-left: 16px; margin-right: 16px; }
          .pw-features { padding: 0 16px 64px; }
        }
      `}</style>

      <div className="pw">
        <div className="pw-bg" />

        {/* Navbar */}
        <nav className="pw-nav">
          <div className="pw-brand">
            <img src="/pasale_logo.png" alt="Pasale" className="pw-logo" />
            <span className="pw-wordmark">Pasale</span>
            <span className="pw-beta">Beta</span>
          </div>
          <div className="pw-nav-r">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </nav>

        {/* Hero */}
        <section className={`pw-hero${mounted ? ' visible' : ''}`}>
          {/* Badge with verified icon */}
          <div className="pw-badge">
            <span className="pw-badge-icon">
              <FiCheckCircle size={11} />
            </span>
            Made for Nepali Businesses
          </div>

          {/* Title */}
          <h1 className="pw-title">
            {t('welcome.title') || (
              <>
                Welcome to{' '}
                <span className="pw-title-brand">Pasale</span>
              </>
            )}
          </h1>

          <p className="pw-sub">{t('welcome.subtitle') || 'Your complete business management solution'}</p>

          {/* CTAs */}
          <div className="pw-btns">
            <button className="pw-btn-p" onClick={() => navigate('/signup')}>
              {t('welcome.signup') || 'Get Started'}
              <FiArrowRight size={15} />
            </button>
            <button className="pw-btn-s" onClick={() => navigate('/login')}>
              <FiLogIn size={15} />
              {t('welcome.login') || 'Login'}
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="pw-features">
          <div className="pw-sec-eyebrow">
            <span className="pw-sec-eyebrow-line" />
            What Pasale Offers
          </div>
          <h2 className="pw-sec-title">Everything your business needs, in one place</h2>

          <div className="pw-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="pw-card"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  className="pw-card-accent-line"
                  style={{ background: f.color }}
                />
                <span className="pw-card-tag">{f.tag}</span>
                <div className="pw-icon-box">
                  <f.Icon
                    size={21}
                    color={hovered === i ? f.color : '#101B55'}
                    style={{ transition: 'color 0.25s' }}
                  />
                </div>
                <h3 className="pw-card-title">{f.title}</h3>
                <p className="pw-card-desc">{f.desc}</p>
                <div className="pw-checks">
                  {f.checks.map((c, j) => (
                    <div className="pw-check" key={j}>
                      <FiCheckCircle size={12} color="#22c55e" style={{ flexShrink: 0 }} />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 80px' }}>
          <div className="pw-cta">
            <div className="pw-cta-orb1" />
            <div className="pw-cta-orb2" />
            <h2 className="pw-cta-title">
              Start managing your business<br />the smart way — today.
            </h2>
            <p className="pw-cta-sub">Free to start. No credit card required. Built for Nepal.</p>
            <button className="pw-cta-btn" onClick={() => navigate('/signup')}>
              Create Free Account
              <FiArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pw-footer">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </>
  );
}