import { describe, it, expect, beforeEach, vi } from 'vitest';
import { retroAudio } from './RetroAudio';

describe('RetroAudio Controller', () => {
  beforeEach(() => {
    retroAudio.setMuted(false);
  });

  it('manages mute state correctly', () => {
    expect(retroAudio.isMuted()).toBe(false);
    const toggled = retroAudio.toggleMute();
    expect(toggled).toBe(true);
    expect(retroAudio.isMuted()).toBe(true);
    retroAudio.setMuted(false);
    expect(retroAudio.isMuted()).toBe(false);
  });

  it('safely handles audio methods when muted or without AudioContext in Node environment', () => {
    retroAudio.setMuted(true);
    expect(() => retroAudio.playBlip()).not.toThrow();
    expect(() => retroAudio.playStart()).not.toThrow();
    expect(() => retroAudio.playWhistle()).not.toThrow();
    expect(() => retroAudio.playFanfare()).not.toThrow();
    expect(() => retroAudio.playAlert()).not.toThrow();

    retroAudio.setMuted(false);
    expect(() => retroAudio.playBlip()).not.toThrow();
    expect(() => retroAudio.playStart()).not.toThrow();
    expect(() => retroAudio.playWhistle()).not.toThrow();
    expect(() => retroAudio.playFanfare()).not.toThrow();
    expect(() => retroAudio.playAlert()).not.toThrow();
  });
});
