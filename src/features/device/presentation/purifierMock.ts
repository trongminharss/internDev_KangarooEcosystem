import {PurifierFilter} from './purifierUtils';

// ponytail: static demo device; swap for a domain/data layer + slice once the device API exists.
export const PURIFIER_MOCK = {
  id: 'kg-hydrogen-01',
  name: 'Máy lọc nước nóng lạnh Hydrogen',
  model: 'KG10A18',
  serial: 'KGR2406180342',
  firmware: '2.4.1',
  location: 'Phòng bếp',
  online: true,
  tdsIn: 186,
  tdsOut: 9,
  purchasedAt: '2025-06-18',
  warrantyMonths: 24,
  hotline: '19006588',
  filters: [
    {
      id: 'f1',
      sku: 'KG-PP5',
      name: 'Lõi PP 5 micron',
      lifeMonths: 6,
      remainingPercent: 8,
      installedAt: '2026-03-30',
      price: 90000,
    },
    {
      id: 'f2',
      sku: 'KG-GAC',
      name: 'Lõi than hoạt tính',
      lifeMonths: 6,
      remainingPercent: 24,
      installedAt: '2026-04-20',
      price: 120000,
    },
    {
      id: 'f3',
      sku: 'KG-PP1',
      name: 'Lõi PP 1 micron',
      lifeMonths: 9,
      remainingPercent: 52,
      installedAt: '2026-05-02',
      price: 110000,
    },
    {
      id: 'f4',
      sku: 'KG-RO',
      name: 'Màng RO Purion',
      lifeMonths: 24,
      remainingPercent: 78,
      installedAt: '2025-12-10',
      price: 650000,
    },
    {
      id: 'f5',
      sku: 'KG-H2',
      name: 'Lõi chức năng Hydrogen',
      lifeMonths: 12,
      remainingPercent: 91,
      installedAt: '2026-08-15',
      price: 280000,
    },
  ] as PurifierFilter[],
};

export type Purifier = typeof PURIFIER_MOCK;
