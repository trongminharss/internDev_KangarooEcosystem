import {DEVICE_CATALOG, DiscoveredDevice} from '../../domain/entities/Device';

/** Raw BLE advertisement as a BLE library reports it. */
export interface BleAdvertisementDTO {
  id: string;
  name: string | null;
  rssi: number | null;
}

/** Returns null for anything that is not a known Kangaroo model. */
export const mapAdvertisementToDevice = (
  dto: BleAdvertisementDTO,
): DiscoveredDevice | null => {
  const name = dto.name?.trim();
  if (!name) {
    return null;
  }
  const model = DEVICE_CATALOG.find(m => name.startsWith(`${m.blePrefix}-`));
  if (!model) {
    return null;
  }
  return {
    id: dto.id,
    name: `${model.name} ${name.slice(model.blePrefix.length + 1)}`,
    modelId: model.id,
    rssi: dto.rssi ?? -100,
  };
};
