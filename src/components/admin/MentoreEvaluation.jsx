import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Sparkles, Loader2 } from 'lucide-react';

const CRITERIA = {
  motivation: [
    { key: 'motivation_authenticite', label: 'Authenticité', max: 15 },
    { key: 'motivation_clarte', label: 'Clarté objectifs', max: 10 },
    { key: 'motivation_alignement', label: 'Alignement MBP', max: 5 }
  ],
  niveau: [
    { key: 'niveau_inscription', label: 'Inscription L3/M1/M2', max: 10 },
    { key: 'niveau_performance', label: 'Performance académique', max: 10 },
    { key: 'niveau_pertinence', label: 'Pertinence parcours', max: 5 }
  ],
  disponibilite: [
    { key: 'disponibilite_calendrier', label: 'Respect calendrier', max: 10 },
    { key: 'disponibilite_activites', label: 'Activités collectives', max: 7 },
    { key: 'disponibilite_engagement', label: 'Engagement déclaré', max: 3 }
  ],
  engagement: [
    { key: 'engagement_associatif', label: 'Implication associative', max: 10 },
    { key: 'engagement_valeurs', label: 'Alignement valeurs MBP', max: 10 },
    { key: 'engagement_leadership', label: 'Potentiel leadership', max: 5 }
  ]
};

export default function MentoreEvaluation({ mentore, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [adminScores, setAdminScores] = useState(mentore?.admin_evaluation || {});
  const [adminComment, setAdminComment] = useState(mentore?.admin_evaluation?.commentaire_admin || '');
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);

  const runAIEvaluation = async () => {
    setIsEvaluatingAI(true);
    const prompt = `Tu es un expert en sélection de candidats pour un programme de mentorat juridique au Togo appelé "PASSERELLES" de l'association Ma Belle Promo (MBP).

Évalue ce candidat mentoré selon les critères suivants et retourne les scores exacts :

**Candidat :**
- Nom : ${mentore.full_name}
- Niveau : ${mentore.level || 'N/A'}
- Université : ${mentore.university || 'N/A'}
- Moyenne : ${mentore.average_grade || 'N/A'}/20
- Spécialisation : ${mentore.specialization || 'N/A'}
- Objectifs carrière : ${(mentore.career_goals || []).join(', ') || 'N/A'}
- Intérêts juridiques : ${(mentore.interests || []).join(', ') || 'N/A'}
- Disponibilité : ${mentore.availability || 'N/A'}
- Format préféré : ${mentore.preferred_format || 'N/A'}
- Engagement civique : ${mentore.civic_engagement || 'N/A'}
- Lettre de motivation : ${mentore.motivation_letter || 'N/A'}

**Grille de notation (total 100 points) :**
1. motivation_authenticite (max 15) : Authenticité de la motivation
2. motivation_clarte (max 10) : Clarté des objectifs
3. motivation_alignement (max 5) : Alignement avec les valeurs MBP (bienveillance, équité, intégrité, responsabilité)
4. niveau_inscription (max 10) : Niveau d'inscription (L3=6, M1=8, M2=10)
5. niveau_performance (max 10) : Performance académique (note/20 → /10)
6. niveau_pertinence (max 5) : Pertinence du parcours pour le mentorat
7. disponibilite_calendrier (max 10) : Respect du calendrier du programme
8. disponibilite_activites (max 7) : Participation aux activités collectives
9. disponibilite_engagement (max 3) : Engagement déclaré
10. engagement_associatif (max 10) : Implication associative et civique
11. engagement_valeurs (max 10) : Alignement avec les valeurs MBP
12. engagement_leadership (max 5) : Potentiel de leadership

Retourne aussi un commentaire général sur le candidat.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          motivation_authenticite: { type: 'number' },
          motivation_clarte: { type: 'number' },
          motivation_alignement: { type: 'number' },
          niveau_inscription: { type: 'number' },
          niveau_performance: { type: 'number' },
          niveau_pertinence: { type: 'number' },
          disponibilite_calendrier: { type: 'number' },
          disponibilite_activites: { type: 'number' },
          disponibilite_engagement: { type: 'number' },
          engagement_associatif: { type: 'number' },
          engagement_valeurs: { type: 'number' },
          engagement_leadership: { type: 'number' },
          commentaire_ai: { type: 'string' }
        }
      }
    });

    const total = Object.keys(CRITERIA).reduce((t, cat) =>
      t + CRITERIA[cat].reduce((s, c) => s + (result[c.key] || 0), 0), 0);

    const aiEvalData = { ...result, total_ai: total };

    await base44.entities.Mentore.update(mentore.id, {
      ai_evaluation: aiEvalData,
      selection_score: total
    });

    queryClient.invalidateQueries({ queryKey: ['mentores'] });
    // Update local view
    mentore.ai_evaluation = aiEvalData;
    mentore.selection_score = total;
    setIsEvaluatingAI(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Mentore.update(mentore.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentores'] });
      onClose();
    }
  });

  if (!mentore) return null;

  const aiEval = mentore.ai_evaluation || {};
  const adminEval = mentore.admin_evaluation || {};

  const calculateTotal = (scores) => {
    return Object.keys(CRITERIA).reduce((total, category) => {
      return total + CRITERIA[category].reduce((catTotal, criterion) => {
        return catTotal + (scores[criterion.key] || 0);
      }, 0);
    }, 0);
  };

  const handleScoreChange = (key, value) => {
    const numValue = Math.max(0, Number(value));
    setAdminScores(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = () => {
    const totalAdmin = calculateTotal(adminScores);
    updateMutation.mutate({
      admin_evaluation: {
        ...adminScores,
        total_admin: totalAdmin,
        commentaire_admin: adminComment
      },
      selection_score: totalAdmin
    });
  };

  const aiTotal = aiEval.total_ai || 0;
  const adminTotal = calculateTotal(adminScores);
  const finalScore = adminTotal > 0 ? adminTotal : aiTotal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Évaluation - {mentore.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Summary */}
          <div className="flex justify-end mb-2">
            <Button
              onClick={runAIEvaluation}
              disabled={isEvaluatingAI}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {isEvaluatingAI
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Évaluation en cours...</>
                : <><Sparkles className="h-4 w-4" /> Évaluer avec l'IA</>
              }
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Score IA</p>
                <p className="text-3xl font-bold text-blue-600">{aiTotal}/100</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Score Admin</p>
                <p className="text-3xl font-bold text-green-600">{adminTotal}/100</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-purple-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Score Final</p>
                <p className="text-3xl font-bold text-purple-600">{finalScore}/100</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="evaluation" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
              <TabsTrigger value="profile">Profil Candidat</TabsTrigger>
            </TabsList>

            <TabsContent value="evaluation" className="space-y-6">
              {/* Motivation */}
              <Card>
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg">Motivation (30 points)</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {CRITERIA.motivation.map(criterion => (
                      <div key={criterion.key} className="grid grid-cols-3 gap-4 items-center">
                        <Label className="text-sm">{criterion.label}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50">
                            IA: {aiEval[criterion.key] || 0}/{criterion.max}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={criterion.max}
                            value={adminScores[criterion.key] || ''}
                            onChange={(e) => handleScoreChange(criterion.key, e.target.value)}
                            placeholder={`/${criterion.max}`}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">/{criterion.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Niveau d'Études */}
              <Card>
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg">Niveau d'Études (25 points)</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {CRITERIA.niveau.map(criterion => (
                      <div key={criterion.key} className="grid grid-cols-3 gap-4 items-center">
                        <Label className="text-sm">{criterion.label}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50">
                            IA: {aiEval[criterion.key] || 0}/{criterion.max}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={criterion.max}
                            value={adminScores[criterion.key] || ''}
                            onChange={(e) => handleScoreChange(criterion.key, e.target.value)}
                            placeholder={`/${criterion.max}`}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">/{criterion.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Disponibilité */}
              <Card>
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg">Disponibilité (20 points)</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {CRITERIA.disponibilite.map(criterion => (
                      <div key={criterion.key} className="grid grid-cols-3 gap-4 items-center">
                        <Label className="text-sm">{criterion.label}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-50">
                            IA: {aiEval[criterion.key] || 0}/{criterion.max}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={criterion.max}
                            value={adminScores[criterion.key] || ''}
                            onChange={(e) => handleScoreChange(criterion.key, e.target.value)}
                            placeholder={`/${criterion.max}`}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">/{criterion.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Engagement */}
              <Card>
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg">Engagement (25 points)</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {CRITERIA.engagement.map(criterion => (
                      <div key={criterion.key} className="grid grid-cols-3 gap-4 items-center">
                        <Label className="text-sm">{criterion.label}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-50">
                            IA: {aiEval[criterion.key] || 0}/{criterion.max}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={criterion.max}
                            value={adminScores[criterion.key] || ''}
                            onChange={(e) => handleScoreChange(criterion.key, e.target.value)}
                            placeholder={`/${criterion.max}`}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-500">/{criterion.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Commentaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Commentaire IA :</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">{aiEval.commentaire_ai || 'Aucun commentaire'}</p>
                  </div>
                  <div>
                    <Label>Commentaire Administrateur :</Label>
                    <Textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Ajoutez vos observations..."
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSave} className="w-full bg-[#1e5631] hover:bg-[#2d7a47]">
                <Save className="mr-2 h-4 w-4" />
                Enregistrer l'évaluation
              </Button>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du Candidat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>Email :</strong> {mentore.email}</div>
                    <div><strong>Téléphone :</strong> {mentore.phone}</div>
                    <div><strong>Université :</strong> {mentore.university}</div>
                    <div><strong>Niveau :</strong> {mentore.level}</div>
                    <div><strong>Moyenne :</strong> {mentore.average_grade || 'N/A'}/20</div>
                    <div><strong>Ville :</strong> {mentore.city}</div>
                  </div>
                  <div><strong>Objectifs :</strong> {mentore.career_goals?.join(', ') || 'N/A'}</div>
                  <div><strong>Intérêts :</strong> {mentore.interests?.join(', ') || 'N/A'}</div>
                  <div>
                    <strong>Engagement civique :</strong>
                    <p className="mt-1 bg-gray-50 p-2 rounded">{mentore.civic_engagement || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <strong>Lettre de motivation :</strong>
                    <p className="mt-1 bg-gray-50 p-2 rounded whitespace-pre-wrap">{mentore.motivation_letter}</p>
                  </div>
                  
                  {mentore.documents_urls?.length > 0 && (
                    <div>
                      <strong>Documents justificatifs :</strong>
                      <div className="mt-2 space-y-2">
                        {mentore.documents_urls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Document {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}