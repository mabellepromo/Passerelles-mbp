import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, supabase } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, CheckCircle2, Clock, AlertTriangle, Send, Users, Loader2 } from 'lucide-react';

export default function DeclenchementBinomes() {
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState([]);
  const queryClient = useQueryClient();

  const { data: binomes = [], isLoading } = useQuery({
    queryKey: ['binomes-declenchement'],
    queryFn: async () => {
      const { data } = await supabase
        .from('binome')
        .select('*')
        .eq('status', 'active')
        .eq('is_test', false)
        .order('mentor_name');
      return data ?? [];
    }
  });

  const { data: mentors = [] } = useQuery({
    queryKey: ['mentors-declenchement'],
    queryFn: () => base44.entities.Mentor.list(),
  });

  const { data: mentores = [] } = useQuery({
    queryKey: ['mentores-declenchement'],
    queryFn: () => base44.entities.Mentore.list(),
  });

  const binomesNonDeclenches = binomes.filter(b => !b.declenche);
  const binomesDeclenches = binomes.filter(b => b.declenche);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(binomesNonDeclenches.map(b => b.id));
  };

  const deselectAll = () => setSelected([]);

  const getMentorInfo = (email) => mentors.find(m => m.email === email) || {};
  const getMentoreInfo = (email) => mentores.find(m => m.email === email) || {};

  const fetchPdfBase64 = async (pdfUrl) => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const declencherBinomes = async (binomesADeclencher) => {
    setSending(true);
    setResults([]);
    const newResults = [];

    for (const binome of binomesADeclencher) {
      try {
        const mentor = getMentorInfo(binome.mentor_email);
        const mentore = getMentoreInfo(binome.mentore_email);

        // Récupérer le PDF en base64
        let pdf_base64 = null;
        let pdf_filename = null;
        if (binome.pdf_url) {
          pdf_base64 = await fetchPdfBase64(binome.pdf_url);
          pdf_filename = binome.pdf_url.split('/').pop();
        }

        // Envoyer l'email
        const token = await base44.auth.getAccessToken();
        const response = await fetch('/api/send-binome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            mentor_name: binome.mentor_name,
            mentor_email: binome.mentor_email,
            mentor_profession: mentor.profession || 'Juriste',
            mentor_organisation: mentor.organisation || '',
            mentore_name: binome.mentore_name,
            mentore_email: binome.mentore_email,
            mentore_specialisation: mentore.specialisation || mentore.domaine_interet || 'Droit',
            mentore_universite: mentore.universite || '',
            notes: binome.notes || `Binôme ${binome.mentor_name} ↔ ${binome.mentore_name}`,
            pdf_base64,
            pdf_filename,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Marquer comme déclenché dans Supabase
          await supabase.from('binome').update({
            declenche: true,
            declenche_date: new Date().toISOString(),
          }).eq('id', binome.id);

          newResults.push({ id: binome.id, nom: `${binome.mentor_name} ↔ ${binome.mentore_name}`, status: 'success' });
        } else {
          newResults.push({ id: binome.id, nom: `${binome.mentor_name} ↔ ${binome.mentore_name}`, status: 'error', message: data.error });
        }
      } catch (error) {
        newResults.push({ id: binome.id, nom: `${binome.mentor_name} ↔ ${binome.mentore_name}`, status: 'error', message: error.message });
      }

      setResults([...newResults]);
    }

    setSending(false);
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: ['binomes-declenchement'] });
  };

  const handleDeclencherSelection = () => {
    const binomesADeclencher = binomes.filter(b => selected.includes(b.id));
    declencherBinomes(binomesADeclencher);
  };

  const handleDeclencherTout = () => {
    declencherBinomes(binomesNonDeclenches);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-600">{binomesDeclenches.length}</p>
              <p className="text-xs text-gray-500">Déclenchés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3 bg-amber-50 rounded-xl">
            <Clock className="h-6 w-6 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-600">{binomesNonDeclenches.length}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3 bg-blue-50 rounded-xl">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{binomes.length}</p>
              <p className="text-xs text-gray-500">Total binômes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {binomesNonDeclenches.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Déclencher les binômes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barre d'actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Tout sélectionner ({binomesNonDeclenches.length})
                </Button>
                {selected.length > 0 && (
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Désélectionner
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {selected.length > 0 && (
                  <Button
                    size="sm"
                    disabled={sending}
                    onClick={handleDeclencherSelection}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Déclencher sélection ({selected.length})
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={sending}
                  onClick={handleDeclencherTout}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Déclencher tout ({binomesNonDeclenches.length})
                </Button>
              </div>
            </div>

            {/* Liste des binômes non déclenchés */}
            <div className="space-y-2">
              {binomesNonDeclenches.map(binome => (
                <div key={binome.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={selected.includes(binome.id)}
                    onCheckedChange={() => toggleSelect(binome.id)}
                    disabled={sending}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {binome.mentor_name} ↔ {binome.mentore_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {binome.mentor_email} · {binome.mentore_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {binome.pdf_url ? (
                      <Badge className="bg-emerald-50 text-emerald-700 text-xs">PDF ✓</Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-600 text-xs">Sans PDF</Badge>
                    )}
                    <Badge className="bg-amber-50 text-amber-700 text-xs">En attente</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats d'envoi */}
      {results.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Résultats d'envoi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.status === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {r.status === 'success'
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  : <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                }
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.nom}</p>
                  {r.status === 'error' && <p className="text-xs text-red-600">{r.message}</p>}
                  {r.status === 'success' && <p className="text-xs text-emerald-600">Emails envoyés avec succès</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Binômes déjà déclenchés */}
      {binomesDeclenches.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Binômes déjà déclenchés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {binomesDeclenches.map(binome => (
              <div key={binome.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {binome.mentor_name} ↔ {binome.mentore_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Déclenché le {binome.declenche_date
                      ? new Date(binome.declenche_date).toLocaleDateString('fr-FR')
                      : '—'}
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">Déclenché ✓</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {binomes.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Aucun binôme actif trouvé</p>
        </div>
      )}
    </div>
  );
}
