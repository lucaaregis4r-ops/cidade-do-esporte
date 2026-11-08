'use client';

/**
 * Campaign inspector shown when the SELECT tool clicks a tile. It renders a
 * one-shot snapshot and docks beside the map so long parcel IDs remain readable.
 */

import { useState, useMemo } from 'react';
import { TileType } from '@/game/core/Tile';
import type { BuildingType } from '@/game/core/Building';
import type { StructureType } from '@/game/core/StructureMap';
import type { TileInfo } from '@/game/engine';
import type { CityDistrictKind } from '@/game/core/city/cityDistricts';
import type { LandValueFactor } from '@/game/core/city/cityLandValue';
import type { ScreenCoord } from '@/game/types/coordinates';
import type { ClubState } from '@/game/core/club/Club';
import { generateContractProposals, type LandOccupancyContract } from '@/game/core/club/ClubLandContract';
import type { CityParcel } from '@/game/core/city/cityParcels';

const TILE_TYPE_LABELS: Record<TileType, string> = {
  [TileType.GRASS]: 'Grass',
  [TileType.DIRT]: 'Dirt',
  [TileType.ROAD]: 'Road',
  [TileType.ZONE_RESIDENTIAL]: 'Residential Zone',
  [TileType.ZONE_COMMERCIAL]: 'Commercial Zone',
  [TileType.ZONE_INDUSTRIAL]: 'Industrial Zone',
  [TileType.POWER_PLANT]: 'Power Plant',
  [TileType.WATER_TOWER]: 'Water Tower',
  [TileType.POLICE_STATION]: 'Police Station',
  [TileType.FIRE_STATION]: 'Fire Station',
  [TileType.HOSPITAL]: 'Hospital',
  [TileType.SCHOOL]: 'School',
  [TileType.PARK]: 'Park',
};

const STRUCTURE_TYPE_LABELS: Record<StructureType, string> = {
  power_plant: 'Power Plant',
  water_tower: 'Water Tower',
  police_station: 'Police Station',
  fire_station: 'Fire Station',
  hospital: 'Hospital',
  school: 'School',
  park: 'Park',
};

const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
};

const CITY_INSTITUTION_LABELS = {
  'railway-station': 'Estação ferroviária',
  'public-square': 'Praça pública',
  'commercial-cluster': 'Comércio',
  'railway-workshops': 'Oficinas ferroviárias',
  'small-industry': 'Pequena indústria',
} as const;

const DISTRICT_LABELS: Record<CityDistrictKind, string> = {
  ...CITY_INSTITUTION_LABELS,
  'outer-north': 'Periferia norte',
  'outer-east': 'Periferia leste',
  'outer-south': 'Periferia sul',
  'outer-west': 'Periferia oeste',
};

const DEVELOPMENT_LABELS = {
  residential: 'Residencial', commercial: 'Comercial', industrial: 'Industrial', services: 'Serviços',
} as const;

const LAND_VALUE_FACTOR_LABELS: Record<LandValueFactor, string> = {
  centrality: 'Centralidade',
  accessibility: 'Acessibilidade',
  railAccess: 'Acesso ferroviário',
  roadAccess: 'Acesso viário',
  commerceAccess: 'Proximidade do comércio',
  industryAccess: 'Proximidade da indústria',
  terrainQuality: 'Qualidade do terreno',
  neighborhoodPopulation: 'População vizinha',
};

const LAND_VALUE_FACTOR_ORDER: readonly LandValueFactor[] = [
  'centrality', 'accessibility', 'railAccess', 'roadAccess',
  'commerceAccess', 'industryAccess', 'terrainQuality', 'neighborhoodPopulation',
];

function campaignDate(date: { year: number; month: number; day: number }): string {
  return `${String(date.day).padStart(2, '0')}/${String(date.month).padStart(2, '0')}/${date.year}`;
}

const DENSITY_LABELS: Record<0 | 1 | 2, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
      <span style={{ opacity: 0.7, flexShrink: 0 }}>{label}</span>
      {/* minWidth 0 lets the value shrink past its automatic min-content floor and
          wrap inside the panel's fixed width instead of widening it; textAlign keeps
          a wrapped second line flush with the right-hand column. */}
      <span style={{ minWidth: 0, textAlign: 'right' }}>{children}</span>
    </div>
  );
}

export function TileInfoPanel({
  info,
  anchor,
  club,
  onFoundClubHere,
  onClose,
}: {
  info: TileInfo | null;
  anchor: ScreenCoord | null;
  club?: ClubState | null;
  onFoundClubHere?: (parcelId: string, contract: LandOccupancyContract) => void;
  onClose: () => void;
}) {
  const [selectedContractIndex, setSelectedContractIndex] = useState<number>(0);
  const [showContracts, setShowContracts] = useState<boolean>(false);

  const proposals = useMemo<readonly LandOccupancyContract[]>(() => {
    if (!info?.city?.parcel) return [];
    const p = info.city.parcel;
    const origin = club ? club.foundingOrigin : 'railway';
    const mockParcel: CityParcel = {
      id: p.id,
      tiles: [],
      area: p.area,
      terrainDifficulty: p.terrainDifficulty,
      districtId: p.districtId,
      ownerId: p.ownerId ?? undefined,
      landValuePpu: p.landValuePpu ?? 10.0,
      centrality: p.centrality,
      accessibility: p.accessibility,
      railAccess: p.railAccess,
      roadAccess: p.roadAccess,
      neighborhoodPopulation: p.neighborhoodPopulation,
      purchaseHistory: [],
      historicalEvents: [],
    };
    return generateContractProposals({
      parcel: mockParcel,
      clubId: club?.id ?? 'club-1910',
      origin,
      date: { year: 1910, month: 1, day: 1 },
      initialCapitalPpu: 35.0,
    });
  }, [info, club]);

  if (!info || !anchor) return null;
  const parcelValuation = info.city?.parcel?.valuation ?? null;

  const isZone =
    info.type === TileType.ZONE_RESIDENTIAL ||
    info.type === TileType.ZONE_COMMERCIAL ||
    info.type === TileType.ZONE_INDUSTRIAL;
  // Round once so the branch and the displayed digits always agree — a sub-0.5%
  // penalty must fall back to plain '0%', never a red '-0%'.
  const congestionPercent = Math.round(info.congestionPenalty * 100);

  return (
    <div
      className="campaign-inspector"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <strong>
          Ponto ({info.x}, {info.y})
        </strong>
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {info.city && (
          <>
            <div style={{ color: '#efd591', marginBottom: '5px' }}>Cidade de Minas · campanha atual</div>
            {info.city.center && <Row label="Marco">Centro histórico</Row>}
            {info.city.institution && <>
              <Row label="Instituição">{CITY_INSTITUTION_LABELS[info.city.institution.kind]}</Row>
              <Row label="ID">{info.city.institution.id}</Row>
            </>}
            {info.city.district && <>
              <Row label="Distrito">{DISTRICT_LABELS[info.city.district.kind]}</Row>
              <Row label="ID">{info.city.district.id}</Row>
              <Row label="Área">{info.city.district.landArea} células</Row>
              <Row label="Centralidade">{info.city.district.centrality}/100</Row>
              <Row label="População">{info.city.district.populationUnits} unidades abstratas</Row>
              <Row label="Empregos">{info.city.district.employmentUnits} unidades abstratas</Row>
            </>}
            {info.city.parcel && <>
              <div style={{ marginTop: '7px', color: '#efd591' }}>Parcela de 1910</div>
              <Row label="ID">{info.city.parcel.id}</Row>
              <Row label="Distrito / ID">{info.city.parcel.districtId}</Row>
              <Row label="Área">{info.city.parcel.area} células</Row>
              <Row label="Topografia">dificuldade {info.city.parcel.terrainDifficulty}/100</Row>
              <Row label="Acesso viário">{info.city.parcel.roadAccess}/100</Row>
              <Row label="Acesso ferroviário">{info.city.parcel.railAccess}/100</Row>
              <Row label="Acessibilidade">{info.city.parcel.accessibility}/100</Row>
              <Row label="População vizinha">{info.city.parcel.neighborhoodPopulation} unidades abstratas</Row>
              <Row label="Proprietário">{info.city.parcel.ownerId ?? 'Indisponível · nenhum registro'}</Row>
              <Row label="Preço de compra">{info.city.parcel.purchaseHistory.at(-1) ? `${info.city.parcel.purchaseHistory.at(-1)!.pricePpu} PPU` : 'Indisponível · sem transação registrada'}</Row>
              {parcelValuation && <>
                <Row label={`Valor de referência (${parcelValuation.year})`}>{parcelValuation.landValuePpu.toFixed(2)} PPU</Row>
                <Row label="Índice ponderado">{parcelValuation.relativeScore.toFixed(1)}/100</Row>
                {info.city.parcel.nominalValuation && (
                  <Row label={`Valor nominal (${info.city.parcel.nominalValuation.currencyLabel})`}>
                    {info.city.parcel.nominalValuation.status === 'available' ? (
                      info.city.parcel.nominalValuation.formatted
                    ) : (
                      <span style={{ color: '#d4c5a9' }}>
                        Indisponível · {info.city.parcel.nominalValuation.reason}
                      </span>
                    )}
                  </Row>
                )}
                <details style={{ marginTop: '3px' }}>
                  <summary style={{ cursor: 'pointer', color: '#c9c9bd' }}>Fatores de valor</summary>
                  {LAND_VALUE_FACTOR_ORDER.map((factor) => {
                    const item = parcelValuation.factors[factor];
                    return <Row key={factor} label={LAND_VALUE_FACTOR_LABELS[factor]}>{item.score}/100 · peso {(parcelValuation.weights[factor] * 100).toFixed(0)}% · +{item.contribution.toFixed(1)}</Row>;
                  })}
                </details>
                <details style={{ marginTop: '3px' }}>
                  <summary style={{ cursor: 'pointer', color: '#c9c9bd' }}>Hipótese e limites</summary>
                  <small style={{ display: 'block', paddingTop: '4px', overflowWrap: 'anywhere' }}>Perfil: {parcelValuation.calibrationId}</small>
                  {parcelValuation.references.map((reference) => <small key={reference.id} style={{ display: 'block', paddingTop: '4px' }}>
                    {reference.source}. {reference.notes}
                  </small>)}
                  <small style={{ display: 'block', paddingTop: '4px' }}>{parcelValuation.notes}</small>
                </details>
              </>}
              <Row label="Renda local">{info.city.parcel.neighborhoodIncomeIndex === null ? 'Indisponível · perfil histórico pendente' : info.city.parcel.neighborhoodIncomeIndex}</Row>
              <Row label="Prestígio">{info.city.parcel.prestige === null ? 'Indisponível · sem dado válido' : info.city.parcel.prestige}</Row>
              {info.city.parcel.clubOccupancy ? (
                <div style={{ margin: '8px 0', padding: '8px', backgroundColor: 'rgba(28, 64, 38, 0.9)', borderRadius: '6px', border: '1px solid #4caf50' }}>
                  <strong style={{ color: '#c8f7c5', fontSize: '12px', display: 'block' }}>🏛 Sede e Praça de Esportes</strong>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>{info.city.parcel.clubOccupancy.clubName}</div>
                  <div style={{ fontSize: '11px', color: '#e0f2e0', marginTop: '3px' }}>
                    Regime: <strong>{info.city.parcel.clubOccupancy.contractType}</strong> · {info.city.parcel.clubOccupancy.grantorName}
                  </div>
                  {club?.facilityDetails && club.facilityDetails.length > 0 && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #4caf50', fontSize: '11px', color: '#d0ffd0' }}>
                      <strong style={{ display: 'block', marginBottom: '3px' }}>Instalações no Local:</strong>
                      {club.facilityDetails.map((f) => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span>• {f.name}</span>
                          <span>{f.condition}% cond.</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : info.city.parcel.clubViability ? (
                <div style={{ margin: '8px 0', padding: '8px', backgroundColor: 'rgba(38, 48, 44, 0.9)', borderRadius: '6px', border: '1px solid #738548' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#f2d994', fontSize: '12px' }}>⚽ Sede do Clube (1910)</strong>
                    <span style={{ fontSize: '11px', color: info.city.parcel.clubViability.viable ? '#98e49b' : '#ff7b7b', fontWeight: 'bold' }}>
                      {info.city.parcel.clubViability.suitabilityScore}/100 · {info.city.parcel.clubViability.viable ? 'Adequado' : 'Inadequado'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#d2d0c2', marginTop: '4px' }}>
                    Compra est.: <strong>{info.city.parcel.clubViability.estimatedPurchasePricePpu} PPU</strong> · Aluguel: <strong>{info.city.parcel.clubViability.estimatedMonthlyRentPpu} PPU/mês</strong>
                  </div>
                  <ul style={{ margin: '6px 0', paddingLeft: '16px', fontSize: '11px', color: '#ccc' }}>
                    {info.city.parcel.clubViability.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  {info.city.parcel.clubViability.viable && onFoundClubHere && (!club || club.parcels.length === 0) && (
                    <div style={{ marginTop: '6px', borderTop: '1px dashed #666', paddingTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowContracts(!showContracts)}
                        style={{
                          width: '100%',
                          padding: '5px',
                          backgroundColor: '#5a6545',
                          color: '#fff5d8',
                          border: '1px solid #f2d994',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        {showContracts ? 'Fechar propostas de contrato ▲' : 'Propostas de ocupação para o clube (C5) ▼'}
                      </button>
                      {showContracts && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {proposals.map((prop, idx) => (
                            <div
                              key={prop.id}
                              onClick={() => setSelectedContractIndex(idx)}
                              style={{
                                padding: '6px',
                                backgroundColor: selectedContractIndex === idx ? 'rgba(90, 101, 69, 0.75)' : 'rgba(20, 26, 24, 0.65)',
                                border: selectedContractIndex === idx ? '1px solid #f2d994' : '1px solid #555',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', color: '#fff5d8' }}>
                                <span>{prop.type}</span>
                                <span style={{ color: '#f2d994' }}>{prop.upfrontCostPpu > 0 ? `${prop.upfrontCostPpu} PPU entrada` : 'Entrada Grátis'}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#bbb' }}>{prop.grantorName} · {prop.monthlyCostPpu > 0 ? `${prop.monthlyCostPpu} PPU/mês` : 'Sem mensalidade'}</div>
                              <ul style={{ margin: '4px 0 0', paddingLeft: '14px', fontSize: '10px', color: '#c9c7bb' }}>
                                {prop.terms.map((t, ti) => <li key={ti}>{t}</li>)}
                              </ul>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const contract = proposals[selectedContractIndex] ?? proposals[0];
                              if (contract && info.city?.parcel) {
                                onFoundClubHere(info.city.parcel.id, contract);
                                setShowContracts(false);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '6px',
                              backgroundColor: '#2e6b3c',
                              color: '#ffffff',
                              border: '1px solid #98e49b',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginTop: '4px',
                            }}
                          >
                            Assinar Contrato e Estabelecer Clube Aqui ✓
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
              <details style={{ marginTop: '5px' }}>
                <summary style={{ cursor: 'pointer', color: '#c9c9bd' }}>Compras ({info.city.parcel.purchaseHistory.length})</summary>
                {info.city.parcel.purchaseHistory.length === 0 ? <small>Nenhuma compra registrada.</small> : info.city.parcel.purchaseHistory.map((purchase) => <div key={purchase.id} style={{ paddingTop: '4px' }}>
                  <Row label={campaignDate(purchase.date)}>{purchase.buyerId} · {purchase.pricePpu} PPU</Row>
                  <Row label="Vendedor">{purchase.sellerId ?? 'Desconhecido'}</Row>
                </div>)}
              </details>
              <details style={{ marginTop: '3px' }}>
                <summary style={{ cursor: 'pointer', color: '#c9c9bd' }}>Eventos ({info.city.parcel.historicalEvents.length})</summary>
                {info.city.parcel.historicalEvents.map((event) => <div key={event.id} style={{ paddingTop: '4px' }}>
                  <Row label={campaignDate(event.date)}>{event.description}</Row>
                </div>)}
              </details>
              {info.city.development ? <>
                <div style={{ marginTop: '7px', color: '#efd591' }}>Ocupação da campanha</div>
                <Row label="Uso">{DEVELOPMENT_LABELS[info.city.development.kind]}</Row>
                <Row label="Desde">{info.city.development.year}</Row>
                <Row label="Acréscimos">+{info.city.development.populationUnitsAdded} população · +{info.city.development.jobUnitsAdded} empregos</Row>
              </> : <Row label="Ocupação">Ainda sem desenvolvimento registrado</Row>}
              {info.city.transformation.buildings.length > 0 && <>
                <div style={{ marginTop: '7px', color: '#efd591' }}>Edificação e memória</div>
                {info.city.transformation.buildings.map((building) => <div key={building.id} style={{ paddingBottom: '3px' }}>
                  <Row label="Situação">{{ active: 'Em uso', demolished: 'Demolida', replaced: 'Substituída' }[building.status]}</Row>
                  <Row label="Construída em">{building.builtYear}</Row>
                  <Row label="Condição">{building.condition}/100 · densidade {building.densityUnits}</Row>
                  {building.demolishedYear && <Row label="Transformada em">{building.demolishedYear}</Row>}
                </div>)}
              </>}
              {info.city.transformation.centrality && <Row label="Centralidade ativa desde">{info.city.transformation.centrality.establishedYear} · intensidade {info.city.transformation.centrality.score}/100</Row>}
              {info.city.transformation.avenue && <Row label="Avenida desde">{info.city.transformation.avenue.upgradedYear}</Row>}
            </>}
            {!info.city.district && <Row label="Terreno">Água</Row>}
            <small style={{ marginTop: '7px', color: '#c6c4b8' }}>Métricas urbanas são hipóteses de design, não dados históricos calibrados.</small>
          </>
        )}
        <details open={!info.city} style={{ marginTop: '8px', borderTop: '1px solid #666', paddingTop: '8px' }}>
          <summary style={{ cursor: 'pointer', color: '#c9c9bd' }}>Dados do motor urbano herdado</summary>
        <Row label="Type">{TILE_TYPE_LABELS[info.type]}</Row>
        {isZone && <Row label="Zone Level">{info.level}</Row>}
        <Row label="Power">
          <span style={{ color: info.powered ? '#4caf50' : '#ff6b6b' }}>
            {info.powered ? 'Powered' : 'No Power'}
          </span>
        </Row>
        <Row label="Water">
          <span style={{ color: info.watered ? '#4caf50' : '#ff6b6b' }}>
            {info.watered ? 'Watered' : 'No Water'}
          </span>
        </Row>
        <Row label="Police">
          <span style={{ color: info.isServiceSource || info.serviceCovered ? '#4caf50' : '#ff6b6b' }}>
            {info.isServiceSource ? 'Police Station' : `${Math.round(info.coverage * 100)}%`}
          </span>
        </Row>
        <Row label="Fire">
          <span style={{ color: info.isFireSource || info.fireServiceCovered ? '#4caf50' : '#ff6b6b' }}>
            {info.isFireSource ? 'Fire Station' : `${Math.round(info.fireCoverage * 100)}%`}
          </span>
        </Row>
        <Row label="Hospital">
          <span style={{ color: info.isHospitalSource || info.hospitalServiceCovered ? '#4caf50' : '#ff6b6b' }}>
            {info.isHospitalSource ? 'Hospital' : `${Math.round(info.hospitalCoverage * 100)}%`}
          </span>
        </Row>
        <Row label="School">
          <span style={{ color: info.isSchoolSource || info.schoolServiceCovered ? '#4caf50' : '#ff6b6b' }}>
            {info.isSchoolSource ? 'School' : `${Math.round(info.schoolCoverage * 100)}%`}
          </span>
        </Row>
        {/* FLOOR, not round: every LEVEL_THRESHOLDS entry is a whole percent, so a
            floored integer can never read as having cleared a threshold the stored
            value sits below. Math.round rendered 0.84891 as "85%" — the level-5 bar —
            and a player would wait forever for an upgrade that cannot fire.
            On a building tile inspectTile sources this from the lot ANCHOR, the cell
            the gates actually compare, so the digits and the gate agree on both axes. */}
        <Row label="Land Value">{Math.floor(info.landValue * 100)}%</Row>
        <Row label="Congestion Loss">
          {congestionPercent > 0 ? (
            <span style={{ color: '#ff6b6b' }}>-{congestionPercent}%</span>
          ) : (
            '0%'
          )}
        </Row>

        {info.building && (
          <>
            <div style={{ marginTop: '6px', opacity: 0.7 }}>Building</div>
            <Row label="Kind">{BUILDING_TYPE_LABELS[info.building.type]}</Row>
            <Row label="Level">{info.building.level}</Row>
            {/* Current tier AND the lot's ceiling, always — the ceiling is most actionable
                BELOW it (a freshly merged 2-wide lot inherits Medium but can reach High).
                At the cap the tier is not repeated ('High · max High' reads as noise);
                'at max' says the same thing without the echo. */}
            <Row label="Density">
              {info.building.density === info.building.maxDensity
                ? `${DENSITY_LABELS[info.building.density]} · at max (${info.building.lotWidth}-wide lot)`
                : `${DENSITY_LABELS[info.building.density]} · max ${DENSITY_LABELS[info.building.maxDensity]} (${info.building.lotWidth}-wide lot)`}
            </Row>
            <Row label="Capacity">{info.building.capacity}</Row>
            <Row label="Age">{info.building.age}</Row>
            <Row label="Status">
              <span style={{ color: info.building.abandoned ? '#ff6b6b' : '#4caf50' }}>
                {info.building.abandoned ? 'Abandoned' : 'Active'}
              </span>
            </Row>
          </>
        )}

        {info.structure && (
          <>
            <div style={{ marginTop: '6px', opacity: 0.7 }}>Structure</div>
            <Row label="Kind">{STRUCTURE_TYPE_LABELS[info.structure.type]}</Row>
          </>
        )}
        </details>
      </div>
    </div>
  );
}
