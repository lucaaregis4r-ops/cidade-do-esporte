import { buildCityHistoryPreview } from '@/game/engine';
import { CityHistoryViewer } from './viewer';

export default function CityHistoryPage() {
  const preview = buildCityHistoryPreview();
  return <CityHistoryViewer preview={preview} />;
}
