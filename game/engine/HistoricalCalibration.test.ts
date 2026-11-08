import { describe, it, expect } from 'vitest';
import {
  CANONICAL_HISTORICAL_CALIBRATION,
  getCalibrationDataByCategory,
  getCalibrationDataByPeriod,
  auditHistoricalAnachronisms,
} from './HistoricalCalibration';

describe('HistoricalCalibration (Macroetapa 41)', () => {
  it('respeita estritamente a Regra dos 5 Eixos em todos os pontos de dados', () => {
    expect(CANONICAL_HISTORICAL_CALIBRATION.length).toBeGreaterThanOrEqual(10);

    for (const point of CANONICAL_HISTORICAL_CALIBRATION) {
      expect(point.id).toBeTruthy();
      expect(point.category).toBeTruthy();
      expect(point.indicator).toBeTruthy();
      // Eixo 1: valor
      expect(point.valor).toBeDefined();
      expect(String(point.valor).length).toBeGreaterThan(0);
      // Eixo 2: ano
      expect(typeof point.ano).toBe('number');
      expect(point.ano).toBeGreaterThanOrEqual(1910);
      expect(point.ano).toBeLessThanOrEqual(1959);
      // Eixo 3: fonte
      expect(point.fonte).toBeTruthy();
      expect(point.fonte.length).toBeGreaterThan(5);
      // Eixo 4: interpretação
      expect(point.interpretacao).toBeTruthy();
      expect(point.interpretacao.length).toBeGreaterThan(15);
      // Eixo 5: limitação
      expect(point.limitacao).toBeTruthy();
      expect(point.limitacao.length).toBeGreaterThan(15);
    }
  });

  it('permite filtrar por categoria e período histórico', () => {
    const demografia = getCalibrationDataByCategory('demografia');
    expect(demografia.length).toBeGreaterThan(0);
    expect(demografia.every((d) => d.category === 'demografia')).toBe(true);

    const period1910to1920 = getCalibrationDataByPeriod(1910, 1920);
    expect(period1910to1920.length).toBeGreaterThan(0);
    expect(period1910to1920.every((d) => d.ano >= 1910 && d.ano <= 1920)).toBe(true);
  });

  describe('Auditor de Anacronismos (Macroetapa 39/41)', () => {
    it('aprova estado autêntico em 1910', () => {
      const results1910 = auditHistoricalAnachronisms(
        1910,
        'REIS',
        0, // 0 subs
        false, // sem cartões coloridos
        false, // sem refletores
        false // sem taça brasil
      );

      expect(results1910.length).toBe(5);
      expect(results1910.every((r) => r.status === 'PASS')).toBe(true);
    });

    it('detecta anacronismo se usar cruzeiro antes de 1942', () => {
      const results = auditHistoricalAnachronisms(1925, 'CRUZEIRO', 0, false, false, false);
      const currencyCheck = results.find((r) => r.checkId === 'RULE-ANAC-01-CURRENCY');
      expect(currencyCheck?.status).toBe('ANACHRONISM_DETECTED');
    });

    it('detecta anacronismo se usar substituições em 1910', () => {
      const results = auditHistoricalAnachronisms(1910, 'REIS', 3, false, false, false);
      const subsCheck = results.find((r) => r.checkId === 'RULE-ANAC-02-SUBSTITUTIONS');
      expect(subsCheck?.status).toBe('ANACHRONISM_DETECTED');
    });

    it('detecta anacronismo se usar cartões amarelo/vermelho em qualquer ano até 1959', () => {
      const results = auditHistoricalAnachronisms(1950, 'CRUZEIRO', 0, true, true, false);
      const cardsCheck = results.find((r) => r.checkId === 'RULE-ANAC-03-CARDS');
      expect(cardsCheck?.status).toBe('ANACHRONISM_DETECTED');
    });

    it('detecta anacronismo se a Taça Brasil for disputada antes de 1959', () => {
      const results = auditHistoricalAnachronisms(1935, 'REIS', 0, false, true, true);
      const tacaCheck = results.find((r) => r.checkId === 'RULE-ANAC-05-TACABRASIL');
      expect(tacaCheck?.status).toBe('ANACHRONISM_DETECTED');
    });

    it('aprova estado autêntico de 1959 (Taça Brasil ativa, Cruzeiro, sem cartões)', () => {
      const results1959 = auditHistoricalAnachronisms(
        1959,
        'CRUZEIRO',
        0, // ainda 0 subs em 1959 no Brasil
        false, // sem cartões
        true, // com refletores
        true // taça brasil ativa!
      );

      expect(results1959.every((r) => r.status === 'PASS')).toBe(true);
    });
  });
});
