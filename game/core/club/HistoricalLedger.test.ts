import { describe, it, expect } from 'vitest';
import {
  createEmptyHistoricalLedger,
  recordHistoricalEvent,
  getCausalChain,
  getEventsByDecade,
  validateHistoricalEvent,
} from './HistoricalLedger';

describe('HistoricalLedger (Alpha G: G9 / Macroetapa 33)', () => {
  it('records events with causal links and updates consequences in preceding cause events', () => {
    let ledger = createEmptyHistoricalLedger();

    // 1. Evento 1: Fundação
    ledger = recordHistoricalEvent(ledger, {
      id: 'ev-fundacao-1910',
      date: { year: 1910, month: 1, day: 1 },
      category: 'FUNDACAO',
      importance: 100,
      title: 'Fundação Solene do Clube em 1910',
      description: 'Reunião de fundadores redigindo a ata inaugural.',
      clubs: ['club-1'],
      tags: ['fundacao', 'marco_zero'],
    });

    expect(ledger.events).toHaveLength(1);
    expect(validateHistoricalEvent(ledger.events[0])).toBe(true);
    expect(ledger.events[0].causes).toHaveLength(0);
    expect(ledger.events[0].consequences).toHaveLength(0);

    // 2. Evento 2: Construção do Campo (causado pela fundação)
    ledger = recordHistoricalEvent(ledger, {
      id: 'ev-obra-1910',
      date: { year: 1910, month: 3, day: 15 },
      category: 'OBRA',
      importance: 80,
      title: 'Inauguração do Campo de Terra Batida',
      description: 'O clube conclui o tapume e aterração da praça.',
      facilities: ['fac-campo'],
      causes: ['ev-fundacao-1910'],
      tags: ['patrimonio', 'estadio'],
    });

    expect(ledger.events).toHaveLength(2);

    // Cause event 1 must have acquired consequence 'ev-obra-1910'
    const ev1 = ledger.events.find((e) => e.id === 'ev-fundacao-1910');
    expect(ev1?.consequences).toContain('ev-obra-1910');

    // 3. Evento 3: Primeiro Jogo Oficial (causado pela obra do campo)
    ledger = recordHistoricalEvent(ledger, {
      id: 'ev-jogo-1910',
      date: { year: 1910, month: 5, day: 1 },
      category: 'PRIMEIRO_JOGO',
      importance: 85,
      title: 'O Primeiro Prélio Oficial',
      description: 'Estreia com vitória expressiva.',
      causes: ['ev-obra-1910'],
      tags: ['partida', 'estreia'],
    });

    expect(ledger.events).toHaveLength(3);
    const ev2 = ledger.events.find((e) => e.id === 'ev-obra-1910');
    expect(ev2?.consequences).toContain('ev-jogo-1910');

    // Causal chain inspection for Evento 3 (Jogo): root causes should include fundacao and obra
    const chain = getCausalChain(ledger, 'ev-jogo-1910');
    expect(chain.targetEvent?.id).toBe('ev-jogo-1910');
    expect(chain.rootCauses.map((e) => e.id)).toEqual(['ev-fundacao-1910', 'ev-obra-1910']);
    expect(chain.downstreamConsequences).toHaveLength(0);

    // Causal chain inspection for Evento 1 (Fundação): downstream consequences should include obra and jogo
    const chainFundacao = getCausalChain(ledger, 'ev-fundacao-1910');
    expect(chainFundacao.rootCauses).toHaveLength(0);
    expect(chainFundacao.downstreamConsequences.map((e) => e.id)).toEqual(['ev-obra-1910', 'ev-jogo-1910']);
  });

  it('filters events by historical decade correctly', () => {
    let ledger = createEmptyHistoricalLedger();

    ledger = recordHistoricalEvent(ledger, {
      id: 'ev-1910',
      date: { year: 1910, month: 1, day: 1 },
      category: 'FUNDACAO',
      importance: 90,
      title: 'Fundação',
      description: 'Desc',
    });

    ledger = recordHistoricalEvent(ledger, {
      id: 'ev-1925',
      date: { year: 1925, month: 6, day: 10 },
      category: 'TITULO',
      importance: 85,
      title: 'Título de 1925',
      description: 'Desc',
    });

    ledger = recordHistoricalEvent(ledger, {
      id: 'ev-1936',
      date: { year: 1936, month: 8, day: 20 },
      category: 'HOMENAGEM',
      importance: 70,
      title: 'Busto Esculpido',
      description: 'Desc',
    });

    const decade1910 = getEventsByDecade(ledger, 1910);
    expect(decade1910).toHaveLength(1);
    expect(decade1910[0].id).toBe('ev-1910');

    const decade1920 = getEventsByDecade(ledger, 1920);
    expect(decade1920).toHaveLength(1);
    expect(decade1920[0].id).toBe('ev-1925');

    const decade1930 = getEventsByDecade(ledger, 1930);
    expect(decade1930).toHaveLength(1);
    expect(decade1930[0].id).toBe('ev-1936');

    const decade1940 = getEventsByDecade(ledger, 1940);
    expect(decade1940).toHaveLength(0);
  });
});
