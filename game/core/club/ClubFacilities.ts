/**
 * Club Facilities domain model for 1910-era sports infrastructure (C6, C10).
 * Governs playing grounds, clubhouses, wooden fencing, stands and maintenance.
 */

import type { GameDate } from '../HistoricalClock';
import type { FoundingOrigin } from './Club';

export const FACILITY_TYPES = [
  'dirt_pitch',        // Campo de terra batida / gramado rústico
  'wooden_fence',      // Tapume / cerca de ripas de madeira
  'locker_room',       // Vestiário simples de tábuas ou alvenaria
  'clubhouse',         // Sede social / secretaria do clube
  'wooden_stands',     // Pequena arquibancada de madeira
  'lantern_lighting',  // Lampiões para iluminação crepuscular
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

export interface FacilityDefinition {
  readonly type: FacilityType;
  readonly defaultName: string;
  readonly buildCostPPU: number;
  readonly monthlyMaintenancePPU: number;
  readonly spectatorCapacity: number;
  readonly description: string;
}

export const FACILITY_CATALOG: Record<FacilityType, FacilityDefinition> = {
  dirt_pitch: {
    type: 'dirt_pitch',
    defaultName: 'Campo de Terra Batida',
    buildCostPPU: 80,
    monthlyMaintenancePPU: 4,
    spectatorCapacity: 300,
    description: 'Terreno aplainado manualmente com marcação de cal e traves de madeira roliça.',
  },
  wooden_fence: {
    type: 'wooden_fence',
    defaultName: 'Cerca de Madeira e Ripas',
    buildCostPPU: 40,
    monthlyMaintenancePPU: 2,
    spectatorCapacity: 0,
    description: 'Cercamento para conter invasões de campo e viabilizar cobrança de ingressos.',
  },
  locker_room: {
    type: 'locker_room',
    defaultName: 'Vestiário dos Atletas',
    buildCostPPU: 60,
    monthlyMaintenancePPU: 3,
    spectatorCapacity: 0,
    description: 'Casinhoto rústico com ganchos de parede, bacias e bancos para os quadros de jogadores.',
  },
  clubhouse: {
    type: 'clubhouse',
    defaultName: 'Sede Social e Secretaria',
    buildCostPPU: 150,
    monthlyMaintenancePPU: 8,
    spectatorCapacity: 100,
    description: 'Espaço para reuniões de diretoria, guarda de atas, flâmulas e convivência de sócios.',
  },
  wooden_stands: {
    type: 'wooden_stands',
    defaultName: 'Pavilhão de Tábuas',
    buildCostPPU: 120,
    monthlyMaintenancePPU: 6,
    spectatorCapacity: 500,
    description: 'Bancadas de madeira sobre esteios para acomodar famílias e torcedores de maior prestígio.',
  },
  lantern_lighting: {
    type: 'lantern_lighting',
    defaultName: 'Postes com Lampiões',
    buildCostPPU: 50,
    monthlyMaintenancePPU: 3,
    spectatorCapacity: 0,
    description: 'Lampiões de querosene para reuniões e treinos ao entardecer após o expediente de trabalho.',
  },
};

export interface ClubFacility {
  readonly id: string;
  readonly type: FacilityType;
  readonly name: string;
  readonly builtDate: GameDate;
  readonly condition: number; // 0 to 100 percentage
  readonly capacity: number;
  readonly monthlyMaintenancePPU: number;
  readonly valuePPU: number;
  readonly biography?: string;
}

export function validateClubFacility(facility: unknown): facility is ClubFacility {
  if (!facility || typeof facility !== 'object') return false;
  const f = facility as Partial<ClubFacility>;
  if (typeof f.id !== 'string' || f.id.trim().length === 0) return false;
  if (!f.type || !FACILITY_TYPES.includes(f.type)) return false;
  if (typeof f.name !== 'string' || f.name.trim().length === 0) return false;
  if (!f.builtDate || typeof f.builtDate.year !== 'number') return false;
  if (typeof f.condition !== 'number' || f.condition < 0 || f.condition > 100) return false;
  if (typeof f.capacity !== 'number' || f.capacity < 0) return false;
  if (typeof f.monthlyMaintenancePPU !== 'number' || f.monthlyMaintenancePPU < 0) return false;
  if (typeof f.valuePPU !== 'number' || f.valuePPU < 0) return false;
  return true;
}

/**
 * Generates initial 1910-era facilities for a newly founded club based on its historical origin.
 */
export function generateInitialFacilities(
  origin: FoundingOrigin,
  foundingDate: GameDate,
): readonly ClubFacility[] {
  const timestamp = `${foundingDate.year}-${String(foundingDate.month).padStart(2, '0')}`;
  const facilities: ClubFacility[] = [];

  // All 1910 clubs start with at least a primitive playing ground
  facilities.push({
    id: `fac-pitch-${timestamp}`,
    type: 'dirt_pitch',
    name: origin === 'elite' ? 'Campo Gramado do Retiro' : 'Campo da Várzea Central',
    builtDate: foundingDate,
    condition: origin === 'elite' ? 95 : 80,
    capacity: origin === 'elite' ? 400 : 250,
    monthlyMaintenancePPU: FACILITY_CATALOG.dirt_pitch.monthlyMaintenancePPU,
    valuePPU: FACILITY_CATALOG.dirt_pitch.buildCostPPU,
    biography: 'Terreno aplainado pelos sócios fundadores para os primeiros jogos do quadro social.',
  });

  if (origin === 'railway' || origin === 'merchants') {
    facilities.push({
      id: `fac-fence-${timestamp}`,
      type: 'wooden_fence',
      name: 'Paliçada de Madeira dos Trilhos',
      builtDate: foundingDate,
      condition: 90,
      capacity: 0,
      monthlyMaintenancePPU: FACILITY_CATALOG.wooden_fence.monthlyMaintenancePPU,
      valuePPU: FACILITY_CATALOG.wooden_fence.buildCostPPU,
      biography: 'Madeira cedida ou adquirida para proteção contra transeuntes e animais.',
    });
  }

  if (origin === 'elite') {
    facilities.push({
      id: `fac-clubhouse-${timestamp}`,
      type: 'clubhouse',
      name: 'Salão Social e Secretaria',
      builtDate: foundingDate,
      condition: 100,
      capacity: 150,
      monthlyMaintenancePPU: FACILITY_CATALOG.clubhouse.monthlyMaintenancePPU,
      valuePPU: FACILITY_CATALOG.clubhouse.buildCostPPU,
      biography: 'Sede confortável para reuniões da comissão diretiva e recepção de delegações visitantes.',
    });
  } else if (origin === 'immigrants' || origin === 'workers') {
    facilities.push({
      id: `fac-locker-${timestamp}`,
      type: 'locker_room',
      name: 'Vestiário dos Sócios',
      builtDate: foundingDate,
      condition: 85,
      capacity: 0,
      monthlyMaintenancePPU: FACILITY_CATALOG.locker_room.monthlyMaintenancePPU,
      valuePPU: FACILITY_CATALOG.locker_room.buildCostPPU,
      biography: 'Galpão erguido em regime de mutirão com tábuas e folhas de zinco.',
    });
  }

  return Object.freeze(facilities);
}

/**
 * Applies natural wear and tear to facilities each month.
 * If maintenance is fully paid, decay is minimal (0.5% per month).
 * If maintenance cannot be paid, decay accelerates (3.0% per month).
 */
export function decayFacilities(
  facilities: readonly ClubFacility[],
  maintenancePaid: boolean,
): readonly ClubFacility[] {
  const decayRate = maintenancePaid ? 0.5 : 3.0;

  return Object.freeze(
    facilities.map((facility) => {
      const nextCondition = Math.max(0, Math.min(100, facility.condition - decayRate));
      return {
        ...facility,
        condition: Math.round(nextCondition * 10) / 10,
      };
    }),
  );
}

/**
 * Creates a new facility for a club.
 */
export function createFacility(
  type: FacilityType,
  date: GameDate,
  sequence = 1,
  customName?: string,
): ClubFacility {
  const def = FACILITY_CATALOG[type];
  const id = `fac-${type}-${date.year}${String(date.month).padStart(2, '0')}-${sequence}`;

  return {
    id,
    type,
    name: customName?.trim() || def.defaultName,
    builtDate: { ...date },
    condition: 100,
    capacity: def.spectatorCapacity,
    monthlyMaintenancePPU: def.monthlyMaintenancePPU,
    valuePPU: def.buildCostPPU,
    biography: def.description,
  };
}

/**
 * Repairs a damaged facility back to 100% condition.
 */
export function repairFacility(facility: ClubFacility): ClubFacility {
  return {
    ...facility,
    condition: 100,
  };
}
