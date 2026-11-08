import { runCityHistoryEnsemble } from '@/game/engine';
import { CityHistoryEnsembleViewer } from './viewer';

const REVIEW_SEEDS = Object.freeze([
  'CM-B11-REVIEW-01', 'CM-B11-REVIEW-02', 'CM-B11-REVIEW-03', 'CM-B11-REVIEW-04',
  'CM-B11-REVIEW-05', 'CM-B11-REVIEW-06', 'CM-B11-REVIEW-07', 'CM-B11-REVIEW-08',
]);

export default function CityHistoryEnsemblePage() {
  const ensemble = runCityHistoryEnsemble(REVIEW_SEEDS);
  return <CityHistoryEnsembleViewer ensemble={ensemble} />;
}
