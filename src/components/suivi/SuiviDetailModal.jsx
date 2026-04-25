import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle, Calendar, Clock, Users, CheckCircle2 } from 'lucide-react';

const StarRating = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} className={`h-4 w-4 ${n <= value ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
    ))}
  </div>
);

const Field = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{value}</p>
    </div>
  );
};

export default function SuiviDetailModal({ suivi, open, onClose }) {
  if (!suivi) return null;

  const formatDate = (d) => {
    if (!d) return '-';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const formatLabels = { presentiel: 'Présentiel', virtuel: 'Virtuel (Zoom/WhatsApp)' };
  const submittedLabels = { mentor: 'Mentor', mentore: 'Mentoré', both: 'Les deux ensemble' };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1e5631] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Rencontre #{suivi.meeting_number} — {formatDate(suivi.meeting_date)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Binôme', value: `${suivi.mentor_name} ↔ ${suivi.mentore_name}` },
              { label: 'Format', value: formatLabels[suivi.format] || suivi.format },
              { label: 'Durée', value: `${suivi.duration_hours}h` },
              { label: 'Soumis par', value: submittedLabels[suivi.submitted_by] || suivi.submitted_by }
            ].map(item => (
              <div key={item.label} className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-xs font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Content fields */}
          <Field label="Objectifs SMART abordés" value={suivi.objectives_discussed} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Succès récents du mentoré" value={suivi.successes} />
            <Field label="Défis rencontrés" value={suivi.challenges} />
          </div>
          <Field label="Conseils donnés par le mentor" value={suivi.advice_given} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Actions pour le mentoré" value={suivi.action_items_mentore} />
            <Field label="Actions pour le mentor" value={suivi.action_items_mentor} />
          </div>

          {/* Next meeting */}
          {suivi.next_meeting_date && (
            <div className="flex items-center gap-2 text-sm text-[#1e5631] bg-emerald-50 rounded-lg p-3">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Prochaine rencontre prévue : <strong>{formatDate(suivi.next_meeting_date)}</strong></span>
            </div>
          )}

          {/* Ratings */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Évaluations de la rencontre</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Satisfaction mentor</p>
                <StarRating value={suivi.satisfaction_mentor} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Satisfaction mentoré</p>
                <StarRating value={suivi.satisfaction_mentore} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Progrès perçus</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`h-4 w-4 ${n <= suivi.progress_rating ? 'text-emerald-500 fill-emerald-500' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Issues */}
          {suivi.issues_reported && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-semibold text-red-700">Signalement enregistré</p>
              </div>
              {suivi.issue_description && (
                <p className="text-sm text-red-600">{suivi.issue_description}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}