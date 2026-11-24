// src/lib/bilanBureau/defaultSections.js
// Textes de départ du bilan « version bureau » (24 novembre 2026), repris du
// document de référence « Rapport_bilan_PASSERELLES_cohorte1_interne ».
//
// Ces textes ne servent QU'À PRÉREMPLIR un nouveau rapport : une fois le
// rapport créé, ils sont stockés en base (review_reports.ai_analysis.sections)
// et modifiés par l'admin dans l'onglet « Rapport ».
//
// Aucun chiffre n'est écrit ici : chaque chiffre est un repère {{cle}}
// calculé par values.js, et chaque tableau ou graphique calculé un repère
// {{bloc:nom}} (voir BureauBlocks). Seuls restent en clair les éléments qui ne
// sont pas des données : numéros de section, seuil proposé de 8 mentors,
// rythme d'un échange par mois, notes de l'échelle (« 6 ou moins »...).
// La syntaxe de mise en forme est décrite dans markup.js.

export const DEFAULT_TITLE = 'PASSERELLES — Bilan de la cohorte 1 et avenir du programme';

export const DEFAULT_SECTIONS = [
  {
    key: 'avertissement',
    title: '',
    body: `**Document interne, nominatif, destiné au bureau de Ma Belle Promo.** Il ne doit pas être diffusé aux participants ni à des partenaires en l'état.

Périmètre : {{binomes}} binômes officiels, binôme de test exclu ; sondage de bilan clos le {{sondage_fin}}.

Les éléments de contexte sur l'association (section 2) proviennent du bureau. Ils ne sont pas mesurés par le sondage, et sont présentés comme tels.`,
  },
  {
    key: 'resume',
    title: '1. Résumé exécutif',
    body: `**Les données de la cohorte 1 ne justifient pas, à elles seules, le lancement d'une cohorte 2 dans les conditions actuelles.** Le programme a produit des résultats réels pour une partie des mentorés. Mais il repose sur des mentors que l'association peine à mobiliser, et ce sont eux qui en tirent le moins de bénéfice.

**Ce que le programme a apporté.** Sur {{binomes}} binômes, {{rel_active}} décrivent une relation active, avec des apports concrets cités par les participants : stages, orientation de carrière, aide au mémoire, confiance retrouvée. Les mentorés recommandent nettement le programme : {{mentores_promoteurs}} promoteurs sur {{mentores_repondants}} répondants.

**Ce qui n'a pas tenu.** {{rel_difficulte}} binômes sur {{binomes}} ont connu un démarrage limité ({{rel_limitee}}) ou une relation jamais établie ({{rel_non_etablie}}), le plus souvent faute de disponibilité du mentor. L'atteinte des objectifs est jugée faible par les mentorés ({{mentores_objectifs_haut}} sur {{mentores_repondants}} seulement donne 4 ou plus ; moyenne {{mentores_objectifs_moy}} sur 5) ; les mentors sont partagés ({{mentors_objectifs_haut}} sur {{mentors_repondants}} donnent 4, {{mentors_objectifs_1}} donnent 1 ; moyenne {{mentors_objectifs_moy}} sur 5).

**Le point décisif : les mentors.** Le recrutement a épuisé le vivier : {{binomes}} mentors engagés sur {{cand_mentors}} candidatures, tous membres de l'association, contre {{cand_mentores}} candidatures de mentorés. Chez les mentors répondants, la recommandation est à l'équilibre ({{mentors_promoteurs}} promoteurs, {{mentors_detracteurs}} détracteurs sur {{mentors_repondants}}, NPS {{nps_mentors}}), et {{mentors_benefice_bas}} sur {{mentors_repondants}} jugent l'expérience peu ou pas bénéfique pour eux (note de 1 ou 2 sur 5, dont {{mentors_benefice_1}} « pas du tout »). {{mentors_non_repondants}} mentors sur {{mentors_invites}} n'ont pas répondu au sondage, malgré les relances.

**L'engouement restant existe, mais il est surtout du côté des bénéficiaires.** L'intérêt déclaré pour une nouvelle expérience ({{mentors_interesses}} mentors sur {{mentors_interet_n}}, {{mentores_interesses}} mentorés sur {{mentores_interet_n}}) est une réponse hypothétique, donnée sous son nom, à l'association dont on est membre. Il ne vaut pas engagement et ne compense pas les autres signaux (section 3).

**Recommandation.** Ne pas lancer de cohorte 2 sur la seule base de ce sondage. Le bureau a deux options réalistes : une clôture en bon ordre, ou une mise en sommeil avec une condition claire de relance, vérifiable avant tout appel à candidatures (section 6). Dans les deux cas, la cohorte 1 mérite d'être close proprement : attestations, remerciements, sort des données (section 7).`,
  },
  {
    key: 'contexte',
    title: "2. Contexte : l'association et la question de l'avenir",
    body: `**Le bureau envisage d'arrêter à la fois le programme PASSERELLES et l'association Ma Belle Promo.** Cette section rapporte la position du bureau ; elle n'est pas tirée du sondage.

- **Un engouement en baisse.** Selon le bureau, la mobilisation des membres de l'association s'est essoufflée.
- **Des mentors tous issus de l'association.** Les {{binomes}} mentors de la cohorte 1 sont membres de Ma Belle Promo. Le programme dépend donc directement de la vitalité de l'association : si elle décline, le vivier de mentors décline avec elle.
- **Un recrutement déjà difficile.** Trouver des mentors pour la cohorte 1 a été très difficile. Les chiffres le confirment : {{cand_mentors}} candidatures de mentors pour {{binomes}} places, quand {{cand_mentores}} étudiants ont postulé.
- **Un doute sur la capacité à mener une cohorte 2 à son terme.** Le bureau craint de rencontrer les mêmes difficultés, aggravées par la baisse d'engagement.
- **Le souhait du bureau** est de tout arrêter, le programme et l'association. Il constate pourtant, à la lecture du sondage, qu'un peu d'engouement subsiste.

**Une première lecture du sondage, écrite pour préparer une cohorte 2.** Une première analyse des résultats partait du principe qu'une cohorte 2 allait suivre. Elle voyait l'enjeu principal dans la lourdeur du suivi sur la plateforme, prenait les réponses du sondage telles quelles, présentait l'intérêt pour une nouvelle expérience comme un résultat, et recommandait un nouveau dispositif de suivi. Ce rapport repart des mêmes données, sans changer aucun chiffre, mais avec une autre question : il explique les biais du sondage (sondage nominatif, non-réponse, relances), confronte l'intérêt déclaré aux autres réponses des mentors, et place au centre la disponibilité des mentors et l'état de l'association. Le dispositif de suivi est renvoyé en annexe B.

La question à laquelle ce rapport tente de répondre est donc : **le sondage montre-t-il un engouement assez solide pour remettre en cause le souhait d'arrêter ?**`,
  },
  {
    key: 'methodologie',
    title: '3. Méthodologie, limites et biais du sondage',
    body: `**Le sondage surestime très probablement l'engouement réel.** Plusieurs biais vont dans le même sens, et aucun ne joue en sens inverse de façon comparable.

**Sources.** Sondage de bilan par lien personnel (ouvert du {{sondage_debut}} au {{sondage_fin}}) ; données de la plateforme (binômes, fiches de séance, journal de bord, messagerie) ; position du bureau pour le contexte. Effectifs : {{reponses}} réponses sur {{invites}} personnes invitées, soit {{mentors_repondants}} mentors sur {{mentors_invites}} et {{mentores_repondants}} mentorés sur {{mentores_invites}}.

| Biais | Ce qui s'est passé | Effet probable sur les résultats |
|---|---|---|
| Sondage nominatif | Chaque réponse était rattachée à son auteur. Les mentors répondaient à l'association dont ils sont membres, les mentorés à l'organisme qui les a sélectionnés. | Réponses plus positives que l'avis réel, surtout sur les questions d'image (recommandation, envie de recommencer). |
| Non-réponse | {{mentors_non_repondants}} mentors sur {{mentors_invites}} n'ont pas répondu, dont au moins un décrit comme injoignable par sa mentorée. | Les moins engagés sont absents : la moyenne des mentors est calculée sur les plus investis. |
| Réponses obtenues par relance | {{reponses_avant_relance}} réponses seulement avant la première relance ; {{invitations}} invitations, {{relances_email}} relances par email, puis des relances personnelles par WhatsApp. {{reponses_periode_relance}} réponses sont arrivées pendant cette période de relance. | Une partie des réponses traduit la sollicitation de la coordination plutôt qu'un élan spontané. |
| Question hypothétique | L'intérêt pour une nouvelle expérience était posé « hypothétiquement », sans date ni engagement. | Dire oui ne coûte rien : cette question mesure une sympathie, pas une disponibilité. |
| Petits effectifs | {{mentors_repondants}} mentors, {{mentores_repondants}} mentorés. Une réponse de mentor déplace leur NPS d'environ {{nps_poids_mentor}} points. | Les chiffres sont des tendances, pas des mesures précises. |

**Ce qui limite ces biais.** Les répondants n'ont pas tous été complaisants : {{mentors_detracteurs}} mentors sur {{mentors_repondants}} donnent une note de recommandation de 6 ou moins, et plusieurs réponses libres sont critiques. Les résultats négatifs sont donc probablement fiables ; ce sont les résultats positifs qu'il faut lire avec prudence.

**Autres limites.**

- Le nombre de séances n'est pas présenté : une partie des séances n'a pas été enregistrée sur la plateforme ({{binomes_avec_fiche}} binômes sur {{binomes}} ont rempli au moins une fiche).
- Les objectifs n'ont été saisis sur la plateforme que par {{binomes_avec_objectifs}} binôme sur {{binomes}} : leur atteinte n'est connue que par le sondage.
- La note de satisfaction des fiches de séance n'est pas interprétée : toutes les valeurs sont égales à la valeur préremplie ({{note_fiche_preremplie}} sur 5).
- Le classement des binômes (actif, limité, non établi) est qualitatif, établi à partir des réponses.`,
  },
  {
    key: 'resultats',
    title: '4. Résultats : ce que disent les données',
    body: `**Les résultats se séparent nettement selon le rôle : les mentorés, bénéficiaires, sont satisfaits ; les mentors, qui donnent leur temps, le sont beaucoup moins.**

**Les mentorés recommandent le programme, les mentors sont partagés**

{{bloc:nps_roles}}

Avec {{mentors_repondants}} réponses de mentors, une seule réponse déplace leur NPS d'environ {{nps_poids_mentor}} points. L'écart entre les deux rôles est une tendance nette, pas une mesure précise.

## Les mentorés : un bénéfice réel mais inégal

{{bloc:table_mentores}}

Les mentorés apprécient la relation plus que ses résultats : la confiance et la relation sont bien notées, l'atteinte des objectifs et la clarté de l'orientation beaucoup moins. Les apports concrets cités (stages, orientation, mémoire) existent, mais pour une partie des binômes seulement.

## Les mentors : un engagement coûteux et peu rendu

{{bloc:table_mentors}}

Les mentors se divisent en deux groupes de taille comparable : ceux pour qui le binôme a fonctionné, et ceux pour qui il n'a rien donné. Et {{mentors_non_repondants}} mentors sur {{mentors_invites}} ne se sont pas exprimés du tout.

## Les binômes : un sur deux a vraiment fonctionné

{{bloc:table_relations}}

Le thème le plus cité dans les réponses libres est la disponibilité et la continuité du mentor ({{mentions_disponibilite}} mentions). Dans les binômes qui n'ont pas démarré, les mentorés décrivent des messages restés sans réponse. La liste nominative figure en annexe A.

## L'envie de recommencer : un chiffre à ne pas surinterpréter

{{mentors_interesses}} mentors sur {{mentors_interet_n}} et {{mentores_interesses}} mentorés sur {{mentores_interet_n}} se disent intéressés par une nouvelle expérience de mentorat. Ce chiffre contredit les autres réponses des mentors :

{{bloc:table_envie}}

Rapporté aux {{mentors_invites}} mentors, l'intérêt déclaré concerne au mieux {{mentors_interesses}} personnes, sans date ni engagement. C'est là que le biais du sondage nominatif pèse le plus (section 3).`,
  },
  {
    key: 'analyse',
    title: '5. Analyse : le programme face à ses contraintes',
    body: `**Le programme répond à un vrai besoin, mais sa ressource clé, le temps des mentors, est précisément celle qui manque.** C'est cette asymétrie, plus que la qualité du dispositif, qui décide de son avenir.

**1. La demande existe.** {{cand_mentores}} étudiants ont candidaté pour {{binomes}} places, et les mentorés qui ont eu un mentor disponible en ont tiré profit. Arrêter le programme, c'est renoncer à un service que des étudiants attendent : ce coût doit être dit.

**2. L'offre de mentors est le goulot d'étranglement.** Le vivier a été entièrement mobilisé pour la cohorte 1 ({{binomes}} mentors sur {{cand_mentors}} candidatures), et il est entièrement adossé à une association dont l'engagement baisse. Une cohorte 2 demanderait de retrouver au moins autant de mentors, dans un contexte moins favorable que la première fois.

**3. Les mentors n'ont pas été assez payés de retour.** {{mentors_benefice_bas}} mentors répondants sur {{mentors_repondants}} jugent l'expérience peu ou pas bénéfique pour eux (note de 1 ou 2 sur 5), et {{mentors_non_repondants}} sur {{mentors_invites}} ne se sont pas exprimés. Un bénévolat qui ne rend rien se renouvelle mal : relancer les mêmes personnes sans changer ce qu'elles y gagnent exposerait aux mêmes défections.

**4. L'essentiel des échecs vient de la disponibilité, pas de l'outil.** La première lecture du sondage mettait l'accent sur la plateforme et les fiches de séance, jugées lourdes ({{suivi_lourd}} répondants sur {{reponses}}) et difficiles ({{suivi_difficile}} sur {{reponses}}). Ces critiques sont réelles, mais elles n'expliquent pas les {{rel_difficulte}} binômes en difficulté : dans 3 cas, c'est le mentor qui a manqué de disponibilité ou cessé de répondre ; dans 2 cas, c'est le mentoré qui n'a pas donné suite. Une personne qui ne répond pas ne répondra pas davantage à un check-in WhatsApp. Simplifier le suivi aurait amélioré la documentation, pas le nombre de binômes actifs.

**5. L'engouement restant est réel, mais il n'est pas là où le programme en a besoin.** Il vient surtout des mentorés, qui reçoivent. Chez les mentors, qui donnent, les signaux sont partagés et le sondage nominatif les flatte probablement. Ce reste d'engouement est un argument pour finir proprement et pour transmettre ; ce n'est pas, à lui seul, un argument pour relancer.

**Ce que le sondage ne dit pas.** Il ne mesure ni l'état de l'association, ni la disponibilité future de chaque mentor. La seule façon fiable de savoir si une cohorte 2 est possible est de demander un engagement ferme, daté, avant d'ouvrir les candidatures (section 6).`,
  },
  {
    key: 'options',
    title: '6. Options pour la suite',
    body: `**Recommandation : choisir entre une clôture en bon ordre et une mise en sommeil conditionnelle. Une cohorte 2 lancée maintenant, sur la seule foi du sondage, est l'option la plus risquée.** La décision appartient au bureau et, pour l'association, à ses membres.

| Option | Ce qu'elle implique | Avantages | Risques |
|---|---|---|---|
| **A. Clôture du programme** (et, si le bureau le confirme, de l'association) | Clore la cohorte 1, informer les participants, archiver ou supprimer les données, fermer la plateforme | Conforme au souhait du bureau ; fin nette et honorable ; aucun engagement pris qu'on ne pourrait tenir | Les {{mentores_non_retenus}} étudiants non retenus et les futurs candidats n'ont plus d'offre ; le savoir-faire acquis se perd s'il n'est pas transmis |
| **B. Mise en sommeil conditionnelle** | Clore la cohorte 1 de la même façon, conserver le dispositif, et ne relancer que si une condition fixée d'avance est remplie | Laisse une porte ouverte sans rien promettre ; teste l'engouement réel au lieu de le supposer | Peut s'éterniser si aucune date butoir n'est fixée ; coût de maintenance faible mais réel |
| **C. Cohorte 2 lancée dès maintenant** | Nouvel appel à mentors et à mentorés, nouveau dispositif de suivi | Répond à la demande étudiante | Fort risque de binômes sans mentor disponible, donc d'étudiants déçus ; contraire au souhait du bureau et à l'état de l'association |

## Si l'option B est retenue : une condition de relance vérifiable

La relance ne se décide pas sur une intention, mais sur un engagement. Exemple de condition, à ajuster par le bureau :

1. Un appel à engagement est envoyé aux mentors potentiels, avec une date limite.
2. Chaque mentor s'engage par écrit sur une durée, un rythme minimal (un échange par mois) et une disponibilité réelle.
3. Un coordinateur disponible pour la durée de la cohorte est identifié nommément.
4. Seuil fixé d'avance : si le nombre d'engagements fermes est inférieur au seuil retenu (par exemple 8 mentors) à la date limite, le programme est clôturé sans autre débat.
5. Les candidatures étudiantes ne sont ouvertes qu'après, et au nombre de mentors engagés.

Le seuil de 8 mentors est une proposition, pas un chiffre issu des données. L'essentiel est qu'il soit fixé avant l'appel, pour que la décision ne dépende pas des réponses.

**Une piste à étudier dans les deux cas : la transmission.** Si un autre acteur (la faculté, une autre association de juristes, un barreau) souhaitait reprendre le principe, la documentation de la cohorte 1 et ce rapport lui éviteraient de repartir de zéro. C'est une hypothèse de ce rapport : aucun contact n'a été pris à ce stade.

**Le dispositif de suivi simplifié** (check-in mensuel par lien personnel, rappels WhatsApp) n'a de sens que si une cohorte 2 a lieu. Il est décrit en annexe B pour cette éventualité.`,
  },
  {
    key: 'cloture',
    title: '7. Clore la cohorte 1 en bon ordre',
    body: `**Quelle que soit l'option retenue, la cohorte 1 doit être close proprement : c'est ce qui laissera un bon souvenir du programme aux {{participants}} participants.** Liste de tâches proposée :

## Les participants

[ ] Annoncer la fin de la cohorte 1 (et, le cas échéant, du programme) par un message personnel à chaque participant, avant toute annonce publique.
[ ] Délivrer une attestation de participation aux mentorés, et une attestation ou un mot de remerciement aux mentors.
[ ] Partager une synthèse courte et anonymisée des résultats avec les participants : ils ont répondu au sondage, ils ont droit à un retour.
[ ] Pour les binômes actifs qui souhaitent continuer, leur dire clairement qu'ils peuvent poursuivre librement, hors du cadre du programme.

## Les données personnelles

[ ] Fixer, dans le registre RGPD, la durée de conservation de chaque catégorie de données (candidatures, binômes, fiches, messages, réponses au sondage).
[ ] Supprimer ou anonymiser ce qui n'a plus de raison d'être conservé, en priorité les {{mentores_non_retenus}} candidatures non retenues et les documents joints.
[ ] Archiver hors ligne ce qui doit rester (rapport final, statistiques anonymes), puis désactiver les liens personnels du sondage.

## La plateforme

[ ] Suspendre le chantier « Coordination cohorte 2 » en cours dans Claude Code, sauf si l'option B est retenue.
[ ] Exporter les données à conserver, puis mettre en pause ou supprimer le projet Supabase et le site Vercel.

## L'association, si sa dissolution est confirmée

[ ] Vérifier dans les statuts la procédure de dissolution (organe compétent, quorum, majorité) et l'affectation des éventuels biens restants.
[ ] Faire voter la dissolution par l'organe prévu, puis accomplir les formalités auprès des autorités togolaises compétentes.

Ce rapport n'est pas un avis juridique : la procédure exacte dépend des statuts de Ma Belle Promo et du droit togolais applicable aux associations.`,
  },
  {
    key: 'conclusion',
    title: '8. Conclusion',
    body: `**PASSERELLES a tenu sa promesse pour une partie des étudiants, mais pas assez de ses mentors pour durer.** {{rel_active_lettres_maj}} binômes sur {{binomes_lettres}} ont fonctionné, et des étudiants en sont sortis avec un stage, une orientation ou de la confiance. C'est un résultat dont l'association peut être fière.

Mais le programme reposait sur l'engagement bénévole de membres d'une association qui s'essouffle, et plus de la moitié des mentors qui ont répondu ({{mentors_benefice_bas}} sur {{mentors_repondants}}) n'y ont pas trouvé leur compte. Le reste d'engouement visible dans le sondage est sincère, surtout chez les mentorés, mais il est gonflé par un sondage nominatif et par une question hypothétique. Il ne suffit pas à contredire le constat du bureau.

Arrêter n'est pas un échec si c'est fait proprement : en remerciant ceux qui ont donné de leur temps, en rendant compte aux participants, en protégeant leurs données et en transmettant ce qui a été appris. Si le bureau souhaite garder une porte ouverte, elle doit l'être sur une condition d'engagement fixe et datée, et non sur l'espoir que l'engouement revienne.`,
  },
  {
    key: 'annexe_a',
    title: 'Annexe A. Situation par binôme (document interne)',
    body: `{{bloc:annexe_binomes}}

Notes : note de recommandation du sondage (0 à 10). État de la relation : classement qualitatif établi à partir des réponses au sondage.`,
  },
  {
    key: 'annexe_b',
    title: "Annexe B. Dispositif de suivi simplifié, à n'utiliser qu'en cas de cohorte 2",
    body: `Résumé de la note « Passerelles — Simplifier les échanges entre binômes » :

- Un lien personnel par participant, sans identifiant ni mot de passe.
- Un check-in mensuel unique de moins d'une minute, à la place des fiches de séance.
- Un rappel WhatsApp le 25 du mois, une relance trois jours plus tard aux seuls non-répondants.
- Un point d'étape à mi-parcours et une procédure de réappariement quand un partenaire ne répond plus.
- Un test sur 2 ou 3 binômes pendant un mois avant toute généralisation.

Ce dispositif améliore la documentation du parcours ; il ne résout pas le manque de disponibilité des mentors (section 5).`,
  },
  {
    key: 'annexe_c',
    title: 'Annexe C. Figures détaillées',
    body: `Profil de la cohorte, questions notées et apports du mentorat. Ces figures portent sur les mêmes données que le rapport ; elles n'y sont pas commentées.

{{bloc:figures_annexe}}`,
  },
];

// Les constats par binôme (annexe A) ne sont PAS dans le code : ce sont des
// données sur des personnes. Ils sont saisis dans l'onglet « Rapport »
// (annexe A, champ « Constat ») et stockés en base avec le rapport.
