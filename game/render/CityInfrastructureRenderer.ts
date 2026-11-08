import { Container, Graphics } from 'pixi.js';
import type { World } from '../core/World';
import type { CityFoundation1910 } from '../core/city/cityFoundation';
import type { CityGrowthState } from '../core/city/cityGrowth';
import type { CityTransformationState } from '../core/city/cityTransformation';
import type { CityParcel } from '../core/city/cityParcels';
import type { ClubState } from '../core/club/Club';
import { tileCenterToScreen } from './IsoTransform';
import { ELEVATION_HEIGHT } from '../core/Terrain';

function parseHexColor(color: string | undefined, defaultColor: number): number {
  if (!color || typeof color !== 'string') return defaultColor;
  const num = parseInt(color.replace('#', ''), 16);
  return Number.isNaN(num) ? defaultColor : num;
}

/**
 * Draws the campaign's seed-derived streets, railway, urban growth, transformation,
 * and the protagonist club's official football pitch and evolving stadium (1910–1959).
 */
export class CityInfrastructureRenderer {
  private readonly graphics: Graphics;
  private lastFoundation: CityFoundation1910 | null = null;
  private lastGrowth: CityGrowthState | null = null;
  private lastTransformation: CityTransformationState | null = null;
  private lastClub: ClubState | null = null;
  private lastYear = -1;
  private lastTerrainRevision = -1;

  constructor(container: Container) {
    this.graphics = new Graphics();
    container.addChild(this.graphics);
  }

  render(world: World): void {
    const foundation = world.getCityFoundation1910();
    const growth = world.getCityGrowthState();
    const transformation = world.getCityTransformationState();
    const terrainRevision = world.getTerrainRevision();
    const club = world.getClub();
    const currentYear = world.getDate?.()?.year ?? 1910;

    if (
      foundation === this.lastFoundation &&
      growth === this.lastGrowth &&
      transformation === this.lastTransformation &&
      terrainRevision === this.lastTerrainRevision &&
      club === this.lastClub &&
      currentYear === this.lastYear
    ) return;

    this.lastFoundation = foundation;
    this.lastGrowth = growth;
    this.lastTransformation = transformation;
    this.lastClub = club;
    this.lastYear = currentYear;
    this.lastTerrainRevision = terrainRevision;
    this.graphics.clear();
    if (!foundation) return;

    const terrain = world.getTerrain();
    const center = foundation.center.coordinate;
    const centerPoint = tileCenterToScreen(center);
    const centerY = centerPoint.y - terrain.getRenderHeight(center.x, center.y) * ELEVATION_HEIGHT;

    // Central landmark of the city
    this.graphics.circle(centerPoint.x, centerY, 9)
      .fill({ color: 0xf4d35e, alpha: 0.96 })
      .stroke({ color: 0x493c2b, width: 2, alpha: 1 });
    this.graphics.circle(centerPoint.x, centerY, 3).fill({ color: 0x493c2b, alpha: 1 });

    // Foundation institutions (railway station, public square, etc.)
    for (const institution of foundation.institutions) {
      const point = tileCenterToScreen(institution.coordinate);
      const y = point.y - terrain.getRenderHeight(institution.coordinate.x, institution.coordinate.y) * ELEVATION_HEIGHT;
      const color = institution.kind === 'railway-station' ? 0xb54830 : 0x3f7182;
      this.graphics.circle(point.x, y, 5)
        .fill({ color, alpha: 1 })
        .stroke({ color: 0xf3e4c3, width: 1, alpha: 1 });
    }

    // Dynamic era-based road and infrastructure rendering (1910 to 1959)
    if (currentYear < 1920) {
      // 1910s (Belle Époque): Dirt / macadam roads with warm earth borders
      for (const road of foundation.roads) {
        this.strokePath(road.path, terrain, { color: 0x493c2b, width: 5, alpha: 0.92 });
        this.strokePath(road.path, terrain, { color: 0xc8a66a, width: 2.5, alpha: 0.95 });
      }
      this.strokePath(foundation.railway.path, terrain, { color: 0x25292c, width: 6, alpha: 1 });
      this.strokePath(foundation.railway.path, terrain, { color: 0xd9d2c1, width: 2, alpha: 1 });
    } else if (currentYear < 1930) {
      // 1920s (Art Déco): Cobblestone pavement (paralelepípedos) and central electric tram tracks
      for (const road of foundation.roads) {
        this.strokePath(road.path, terrain, { color: 0x334155, width: 6, alpha: 0.95 });
        this.strokePath(road.path, terrain, { color: 0x64748b, width: 3.5, alpha: 1 });
        this.strokePath(road.path, terrain, { color: 0xe2e8f0, width: 1, alpha: 0.85 }); // trilhos de bonde
      }
      this.strokePath(foundation.railway.path, terrain, { color: 0x1e293b, width: 6, alpha: 1 });
      this.strokePath(foundation.railway.path, terrain, { color: 0xcbd5e1, width: 2, alpha: 1 });
    } else if (currentYear < 1940) {
      // 1930s (Era do Rádio): Early asphalt, slate paving and industrial curbing
      for (const road of foundation.roads) {
        this.strokePath(road.path, terrain, { color: 0x1e293b, width: 7, alpha: 0.96 });
        this.strokePath(road.path, terrain, { color: 0x334155, width: 4.5, alpha: 1 });
      }
      this.strokePath(foundation.railway.path, terrain, { color: 0x0f172a, width: 6, alpha: 1 });
      this.strokePath(foundation.railway.path, terrain, { color: 0xe2e8f0, width: 2, alpha: 1 });
    } else if (currentYear < 1950) {
      // 1940s (Padrão Cruzeiro): Dark asphalt with white dashed centerlines
      for (const road of foundation.roads) {
        this.strokePath(road.path, terrain, { color: 0x0f172a, width: 7, alpha: 0.98 });
        this.strokePath(road.path, terrain, { color: 0x1e293b, width: 5, alpha: 1 });
        this.strokePath(road.path, terrain, { color: 0xf8fafc, width: 1.2, alpha: 0.85 });
      }
      this.strokePath(foundation.railway.path, terrain, { color: 0x020617, width: 6, alpha: 1 });
      this.strokePath(foundation.railway.path, terrain, { color: 0xffffff, width: 2, alpha: 1 });
    } else {
      // 1950s (Anos Dourados): Modern highway asphalt with dual yellow center dividers
      for (const road of foundation.roads) {
        this.strokePath(road.path, terrain, { color: 0x030712, width: 8, alpha: 1 });
        this.strokePath(road.path, terrain, { color: 0x0f172a, width: 6, alpha: 1 });
        this.strokePath(road.path, terrain, { color: 0xfacc15, width: 1.5, alpha: 0.95 });
      }
      this.strokePath(foundation.railway.path, terrain, { color: 0x000000, width: 6, alpha: 1 });
      this.strokePath(foundation.railway.path, terrain, { color: 0xffffff, width: 2, alpha: 1 });
    }

    // Station landmark
    const station = tileCenterToScreen(foundation.railway.station);
    const stationHeight = terrain.getRenderHeight(foundation.railway.station.x, foundation.railway.station.y);
    const sx = station.x;
    const sy = station.y - stationHeight * ELEVATION_HEIGHT;
    this.graphics.circle(sx, sy, 7).fill({ color: 0xb54830, alpha: 1 });
    this.graphics.circle(sx, sy, 3).fill({ color: 0xf3e4c3, alpha: 1 });

    // Urban growth extensions
    if (growth) {
      for (const extension of growth.roadExtensions) {
        if (currentYear < 1920) {
          this.strokePath(extension.path, terrain, { color: 0x493c2b, width: 4, alpha: 0.95 });
          this.strokePath(extension.path, terrain, { color: 0xe8bd72, width: 2, alpha: 1 });
        } else if (currentYear < 1940) {
          this.strokePath(extension.path, terrain, { color: 0x334155, width: 5, alpha: 0.95 });
          this.strokePath(extension.path, terrain, { color: 0x64748b, width: 2.5, alpha: 1 });
        } else {
          this.strokePath(extension.path, terrain, { color: 0x0f172a, width: 5.5, alpha: 0.98 });
          this.strokePath(extension.path, terrain, { color: 0x1e293b, width: 3.5, alpha: 1 });
        }
      }
      const parcels = world.getCityParcels1910();
      const colorByKind = { residential: 0x58a66b, commercial: 0x5598d0, industrial: 0xa7a9a6, services: 0xe5be55 } as const;
      const latestDevelopmentId = growth.developments.at(-1)?.id;
      for (const development of growth.developments) {
        const parcel = parcels?.parcels.find(({ id }) => id === development.parcelId);
        if (!parcel) continue;
        const tile = parcel.tiles[0];
        const point = tileCenterToScreen(tile);
        const y = point.y - terrain.getRenderHeight(tile.x, tile.y) * ELEVATION_HEIGHT;
        if (development.id === latestDevelopmentId) {
          this.graphics.circle(point.x, y, 10).stroke({ color: 0xf9e2a6, width: 2, alpha: 0.95 });
        }
        this.graphics.roundRect(point.x - 5, y - 5, 10, 10, 2)
          .fill({ color: colorByKind[development.kind], alpha: 1 })
          .stroke({ color: 0x302b24, width: 2, alpha: 1 });
      }
    }

    // Urban transformation avenues, centralities, and building life cycles
    if (transformation) {
      const parcels = world.getCityParcels1910();
      const parcelById = new Map(parcels?.parcels.map((parcel) => [parcel.id, parcel]));
      for (const avenue of transformation.avenueUpgrades) {
        if (currentYear < 1940) {
          this.strokePath(avenue.path, terrain, { color: 0x542d62, width: 9, alpha: 0.95 });
          this.strokePath(avenue.path, terrain, { color: 0xd5a4df, width: 4, alpha: 1 });
        } else if (currentYear < 1950) {
          this.strokePath(avenue.path, terrain, { color: 0x1e1b4b, width: 10, alpha: 0.96 });
          this.strokePath(avenue.path, terrain, { color: 0x60a5fa, width: 4.5, alpha: 1 });
        } else {
          this.strokePath(avenue.path, terrain, { color: 0x090d16, width: 11, alpha: 1 });
          this.strokePath(avenue.path, terrain, { color: 0x1f2937, width: 7, alpha: 1 });
          this.strokePath(avenue.path, terrain, { color: 0xfbbf24, width: 2, alpha: 1 }); // faixa amarela central
        }
      }
      for (const center of transformation.centralities) {
        const parcel = parcelById.get(center.parcelId);
        if (!parcel) continue;
        const tile = parcel.tiles[0];
        const point = tileCenterToScreen(tile);
        const y = point.y - terrain.getRenderHeight(tile.x, tile.y) * ELEVATION_HEIGHT;
        this.graphics.circle(point.x, y, 11).stroke({ color: 0x61d5cb, width: 3, alpha: 1 });
        this.graphics.circle(point.x, y, 3).fill({ color: 0x61d5cb, alpha: 1 });
      }
      for (const building of transformation.buildings) {
        const parcel = parcelById.get(building.parcelId);
        if (!parcel) continue;
        const tile = parcel.tiles[0];
        const point = tileCenterToScreen(tile);
        const y = point.y - terrain.getRenderHeight(tile.x, tile.y) * ELEVATION_HEIGHT;
        if (building.status === 'demolished') {
          this.graphics.moveTo(point.x - 5, y - 5).lineTo(point.x + 5, y + 5)
            .moveTo(point.x + 5, y - 5).lineTo(point.x - 5, y + 5)
            .stroke({ color: 0xf0c6a6, width: 2, alpha: 0.9 });
        } else if (building.status === 'replaced') {
          this.graphics.circle(point.x, y, 8).stroke({ color: 0xd99a88, width: 2, alpha: 0.85 });
        } else {
          const tint = Math.round((building.condition / 100) * 0x65 + ((100 - building.condition) / 100) * 0xd1);
          const color = (tint << 16) | (Math.round((building.condition / 100) * 0xa0 + ((100 - building.condition) / 100) * 0x76) << 8) | 0x55;
          const radius = Math.min(8, 4 + building.densityUnits);
          this.graphics.circle(point.x, y, radius).fill({ color, alpha: 0.96 })
            .stroke({ color: 0x302b24, width: 1, alpha: 1 });
        }
      }
    }

    // Protagonist Club Official Football Pitch and Evolving Stadium
    if (club && club.parcels && club.parcels.length > 0) {
      const parcels = world.getCityParcels1910();
      const clubParcel = parcels?.parcels.find((p) => club.parcels.includes(p.id));
      if (clubParcel && clubParcel.tiles.length > 0) {
        this.renderClubGround(club, clubParcel, terrain, currentYear);
      }
    }
  }

  /**
   * Renders the protagonist club's official pitch, 3D goalposts, waving flagpole,
   * period grandstands (1910 wooden fencing to 1950s concrete stadium), and floating shield badge.
   */
  private renderClubGround(
    club: ClubState,
    parcel: CityParcel,
    terrain: ReturnType<World['getTerrain']>,
    year: number,
  ): void {
    const tile = parcel.tiles[0];
    const point = tileCenterToScreen(tile);
    const elevation = terrain.getRenderHeight(tile.x, tile.y);
    const gx = point.x;
    const gy = point.y - elevation * ELEVATION_HEIGHT;

    const primaryColor = parseHexColor(club.colors.primary, 0x1a365d);
    const secondaryColor = parseHexColor(club.colors.secondary, 0xf8fafc);

    // 1. Parcel Beacon & Golden Aura (Aura sagrada do campo)
    this.graphics.ellipse(gx, gy, 36, 18)
      .fill({ color: 0xf59e0b, alpha: 0.12 })
      .stroke({ color: 0xf59e0b, width: 1.5, alpha: 0.75 });

    // 2. Soccer Pitch Grass (Gramado Esportivo com faixas de corte)
    const topX = gx, topY = gy - 13;
    const rightX = gx + 26, rightY = gy;
    const bottomX = gx, bottomY = gy + 13;
    const leftX = gx - 26, leftY = gy;

    // Base turf diamond
    this.graphics.beginPath();
    this.graphics.moveTo(topX, topY);
    this.graphics.lineTo(rightX, rightY);
    this.graphics.lineTo(bottomX, bottomY);
    this.graphics.lineTo(leftX, leftY);
    this.graphics.closePath();
    this.graphics.fill({ color: 0x2e7d32, alpha: 1.0 });
    this.graphics.stroke({ color: 0x1b5e20, width: 2, alpha: 1.0 });

    // Mowing stripes (faixas alternadas de grama cortada)
    this.graphics.beginPath();
    this.graphics.moveTo((topX + leftX) / 2, (topY + leftY) / 2);
    this.graphics.lineTo((topX + rightX) / 2, (topY + rightY) / 2);
    this.graphics.lineTo((bottomX + rightX) / 2, (bottomY + rightY) / 2);
    this.graphics.lineTo((bottomX + leftX) / 2, (bottomY + leftY) / 2);
    this.graphics.closePath();
    this.graphics.fill({ color: 0x388e3c, alpha: 0.45 });

    // 3. Pitch Chalk Markings (Marcações com Cal Branca)
    this.graphics.beginPath();
    this.graphics.moveTo(topX, topY);
    this.graphics.lineTo(rightX, rightY);
    this.graphics.lineTo(bottomX, bottomY);
    this.graphics.lineTo(leftX, leftY);
    this.graphics.closePath();
    this.graphics.stroke({ color: 0xffffff, width: 1.5, alpha: 0.95 });

    // Halfway line (Linha divisória central)
    const midTopX = (topX + rightX) / 2, midTopY = (topY + rightY) / 2;
    const midBotX = (leftX + bottomX) / 2, midBotY = (leftY + bottomY) / 2;
    this.graphics.moveTo(midTopX, midTopY).lineTo(midBotX, midBotY).stroke({ color: 0xffffff, width: 1.2, alpha: 0.95 });

    // Center circle & spot (Círculo central e ponto de saída)
    this.graphics.ellipse(gx, gy, 7, 3.5).stroke({ color: 0xffffff, width: 1.2, alpha: 0.95 });
    this.graphics.circle(gx, gy, 1.2).fill({ color: 0xffffff, alpha: 1 });

    // Penalty areas (Grandes áreas)
    this.graphics.moveTo(leftX + 6, leftY - 3).lineTo(leftX + 6, leftY + 3).stroke({ color: 0xffffff, width: 1, alpha: 0.9 });
    this.graphics.moveTo(rightX - 6, rightY - 3).lineTo(rightX - 6, rightY + 3).stroke({ color: 0xffffff, width: 1, alpha: 0.9 });

    // 4. 3D Isometric Goalposts & Nets (As Traves de Madeira/Metal e Redes)
    // Left Goal
    const goal1X = leftX;
    const goal1Y = leftY;
    this.graphics.moveTo(goal1X, goal1Y - 1).lineTo(goal1X, goal1Y - 6)
      .lineTo(goal1X + 3, goal1Y - 4.5)
      .lineTo(goal1X + 3, goal1Y + 0.5)
      .stroke({ color: 0xffffff, width: 1.5, alpha: 1 });
    this.graphics.moveTo(goal1X, goal1Y - 6).lineTo(goal1X - 3, goal1Y - 3).lineTo(goal1X + 3, goal1Y - 4.5)
      .stroke({ color: 0xffffff, width: 0.8, alpha: 0.6 });

    // Right Goal
    const goal2X = rightX;
    const goal2Y = rightY;
    this.graphics.moveTo(goal2X, goal2Y - 1).lineTo(goal2X, goal2Y - 6)
      .lineTo(goal2X - 3, goal2Y - 4.5)
      .lineTo(goal2X - 3, goal2Y + 0.5)
      .stroke({ color: 0xffffff, width: 1.5, alpha: 1 });
    this.graphics.moveTo(goal2X, goal2Y - 6).lineTo(goal2X + 3, goal2Y - 3).lineTo(goal2X - 3, goal2Y - 4.5)
      .stroke({ color: 0xffffff, width: 0.8, alpha: 0.6 });

    // 5. Evolving Grandstands & Perimeter Enclosure (Arquibancadas da Época)
    if (year < 1920) {
      // 1910s: Rustic wooden fence around perimeter + wooden players bench
      this.graphics.beginPath();
      this.graphics.moveTo(topX - 3, topY - 2);
      this.graphics.lineTo(rightX + 3, rightY - 2);
      this.graphics.lineTo(bottomX + 3, bottomY + 2);
      this.graphics.lineTo(leftX - 3, leftY + 2);
      this.graphics.closePath();
      this.graphics.stroke({ color: 0x8b5a2b, width: 1.5, alpha: 0.85 });

      // Wooden players bench
      this.graphics.rect(gx - 8, gy + 15, 16, 3).fill({ color: 0x6d4c41, alpha: 1 });
    } else if (year < 1930) {
      // 1920s: Wooden Grandstand (Pavilhão de Tábuas com cobertura)
      this.graphics.moveTo(topX - 6, topY - 3).lineTo(leftX - 6, leftY - 3)
        .lineTo(leftX - 11, leftY - 7).lineTo(topX - 11, topY - 7)
        .closePath()
        .fill({ color: 0x8d6e63, alpha: 1 })
        .stroke({ color: 0x4e342e, width: 1.5, alpha: 1 });
      // Canopy roof
      this.graphics.moveTo(topX - 5, topY - 9).lineTo(leftX - 5, leftY - 9)
        .lineTo(leftX - 12, leftY - 12).lineTo(topX - 12, topY - 12)
        .closePath()
        .fill({ color: 0xa1887f, alpha: 0.95 })
        .stroke({ color: 0x3e2723, width: 1, alpha: 1 });
      // Spectator dots in stands
      for (let i = -4; i <= 4; i += 2) {
        this.graphics.circle(gx - 10 + i * 2, gy - 8 - i, 1.2).fill({ color: primaryColor, alpha: 1 });
      }
    } else if (year < 1940) {
      // 1930s: Expanded Grandstand + Brick Clubhouse / Sede Social
      this.graphics.moveTo(topX - 7, topY - 4).lineTo(leftX - 7, leftY - 4)
        .lineTo(leftX - 14, leftY - 9).lineTo(topX - 14, topY - 9)
        .closePath()
        .fill({ color: 0x5d4037, alpha: 1 })
        .stroke({ color: 0x271c19, width: 1.5, alpha: 1 });
      // Brick clubhouse shed
      this.graphics.roundRect(gx + 12, gy + 14, 10, 8, 2)
        .fill({ color: 0xb71c1c, alpha: 1 })
        .stroke({ color: 0xffffff, width: 1, alpha: 1 });
      // Spectators
      for (let i = -5; i <= 5; i += 2) {
        this.graphics.circle(gx - 11 + i * 2, gy - 9 - i, 1.3).fill({ color: primaryColor, alpha: 1 });
        this.graphics.circle(gx - 9 + i * 2, gy - 7 - i, 1.1).fill({ color: secondaryColor, alpha: 1 });
      }
    } else {
      // 1940s & 1950s: Monumental Reinforced Concrete Stadium Grandstand + Floodlight Towers
      this.graphics.moveTo(topX - 8, topY - 5).lineTo(leftX - 8, leftY - 5)
        .lineTo(leftX - 16, leftY - 12).lineTo(topX - 16, topY - 12)
        .closePath()
        .fill({ color: 0x475569, alpha: 1 })
        .stroke({ color: 0x1e293b, width: 2, alpha: 1 });
      this.graphics.moveTo(topX - 12, topY - 8).lineTo(leftX - 12, leftY - 8)
        .stroke({ color: 0x94a3b8, width: 1.5, alpha: 1 });
      this.graphics.moveTo(bottomX + 8, bottomY + 5).lineTo(rightX + 8, rightY + 5)
        .lineTo(rightX + 14, rightY + 10).lineTo(bottomX + 14, bottomY + 10)
        .closePath()
        .fill({ color: 0x475569, alpha: 1 })
        .stroke({ color: 0x1e293b, width: 1.5, alpha: 1 });
      // Spectators
      for (let i = -6; i <= 6; i += 2) {
        this.graphics.circle(gx - 13 + i * 2, gy - 11 - i, 1.3).fill({ color: primaryColor, alpha: 1 });
        this.graphics.circle(gx - 10 + i * 2, gy - 8 - i, 1.2).fill({ color: secondaryColor, alpha: 1 });
        this.graphics.circle(gx + 10 + i * 2, gy + 8 + i, 1.2).fill({ color: primaryColor, alpha: 1 });
      }
      // Floodlight Towers
      this.graphics.moveTo(topX - 16, topY - 12).lineTo(topX - 16, topY - 34)
        .stroke({ color: 0x64748b, width: 2, alpha: 1 });
      this.graphics.rect(topX - 19, topY - 38, 6, 4).fill({ color: 0x334155, alpha: 1 });
      this.graphics.circle(topX - 18, topY - 36, 1.5).fill({ color: 0xfef08a, alpha: 1 });
      this.graphics.circle(topX - 14, topY - 36, 1.5).fill({ color: 0xfef08a, alpha: 1 });

      this.graphics.moveTo(bottomX + 14, bottomY + 10).lineTo(bottomX + 14, bottomY - 12)
        .stroke({ color: 0x64748b, width: 2, alpha: 1 });
      this.graphics.rect(bottomX + 11, bottomY - 16, 6, 4).fill({ color: 0x334155, alpha: 1 });
      this.graphics.circle(bottomX + 12, bottomY - 14, 1.5).fill({ color: 0xfef08a, alpha: 1 });
      this.graphics.circle(bottomX + 16, bottomY - 14, 1.5).fill({ color: 0xfef08a, alpha: 1 });
    }

    // 6. Waving Club Flagpole & Flying Banner (Mastro e Bandeira Oficial)
    const flagX = gx - 20;
    const flagY = gy - 8;
    this.graphics.moveTo(flagX, flagY).lineTo(flagX, flagY - 26)
      .stroke({ color: 0xd1d5db, width: 2, alpha: 1 });
    this.graphics.circle(flagX, flagY - 26, 2.5)
      .fill({ color: 0xf59e0b, alpha: 1 })
      .stroke({ color: 0xb45309, width: 1, alpha: 1 });
    this.graphics.beginPath();
    this.graphics.moveTo(flagX, flagY - 25);
    this.graphics.lineTo(flagX + 11, flagY - 22);
    this.graphics.lineTo(flagX + 8, flagY - 17);
    this.graphics.lineTo(flagX, flagY - 19);
    this.graphics.closePath();
    this.graphics.fill({ color: primaryColor, alpha: 1 });
    this.graphics.stroke({ color: 0xffffff, width: 0.8, alpha: 0.9 });
    this.graphics.moveTo(flagX + 2, flagY - 24).lineTo(flagX + 9, flagY - 22)
      .stroke({ color: secondaryColor, width: 1.5, alpha: 1 });

    // 7. Floating Stadium Shield Badge (Distintivo Flutuante do Estádio)
    const badgeX = gx;
    const badgeY = gy - 26;
    this.graphics.circle(badgeX, badgeY, 8)
      .fill({ color: 0x0f172a, alpha: 0.95 })
      .stroke({ color: 0xf59e0b, width: 2, alpha: 1 });
    this.graphics.circle(badgeX, badgeY, 5)
      .fill({ color: primaryColor, alpha: 1 });
    this.graphics.circle(badgeX, badgeY, 2)
      .fill({ color: 0xfbbf24, alpha: 1 });
    this.graphics.circle(badgeX, badgeY - 9, 2)
      .fill({ color: 0xf59e0b, alpha: 1 });
  }

  destroy(): void {
    this.graphics.destroy();
  }

  private strokePath(
    path: CityFoundation1910['railway']['path'] | CityFoundation1910['roads'][number]['path'],
    terrain: ReturnType<World['getTerrain']>,
    style: { color: number; width: number; alpha: number },
  ): void {
    if (path.length < 2) return;
    const first = path[0];
    const firstPoint = tileCenterToScreen(first);
    this.graphics.moveTo(firstPoint.x, firstPoint.y - terrain.getRenderHeight(first.x, first.y) * ELEVATION_HEIGHT);
    for (let index = 1; index < path.length; index++) {
      const tile = path[index];
      const point = tileCenterToScreen(tile);
      this.graphics.lineTo(point.x, point.y - terrain.getRenderHeight(tile.x, tile.y) * ELEVATION_HEIGHT);
    }
    this.graphics.stroke(style);
  }
}
