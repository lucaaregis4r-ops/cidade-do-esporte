/**
 * NationalAbstractClub.test.ts
 *
 * Testes unitários para o catálogo de clubes abstratos nacionais de 1959.
 */

import { describe, expect, it } from 'vitest';
import {
  getAllNationalClubs,
  getNationalClubById,
  getNationalClubsByZone,
  HISTORICAL_1959_NATIONAL_CLUBS,
} from './NationalAbstractClub';

describe('NationalAbstractClub', () => {
  it('contém catálogo histórico frozen com clubes obrigatórios de 1959', () => {
    expect(Object.isFrozen(HISTORICAL_1959_NATIONAL_CLUBS)).toBe(true);
    expect(HISTORICAL_1959_NATIONAL_CLUBS.length).toBeGreaterThanOrEqual(10);

    const santos = getNationalClubById('club-nac-santos');
    expect(santos).toBeDefined();
    expect(santos?.name).toBe('Santos Futebol Clube');
    expect(santos?.state).toBe('SP');
    expect(santos?.region).toBe('centro-sul');
    expect(santos?.notableStars).toContain('Pelé');

    const bahia = getNationalClubById('club-nac-bahia');
    expect(bahia).toBeDefined();
    expect(bahia?.name).toBe('Esporte Clube Bahia');
    expect(bahia?.state).toBe('BA');
    expect(bahia?.region).toBe('norte-nordeste');
    expect(bahia?.notableStars).toContain('Léo Briglia');

    const vasco = getNationalClubById('club-nac-vasco');
    expect(vasco).toBeDefined();
    expect(vasco?.region).toBe('centro-sul');

    const gremio = getNationalClubById('club-nac-gremio');
    expect(gremio).toBeDefined();
    expect(gremio?.region).toBe('centro-sul');
  });

  it('separa corretamente os clubes por zona geográfica (Norte-Nordeste vs Centro-Sul)', () => {
    const norteNordeste = getNationalClubsByZone('norte-nordeste');
    const centroSul = getNationalClubsByZone('centro-sul');

    expect(norteNordeste.length).toBeGreaterThan(0);
    expect(centroSul.length).toBeGreaterThan(0);

    for (const c of norteNordeste) {
      expect(c.region).toBe('norte-nordeste');
    }
    for (const c of centroSul) {
      expect(c.region).toBe('centro-sul');
    }

    const all = getAllNationalClubs();
    expect(all.length).toBe(norteNordeste.length + centroSul.length);
  });
});
