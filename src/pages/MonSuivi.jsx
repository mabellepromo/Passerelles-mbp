import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  ClipboardList, Plus, Calendar, Star,
  Users, ChevronDown, ChevronRight, Eye, AlertTriangle,
  FileText, Clock, Search, Trash2, Edit
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { formatName } from '@/lib/formatName';
import NavBar from '@/components/NavBar';
import SuiviDetailModal from '@/components/suivi/SuiviDetailModal';
import Footer from '@/components/Footer';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const StarMini = ({ value, color = 'amber' }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(n => (
      <Star key={n} className={`h-3 w-3 ${n <= value ? `text-${color}-500 fill-${color}-500` : 'text-gray-300'}`} />
    ))}
  </div>
);

const formatDate = (d) => {
  if (!d) return '-';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const formatMonth = (key) => {
  const [year, month] = key.split('-');
  return `${MONTHS_FR[parseInt(month) - 1]} ${year}`;
};

export default function MonSuivi() {
  const [user, setUser] = useState(null);
  const [selectedSuivi, setSelectedSuivi] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSuiviId, setEditingSuiviId] = useState(null);
  const [deletingSuiviId, setDeletingSuiviId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: binomes = [] } = useQuery({
    queryKey: ['binomes-mon-suivi'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getMyBinomes', {});
      return res.data?.binomes || [];
    },
    enabled: !!user
  });

  const { data: suivis = [], refetch: refetchSuivis } = useQuery({
    queryKey: ['suivis-mon-suivi'],
    queryFn: () => base44.entities.SuiviMensuel.list('-meeting_date'),
    enabled: !!user
  });

  const isAdmin = user?.role === 'admin';

  const suivisByBinome = suivis.reduce((acc, s) => {
    if (!acc[s.binome_id]) acc[s.binome_id] = [];
    acc[s.binome_id].push(s);
    return acc;
  }, {});

  const groupByMonth = (list) => {
    const grouped = {};
    list.forEach(s => {
      if (!s.meeting_date) return;
      const key = s.meeting_date.slice(0, 7);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const toggle = (key) => setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));

  const totalSuivis = suivis.length;
  const totalHeures = suivis.reduce((acc, s) => acc + (s.duration_hours || 0), 0);
  const avgSatisfaction = totalSuivis > 0
    ? (suivis.reduce((acc, s) => acc + ((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2, 0) / totalSuivis).toFixed(1)
    : 0;
  const issuesCount = suivis.filter(s => s.issues_reported).length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-cream)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand-green)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const filterBinomes = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(b => {
      const bs = suivisByBinome[b.id] || [];
      return (
        b.mentor_name?.toLowerCase().includes(q) ||
        b.mentore_name?.toLowerCase().includes(q) ||
        bs.some(s =>
          s.objectives_discussed?.toLowerCase().includes(q) ||
          s.advice_given?.toLowerCase().includes(q) ||
          s.successes?.toLowerCase().includes(q) ||
          s.challenges?.toLowerCase().includes(q)
        )
      );
    });
  };

  const filteredBinomes = filterBinomes(binomes);

  const handleDeleteSuivi = async (suiviId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce suivi ? Cette action est irréversible.')) return;
    setDeletingSuiviId(suiviId);
    try {
      await base44.entities.SuiviMensuel.delete(suiviId);
      refetchSuivis();
      setDeletingSuiviId(null);
    } catch (error) {
      console.error('Erreur suppression suivi:', error);
      alert(`Erreur: ${error.message || 'Impossible de supprimer'}`);
      setDeletingSuiviId(null);
    }
  };

  const handleEditSuivi = (suivi) => {
    setEditingSuiviId(suivi.id);
    // Redirect to edit mode (or open a modal)
    const binomeId = suivi.binome_id;
    window.location.href = `${createPageUrl('SuiviMensuel')}?binome_id=${binomeId}&edit_id=${suivi.id}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-cream)' }}>
      <NavBar />

      {/* Header */}
      <header className="relative text-white py-8 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f5530 0%, #1a7a45 50%, #2ea05c 100%)' }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="w-full max-w-5xl mx-auto relative">
          <Breadcrumb items={[{ label: 'Mon Espace', to: '/MonEspace' }, { label: 'Mes Suivis' }]} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-playfair">Mes Suivis Mensuels</h1>
                <p className="text-xs text-emerald-200 mt-0.5">Archive sécurisée de votre parcours de mentorat</p>
              </div>
            </div>
            <Link to={createPageUrl('SuiviMensuel')}>
              <Button className="font-semibold shadow-premium text-sm gap-1.5"
                style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--brand-green)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}>
                <Plus className="h-4 w-4" /> Nouveau suivi
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom de binôme, objectifs, conseils…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none shadow-premium transition-all"
            style={{ '--tw-ring-color': 'var(--brand-green)' }}
            onFocus={e => { e.target.style.borderColor = 'var(--brand-green)'; e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>

        {/* Stats */}
        {totalSuivis > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: ClipboardList, label: 'Suivis enregistrés', value: totalSuivis, color: '#059669', bg: '#ecfdf5' },
              { icon: Clock, label: 'Heures de mentorat', value: `${totalHeures}h`, color: '#2563eb', bg: '#eff6ff' },
              { icon: Star, label: 'Satisfaction moy.', value: `${avgSatisfaction}/5`, color: '#d97706', bg: '#fffbeb' },
              { icon: Users, label: 'Binômes', value: binomes.length, color: '#7c3aed', bg: '#f5f3ff' },
            ].map(stat => (
              <Card key={stat.label} className="border-0 shadow-premium overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-0.5" style={{ background: stat.color }} />
                  <div className="p-4 flex items-center gap-3" style={{ background: stat.bg }}>
                    <stat.icon className="h-5 w-5 flex-shrink-0" style={{ color: stat.color }} />
                    <div>
                      <p className="text-lg font-bold leading-none" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-xs mt-0.5 text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Admin alert */}
        {isAdmin && issuesCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: '#fff1f2', borderColor: '#fca5a5' }}>
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-semibold">
              {issuesCount} signalement{issuesCount > 1 ? 's' : ''} à traiter dans les suivis ci-dessous.
            </p>
          </div>
        )}

        {/* Empty/no results */}
        {filteredBinomes.length === 0 && searchQuery ? (
          <div className="text-center py-16">
            <Search className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucun résultat pour « {searchQuery} »</p>
            <button onClick={() => setSearchQuery('')} className="mt-2 text-sm hover:underline" style={{ color: 'var(--brand-green)' }}>Effacer la recherche</button>
          </div>
        ) : binomes.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-200 bg-white shadow-none">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <Users className="h-8 w-8 text-green-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 font-playfair mb-2">Aucun binôme actif</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">Votre binôme n'a pas encore été créé par l'équipe MBP.</p>
            </CardContent>
          </Card>
        ) : (
          filteredBinomes.map((binome, idx) => {
            const binomeSuivis = suivisByBinome[binome.id] || [];
            const monthGroups = groupByMonth(binomeSuivis);

            return (
              <motion.div key={binome.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="border-0 shadow-premium overflow-hidden">
                  {/* Binôme header */}
                  <div className="p-5 text-white relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0f5530 0%, #1a7a45 60%, #2ea05c 100%)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                      style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }} />
                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-emerald-300" />
                          <span className="text-white font-bold text-sm">{formatName(binome.mentor_name)} ↔ {formatName(binome.mentore_name)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: binome.status === 'active' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.15)', color: binome.status === 'active' ? '#86efac' : 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {binome.status === 'active' ? '● Actif' : binome.status}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                            {binomeSuivis.length} suivi{binomeSuivis.length > 1 ? 's' : ''}
                          </span>
                          {binome.match_date && (
                            <span className="text-xs text-emerald-300">Depuis {formatDate(binome.match_date)}</span>
                          )}
                        </div>
                      </div>
                      <Link to={`${createPageUrl('SuiviMensuel')}?binome_id=${binome.id}`}>
                        <Button size="sm" className="font-semibold flex-shrink-0 text-xs"
                          style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--brand-green)' }}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau suivi
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Content */}
                  {binomeSuivis.length === 0 ? (
                    <div className="py-10 text-center bg-white">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">Aucun suivi enregistré pour ce binôme</p>
                      <Link to={`${createPageUrl('SuiviMensuel')}?binome_id=${binome.id}`} className="mt-3 inline-block">
                        <Button size="sm" className="mt-2 text-xs" style={{ background: 'var(--brand-green)', color: 'white' }}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Créer le premier suivi
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 bg-white">
                      {monthGroups.map(([monthKey, monthSuivis]) => {
                        const expandKey = `${binome.id}-${monthKey}`;
                        const isExpanded = expandedKeys[expandKey];
                        return (
                          <div key={monthKey}>
                            <button
                              onClick={() => toggle(expandKey)}
                              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ecfdf5' }}>
                                  <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--brand-green)' }} />
                                </div>
                                <span className="font-semibold text-sm text-gray-800">{formatMonth(monthKey)}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#ecfdf5', color: 'var(--brand-green)' }}>
                                  {monthSuivis.length} rencontre{monthSuivis.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                            </button>

                            {isExpanded && (
                              <div className="divide-y divide-gray-50">
                                {monthSuivis.map(suivi => (
                                  <div key={suivi.id} className="px-5 py-4 hover:bg-gray-50/80 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                      <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-semibold text-sm text-gray-800">Rencontre #{suivi.meeting_number}</span>
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{formatDate(suivi.meeting_date)}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${suivi.format === 'presentiel' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {suivi.format === 'presentiel' ? 'Présentiel' : 'Virtuel'}
                                          </span>
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{suivi.duration_hours}h</span>
                                          {suivi.issues_reported && (
                                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-red-50 text-red-700">
                                              <AlertTriangle className="h-3 w-3" /> Signalement
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex gap-4 text-xs text-gray-500">
                                          <span className="flex items-center gap-1">Mentor : <StarMini value={suivi.satisfaction_mentor} /></span>
                                          <span className="flex items-center gap-1">Mentoré : <StarMini value={suivi.satisfaction_mentore} /></span>
                                          <span className="flex items-center gap-1 text-emerald-600">Progrès : <StarMini value={suivi.progress_rating} color="emerald" /></span>
                                        </div>
                                        {suivi.objectives_discussed && (
                                          <p className="text-xs text-gray-400 line-clamp-1 italic">{suivi.objectives_discussed}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setSelectedSuivi(suivi)}
                                          className="text-xs hover:text-white transition-all"
                                          style={{ borderColor: 'var(--brand-green)', color: 'var(--brand-green)' }}
                                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-green)'; e.currentTarget.style.color = 'white'; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--brand-green)'; }}>
                                          <Eye className="h-3.5 w-3.5 mr-1" /> Détail
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditSuivi(suivi)}
                                          className="text-xs hover:text-white transition-all"
                                          style={{ borderColor: '#2563eb', color: '#2563eb' }}
                                          onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = 'white'; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#2563eb'; }}>
                                          <Edit className="h-3.5 w-3.5 mr-1" /> Modifier
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDeleteSuivi(suivi.id)}
                                          disabled={deletingSuiviId === suivi.id}
                                          className="text-xs hover:text-white transition-all"
                                          style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#ef4444'; }}>
                                          <Trash2 className="h-3.5 w-3.5 mr-1" /> {deletingSuiviId === suivi.id ? 'Suppression...' : 'Supprimer'}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </main>

      <SuiviDetailModal suivi={selectedSuivi} open={!!selectedSuivi} onClose={() => setSelectedSuivi(null)} />
      <Footer />
    </div>
  );
}