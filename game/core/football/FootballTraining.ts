/**
 * Historical Football Training, Physical Condition, Wear, Injuries, and Aging (Alpha E: E3 + E4).
 * Governs historical training regimens of the 1910s era (amateur practices, tactical pyramid rehearsals,
 * calisthenics, and first-vs-second squad scrimmages), physical condition recovery, fatigue accumulation,
 * injuries modulated by facility quality (dirt pitch vs dressing room), weekly progression, and annual aging.
 *
 * SPECIFICATION & CANONICAL RULES:
 * - Era 1910: Pure amateurism — training occurs 1 to 2 times weekly (traditionally Saturday afternoons / Thursdays).
 * - "Não usar overall único no motor. A UI pode resumir, o motor não."
 * - All randomness strictly consumes the `football` stream of CampaignRng. Never use non-deterministic randomness.
 * - Direction: React Shell → Input → Engine → Core → Render.
 */

import type { GameDate } from '../HistoricalClock';
import type { CampaignRng } from '../CampaignRng';
import type { ClubFacility } from '../club/ClubFacilities';
import type {
  Footballer,
  FootballSquadState,
  HistoricalTrainingType,
  TrainingRegime,
  TechnicalAttributes,
  PhysicalAttributes,
  MentalAttributes,
} from './Footballer';

export interface HistoricalTrainingDetails {
  readonly id: HistoricalTrainingType;
  readonly namePt: string;
  readonly shortDescPt: string;
  readonly fullDescPt: string;
  readonly baseFatigueGain: number;
  readonly baseConditionGain: number;
  readonly injuryRiskFactor: number;
  readonly primaryAttributes: readonly string[];
}

export const HISTORICAL_TRAINING_DETAILS: Readonly<Record<HistoricalTrainingType, HistoricalTrainingDetails>> = Object.freeze({
  recreational: Object.freeze({
    id: 'recreational',
    namePt: 'Bate-Bola Livre aos Sábados',
    shortDescPt: 'Pelada amadora de fim de semana',
    fullDescPt: 'Prática descontraída entre associados aos sábados à tarde. Mantém o fôlego e o espírito esportivo sem sobrecarregar os atletas operários ou estudantes.',
    baseFatigueGain: 4,
    baseConditionGain: 6,
    injuryRiskFactor: 0.35,
    primaryAttributes: Object.freeze(['ballControl', 'stamina', 'passing']),
  }),
  tactical_pyramid: Object.freeze({
    id: 'tactical_pyramid',
    namePt: 'Ensaio de Linhas na Pirâmide 2-3-5',
    shortDescPt: 'Ensaio tático com o Capitão de Campo',
    fullDescPt: 'Exercício tático britânico para coordenar a cobertura dos dois zagueiros (backs), o apoio dos três médios (halves) e o avanço coordenado da linha de cinco atacantes.',
    baseFatigueGain: 8,
    baseConditionGain: 3,
    injuryRiskFactor: 0.65,
    primaryAttributes: Object.freeze(['positioning', 'passing', 'decision', 'discipline']),
  }),
  physical_calisthenics: Object.freeze({
    id: 'physical_calisthenics',
    namePt: 'Calistenia e Corridas Rústicas',
    shortDescPt: 'Ginástica militar e voltas ao ar livre',
    fullDescPt: 'Ginástica calistênica ao ar livre, flexões e corridas de longa distância nos arredores para construir resistência física e arranque rústico.',
    baseFatigueGain: 14,
    baseConditionGain: -2,
    injuryRiskFactor: 1.15,
    primaryAttributes: Object.freeze(['stamina', 'strength', 'pace', 'agility']),
  }),
  scrimmage_first_vs_second: Object.freeze({
    id: 'scrimmage_first_vs_second',
    namePt: 'Coletivo 1º vs 2º Quadro',
    shortDescPt: 'Jogo-treino disputado por camisas titulares',
    fullDescPt: 'Partida disputada de 90 minutos entre os titulares do Primeiro Quadro e os aspirantes do Segundo Quadro, simulando a pegada e a pressão de um jogo oficial.',
    baseFatigueGain: 18,
    baseConditionGain: -7,
    injuryRiskFactor: 1.55,
    primaryAttributes: Object.freeze(['tackling', 'shooting', 'courage', 'composure', 'goalkeeping']),
  }),
});

export interface FacilityTrainingModifier {
  readonly injuryRiskMultiplier: number;
  readonly fatigueRecoveryBonus: number;
  readonly trainingEffectMultiplier: number;
  readonly notesPt: readonly string[];
}

/**
 * Calculates how club sports facilities (e.g. dirt pitch, wooden dressing room, fence)
 * affect training efficiency, fatigue recovery, and injury risks.
 */
export function evaluateFacilityModifiers(facilities?: readonly ClubFacility[]): FacilityTrainingModifier {
  let injuryRiskMultiplier = 1.0;
  let fatigueRecoveryBonus = 6; // Base weekly rest from amateur schedule
  let trainingEffectMultiplier = 1.0;
  const notesPt: string[] = [];

  if (!facilities || facilities.length === 0) {
    injuryRiskMultiplier += 0.25;
    notesPt.push('Sem praça própria: treinos em terreno baldio com pedras (+25% risco de lesão).');
    return Object.freeze({
      injuryRiskMultiplier: 1.25,
      fatigueRecoveryBonus: 5,
      trainingEffectMultiplier: 0.90,
      notesPt: Object.freeze(notesPt),
    });
  }

  const hasDirtPitch = facilities.some((f) => f.type === 'dirt_pitch' && f.condition > 20);
  const hasLockerRoom = facilities.some((f) => f.type === 'locker_room' && f.condition > 20);
  const hasClubhouse = facilities.some((f) => f.type === 'clubhouse' && f.condition > 20);
  const hasFence = facilities.some((f) => f.type === 'wooden_fence' && f.condition > 20);

  if (hasDirtPitch) {
    injuryRiskMultiplier += 0.15;
    trainingEffectMultiplier += 0.10;
    notesPt.push('Campo de terra batida: melhora o passe e desarme rústico, mas aumenta risco de contusões.');
  }

  if (hasLockerRoom) {
    fatigueRecoveryBonus += 8;
    injuryRiskMultiplier -= 0.15;
    notesPt.push('Vestiário de madeira: água corrente e massagem com arnica aceleram o repouso (+8 pts).');
  }

  if (hasClubhouse) {
    fatigueRecoveryBonus += 3;
    trainingEffectMultiplier += 0.05;
    notesPt.push('Sede social: ponto de encontro que fortalece a disciplina e união do elenco.');
  }

  if (hasFence) {
    trainingEffectMultiplier += 0.05;
    notesPt.push('Tapume de madeira: isola o treino contra o olhar de curiosos e adversários.');
  }

  return Object.freeze({
    injuryRiskMultiplier: Math.max(0.4, injuryRiskMultiplier),
    fatigueRecoveryBonus,
    trainingEffectMultiplier,
    notesPt: Object.freeze(notesPt),
  });
}

export interface FootballTrainingEvent {
  readonly date: Readonly<GameDate>;
  readonly footballerId: string;
  readonly footballerName: string;
  readonly type: 'injury_occurred' | 'injury_recovered' | 'attribute_growth' | 'exhaustion_warning';
  readonly message: string;
}

export interface WeeklyTrainingResult {
  readonly squad: FootballSquadState;
  readonly events: readonly FootballTrainingEvent[];
}

/**
 * Executes a weekly training step on the squad (triggered every cadence.weekly).
 * Updates footballer fatigue, physical condition, processes injuries, and applies gradual attribute evolution.
 */
export function processWeeklyTrainingAndCondition(
  squad: FootballSquadState,
  currentDate: GameDate,
  rng: CampaignRng,
  facilities?: readonly ClubFacility[]
): WeeklyTrainingResult {
  const stream = rng.football;
  const facilityMod = evaluateFacilityModifiers(facilities);
  const regime = squad.trainingRegime ?? {
    type: 'recreational',
    intensity: 'light',
    weeklySessions: 1,
    focus: 'balanced',
  };

  const details = HISTORICAL_TRAINING_DETAILS[regime.type];
  const intensityMultiplier = regime.intensity === 'intense' ? 1.4 : regime.intensity === 'moderate' ? 1.0 : 0.7;

  const updatedFootballers: Footballer[] = [];
  const events: FootballTrainingEvent[] = [];

  for (const f of squad.footballers) {
    let currentInjury = f.currentInjury;
    let fatigue = f.fatigue ?? 0;
    let condition = f.condition;
    let tech = { ...f.technical };
    let phys = { ...f.physical };
    let ment = { ...f.mental };

    // Case 1: Athlete is currently injured
    if (currentInjury) {
      const remainingWeeks = currentInjury.weeksRemaining - 1;
      if (remainingWeeks <= 0) {
        // Recovery complete!
        events.push(
          Object.freeze({
            date: Object.freeze({ ...currentDate }),
            footballerId: f.id,
            footballerName: f.name,
            type: 'injury_recovered',
            message: `${f.name} recuperou-se de ${currentInjury.description} e recebeu alta para treinar.`,
          })
        );
        currentInjury = undefined;
        // Restores some baseline shape
        condition = Math.min(80, condition + 10);
        fatigue = Math.max(0, fatigue - facilityMod.fatigueRecoveryBonus);
      } else {
        // Still recovering
        currentInjury = Object.freeze({
          ...currentInjury,
          weeksRemaining: remainingWeeks,
        });
        condition = Math.min(75, condition + 3);
        fatigue = Math.max(0, fatigue - facilityMod.fatigueRecoveryBonus);
      }

      updatedFootballers.push(
        Object.freeze({
          ...f,
          condition,
          fatigue,
          currentInjury,
        })
      );
      continue;
    }

    // Case 2: Athlete is fit and participates in weekly training
    const fatigueDelta = Math.round(details.baseFatigueGain * intensityMultiplier * regime.weeklySessions);
    fatigue = clamp(fatigue + fatigueDelta - facilityMod.fatigueRecoveryBonus, 0, 100);

    const conditionDelta = Math.round(details.baseConditionGain * intensityMultiplier);
    // Well-rested players gain condition faster, exhausted players lose condition
    const restBonus = fatigue < 30 ? 4 : fatigue > 70 ? -5 : 0;
    condition = clamp(condition + conditionDelta + restBonus, 15, 100);

    if (fatigue >= 80) {
      events.push(
        Object.freeze({
          date: Object.freeze({ ...currentDate }),
          footballerId: f.id,
          footballerName: f.name,
          type: 'exhaustion_warning',
          message: `${f.name} apresenta estafa muscular acumulada (Fadiga ${fatigue}%). Risco elevado de lesão.`,
        })
      );
    }

    // Check for training injury
    // Base chance depends on natural injuryRisk, training intensity, facilities, and fatigue
    const fatigueRiskPenalty = fatigue > 70 ? 2.2 : fatigue > 50 ? 1.4 : 1.0;
    const effectiveInjuryChance =
      (f.injuryRisk / 1000) *
      details.injuryRiskFactor *
      facilityMod.injuryRiskMultiplier *
      fatigueRiskPenalty *
      intensityMultiplier;

    if (stream.next() < effectiveInjuryChance) {
      // Player suffers a historical injury
      const injuryRoll = stream.next();
      let injuryType: 'contusion' | 'sprain' | 'strain' | 'fracture';
      let description: string;
      let expectedWeeks: number;
      let severity: 'minor' | 'moderate' | 'severe';

      if (injuryRoll < 0.50) {
        injuryType = 'contusion';
        severity = 'minor';
        expectedWeeks = 1 + Math.floor(stream.next() * 2);
        description = 'Contusão muscular na coxa (pancada em treino)';
      } else if (injuryRoll < 0.80) {
        injuryType = 'sprain';
        severity = 'moderate';
        expectedWeeks = 2 + Math.floor(stream.next() * 3);
        description = 'Entorse de tornozelo em terreno acidentado';
      } else if (injuryRoll < 0.95) {
        injuryType = 'strain';
        severity = 'moderate';
        expectedWeeks = 3 + Math.floor(stream.next() * 3);
        description = 'Estiramento muscular na virilha durante pique';
      } else {
        injuryType = 'fracture';
        severity = 'severe';
        expectedWeeks = 6 + Math.floor(stream.next() * 6);
        description = 'Fratura de clavícula em dividida rústica';
      }

      currentInjury = Object.freeze({
        id: `inj-${f.id}-${currentDate.year}-${currentDate.month}-${currentDate.day}`,
        type: injuryType,
        description,
        occurredDate: Object.freeze({ ...currentDate }),
        expectedWeeks,
        weeksRemaining: expectedWeeks,
        severity,
      });

      condition = Math.max(20, condition - 20);

      events.push(
        Object.freeze({
          date: Object.freeze({ ...currentDate }),
          footballerId: f.id,
          footballerName: f.name,
          type: 'injury_occurred',
          message: `${f.name} sofreu ${description} e desfalcará a equipe por cerca de ${expectedWeeks} semana(s).`,
        })
      );
    } else {
      // Attribute growth check (E3)
      // Progression rate: highest for youth (< 22), moderate for peak (22–27), rare for veterans (28+)
      const youthMultiplier = f.age <= 21 ? 2.5 : f.age <= 25 ? 1.5 : f.age <= 28 ? 1.0 : 0.4;
      const growthRollChance = 0.08 * youthMultiplier * facilityMod.trainingEffectMultiplier;

      if (stream.next() < growthRollChance) {
        // Choose one attribute from details.primaryAttributes to develop
        const attrKeys = details.primaryAttributes;
        const chosenAttr = attrKeys[Math.floor(stream.next() * attrKeys.length)];

        let evolved = false;
        let attrLabel = chosenAttr;

        // Check technical
        if (chosenAttr in tech) {
          const key = chosenAttr as keyof TechnicalAttributes;
          if (tech[key] < f.potential && tech[key] < 95) {
            tech = { ...tech, [key]: tech[key] + 1 };
            evolved = true;
            attrLabel = `técnica (${chosenAttr})`;
          }
        }
        // Check physical
        else if (chosenAttr in phys) {
          const key = chosenAttr as keyof PhysicalAttributes;
          if (phys[key] < f.potential && phys[key] < 95) {
            phys = { ...phys, [key]: phys[key] + 1 };
            evolved = true;
            attrLabel = `física (${chosenAttr})`;
          }
        }
        // Check mental
        else if (chosenAttr in ment) {
          const key = chosenAttr as keyof MentalAttributes;
          if (ment[key] < f.potential && ment[key] < 95) {
            ment = { ...ment, [key]: ment[key] + 1 };
            evolved = true;
            attrLabel = `mental (${chosenAttr})`;
          }
        }

        if (evolved) {
          events.push(
            Object.freeze({
              date: Object.freeze({ ...currentDate }),
              footballerId: f.id,
              footballerName: f.name,
              type: 'attribute_growth',
              message: `${f.name} demonstrou evolução no treinamento semanal: +1 em habilidade ${attrLabel}.`,
            })
          );
        }
      }
    }

    updatedFootballers.push(
      Object.freeze({
        ...f,
        condition,
        fatigue,
        currentInjury,
        technical: Object.freeze(tech),
        physical: Object.freeze(phys),
        mental: Object.freeze(ment),
      })
    );
  }

  return Object.freeze({
    squad: Object.freeze({
      ...squad,
      footballers: Object.freeze(updatedFootballers),
    }),
    events: Object.freeze(events),
  });
}

export interface AnnualAgingResult {
  readonly squad: FootballSquadState;
  readonly agingEvents: readonly string[];
}

/**
 * Processes annual aging of footballers (triggered on cadence.annual at January 1st).
 * Increments each athlete's age and modulates attributes according to natural physiological curves:
 * - < 22: Rapid physical and technical growth
 * - 22–27: Peak athletic stability
 * - 28–31: Slight physical decline, compensated by increased mental tactical maturity
 * - 32+: Accelerated physical decline, high tactical leadership
 */
export function processAnnualPlayerAging(
  squad: FootballSquadState,
  newYear: number,
  rng: CampaignRng
): AnnualAgingResult {
  const stream = rng.football;
  const updatedFootballers: Footballer[] = [];
  const events: string[] = [];

  for (const f of squad.footballers) {
    const newAge = f.age + 1;
    const phys = { ...f.physical };
    const ment = { ...f.mental };
    const tech = { ...f.technical };

    if (newAge <= 21) {
      // Natural youth maturation: +1 stamina/strength with 60% probability
      if (stream.next() < 0.60 && phys.stamina < 92) {
        phys.stamina = Math.min(95, phys.stamina + 1);
      }
      if (stream.next() < 0.50 && phys.strength < 90) {
        phys.strength = Math.min(95, phys.strength + 1);
      }
    } else if (newAge >= 28 && newAge <= 31) {
      // Veteran transition: minor physical deceleration, increased tactical composure
      if (stream.next() < 0.45 && phys.pace > 25) {
        phys.pace = Math.max(20, phys.pace - 1);
      }
      if (stream.next() < 0.45 && phys.agility > 25) {
        phys.agility = Math.max(20, phys.agility - 1);
      }
      if (stream.next() < 0.50 && ment.decision < 95) {
        ment.decision = Math.min(98, ment.decision + 1);
      }
      if (stream.next() < 0.50 && ment.positioning < 95) {
        ment.positioning = Math.min(98, ment.positioning + 1);
      }
    } else if (newAge >= 32) {
      // Veteran decline: accelerated physical loss
      const paceLoss = 1 + (stream.next() < 0.50 ? 1 : 0);
      phys.pace = Math.max(15, phys.pace - paceLoss);
      phys.agility = Math.max(15, phys.agility - 1);
      if (stream.next() < 0.50) {
        phys.stamina = Math.max(20, phys.stamina - 1);
      }
      // Mental compensation
      if (ment.composure < 95) {
        ment.composure = Math.min(98, ment.composure + 1);
      }
      events.push(`${f.name} completou ${newAge} anos em ${newYear}: veterano experiente com declínio físico natural.`);
    }

    updatedFootballers.push(
      Object.freeze({
        ...f,
        age: newAge,
        physical: Object.freeze(phys),
        mental: Object.freeze(ment),
        technical: Object.freeze(tech),
      })
    );
  }

  return Object.freeze({
    squad: Object.freeze({
      ...squad,
      footballers: Object.freeze(updatedFootballers),
    }),
    agingEvents: Object.freeze(events),
  });
}

/**
 * Changes the active training regimen of the squad.
 */
export function setSquadTrainingRegime(
  squad: FootballSquadState,
  regime: TrainingRegime
): FootballSquadState {
  return Object.freeze({
    ...squad,
    trainingRegime: Object.freeze({ ...regime }),
  });
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
