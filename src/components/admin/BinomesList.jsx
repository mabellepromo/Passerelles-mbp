import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatName } from '@/lib/formatName';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NotificationBinomesModal from './NotificationBinomesModal';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Eye,
  Link2,
  Calendar,
  Target,
  Pause,
  Play,
  XCircle,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusColors = {
  active: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-amber-100 text-amber-800',
  completed: 'bg-blue-100 text-blue-800',
  terminated: 'bg-red-100 text-red-800'
};

const statusLabels = {
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
  terminated: 'Rompu'
};

export default function BinomesList({ binomes }) {
  const [search, setSearch] = useState('');
  const [selectedBinome, setSelectedBinome] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Binome.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['binomes'] });
    }
  });

  const filteredBinomes = binomes.filter(b => 
    b.mentor_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.mentore_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <CardTitle>Binômes Mentor/Mentoré</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotifModal(true)}
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Notifier les binômes
            </Button>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Binôme</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Rencontres</TableHead>
                <TableHead>Dernière rencontre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBinomes.map(binome => (
                <TableRow key={binome.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="font-medium">{formatName(binome.mentor_name)}</p>
                        <p className="text-sm text-gray-500">↔ {formatName(binome.mentore_name)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {binome.match_score ? `${binome.match_score}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {binome.total_meetings || 0}
                  </TableCell>
                  <TableCell>
                    {binome.last_meeting_date 
                      ? format(new Date(binome.last_meeting_date), 'dd MMM yyyy', { locale: fr })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[binome.status]}>
                      {statusLabels[binome.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedBinome(binome)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBinomes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucun binôme trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <NotificationBinomesModal
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        binomes={binomes}
      />

      {/* Detail Dialog */}
      <Dialog open={!!selectedBinome} onOpenChange={() => setSelectedBinome(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du Binôme</DialogTitle>
          </DialogHeader>
          {selectedBinome && (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-emerald-700">
                      {selectedBinome.mentor_name?.charAt(0)}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{formatName(selectedBinome.mentor_name)}</p>
                  <p className="text-xs text-gray-500">Mentor</p>
                </div>
                <Link2 className="h-6 w-6 text-gray-400" />
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-purple-700">
                      {selectedBinome.mentore_name?.charAt(0)}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{formatName(selectedBinome.mentore_name)}</p>
                  <p className="text-xs text-gray-500">Mentoré</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Apparié le {selectedBinome.match_date && format(new Date(selectedBinome.match_date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Target className="h-4 w-4" />
                  <span>Score: {selectedBinome.match_score || '-'}%</span>
                </div>
              </div>

              {selectedBinome.objectives?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Objectifs</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    {selectedBinome.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Modifier le statut</label>
                <Select 
                  value={selectedBinome.status} 
                  onValueChange={(v) => {
                    updateStatusMutation.mutate({ id: selectedBinome.id, status: v });
                    setSelectedBinome({ ...selectedBinome, status: v });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="paused">En pause</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="terminated">Rompu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}