import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User, MessageSquare, Send, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';

const SUBJECTS = [
  'Question générale',
  'Candidature au programme',
  'Partenariat / Bénévolat',
  'Don / Soutien financier',
  'Demande de renseignement',
  'Autre',
];

export default function ContactModal({ open, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Votre nom est requis';
    if (!form.email.trim())   e.email   = 'Votre email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.subject)        e.subject = 'Choisissez un objet';
    if (!form.message.trim()) e.message = 'Votre message est requis';
    else if (form.message.trim().length < 10) e.message = 'Message trop court (min 10 caractères)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/notify-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, subject: form.subject, message: form.message }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setSubmitError('Une erreur est survenue. Veuillez réessayer ou écrire à contact@mabellepromo.org');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setForm({ name: '', email: '', subject: '', message: '' }); setErrors({}); setSent(false); setSubmitError(''); }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={handleClose}
          >
            {/* Card */}
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff' }}
            >
              {/* Header */}
              <div className="relative px-6 pt-8 pb-5 text-center"
                style={{ background: 'linear-gradient(180deg,#faf8f2 0%,#ffffff 100%)', borderBottom: '1px solid #f0ebe0' }}>
                {/* Filet or */}
                <div className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: 'linear-gradient(90deg,transparent,#b8941f 30%,#d4aa35 50%,#b8941f 70%,transparent)' }} />
                {/* Fermer */}
                <button onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(0,0,0,0.05)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}>
                  <X className="h-4 w-4 text-gray-500" />
                </button>
                {/* Logo MBP */}
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                    style={{ background: '#d4aa35', transform: 'scale(2.2)' }} />
                  <img src="/logo-mbp.png" alt="Ma Belle Promo"
                    className="relative w-16 h-16 rounded-full object-cover"
                    style={{ boxShadow: '0 0 0 3px rgba(212,170,53,0.55), 0 0 0 7px rgba(212,170,53,0.12)' }} />
                </div>
                <h2 className="font-playfair font-bold text-gray-900 text-xl leading-tight mb-1">Ma Belle Promo</h2>
                <p className="text-gray-400 text-xs">Écrivez-nous · Notre équipe vous répond rapidement</p>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div key="success"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-6 gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(26,122,69,0.1)' }}>
                        <CheckCircle2 className="h-8 w-8" style={{ color: '#1a7a45' }} />
                      </div>
                      <div>
                        <h3 className="font-playfair font-bold text-gray-900 text-xl mb-1">Message envoyé !</h3>
                        <p className="text-gray-400 text-sm">Merci <span className="font-semibold text-gray-700">{form.name}</span>.<br />
                          Nous vous répondrons à <span className="font-semibold text-gray-700">{form.email}</span>.</p>
                      </div>
                      <button onClick={handleClose}
                        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#1a7a45,#2ea05c)' }}>
                        Fermer
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                      {/* Nom + Email */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Nom complet <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                            <input
                              type="text" value={form.name} onChange={set('name')}
                              placeholder="Jean Dupont"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-all outline-none"
                              style={{ borderColor: errors.name ? '#ef4444' : '#e5e7eb', background: errors.name ? '#fef2f2' : '#fafafa', color: '#111827' }}
                              onFocus={e => { e.target.style.borderColor = '#1a7a45'; e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.08)'; }}
                              onBlur={e => { e.target.style.borderColor = errors.name ? '#ef4444' : '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                            />
                          </div>
                          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Email <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                            <input
                              type="email" value={form.email} onChange={set('email')}
                              placeholder="vous@exemple.com"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-all outline-none"
                              style={{ borderColor: errors.email ? '#ef4444' : '#e5e7eb', background: errors.email ? '#fef2f2' : '#fafafa', color: '#111827' }}
                              onFocus={e => { e.target.style.borderColor = '#1a7a45'; e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.08)'; }}
                              onBlur={e => { e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                            />
                          </div>
                          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                        </div>
                      </div>

                      {/* Objet */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                          Objet <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 pointer-events-none" />
                          <select
                            value={form.subject} onChange={set('subject')}
                            className="w-full px-3 py-2.5 rounded-xl text-sm border transition-all outline-none appearance-none"
                            style={{ borderColor: errors.subject ? '#ef4444' : '#e5e7eb', background: errors.subject ? '#fef2f2' : '#fafafa', color: form.subject ? '#111827' : '#9ca3af' }}
                            onFocus={e => { e.target.style.borderColor = '#1a7a45'; e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = errors.subject ? '#ef4444' : '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                          >
                            <option value="" disabled>Sélectionnez un objet...</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                          Message <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-300" />
                          <textarea
                            value={form.message} onChange={set('message')}
                            rows={6} placeholder="Décrivez votre demande..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-all outline-none resize-none"
                            style={{ borderColor: errors.message ? '#ef4444' : '#e5e7eb', background: errors.message ? '#fef2f2' : '#fafafa', color: '#111827' }}
                            onFocus={e => { e.target.style.borderColor = '#1a7a45'; e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = errors.message ? '#ef4444' : '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          {errors.message ? <p className="text-red-400 text-xs">{errors.message}</p> : <span />}
                          <p className="text-gray-300 text-xs">{form.message.length} car.</p>
                        </div>
                      </div>

                      {/* Footer */}
                      {submitError && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#ef4444' }}>
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {submitError}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 gap-3">
                        <p className="text-xs text-gray-300">
                          Votre message sera reçu directement par l'équipe MBP.
                        </p>
                        <button type="submit" disabled={sending}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex-shrink-0 disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#1a7a45,#2ea05c)', boxShadow: '0 4px 14px rgba(26,122,69,0.3)' }}
                          onMouseOver={e => { if (!sending) e.currentTarget.style.opacity = '0.9'; }}
                          onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}>
                          {sending
                            ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Envoi...</>
                            : <><Send className="h-3.5 w-3.5" /> Envoyer</>
                          }
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
