export interface GameDate {
  year: number;
  month: number;
  day: number;
}

export interface HistoricalCadence {
  advanced: boolean;
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
  annual: boolean;
  completedMonthDays: number | null;
  campaignComplete: boolean;
}

export const CAMPAIGN_START_DATE: Readonly<GameDate> = { year: 1910, month: 1, day: 1 };
export const CAMPAIGN_END_DATE: Readonly<GameDate> = { year: 1959, month: 12, day: 31 };

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`invalid year/month: ${year}/${month}`);
  }
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

function nextDate(date: GameDate): GameDate {
  if (date.day < daysInMonth(date.year, date.month)) {
    return { ...date, day: date.day + 1 };
  }
  if (date.month < 12) return { year: date.year, month: date.month + 1, day: 1 };
  return { year: date.year + 1, month: 1, day: 1 };
}

function dateAtElapsedDays(elapsedDays: number): GameDate {
  let date = { ...CAMPAIGN_START_DATE };
  for (let i = 0; i < elapsedDays; i++) date = nextDate(date);
  return date;
}

function elapsedDaysAtEnd(): number {
  let elapsed = 0;
  let date = { ...CAMPAIGN_START_DATE };
  while (
    date.year !== CAMPAIGN_END_DATE.year ||
    date.month !== CAMPAIGN_END_DATE.month ||
    date.day !== CAMPAIGN_END_DATE.day
  ) {
    date = nextDate(date);
    elapsed++;
  }
  return elapsed;
}

export const MAX_CAMPAIGN_ELAPSED_DAYS = elapsedDaysAtEnd();

export class HistoricalClock {
  private elapsedDays = 0;
  private date: GameDate = { ...CAMPAIGN_START_DATE };

  getDate(): GameDate {
    return { ...this.date };
  }

  getElapsedDays(): number {
    return this.elapsedDays;
  }

  isComplete(): boolean {
    return this.elapsedDays === MAX_CAMPAIGN_ELAPSED_DAYS;
  }

  reset(): void {
    this.elapsedDays = 0;
    this.date = { ...CAMPAIGN_START_DATE };
  }

  setElapsedDays(elapsedDays: number): boolean {
    if (
      !Number.isInteger(elapsedDays) ||
      elapsedDays < 0 ||
      elapsedDays > MAX_CAMPAIGN_ELAPSED_DAYS
    ) {
      return false;
    }
    this.elapsedDays = elapsedDays;
    this.date = dateAtElapsedDays(elapsedDays);
    return true;
  }

  advanceOneDay(): HistoricalCadence {
    if (this.isComplete()) {
      return {
        advanced: false,
        daily: false,
        weekly: false,
        monthly: false,
        annual: false,
        completedMonthDays: null,
        campaignComplete: true,
      };
    }

    const previous = this.date;
    this.date = nextDate(previous);
    this.elapsedDays++;
    const monthly = this.date.day === 1;

    return {
      advanced: true,
      daily: true,
      weekly: this.elapsedDays % 7 === 0,
      monthly,
      annual: monthly && this.date.month === 1,
      completedMonthDays: monthly ? daysInMonth(previous.year, previous.month) : null,
      campaignComplete: this.isComplete(),
    };
  }
}
