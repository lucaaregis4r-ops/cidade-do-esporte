/** Named deterministic RNG streams owned by one campaign seed. */

export const RNG_DOMAINS = [
  'city',
  'population',
  'club',
  'football',
  'politics',
  'federation',
  'events',
  'media',
] as const;

export type RngDomain = (typeof RNG_DOMAINS)[number];

export const DEFAULT_WORLD_SEED = 'CM-1910-C15A1E11';

export interface CampaignRngState {
  version: 1;
  worldSeed: string;
  streams: Record<RngDomain, number>;
}

function assertWorldSeed(worldSeed: string): void {
  if (typeof worldSeed !== 'string' || worldSeed.length === 0) {
    throw new TypeError('worldSeed must be a non-empty string');
  }
}

/** Stable UTF-16 FNV-1a hash with a final avalanche. */
export function hashSeed(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}

export class RngStream {
  constructor(private state: number) {
    this.state >>>= 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  nextUint32(): number {
    return Math.floor(this.next() * 4294967296) >>> 0;
  }

  getState(): number {
    return this.state;
  }

  setState(state: number): void {
    if (!Number.isInteger(state) || state < 0 || state > 0xffffffff) {
      throw new RangeError('RNG state must be a uint32');
    }
    this.state = state >>> 0;
  }
}

export class CampaignRng {
  readonly city: RngStream;
  readonly population: RngStream;
  readonly club: RngStream;
  readonly football: RngStream;
  readonly politics: RngStream;
  readonly federation: RngStream;
  readonly events: RngStream;
  readonly media: RngStream;

  private readonly byDomain: Record<RngDomain, RngStream>;

  constructor(readonly worldSeed: string) {
    assertWorldSeed(worldSeed);
    this.byDomain = Object.fromEntries(
      RNG_DOMAINS.map((domain) => [domain, new RngStream(hashSeed(`${worldSeed}\u0000${domain}`))]),
    ) as Record<RngDomain, RngStream>;
    this.city = this.byDomain.city;
    this.population = this.byDomain.population;
    this.club = this.byDomain.club;
    this.football = this.byDomain.football;
    this.politics = this.byDomain.politics;
    this.federation = this.byDomain.federation;
    this.events = this.byDomain.events;
    this.media = this.byDomain.media;
  }

  snapshot(): CampaignRngState {
    return {
      version: 1,
      worldSeed: this.worldSeed,
      streams: Object.fromEntries(
        RNG_DOMAINS.map((domain) => [domain, this.byDomain[domain].getState()]),
      ) as Record<RngDomain, number>,
    };
  }

  restore(snapshot: CampaignRngState): boolean {
    if (
      snapshot === null ||
      typeof snapshot !== 'object' ||
      snapshot.version !== 1 ||
      snapshot.worldSeed !== this.worldSeed ||
      snapshot.streams === null ||
      typeof snapshot.streams !== 'object'
    ) {
      return false;
    }
    const states = RNG_DOMAINS.map((domain) => snapshot.streams[domain]);
    if (states.some((state) => !Number.isInteger(state) || state < 0 || state > 0xffffffff)) {
      return false;
    }
    RNG_DOMAINS.forEach((domain, index) => this.byDomain[domain].setState(states[index]));
    return true;
  }
}

export function worldSeedFromNumber(seed: number): string {
  const normalized = (Number.isFinite(seed) ? seed : 0) >>> 0;
  return `CM-1910-${normalized.toString(16).padStart(8, '0').toUpperCase()}`;
}
