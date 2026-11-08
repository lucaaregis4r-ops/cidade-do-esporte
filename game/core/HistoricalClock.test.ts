import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_END_DATE,
  CAMPAIGN_START_DATE,
  HistoricalClock,
  MAX_CAMPAIGN_ELAPSED_DAYS,
  daysInMonth,
  isLeapYear,
} from './HistoricalClock';

describe('HistoricalClock', () => {
  it('starts on 1 January 1910', () => {
    const clock = new HistoricalClock();
    expect(clock.getDate()).toEqual(CAMPAIGN_START_DATE);
    expect(clock.getElapsedDays()).toBe(0);
  });

  it('emits daily, weekly, monthly, and annual boundaries', () => {
    const clock = new HistoricalClock();
    for (let i = 0; i < 6; i++) expect(clock.advanceOneDay().weekly).toBe(false);
    expect(clock.advanceOneDay().weekly).toBe(true);

    expect(clock.setElapsedDays(30)).toBe(true);
    const february = clock.advanceOneDay();
    expect(clock.getDate()).toEqual({ year: 1910, month: 2, day: 1 });
    expect(february).toMatchObject({ daily: true, monthly: true, annual: false, completedMonthDays: 31 });

    expect(clock.setElapsedDays(364)).toBe(true);
    const newYear = clock.advanceOneDay();
    expect(clock.getDate()).toEqual({ year: 1911, month: 1, day: 1 });
    expect(newYear).toMatchObject({ monthly: true, annual: true, completedMonthDays: 31 });
  });

  it('uses Gregorian leap-year rules', () => {
    expect(isLeapYear(1912)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(1912, 2)).toBe(29);
    expect(daysInMonth(1911, 2)).toBe(28);
  });

  it('stops exactly on 31 December 1959', () => {
    const clock = new HistoricalClock();
    expect(clock.setElapsedDays(MAX_CAMPAIGN_ELAPSED_DAYS - 1)).toBe(true);
    const finalDay = clock.advanceOneDay();
    expect(clock.getDate()).toEqual(CAMPAIGN_END_DATE);
    expect(finalDay.campaignComplete).toBe(true);
    expect(clock.advanceOneDay()).toMatchObject({ advanced: false, campaignComplete: true });
    expect(clock.getDate()).toEqual(CAMPAIGN_END_DATE);
  });

  it('rejects elapsed days outside the campaign without mutation', () => {
    const clock = new HistoricalClock();
    expect(clock.setElapsedDays(-1)).toBe(false);
    expect(clock.setElapsedDays(MAX_CAMPAIGN_ELAPSED_DAYS + 1)).toBe(false);
    expect(clock.setElapsedDays(1.5)).toBe(false);
    expect(clock.getDate()).toEqual(CAMPAIGN_START_DATE);
  });
});
