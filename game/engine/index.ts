/**
 * Engine module public API exports
 */

export { executeClick, executeDrag, previewDrag, previewClick } from './CommandDispatcher';
export { GameSession } from './GameSession';
export type { GameSessionCallbacks, TickUpdate } from './GameSession';
export { inspectTile } from './inspectTile';
export type { TileInfo, TileBuildingInfo, CampaignCityTileInfo, ParcelNominalValuation } from './inspectTile';
export { runHeadlessCampaign } from './HeadlessCampaign';
export type { HeadlessCampaignResult } from './HeadlessCampaign';
export { buildCityHistoryPreview } from './CityHistoryPreview';
export type { CityHistoryPreview } from './CityHistoryPreview';
export { runCityHistoryEnsemble, serializeCityHistoryEnsemble } from './CityHistoryEnsemble';
export type { CityHistoryEnsemble, CityHistoryEnsembleYear, CityHistoryMetricBand } from './CityHistoryEnsemble';
export type { CitySnapshot, CitySnapshotParcel, CitySnapshotYear } from '../core/city/citySnapshots';
