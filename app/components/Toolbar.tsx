'use client';

import { Tool } from '@/game/tools';

export interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  paused: boolean;
  speedMultiplier: 1 | 2 | 4 | 8;
  onPauseToggle: () => void;
  onSpeedChange: (tier: 1 | 2 | 4 | 8) => void;
}

const SPEEDS = [1, 2, 4, 8] as const;

/** The campaign player observes the city; municipal editing remains an internal engine capability. */
export function Toolbar({ currentTool, onToolChange, paused, speedMultiplier, onPauseToggle, onSpeedChange }: ToolbarProps) {
  return (
    <div className="campaign-controls" aria-label="Controles da campanha">
      <button
        type="button"
        className={currentTool === Tool.SELECT ? 'active' : ''}
        onClick={() => onToolChange(Tool.SELECT)}
        title="Inspecionar parcela ou distrito (S)"
      >
        Inspecionar <small>[S]</small>
      </button>
      <span className="campaign-control-divider" />
      <button type="button" className={paused ? 'active' : ''} onClick={onPauseToggle} title={paused ? 'Continuar (Espaço)' : 'Pausar (Espaço)'}>
        {paused ? 'Continuar' : 'Pausar'} <small>[Espaço]</small>
      </button>
      <span className="campaign-control-label">Velocidade</span>
      {SPEEDS.map((speed, index) => (
        <button
          key={speed}
          type="button"
          className={speedMultiplier === speed ? 'active' : ''}
          onClick={() => onSpeedChange(speed)}
          title={`${speed}x (tecla ${index + 1})`}
        >
          {speed}x <small>[{index + 1}]</small>
        </button>
      ))}
    </div>
  );
}
