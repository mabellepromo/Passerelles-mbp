import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Eye,
  Star,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SuivisList({ suivis }) {
  const [search, setSearch] = useState('');
  const [selectedSuivi, setSelectedSuivi] = useState(null);

  const filteredSuivis = suivis.filter(s => 
    s.mentor_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.mentore_name?.toLowerCase().includes(search.toLowerCase())
  );

  const StarRating = ({ value }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <CardTitle>Fiches de Suivi Mensuel</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Binôme</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Satisfaction</TableHead>
                <TableHead>Progrès</TableHead>
                <TableHead>Signalement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuivis.map(suivi => (
                <TableRow key={suivi.id} className={suivi.issues_reported ? 'bg-red-50' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{suivi.mentor_name}</p>
                      <p className="text-sm text-gray-500">↔ {suivi.mentore_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {suivi.meeting_date && format(new Date(suivi.meeting_date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {suivi.duration_hours}h
                  </TableCell>
                  <TableCell>
                    <StarRating value={Math.round(((suivi.satisfaction_mentor || 0) + (suivi.satisfaction_mentore || 0)) / 2)} />
                  </TableCell>
                  <TableCell>
                    <StarRating value={suivi.progress_rating} />
                  </TableCell>
                  <TableCell>
                    {suivi.issues_reported ? (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Oui
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Non
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedSuivi(suivi)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSuivis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Aucune fiche de suivi trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSuivi} onOpenChange={() => setSelectedSuivi(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Suivi</DialogTitle>
          </DialogHeader>
          {selectedSuivi && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{selectedSuivi.mentor_name} ↔ {selectedSuivi.mentore_name}</h3>
                  <p className="text-sm text-gray-500">
                    Rencontre #{selectedSuivi.meeting_number} - {selectedSuivi.meeting_date && format(new Date(selectedSuivi.meeting_date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <Badge variant="outline">
                  {selectedSuivi.format === 'presentiel' ? 'Présentiel' : 'Virtuel'} - {selectedSuivi.duration_hours}h
                </Badge>
              </div>

              {selectedSuivi.issues_reported && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    Problème Signalé
                  </div>
                  <p className="text-sm text-red-600">{selectedSuivi.issue_description}</p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Satisfaction Mentor</p>
                  <StarRating value={selectedSuivi.satisfaction_mentor} />
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Satisfaction Mentoré</p>
                  <StarRating value={selectedSuivi.satisfaction_mentore} />
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Progrès</p>
                  <StarRating value={selectedSuivi.progress_rating} />
                </div>
              </div>

              <div className="space-y-4">
                {selectedSuivi.objectives_discussed && (
                  <div>
                    <h4 className="font-semibold mb-1">Objectifs abordés</h4>
                    <p className="text-sm text-gray-600">{selectedSuivi.objectives_discussed}</p>
                  </div>
                )}

                {selectedSuivi.successes && (
                  <div>
                    <h4 className="font-semibold mb-1">Succès</h4>
                    <p className="text-sm text-gray-600">{selectedSuivi.successes}</p>
                  </div>
                )}

                {selectedSuivi.challenges && (
                  <div>
                    <h4 className="font-semibold mb-1">Défis</h4>
                    <p className="text-sm text-gray-600">{selectedSuivi.challenges}</p>
                  </div>
                )}

                {selectedSuivi.advice_given && (
                  <div>
                    <h4 className="font-semibold mb-1">Conseils donnés</h4>
                    <p className="text-sm text-gray-600">{selectedSuivi.advice_given}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {selectedSuivi.action_items_mentore && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold mb-1 text-purple-800">Actions Mentoré</h4>
                      <p className="text-sm text-purple-700">{selectedSuivi.action_items_mentore}</p>
                    </div>
                  )}
                  {selectedSuivi.action_items_mentor && (
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <h4 className="font-semibold mb-1 text-emerald-800">Actions Mentor</h4>
                      <p className="text-sm text-emerald-700">{selectedSuivi.action_items_mentor}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSuivi.next_meeting_date && (
                <div className="pt-4 border-t text-sm text-gray-500">
                  Prochaine rencontre prévue: {format(new Date(selectedSuivi.next_meeting_date), 'dd MMMM yyyy', { locale: fr })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}