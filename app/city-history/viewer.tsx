'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CityHistoryPreview, CitySnapshot, CitySnapshotParcel } from '@/game/engine';

type Layer = 'growth' | 'districts' | 'parcels' | 'land-value' | 'relief';

const DISTRICT_COLORS = ['#d2a96f', '#b98863', '#8b7054', '#a8996d', '#c27d60', '#6f8a76', '#8a7a9c', '#7895a4', '#c4b46e'];
const BUILDING_COLORS: Record<string, string> = {
  residential: '#76a879', commercial: '#e8bd55', industrial: '#d07857', services: '#75a9c0',
};

function parcelValueById(snapshot: CitySnapshot): Map<string, CitySnapshotParcel> {
  return new Map(snapshot.parcels.map((parcel) => [parcel.id, parcel]));
}

function districtColorMap(snapshot: CitySnapshot): Map<string, string> {
  return new Map(snapshot.districts.map((district, index) => [district.id, DISTRICT_COLORS[index % DISTRICT_COLORS.length]]));
}

function colorForLandValue(parcel: CitySnapshotParcel | undefined, min: number, max: number): string {
  if (!parcel || parcel.baselineLandValuePpu === null) return '#d4c6a8';
  const t = max === min ? 0.5 : (parcel.baselineLandValuePpu - min) / (max - min);
  const red = Math.round(53 + 185 * t);
  const green = Math.round(103 + 75 * (1 - t));
  const blue = Math.round(130 - 78 * t);
  return `rgb(${red}, ${green}, ${blue})`;
}

function colorForElevation(elevation: number, min: number, max: number): string {
  const ratio = max === min ? 0.5 : (elevation - min) / (max - min);
  const low = [84, 119, 83];
  const high = [215, 190, 135];
  const channels = low.map((value, index) => Math.round(value + (high[index] - value) * ratio));
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

const INSTITUTION_MARKS: Record<string, string> = {
  'railway-station': 'E', 'public-square': 'P', 'commercial-cluster': 'C',
  'railway-workshops': 'O', 'small-industry': 'I',
};

function CityMap({ snapshot, layer, selectedParcelId, onSelectParcel }: {
  snapshot: CitySnapshot;
  layer: Layer;
  selectedParcelId: string | null;
  onSelectParcel: (parcelId: string | null) => void;
}) {
  const parcelById = useMemo(() => parcelValueById(snapshot), [snapshot]);
  const districtColors = useMemo(() => districtColorMap(snapshot), [snapshot]);
  const activeBuildings = snapshot.buildings.filter(({ status }) => status === 'active');
  const buildingsByParcel = new Map(activeBuildings.map((building) => [building.parcelId, building]));
  const parcelValues = snapshot.parcels.flatMap(({ baselineLandValuePpu }) => baselineLandValuePpu === null ? [] : [baselineLandValuePpu]);
  const minValue = Math.min(0, ...parcelValues);
  const maxValue = Math.max(1, ...parcelValues);
  const elevations = snapshot.elevations.flat();
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const avenueIds = new Set(snapshot.roads.filter(({ kind }) => kind === 'avenue').map(({ id }) => id));

  return (
    <svg
      role="img"
      aria-label={`Mapa de Cidade de Minas em ${snapshot.year}`}
      viewBox={`0 0 ${snapshot.width} ${snapshot.height}`}
      style={{ display: 'block', width: '100%', height: 'auto', background: '#17344a', borderRadius: 8, touchAction: 'manipulation' }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * snapshot.width);
        const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * snapshot.height);
        const parcelId = snapshot.parcelByTile[y]?.[x] ?? null;
        onSelectParcel(parcelId);
      }}
    >
      {snapshot.waterMask.flatMap((row, y) => row.map((isWater, x) => {
        const districtId = snapshot.districtByTile[y][x];
        const parcelId = snapshot.parcelByTile[y][x];
        const parcel = parcelId ? parcelById.get(parcelId) : undefined;
        const building = parcelId ? buildingsByParcel.get(parcelId) : undefined;
        let fill = isWater ? '#17344a' : '#79684e';
        if (!isWater && layer === 'districts' && districtId) fill = districtColors.get(districtId) ?? fill;
        if (!isWater && layer === 'parcels') fill = '#c9b998';
        if (!isWater && layer === 'land-value') fill = colorForLandValue(parcel, minValue, maxValue);
        if (!isWater && layer === 'growth' && building) fill = BUILDING_COLORS[building.kind];
        if (!isWater && layer === 'relief') fill = colorForElevation(snapshot.elevations[y][x], minElevation, maxElevation);
        const selected = parcelId !== null && parcelId === selectedParcelId;
        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} stroke={selected ? '#fff5c4' : layer === 'parcels' ? '#f1e3c6' : '#273729'} strokeWidth={selected ? 0.12 : layer === 'parcels' ? 0.035 : 0.012} />;
      }))}

      {layer === 'growth' && activeBuildings.map((building) => {
        const anchor = parcelById.get(building.parcelId)?.anchor;
        if (!anchor) return null;
        return <rect key={building.id} x={anchor.x + 0.24} y={anchor.y + 0.24} width="0.52" height="0.52" rx="0.08" fill={BUILDING_COLORS[building.kind]} stroke="#31291f" strokeWidth="0.07" />;
      })}

      {snapshot.roads.map((road) => <polyline
        key={road.id}
        points={road.path.map(({ x, y }) => `${x + 0.5},${y + 0.5}`).join(' ')}
        fill="none"
        stroke={avenueIds.has(road.id) ? '#ef8e50' : '#e0c99a'}
        strokeWidth={avenueIds.has(road.id) ? 0.36 : 0.16}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.96}
      />)}
      <polyline points={snapshot.railwayPath.map(({ x, y }) => `${x + 0.5},${y + 0.5}`).join(' ')} fill="none" stroke="#f1dc7a" strokeWidth="0.12" strokeDasharray="0.3 0.18" />

      {snapshot.centralities.map((center) => {
        const anchor = parcelById.get(center.parcelId)?.anchor;
        return anchor ? <circle key={center.id} cx={anchor.x + 0.5} cy={anchor.y + 0.5} r="0.38" fill="none" stroke="#fff1a8" strokeWidth="0.12" /> : null;
      })}

      <polygon
        aria-label="Centro histórico"
        points={`${snapshot.center.coordinate.x + 0.5},${snapshot.center.coordinate.y + 0.02} ${snapshot.center.coordinate.x + 0.98},${snapshot.center.coordinate.y + 0.5} ${snapshot.center.coordinate.x + 0.5},${snapshot.center.coordinate.y + 0.98} ${snapshot.center.coordinate.x + 0.02},${snapshot.center.coordinate.y + 0.5}`}
        fill="#fff1a8"
        stroke="#382b16"
        strokeWidth="0.12"
      />
      {snapshot.institutions.map((institution) => <g key={institution.id} aria-label={institution.kind}>
        <circle cx={institution.coordinate.x + 0.5} cy={institution.coordinate.y + 0.5} r="0.48" fill="#26312a" stroke="#fff1a8" strokeWidth="0.1" />
        <text x={institution.coordinate.x + 0.5} y={institution.coordinate.y + 0.69} textAnchor="middle" fill="#fff1a8" fontSize="0.52" fontFamily="system-ui" fontWeight="700">{INSTITUTION_MARKS[institution.kind] ?? '?'}</text>
      </g>)}
    </svg>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div style={{ padding: '12px 14px', borderRadius: 10, background: '#202820', border: '1px solid #394336' }}>
    <div style={{ fontSize: 11, color: '#b0b8a3', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ marginTop: 5, fontSize: 22, fontWeight: 700, color: '#f0ead7' }}>{value}</div>
  </div>;
}

export function CityHistoryViewer({ preview }: { preview: CityHistoryPreview }) {
  const [year, setYear] = useState(1959);
  const [layer, setLayer] = useState<Layer>('growth');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const snapshot = preview.snapshots.find((item) => item.year === year) ?? preview.snapshots[0];
  const selectedParcel = selectedParcelId ? snapshot.parcels.find(({ id }) => id === selectedParcelId) : undefined;
  const activeLayers: { id: Layer; label: string }[] = [
    { id: 'growth', label: 'Ocupação e vias' },
    { id: 'districts', label: 'Distritos' },
    { id: 'parcels', label: 'Parcelas' },
    { id: 'land-value', label: 'Valor PPU de 1910' },
    { id: 'relief', label: 'Relevo' },
  ];

  function downloadSnapshots() {
    const blob = new Blob([preview.serializedSnapshots], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cidade-de-minas-${preview.worldSeed}-snapshots.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <main style={{ minHeight: '100vh', padding: '28px clamp(18px, 4vw, 58px) 48px', color: '#f0ead7', background: '#151a16', fontFamily: 'Georgia, serif' }}>
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, maxWidth: 1440, margin: '0 auto 22px' }}>
      <div>
        <Link href="/" style={{ color: '#d5bd7d', font: '600 12px system-ui', textDecoration: 'none' }}>← Voltar ao simulador</Link>
        <h1 style={{ margin: '12px 0 4px', fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 500 }}>Cidade em transformação</h1>
        <div style={{ color: '#b4b8a7', font: '13px system-ui' }}>Visor de revisão Alpha B · seed <code>{preview.worldSeed}</code></div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        <Link href="/city-history/ensemble" style={{ display: 'inline-block', border: '1px solid #85784f', borderRadius: 7, padding: '10px 13px', background: '#27271f', color: '#f0ead7', textDecoration: 'none', font: '12px system-ui' }}>Ver faixas entre seeds</Link>
        <button onClick={downloadSnapshots} style={{ border: '1px solid #85784f', borderRadius: 7, padding: '10px 13px', background: '#27271f', color: '#f0ead7', cursor: 'pointer' }}>Baixar snapshots JSON</button>
      </div>
    </header>

    <section aria-label="Aviso da demonstração" style={{ maxWidth: 1440, margin: '0 auto 20px', padding: '13px 16px', borderLeft: '4px solid #d5bd7d', background: '#28271f', color: '#e4dcbf', font: '13px/1.5 system-ui' }}>
      {preview.warning}
    </section>

    <section style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 22, alignItems: 'start' }}>
      <div style={{ padding: 16, border: '1px solid #363d31', borderRadius: 14, background: '#1c221d' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ font: '700 12px system-ui', color: '#c6c4a7', letterSpacing: 1.1, textTransform: 'uppercase' }}>Mapa · {snapshot.year}</div>
          <div role="group" aria-label="Ano do mapa" style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {preview.snapshots.map(({ year: option }) => <button key={option} aria-pressed={year === option} onClick={() => { setYear(option); setSelectedParcelId(null); }} style={{ padding: '6px 9px', border: '1px solid #525442', borderRadius: 6, background: year === option ? '#d0b674' : '#252b24', color: year === option ? '#1c211a' : '#e9e2cd', cursor: 'pointer', font: '600 12px system-ui' }}>{option}</button>)}
          </div>
        </div>
        <CityMap snapshot={snapshot} layer={layer} selectedParcelId={selectedParcelId} onSelectParcel={setSelectedParcelId} />
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {activeLayers.map((item) => <button key={item.id} aria-pressed={layer === item.id} onClick={() => setLayer(item.id)} style={{ padding: '7px 10px', border: '1px solid #525442', borderRadius: 6, background: layer === item.id ? '#d0b674' : '#252b24', color: layer === item.id ? '#1c211a' : '#e9e2cd', cursor: 'pointer', font: '12px system-ui' }}>{item.label}</button>)}
        </div>
        {layer === 'land-value' && year !== 1910 && <p style={{ color: '#e7d79b', font: '12px/1.5 system-ui', marginBottom: 0 }}>Valor temporal ainda não calibrado: o overlay de PPU só existe para o cenário-base de 1910.</p>}
        <div style={{ marginTop: 10, color: '#afb4a3', font: '12px system-ui' }}>O losango marca o centro histórico. Letras: E estação, P praça, C comércio, O oficinas, I indústria. Ruas claras; avenidas em laranja; ferrovia tracejada em amarelo; círculos indicam novas centralidades.</div>
      </div>

      <aside style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <Metric label="População abstrata" value={snapshot.metrics.populationUnits.toLocaleString('pt-BR')} />
          <Metric label="Empregos abstratos" value={snapshot.metrics.employmentUnits.toLocaleString('pt-BR')} />
          <Metric label="Edifícios ativos" value={snapshot.metrics.activeBuildings} />
          <Metric label="Parcelas ocupadas" value={snapshot.metrics.developedParcels} />
          <Metric label="Novas centralidades" value={snapshot.metrics.centralities} />
          <Metric label="Vias promovidas" value={snapshot.metrics.avenues} />
        </div>
        <section style={{ padding: 15, border: '1px solid #363d31', borderRadius: 12, background: '#1c221d' }}>
          <h2 style={{ margin: '0 0 9px', fontSize: 17, fontWeight: 500 }}>Valores e evidência</h2>
          <p style={{ color: '#c4c7b6', font: '13px/1.55 system-ui', margin: 0 }}>
            {snapshot.metrics.landValuePpu === null
              ? 'O PPU por parcela não é projetado para anos sem perfil de avaliação. A série nominal também está indisponível porque ainda não existe índice mensal calibrado.'
              : `Valor total da terra no cenário-base: ${snapshot.metrics.landValuePpu.toLocaleString('pt-BR')} PPU. Perfil demonstrativo, não calibrado.`}
          </p>
        </section>
        {selectedParcel && <section style={{ padding: 15, border: '1px solid #8c7a4a', borderRadius: 12, background: '#29281f' }}>
          <h2 style={{ margin: '0 0 9px', fontSize: 17, fontWeight: 500 }}>Parcela selecionada</h2>
          <div style={{ color: '#e3dcc6', font: '12px/1.8 system-ui' }}>
            <div><b>ID:</b> {selectedParcel.id}</div>
            <div><b>Área:</b> {selectedParcel.tiles.length} células</div>
            <div><b>Acessibilidade:</b> {selectedParcel.accessibility}/100</div>
            <div><b>Centralidade-base:</b> {selectedParcel.centrality}/100</div>
            <div><b>PPU 1910:</b> {selectedParcel.baselineLandValuePpu === null ? 'indisponível' : `${selectedParcel.baselineLandValuePpu.toLocaleString('pt-BR')} (sintético)`}</div>
          </div>
        </section>}
        <section style={{ padding: 15, border: '1px solid #363d31', borderRadius: 12, background: '#1c221d', color: '#b8beae', font: '12px/1.55 system-ui' }}>
          <b style={{ color: '#e8e0ca' }}>Leitura das camadas</b>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li>Ocupação mostra os usos e a infraestrutura por ano.</li>
            <li>Distritos e parcelas preservam o mapa procedural de 1910.</li>
            <li>PPU aparece apenas como base 1910; renda e clubes continuam indisponíveis.</li>
            <li>Os parâmetros deste visor são hipotéticos e não alteram saves.</li>
          </ul>
        </section>
      </aside>
    </section>
  </main>;
}
