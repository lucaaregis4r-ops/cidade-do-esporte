/**
 * Historical Football Rules by Era (Macroetapa 21, E8).
 * Governs the rule evolution of association football across the 1910–1959 campaign.
 *
 * CANONICAL RULES (1910 ERA):
 * - Tactics/Formation: Classical Pyramid 2-3-5 (1 Goalkeeper, 2 Backs, 3 Halves, 5 Forwards).
 * - Substitutions: 0 allowed. In 1910, substitutions did not exist in competitive football.
 *   If a player was injured or expelled, the team continued with a man down (10 vs 11, etc.).
 * - Points System: 2 points for a victory, 1 point for a tie/draw, 0 points for a defeat.
 * - Disciplinary System: Verbal warnings ("advertência verbal") and direct verbal expulsions ("expulsão de campo")
 *   decreed by the referee ("juiz de campo"). Colored yellow/red cards were only invented in 1970.
 * - Offside Rule: 3-player offside rule (attacker must have 3 opponents between him and the goal line).
 *   Only changed to 2 players in 1925.
 * - Match Duration: 90 minutes (two halves of 45 minutes).
 */

export interface FootballEraRules {
  readonly eraName: string;
  readonly year: number;
  readonly maxSubstitutions: number;
  readonly pointsForWin: number;
  readonly pointsForDraw: number;
  readonly pointsForLoss: number;
  readonly offsideRule: 'three_player' | 'two_player';
  readonly disciplinaryStyle: 'verbal_expulsion' | 'cards';
  readonly matchDurationMinutes: number;
  readonly formationConvention: '2-3-5' | 'WM' | '4-2-4';
}

/**
 * Returns the official historical football rules for a given year.
 */
export function getFootballRulesForEra(year: number): FootballEraRules {
  if (year < 1925) {
    return Object.freeze({
      eraName: '1910s Early Amateur Era',
      year,
      maxSubstitutions: 0,
      pointsForWin: 2,
      pointsForDraw: 1,
      pointsForLoss: 0,
      offsideRule: 'three_player',
      disciplinaryStyle: 'verbal_expulsion',
      matchDurationMinutes: 90,
      formationConvention: '2-3-5',
    });
  } else if (year < 1958) {
    return Object.freeze({
      eraName: 'Interwar & Classical Era',
      year,
      maxSubstitutions: 0,
      pointsForWin: 2,
      pointsForDraw: 1,
      pointsForLoss: 0,
      offsideRule: 'two_player',
      disciplinaryStyle: 'verbal_expulsion',
      matchDurationMinutes: 90,
      formationConvention: 'WM',
    });
  } else {
    // 1958–1959 leading to Taça Brasil
    return Object.freeze({
      eraName: '1959 Taça Brasil Era',
      year,
      maxSubstitutions: 1, // Goalkeeper substitution only
      pointsForWin: 2,
      pointsForDraw: 1,
      pointsForLoss: 0,
      offsideRule: 'two_player',
      disciplinaryStyle: 'verbal_expulsion',
      matchDurationMinutes: 90,
      formationConvention: '4-2-4',
    });
  }
}
