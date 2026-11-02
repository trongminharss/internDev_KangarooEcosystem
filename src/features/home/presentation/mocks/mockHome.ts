// ponytail: mock loaders — swap for thunks + real API when the data layer lands
import type {WaveStatus} from '@/shared/components';

export type RegionState = 'success' | 'error' | 'empty';

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  badge?: 'hot' | 'new';
}

export interface MockDevice {
  id: string;
  room: string;
  name: string;
  statusText: string;
}

export interface ConnectedDeviceData {
  grade: string;
  gradePpm: string;
  qualityLabel: string;
  stats: {efficiency: string; filtered: string; inputPpm: string};
  devices: MockDevice[];
  status: WaveStatus;
}

export type DeviceRegionResult =
  | {status: Exclude<RegionState, 'success'>}
  | {status: 'success'; data: ConnectedDeviceData};
export type ProductRegionResult = {status: RegionState; items: MockProduct[]};

/** Flip this single value to demo loading → state transitions. */
export const MOCK_REGION_STATE: RegionState = 'success';

export const MOCK_CONNECTED: ConnectedDeviceData = {
  grade: 'A+',
  gradePpm: '3.2',
  qualityLabel: 'Tuyệt vời',
  stats: {efficiency: '85%', filtered: 'A+', inputPpm: '214'},
  devices: [
    {id: 'd1', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
    {id: 'd2', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
  ],
  status: 'normal',
};

export const MOCK_PRODUCTS: MockProduct[] = [
  {id: 'p1', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
  {id: 'p2', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'new'},
  {id: 'p3', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
  {id: 'p4', name: 'Máy lọc nước KGR 01H23', price: 250000},
  {id: 'p5', name: 'Máy lọc nước KGR 02H23', price: 320000, badge: 'new'},
  {id: 'p6', name: 'Máy lọc nước KGR 02H23', price: 320000},
];

const DELAY_MS = 800;
const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export const loadDeviceRegion = async (
  state: RegionState = MOCK_REGION_STATE,
  delayMs: number = DELAY_MS,
): Promise<DeviceRegionResult> => {
  await delay(delayMs);
  return state === 'success'
    ? {status: 'success', data: MOCK_CONNECTED}
    : {status: state};
};

export const loadProductRegion = async (
  state: RegionState = MOCK_REGION_STATE,
  delayMs: number = DELAY_MS,
): Promise<ProductRegionResult> => {
  await delay(delayMs);
  if (state === 'success') {
    return {status: 'success', items: MOCK_PRODUCTS};
  }
  return {status: state, items: []};
};
