/**
 * SocialIdentity domain model (Alpha D: D4).
 * Governs the club's dynamic social identity across 7 societal segments,
 * urban districts, citywide reputation, and historical evolution over time.
 *
 * CANONICAL RULE: Social identity is dynamic and NOT frozen by founding origin.
 * It evolves according to membership pricing, facilities, parcel district,
 * board decisions, socio-demographic composition, and generational transmission.
 */

import type { FoundingOrigin } from './Club';
import type { SocialClass } from './FoundingGroup';

export interface SocialSegmentAffinity {
  readonly workers: number;       // 0–100 (operários industriais e fabris)
  readonly railway: number;       // 0–100 (trabalhadores da ferrovia e transportes)
  readonly students: number;      // 0–100 (estudantes secundaristas e universitários)
  readonly merchants: number;     // 0–100 (comerciantes e lojistas)
  readonly middleClass: number;   // 0–100 (funcionários públicos e liberais)
  readonly elite: number;         // 0–100 (aristocracia agrária, investidores e capitalistas)
  readonly immigrants: number;    // 0–100 (colônias de imigrantes)
}

export type SocialSegment = keyof SocialSegmentAffinity;

export const SOCIAL_SEGMENTS: readonly SocialSegment[] = Object.freeze([
  'workers',
  'railway',
  'students',
  'merchants',
  'middleClass',
  'elite',
  'immigrants',
]);

export interface SocialIdentitySnapshot {
  readonly year: number;
  readonly month: number;
  readonly primarySegment: SocialSegment;
  readonly segments: Readonly<SocialSegmentAffinity>;
  readonly topDistrictId: string;
  readonly summaryNarrative: string;
}

export interface SocialIdentityState {
  readonly segments: Readonly<SocialSegmentAffinity>;
  readonly districts: Readonly<Record<string, number>>; // districtId -> 0–100
  readonly cityWideReputation: number;                  // 0–100
  readonly history: readonly SocialIdentitySnapshot[];
}

export interface EvolveSocialIdentityInput {
  readonly currentYear: number;
  readonly currentMonth: number;
  readonly monthlyFeePPU: number;
  readonly parcelDistrictId?: string;
  readonly memberClassDistribution?: Partial<Record<SocialClass, number>>; // count per class
  readonly hasLuxuryFacility?: boolean;
  readonly hasBasicFacility?: boolean;
}

/**
 * Generates initial social affinities based on the founding origin in 1910.
 */
export function createInitialSocialIdentity(
  origin: FoundingOrigin,
  initialDistrictId: string,
): SocialIdentityState {
  let segments: SocialSegmentAffinity;

  switch (origin) {
    case 'railway':
      segments = {
        railway: 90,
        workers: 80,
        middleClass: 40,
        merchants: 35,
        students: 30,
        immigrants: 45,
        elite: 10,
      };
      break;
    case 'workers':
      segments = {
        workers: 90,
        railway: 75,
        immigrants: 65,
        merchants: 40,
        middleClass: 30,
        students: 25,
        elite: 10,
      };
      break;
    case 'students':
      segments = {
        students: 92,
        middleClass: 70,
        merchants: 50,
        elite: 45,
        immigrants: 40,
        workers: 30,
        railway: 20,
      };
      break;
    case 'merchants':
      segments = {
        merchants: 90,
        middleClass: 75,
        immigrants: 65,
        elite: 50,
        students: 40,
        workers: 35,
        railway: 25,
      };
      break;
    case 'immigrants':
      segments = {
        immigrants: 95,
        merchants: 70,
        workers: 60,
        middleClass: 45,
        students: 35,
        railway: 30,
        elite: 15,
      };
      break;
    case 'elite':
    default:
      segments = {
        elite: 90,
        middleClass: 65,
        merchants: 50,
        students: 40,
        immigrants: 25,
        railway: 15,
        workers: 10,
      };
      break;
  }

  const districts: Record<string, number> = {
    [initialDistrictId]: 75,
  };

  const primarySegment = getDominantSegment(segments);
  const narrative = `Fundado com identidade voltada para ${getSegmentLabel(primarySegment)}.`;

  const initialSnapshot: SocialIdentitySnapshot = {
    year: 1910,
    month: 1,
    primarySegment,
    segments: Object.freeze({ ...segments }),
    topDistrictId: initialDistrictId,
    summaryNarrative: narrative,
  };

  return Object.freeze({
    segments: Object.freeze(segments),
    districts: Object.freeze(districts),
    cityWideReputation: 50,
    history: Object.freeze([initialSnapshot]),
  });
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}

export function getSegmentLabel(segment: SocialSegment): string {
  switch (segment) {
    case 'workers': return 'Classes Trabalhadoras & Operárias';
    case 'railway': return 'Comunidade Ferroviária';
    case 'students': return 'Juventude Estudantil & Acadêmica';
    case 'merchants': return 'Comércio Local & Lojistas';
    case 'middleClass': return 'Classe Média Urbana & Servidores';
    case 'elite': return 'Aristocracia & Elites Econômicas';
    case 'immigrants': return 'Colônias de Imigrantes';
  }
}

export function getDominantSegment(segments: SocialSegmentAffinity): SocialSegment {
  let bestKey: SocialSegment = 'workers';
  let bestVal = -1;

  for (const seg of SOCIAL_SEGMENTS) {
    if (segments[seg] > bestVal) {
      bestVal = segments[seg];
      bestKey = seg;
    }
  }

  return bestKey;
}

/**
 * Evolves social identity according to economic policies, geography, and membership dynamics.
 * Enforces non-freezing rule: choices have immediate and cumulative social effects.
 */
export function evolveSocialIdentity(
  current: SocialIdentityState,
  input: EvolveSocialIdentityInput,
): SocialIdentityState {
  const seg = { ...current.segments };
  const dist = { ...current.districts };

  // 1. Impact of membership fee (PPU)
  // Historical context: < 1.5 PPU is popular/accessible; > 4.0 PPU is exclusionary elite pricing
  if (input.monthlyFeePPU <= 1.5) {
    seg.workers = clamp(seg.workers + 1.2);
    seg.railway = clamp(seg.railway + 1.0);
    seg.immigrants = clamp(seg.immigrants + 0.8);
    seg.elite = clamp(seg.elite - 1.0); // Elite disdains popular masses
  } else if (input.monthlyFeePPU >= 4.0) {
    seg.elite = clamp(seg.elite + 1.5);
    seg.middleClass = clamp(seg.middleClass + 0.5);
    seg.workers = clamp(seg.workers - 1.8);
    seg.railway = clamp(seg.railway - 1.5);
  } else {
    // Moderate fee strengthens middle class and merchants
    seg.middleClass = clamp(seg.middleClass + 0.5);
    seg.merchants = clamp(seg.merchants + 0.5);
  }

  // 2. Impact of home parcel district
  if (input.parcelDistrictId) {
    const currentDistVal = dist[input.parcelDistrictId] ?? 30;
    dist[input.parcelDistrictId] = clamp(currentDistVal + 1.5);
  }

  // 3. Impact of facility characteristics
  if (input.hasLuxuryFacility) {
    seg.elite = clamp(seg.elite + 1.0);
    seg.middleClass = clamp(seg.middleClass + 0.6);
  }
  if (input.hasBasicFacility) {
    seg.workers = clamp(seg.workers + 0.5);
    seg.railway = clamp(seg.railway + 0.5);
  }

  // 4. Impact of member class distribution
  if (input.memberClassDistribution) {
    const total = Object.values(input.memberClassDistribution).reduce((a, b) => a + (b ?? 0), 0);
    if (total > 0) {
      if ((input.memberClassDistribution.working_class ?? 0) / total > 0.5) {
        seg.workers = clamp(seg.workers + 0.8);
      }
      if ((input.memberClassDistribution.elite ?? 0) / total > 0.4) {
        seg.elite = clamp(seg.elite + 0.8);
      }
    }
  }

  const primarySegment = getDominantSegment(seg);
  let topDist = input.parcelDistrictId ?? 'd-centro';
  let bestDistVal = -1;
  for (const [dId, val] of Object.entries(dist)) {
    if (val > bestDistVal) {
      bestDistVal = val;
      topDist = dId;
    }
  }

  // Record snapshot once a year (or if history is empty)
  let updatedHistory = current.history;
  const lastSnapshot = current.history[current.history.length - 1];
  if (!lastSnapshot || lastSnapshot.year !== input.currentYear) {
    const newSnapshot: SocialIdentitySnapshot = {
      year: input.currentYear,
      month: input.currentMonth,
      primarySegment,
      segments: Object.freeze({ ...seg }),
      topDistrictId: topDist,
      summaryNarrative: `Identidade em ${input.currentYear}: forte apelo entre ${getSegmentLabel(primarySegment)}.`,
    };
    updatedHistory = Object.freeze([...current.history, newSnapshot]);
  }

  const cityWideReputation = clamp(
    (seg.workers + seg.railway + seg.students + seg.merchants + seg.middleClass + seg.elite + seg.immigrants) / 7,
  );

  return Object.freeze({
    segments: Object.freeze(seg),
    districts: Object.freeze(dist),
    cityWideReputation,
    history: updatedHistory,
  });
}

/**
 * Validates a SocialIdentityState defensively.
 */
export function validateSocialIdentityState(state: unknown): state is SocialIdentityState {
  if (!state || typeof state !== 'object') return false;
  const s = state as Record<string, unknown>;

  if (!s.segments || typeof s.segments !== 'object') return false;
  const seg = s.segments as Record<string, unknown>;
  for (const k of SOCIAL_SEGMENTS) {
    if (typeof seg[k] !== 'number' || seg[k] < 0 || seg[k] > 100) return false;
  }

  if (!s.districts || typeof s.districts !== 'object') return false;
  if (typeof s.cityWideReputation !== 'number' || s.cityWideReputation < 0 || s.cityWideReputation > 100) return false;
  if (!Array.isArray(s.history)) return false;

  return true;
}
