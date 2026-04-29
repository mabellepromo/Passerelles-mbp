import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import NotificationBell from '@/components/NotificationBell';
import { MessageCircle, Info, LayoutDashboard, Menu, X, LogOut, BookOpen } from 'lucide-react';

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [binome, setBinome] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Binome.list().then(binomes => {
      const active = binomes.find(b =>
        b.mentor_email === user.email || b.mentore_email === user.email
      );
      setBinome(active);
    }).catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  const isAdmin = user?.role === 'admin';
  const isMentor = binome && user?.email === binome.mentor_email;

  // Liens principaux (centre) — Messagerie déplacée à droite
  const navLinks = [
    { to: '/',                          label: 'Accueil' },
    { to: '/ResultatsCohorte1',         label: 'Cohorte 1' },
    { to: createPageUrl('MonEspace'),   label: 'Mon Espace' },
    { to: '/GuideNavigation',           label: 'Guide',    icon: BookOpen },
    { to: '/AProposMBP',               label: 'À propos', icon: Info },
  ];

  const isActive = (to) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const bgNav = scrolled
    ? 'linear-gradient(135deg, #09321c 0%, #0d4828 60%, #0f5530 100%)'
    : 'linear-gradient(135deg, #0f5530 0%, #1a7a45 60%, #1e6b3e 100%)';

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'shadow-xl' : ''}`}
        style={{
          background: bgNav,
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        {/* Ligne or */}
        <div
          className="h-[3px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #a07818 10%, #d4aa35 35%, #f0cc55 50%, #d4aa35 65%, #a07818 90%, transparent 100%)' }}
        />

        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 py-3 px-4 sm:px-5">

          {/* ── LOGO ── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative">
              <img
                src="/logo-mbp.png"
                alt="Ma Belle Promo"
                className="w-10 h-10 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                style={{ boxShadow: '0 0 0 2px rgba(184,148,31,0.55), 0 0 12px rgba(212,170,53,0.25)' }}
              />
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="font-playfair font-bold text-[14px] tracking-wide" style={{ color: '#f97316' }}>Passerelles</span>
              <span className="text-[8px] text-emerald-400 tracking-widest uppercase font-semibold">Ma Belle Promo</span>
            </div>
          </Link>

          {/* ── NAV CENTRE (desktop) ── */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-lg transition-all duration-200 text-[12px] font-semibold tracking-wide
                    ${active
                      ? 'text-white bg-white/15'
                      : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />}
                  <span>{label}</span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(90deg, transparent, #d4aa35, transparent)' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── ZONE DROITE (desktop) ── */}
          <div className="hidden md:flex items-center gap-2">

            {/* Messagerie */}
            <Link
              to={createPageUrl('Messagerie')}
              title="Messagerie"
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all
                ${isActive('/Messagerie') ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </Link>

            {/* Cloche notifications */}
            {user && <NotificationBell userEmail={user.email} />}

            {/* Admin */}
            {isAdmin && (
              <Link
                to={createPageUrl('AdminDashboard')}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                style={{ background: 'rgba(184,148,31,0.2)', border: '1px solid rgba(184,148,31,0.45)', color: '#f0d060' }}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden xl:block">Admin</span>
              </Link>
            )}

            {/* Séparateur */}
            <div className="w-px h-6 bg-white/20 flex-shrink-0" />

            {/* Utilisateur */}
            {!user ? (
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="text-[11px] font-semibold px-4 py-1.5 rounded-lg text-white transition-all whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Connexion
              </button>
            ) : (
              <div className="flex items-center gap-2">

                {/* Badge binôme */}
                {binome && (
                  <div
                    className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">
                      {isMentor ? 'Mentor' : 'Mentoré'}
                    </span>
                    <span className="w-px h-3 bg-white/20" />
                    <span className="text-[11px] text-white/85 font-medium max-w-[72px] truncate">
                      {isMentor ? binome.mentore_name : binome.mentor_name}
                    </span>
                  </div>
                )}

                {/* Avatar + nom */}
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(184,148,31,0.4)', color: '#f0d060', border: '1px solid rgba(184,148,31,0.6)' }}
                  >
                    {user.full_name?.[0] || user.email?.[0] || '?'}
                  </div>
                  <span className="text-[11px] text-white/85 hidden lg:block font-medium">
                    {user.full_name || user.email}
                  </span>
                </div>

                {/* Déconnexion */}
                <button
                  onClick={() => base44.auth.logout()}
                  title="Déconnexion"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold text-[11px] text-white/75 hover:text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.25)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden xl:block">Quitter</span>
                </button>
              </div>
            )}
          </div>

          {/* ── MOBILE — cloche + hamburger ── */}
          <div className="md:hidden flex items-center gap-2">
            {user && <NotificationBell userEmail={user.email} />}
            <button
              className="p-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Ligne de séparation bas */}
        <div
          className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 80%, transparent 100%)' }}
        />
      </nav>

      {/* ── MENU MOBILE ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30" style={{ top: '45px' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />

          <div
            className="relative flex flex-col max-h-[calc(100vh-45px)] overflow-y-auto"
            style={{ background: 'linear-gradient(180deg, #0f5530, #0a3320)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Profil */}
            {user && (
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(184,148,31,0.25)', color: '#f0d060', border: '1px solid rgba(184,148,31,0.4)' }}
                >
                  {user.full_name?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{user.full_name}</p>
                  <p className="text-xs text-emerald-400">{user.email}</p>
                  {binome && (
                    <p className="text-xs text-white/50 mt-0.5">
                      {isMentor ? 'Mentor' : 'Mentoré'} · {isMentor ? binome.mentore_name : binome.mentor_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Liens nav + messagerie */}
            <div className="py-2">
              {[...navLinks, { to: createPageUrl('Messagerie'), label: 'Messagerie', icon: MessageCircle }].map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors
                      ${active ? 'text-white bg-white/10 font-semibold' : 'text-white/75 hover:text-white hover:bg-white/8'}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                    {label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </Link>
                );
              })}
            </div>

            {/* Admin mobile */}
            {isAdmin && (
              <div className="border-t border-white/10 py-2">
                <Link
                  to={createPageUrl('AdminDashboard')}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors"
                  style={{ color: '#f0d060' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Administration
                </Link>
              </div>
            )}

            {/* Connexion / Déconnexion */}
            <div className="border-t border-white/10 py-2 mt-auto">
              {!user ? (
                <button
                  onClick={() => { setMobileOpen(false); base44.auth.redirectToLogin(window.location.href); }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Connexion
                </button>
              ) : (
                <button
                  onClick={() => { setMobileOpen(false); base44.auth.logout(); }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors"
                  style={{ color: '#fca5a5' }}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
