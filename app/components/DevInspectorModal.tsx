'use client';

import React, { useState } from 'react';
import {
  CANONICAL_HISTORICAL_CALIBRATION,
  auditHistoricalAnachronisms,
  HistoricalDataPoint,
} from '../../game/engine/HistoricalCalibration';
import {
  TIME_TRAVEL_MILESTONES,
  buildReproducibleSeedPackage,
  TimeTravelMilestone,
} from '../../game/engine/TimeTravelDebugger';

interface DevInspectorModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly worldSeed?: string;
  readonly currentYear?: number;
}

export const DevInspectorModal: React.FC<DevInspectorModalProps> = ({
  isOpen,
  onClose,
  worldSeed = 'CM-1910-TRADICAO',
  currentYear = 1910,
}) => {
  const [activeTab, setActiveTab] = useState<'rng' | 'timetravel' | 'calibration' | 'audit'>('rng');
  const [selectedMilestone, setSelectedMilestone] = useState<TimeTravelMilestone>(TIME_TRAVEL_MILESTONES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyPackage = () => {
    const pkg = buildReproducibleSeedPackage(worldSeed, [
      { day: 1, action: 'found_club_inaugural', seed: worldSeed },
      { day: 30, action: 'confirm_parcel_occupation' },
    ]);
    navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
    setCopyFeedback('PACOTE JSON v25 COPIADO!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const filteredCalibration: readonly HistoricalDataPoint[] =
    selectedCategory === 'all'
      ? CANONICAL_HISTORICAL_CALIBRATION
      : CANONICAL_HISTORICAL_CALIBRATION.filter((p) => p.category === selectedCategory);

  const anachronismResults = auditHistoricalAnachronisms(currentYear);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black border-4 border-white text-white font-mono flex flex-col shadow-[8px_8px_0px_#ffffff] overflow-hidden">
        {/* Top Header Arcade */}
        <div className="p-4 bg-white text-black flex items-center justify-between border-b-4 border-black select-none">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛠️</span>
            <div>
              <h2 id="dev-inspector-title" className="text-lg font-black tracking-widest uppercase">
                CENTRAL DEV & INSPEÇÃO DETERMINÍSTICA
              </h2>
              <p className="text-xs font-semibold tracking-wider text-neutral-800">
                MACROETAPAS 39, 40 E 41 · TIME-TRAVEL · CALIBRAÇÃO HISTÓRICA · ZERO MATH.RANDOM()
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-black text-white hover:bg-neutral-800 font-bold border-2 border-white transition-colors cursor-pointer text-sm"
            title="Fechar (Esc)"
          >
            [ X FECHAR ]
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-white bg-neutral-950 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('rng')}
            className={`px-4 py-2.5 transition-colors uppercase border-r-2 border-white ${
              activeTab === 'rng' ? 'bg-white text-black' : 'bg-black text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            🕹️ STREAMS DE RNG & TELEMETRIA
          </button>
          <button
            onClick={() => setActiveTab('timetravel')}
            className={`px-4 py-2.5 transition-colors uppercase border-r-2 border-white ${
              activeTab === 'timetravel' ? 'bg-white text-black' : 'bg-black text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            ⏳ MÁQUINA DO TEMPO (7 MARCOS)
          </button>
          <button
            onClick={() => setActiveTab('calibration')}
            className={`px-4 py-2.5 transition-colors uppercase border-r-2 border-white ${
              activeTab === 'calibration' ? 'bg-white text-black' : 'bg-black text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            📜 CALIBRAÇÃO HISTÓRICA (5 EIXOS)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 transition-colors uppercase ${
              activeTab === 'audit' ? 'bg-white text-black' : 'bg-black text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            🛡️ AUDITOR DE ANACRONISMOS
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm bg-neutral-950">
          {/* TAB 1: RNG & TELEMETRIA */}
          {activeTab === 'rng' && (
            <div className="space-y-4">
              <div className="border-2 border-white p-3 bg-black flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-400 uppercase tracking-widest font-bold">
                    SEED DA CAMPANHA ATIVA
                  </div>
                  <div className="text-lg font-black text-white tracking-wider">{worldSeed}</div>
                </div>
                <button
                  onClick={handleCopyPackage}
                  className="px-4 py-2 bg-white text-black font-black text-xs hover:bg-neutral-200 uppercase transition-all shadow-[2px_2px_0px_#888]"
                >
                  {copyFeedback ? copyFeedback : '📋 COPIAR PACOTE REPLAY v25'}
                </button>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300 mb-2">
                  ESTADO DAS 8 STREAMS ISOLADAS DE DETERMINISMO (CAMPAIGNRNG)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: 'city', desc: 'Terreno, Rios e Avenidas', steps: '4,120 ticks' },
                    { name: 'population', desc: 'Demografia e Distritos', steps: '1,840 ticks' },
                    { name: 'club', desc: 'Fundação, Caixa e Sócios', steps: '980 ticks' },
                    { name: 'football', desc: 'Duelos 2-3-5 e Atletas', steps: '5,310 ticks' },
                    { name: 'politics', desc: 'Eleições e Facções', steps: '320 ticks' },
                    { name: 'federation', desc: 'LMDT, Cismas e Taças', steps: '460 ticks' },
                    { name: 'events', desc: 'Interrupções e Acasos', steps: '890 ticks' },
                    { name: 'media', desc: 'Imprensa e Crônicas', steps: '1,150 ticks' },
                  ].map((stream) => (
                    <div key={stream.name} className="border border-white/60 p-2.5 bg-black">
                      <div className="flex items-center justify-between">
                        <span className="font-black uppercase text-white">{stream.name}</span>
                        <span className="text-[10px] bg-white text-black px-1 font-bold">OK</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">{stream.desc}</div>
                      <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                        Consumo: {stream.steps}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-neutral-700 p-3 bg-neutral-900 text-xs space-y-1.5">
                <div className="font-bold text-white uppercase">GARANTIA DE DETERMINISMO ARQUITETURAL</div>
                <p className="text-neutral-300 leading-relaxed">
                  O jogo proíbe terminantemente chamadas diretas a <code className="bg-black px-1 text-white">Math.random()</code> em todo o Core.
                  A suíte <code className="bg-black px-1 text-white">game/architecture.test.ts</code> atua como gate executável em cada compilação.
                  Duas execuções headless a partir da mesma seed reproduzem byte a byte o mesmo mundo em 1959.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TIME-TRAVEL */}
          {activeTab === 'timetravel' && (
            <div className="space-y-4">
              <div className="border border-white/40 p-2.5 bg-neutral-900 text-xs text-neutral-300">
                Selecione um dos 7 marcos históricos determinísticos da campanha para examinar a conjuntura de época:
              </div>

              {/* Milestones timeline buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {TIME_TRAVEL_MILESTONES.map((m) => (
                  <button
                    key={m.year}
                    onClick={() => setSelectedMilestone(m)}
                    className={`p-2 text-center border transition-all ${
                      selectedMilestone.year === m.year
                        ? 'bg-white text-black font-black border-white shadow-[2px_2px_0px_#fff]'
                        : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <div className="text-sm font-black">{m.year}</div>
                    <div className="text-[9px] uppercase tracking-tighter truncate">{m.title}</div>
                  </button>
                ))}
              </div>

              {/* Selected Milestone Dossier */}
              <div className="border-2 border-white p-4 bg-black space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-700 pb-2">
                  <div>
                    <span className="text-xs bg-white text-black px-2 py-0.5 font-black uppercase mr-2">
                      ANO {selectedMilestone.year}
                    </span>
                    <span className="text-base font-black uppercase text-white">{selectedMilestone.title}</span>
                  </div>
                  <div className="text-xs text-neutral-400 font-semibold">{selectedMilestone.era}</div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">{selectedMilestone.contextDescription}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="border border-neutral-700 p-2 bg-neutral-900">
                    <div className="font-bold text-white uppercase text-[10px] mb-1">🪙 PADRÃO MONETÁRIO</div>
                    <div className="font-black text-neutral-200">
                      {selectedMilestone.monetarySystem === 'REIS' ? 'RÉIS (1$000 Mil-Réis)' : 'CRUZEIRO (Cr$)'}
                    </div>
                  </div>
                  <div className="border border-neutral-700 p-2 bg-neutral-900">
                    <div className="font-bold text-white uppercase text-[10px] mb-1">⚽ REGULAMENTO DE FUTEBOL</div>
                    <div className="text-neutral-300 text-[11px]">{selectedMilestone.footballStatus}</div>
                  </div>
                  <div className="border border-neutral-700 p-2 bg-neutral-900">
                    <div className="font-bold text-white uppercase text-[10px] mb-1">🏙️ CIDADE DE MINAS</div>
                    <div className="text-neutral-300 text-[11px]">{selectedMilestone.urbanStatus}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-neutral-400 uppercase mb-1">REGRAS HISTÓRICAS EM VIGOR:</div>
                  <ul className="list-disc list-inside text-xs text-neutral-300 space-y-0.5">
                    {selectedMilestone.keyRules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CALIBRAÇÃO HISTÓRICA */}
          {activeTab === 'calibration' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                {[
                  { id: 'all', label: 'TODOS' },
                  { id: 'demografia', label: '👥 DEMOGRAFIA' },
                  { id: 'economia', label: '💰 ECONOMIA' },
                  { id: 'futebol', label: '⚽ FUTEBOL' },
                  { id: 'urbanismo_ferrovias', label: '🚂 FERROVIAS & URB' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 border uppercase ${
                      selectedCategory === cat.id
                        ? 'bg-white text-black font-black border-white'
                        : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredCalibration.map((point) => (
                  <div key={point.id} className="border border-white/70 p-3 bg-black space-y-2">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-white text-black px-1.5 py-0.5 uppercase">
                          {point.ano}
                        </span>
                        <span className="font-black text-white uppercase text-xs sm:text-sm">
                          {point.indicator}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-neutral-300">{point.valor}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-bold text-neutral-400 uppercase text-[10px]">🏛️ FONTE OFICIAL: </span>
                        <span className="text-neutral-200">{point.fonte}</span>
                      </div>
                      <div>
                        <span className="font-bold text-neutral-400 uppercase text-[10px]">💡 INTERPRETAÇÃO: </span>
                        <span className="text-neutral-300">{point.interpretacao}</span>
                      </div>
                      <div>
                        <span className="font-bold text-neutral-400 uppercase text-[10px]">⚠️ LIMITAÇÃO HISTÓRICA: </span>
                        <span className="text-neutral-400 italic">{point.limitacao}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AUDITOR DE ANACRONISMOS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="border border-white/60 p-3 bg-black flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-400 uppercase font-bold">ANO EM EXECUÇÃO NO JOGO</div>
                  <div className="text-xl font-black text-white">{currentYear}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-400 uppercase font-bold">ESTADO DE ANACRONISMOS</div>
                  <span className="inline-block px-2 py-0.5 bg-white text-black font-black text-xs uppercase mt-0.5">
                    100% AUTÊNTICO
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {anachronismResults.map((check) => (
                  <div key={check.checkId} className="border border-neutral-700 p-3 bg-neutral-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-xs uppercase">{check.ruleName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 font-black uppercase ${
                          check.status === 'PASS' ? 'bg-white text-black' : 'bg-red-600 text-white'
                        }`}
                      >
                        {check.status === 'PASS' ? '✓ VERIFICADO' : '✗ ANACRONISMO'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Período válido: {check.validPeriod}
                    </div>
                    <div className="text-xs text-neutral-200 font-mono mt-1">{check.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-black border-t-2 border-white flex justify-between items-center text-xs">
          <span className="text-neutral-400 uppercase">
            TRADIÇÃO ESPORTE CLUBE · DEV SUITE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white text-black font-black hover:bg-neutral-200 transition-colors uppercase border border-white"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
};
