/**
 * SupporterTerritory domain model (Alpha G: G3 / Macroetapa 25).
 * Governs the territorial distribution of club supporter bases across
 * the urban districts of Cidade de Minas, causal demographic affinity,
 * neighborhood redoubts, and matchday attendance turnout.
 *
 * CANONICAL RULES:
 * - Deterministic: purely causal, zero unseeded randomness or unseeded PRNG.
 * - Territorial: supporter bases are anchored in real urban districts.
 * - Social causality: workers root for working-class clubs, students/merchants
 *   root for academic/bourgeois clubs, elite root for aristocratic clubs.
 */

import type { SocialSegmentAffinity } from '../club/SocialIdentity';

export interface DistrictSupporterBreakdown {
  readonly districtId: string;
  readonly districtKind: string;
  readonly totalSupporters: number;
  readonly marketShareBps: number; // 0–10000 (basis points of district football fans)
  readonly fanaticismIndex: number; // 0–100
}

export interface ClubSupporterTerritory {
  readonly clubId: string;
  readonly clubName: string;
  readonly totalSupporters: number;
  readonly dominantDistrictId: string;
  readonly districts: readonly DistrictSupporterBreakdown[];
  readonly homeMatchAttendancePotential: number;
}

export interface ClubTerritoryInput {
  readonly id: string;
  readonly name: string;
  readonly headquartersDistrictId?: string;
  readonly socialAffinity: Readonly<SocialSegmentAffinity>;
  readonly reputation: number; // 0–100
}

export interface UrbanDistrictInput {
  readonly id: string;
  readonly kind: string;
  readonly populationUnits: number;
  readonly centrality?: number;
}

export interface MatchTurnoutInput {
  readonly homeTerritory: Readonly<ClubSupporterTerritory>;
  readonly awayTerritory: Readonly<ClubSupporterTerritory>;
  readonly isDerby: boolean;
  readonly derbyIntensity: number; // 0–100
  readonly ticketPricePpu: number;
  readonly stadiumCapacity: number;
}

export interface MatchTurnoutResult {
  readonly homeSupporters: number;
  readonly awaySupporters: number;
  readonly neutralSpectators: number;
  readonly totalTurnout: number;
  readonly atmosphereDescriptionPt: string;
}

/**
 * Computes the demographic alignment score (0–100) between a district's
 * predominant socioeconomic makeup and a club's social identity.
 */
export function computeDistrictDemographicAffinity(
  districtKind: string,
  affinity: Readonly<SocialSegmentAffinity>
): number {
  switch (districtKind) {
    case 'railway-workshops':
      return Math.round(affinity.railway * 0.6 + affinity.workers * 0.4);

    case 'small-industry':
      return Math.round(affinity.workers * 0.55 + affinity.immigrants * 0.25 + affinity.railway * 0.2);

    case 'commercial-cluster':
      return Math.round(affinity.merchants * 0.5 + affinity.middleClass * 0.3 + affinity.students * 0.2);

    case 'public-square':
      return Math.round(affinity.students * 0.4 + affinity.middleClass * 0.35 + affinity.elite * 0.25);

    case 'railway-station':
      return Math.round(affinity.railway * 0.4 + affinity.merchants * 0.35 + affinity.middleClass * 0.25);

    case 'outer-north':
    case 'outer-east':
      // Aristocratic and bourgeois suburban garden districts
      return Math.round(affinity.elite * 0.45 + affinity.middleClass * 0.35 + affinity.students * 0.2);

    case 'outer-south':
    case 'outer-west':
      // Várzea, railway tracks, popular colonies and worker settlements
      return Math.round(affinity.workers * 0.5 + affinity.immigrants * 0.3 + affinity.railway * 0.2);

    default:
      return Math.round((affinity.workers + affinity.middleClass + affinity.students) / 3);
  }
}

/**
 * Distributes urban district populations among participating local clubs,
 * producing each club's territorial supporter footprint.
 */
export function computeClubSupporterTerritories(
  clubs: readonly ClubTerritoryInput[],
  districts: readonly UrbanDistrictInput[]
): readonly ClubSupporterTerritory[] {
  if (clubs.length === 0) return Object.freeze([]);

  // Footprint accumulator per club
  const clubDistrictsMap = new Map<string, DistrictSupporterBreakdown[]>();
  for (const c of clubs) {
    clubDistrictsMap.set(c.id, []);
  }

  // Iterate over each urban district
  for (const d of districts) {
    // In 1910 Cidade de Minas, ~35% of district population are active football enthusiasts
    const districtFootballEnthusiasts = Math.max(10, Math.round(d.populationUnits * 0.35));

    // Calculate raw appeal score for each club in this district
    const scores = clubs.map((c) => {
      const demoAffinity = computeDistrictDemographicAffinity(d.kind, c.socialAffinity);
      const repBonus = 1 + c.reputation / 100;
      const isHomeDistrict = c.headquartersDistrictId === d.id;
      const homeBonus = isHomeDistrict ? 1.5 : 1.0;
      const rawScore = Math.max(1, demoAffinity * repBonus * homeBonus);
      return { clubId: c.id, rawScore, isHomeDistrict };
    });

    const totalRawScore = scores.reduce((sum, s) => sum + s.rawScore, 0);

    for (const s of scores) {
      const share = s.rawScore / totalRawScore;
      const marketShareBps = Math.round(share * 10000);
      const supportersInDistrict = Math.round(districtFootballEnthusiasts * share);
      const fanaticismIndex = Math.min(100, Math.round(30 + (s.isHomeDistrict ? 25 : 0) + share * 45));

      clubDistrictsMap.get(s.clubId)!.push({
        districtId: d.id,
        districtKind: d.kind,
        totalSupporters: supportersInDistrict,
        marketShareBps,
        fanaticismIndex,
      });
    }
  }

  // Build final ClubSupporterTerritory objects
  const territories: ClubSupporterTerritory[] = [];
  for (const c of clubs) {
    const dList = clubDistrictsMap.get(c.id) ?? [];
    const totalSupporters = dList.reduce((sum, d) => sum + d.totalSupporters, 0);

    // Identify dominant redoubt district
    let maxSupporters = -1;
    let dominantDistrictId = c.headquartersDistrictId ?? (dList[0]?.districtId ?? 'district-center');
    for (const d of dList) {
      if (d.totalSupporters > maxSupporters) {
        maxSupporters = d.totalSupporters;
        dominantDistrictId = d.districtId;
      }
    }

    // Typical home attendance potential (~20% to ~30% of total fanbase)
    const homeMatchAttendancePotential = Math.round(totalSupporters * 0.25);

    territories.push(
      Object.freeze({
        clubId: c.id,
        clubName: c.name,
        totalSupporters,
        dominantDistrictId,
        districts: Object.freeze(dList),
        homeMatchAttendancePotential,
      })
    );
  }

  return Object.freeze(territories);
}

/**
 * Calculates deterministic matchday attendance turnout from territorial data,
 * factoring home potential, traveling away fans, derby intensity, and ticket pricing.
 */
export function calculateSupporterTurnout(input: MatchTurnoutInput): MatchTurnoutResult {
  const { homeTerritory, awayTerritory, isDerby, derbyIntensity, ticketPricePpu, stadiumCapacity } = input;

  // Base home turnout (~25% of fanbase)
  const homeBase = Math.max(20, homeTerritory.homeMatchAttendancePotential);

  // Base away turnout (~5% of fanbase traveling or attending)
  const awayBase = Math.max(5, Math.round(awayTerritory.totalSupporters * 0.05));

  // Derby multiplier
  const derbyFactor = isDerby ? 1.0 + (derbyIntensity / 100) * 0.75 : 1.0;
  const awayDerbyFactor = isDerby ? 1.5 + (derbyIntensity / 100) * 0.8 : 1.0;

  // Price dampener (baseline PPU is ~10; higher prices slightly dampen general attendance)
  const priceDampener = Math.max(0.6, Math.min(1.2, 10 / Math.max(5, ticketPricePpu)));

  let estimatedHome = Math.round(homeBase * derbyFactor * priceDampener);
  let estimatedAway = Math.round(awayBase * awayDerbyFactor * priceDampener);
  let estimatedNeutral = isDerby ? Math.round(estimatedHome * 0.2) : Math.round(estimatedHome * 0.1);

  let total = estimatedHome + estimatedAway + estimatedNeutral;

  // Stadium capacity cap
  if (total > stadiumCapacity) {
    const scale = stadiumCapacity / total;
    estimatedHome = Math.round(estimatedHome * scale);
    estimatedAway = Math.round(estimatedAway * scale);
    estimatedNeutral = Math.max(0, stadiumCapacity - estimatedHome - estimatedAway);
    total = stadiumCapacity;
  }

  let atmosphereDescriptionPt = 'Ambiente tranquilo de prélio amador da capital.';
  if (isDerby && derbyIntensity >= 75) {
    atmosphereDescriptionPt = 'Praça de esportes fervilhando com cânticos, matracas e rivalidade inflamada entre as torcidas!';
  } else if (isDerby) {
    atmosphereDescriptionPt = 'Grande entusiasmo nas arquibancadas com bandeiras, charangas e provocação bem-humorada.';
  } else if (total > stadiumCapacity * 0.85) {
    atmosphereDescriptionPt = 'Casa cheia com entusiasmo operário e famílias prestigiando o festival esportivo.';
  }

  return Object.freeze({
    homeSupporters: estimatedHome,
    awaySupporters: estimatedAway,
    neutralSpectators: estimatedNeutral,
    totalTurnout: total,
    atmosphereDescriptionPt,
  });
}
