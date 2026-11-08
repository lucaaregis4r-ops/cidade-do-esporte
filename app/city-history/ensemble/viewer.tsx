'use client';

import Link from 'next/link';
import type { CityHistoryEnsemble, CityHistoryMetricBand } from '@/game/engine';

const METRICS: ReadonlyArray<{ id: keyof CityHistoryEnsemble['years'][number]['metrics']; label: string }> = [
  { id: 'populationUnits', label: 'População abstrata' },
  { id: 'employmentUnits', label: 'Empregos abstratos' },
  { id: 'activeBuildings', label: 'Edifícios ativos' },
  { id: 'developedParcels', label: 'Parcelas ocupadas' },
  { id: 'centralities', label: 'Novas centralidades' },
  { id: 'avenues', label: 'Vias promovidas a avenidas' },
  { id: 'baselineLandValuePpu', label: 'PPU de base' },
];

function formatBand(band: CityHistoryMetricBand | null): string {
  if (!band) return '— · sem projeção';
  return `${band.minimum.toLocaleString('pt-BR')} · ${band.mean.toLocaleString('pt-BR')} · ${band.maximum.toLocaleString('pt-BR')}`;
}

export function CityHistoryEnsembleViewer({ ensemble }: { ensemble: CityHistoryEnsemble }) {
  function downloadReport() {
    const blob = new Blob([JSON.stringify({ format: 'cidade-de-minas-city-history-ensemble', ...ensemble }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cidade-de-minas-b11-faixas-sinteticas.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <main style={{ minHeight: '100vh', padding: '28px clamp(18px, 4vw, 58px) 48px', color: '#f0ead7', background: '#151a16', fontFamily: 'Georgia, serif' }}>
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, maxWidth: 1440, margin: '0 auto 22px' }}>
      <div>
        <Link href="/city-history" style={{ color: '#d5bd7d', font: '600 12px system-ui', textDecoration: 'none' }}>← Voltar ao mapa da cidade</Link>
        <h1 style={{ margin: '12px 0 4px', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 500 }}>Faixas do modelo urbano</h1>
        <div style={{ color: '#b4b8a7', font: '13px system-ui' }}>Alpha B/B11 · execução headless · {ensemble.sampleCount} seeds</div>
      </div>
      <button onClick={downloadReport} style={{ border: '1px solid #85784f', borderRadius: 7, padding: '10px 13px', background: '#27271f', color: '#f0ead7', cursor: 'pointer' }}>Baixar relatório JSON</button>
    </header>

    <section aria-label="Aviso da demonstração" style={{ maxWidth: 1440, margin: '0 auto 20px', padding: '13px 16px', borderLeft: '4px solid #d5bd7d', background: '#28271f', color: '#e4dcbf', font: '13px/1.5 system-ui' }}>
      Demonstração sintética para revisão do comportamento do modelo. As faixas não são previsões nem calibração histórica. A amostra contém oito seeds de revisão; os testes históricos de 100+ seeds continuam sendo um critério posterior da Macroetapa 39.
    </section>

    <section style={{ maxWidth: 1440, margin: '0 auto 18px', padding: 15, border: '1px solid #363d31', borderRadius: 12, background: '#1c221d' }}>
      <h2 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 500 }}>Seeds da amostra</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {ensemble.seedIds.map((seed) => <code key={seed} style={{ padding: '5px 8px', borderRadius: 5, background: '#252b24', color: '#dfd4b5', font: '12px ui-monospace, monospace' }}>{seed}</code>)}
      </div>
    </section>

    <section aria-label="Faixas estatísticas por ano" style={{ maxWidth: 1440, margin: '0 auto', overflowX: 'auto', border: '1px solid #363d31', borderRadius: 12, background: '#1c221d' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: '13px system-ui', minWidth: 640 }}>
        <caption style={{ padding: 14, textAlign: 'left', color: '#c4c7b6' }}>Cada faixa mostra mínimo · média · máximo entre as seeds, por ano. PPU permanece somente na base de 1910.</caption>
        <thead><tr style={{ color: '#dfd4b5', textAlign: 'left', background: '#252b24' }}>
          <th scope="col" style={{ padding: 11 }}>Ano</th><th scope="col" style={{ padding: 11 }}>Métrica</th><th scope="col" style={{ padding: 11 }}>Mínimo · média · máximo</th>
        </tr></thead>
        <tbody>{ensemble.years.flatMap((year) => METRICS.map((metric) => {
          const band = year.metrics[metric.id];
          return <tr key={`${year.year}-${metric.id}`} style={{ borderTop: '1px solid #363d31', color: '#e8e0ca' }}>
            <th scope="row" style={{ padding: 10, textAlign: 'left', color: '#d5bd7d', whiteSpace: 'nowrap' }}>{year.year}</th>
            <td style={{ padding: 10 }}>{metric.label}</td>
            <td style={{ padding: 10, fontVariantNumeric: 'tabular-nums' }}>{formatBand(band)}</td>
          </tr>;
        }))}</tbody>
      </table>
    </section>
  </main>;
}
