import {IDeviceRepository} from '../repositories/IDeviceRepository';
import {DiscoveredDevice} from '../entities/Device';

export class ScanDevicesUseCase {
  constructor(private deviceRepo: IDeviceRepository) {}

  /** Pass `modelId` to only report devices of that model (manual flow). */
  execute(
    onFound: (device: DiscoveredDevice) => void,
    modelId?: string,
  ): () => void {
    return this.deviceRepo.scanDevices(device => {
      if (!modelId || device.modelId === modelId) {
        onFound(device);
      }
    });
  }
}
