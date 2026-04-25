/**
 * Reformate un nom au format "NOM Prénoms"
 * Détecte les mots entièrement en majuscules comme le nom de famille,
 * et les place en premier, suivis des prénoms en Title Case.
 *
 * Exemples :
 *   "Florent Folly MESSAN"       → "MESSAN Florent Folly"
 *   "KOUTOH Kokou Georges"       → "KOUTOH Kokou Georges" (déjà bon)
 *   "M'BELOU Eslie Lootiyé"      → "M'BELOU Eslie Lootiyé"
 *   "Olive Bonaventure AYENA"    → "AYENA Olive Bonaventure"
 *   "Claude Kokou AMEGAN"        → "AMEGAN Claude Kokou"
 */
export function formatName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);

  // Un mot est considéré comme "NOM" s'il est entièrement en majuscules
  // (on ignore les apostrophes, tirets, accents)
  const isLastName = (word) => {
    const letters = word.replace(/['\-]/g, '');
    return letters.length > 1 && letters === letters.toUpperCase() && /[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ]/.test(letters);
  };

  const lastNames = parts.filter(isLastName);
  const firstNames = parts.filter(p => !isLastName(p));

  if (lastNames.length === 0) return fullName; // Pas de NOM détecté, retourner tel quel

  return [...lastNames, ...firstNames].join(' ');
}