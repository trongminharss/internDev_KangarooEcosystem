import {
  loadDeviceRegion,
  loadProductRegion,
  MOCK_CONNECTED,
  MOCK_PRODUCTS,
} from '@/features/home/presentation/mocks/mockHome';

describe('mockHome', () => {
  it('loadDeviceRegion resolves the requested state', async () => {
    await expect(loadDeviceRegion('empty', 0)).resolves.toEqual({
      status: 'empty',
    });
    await expect(loadDeviceRegion('error', 0)).resolves.toEqual({
      status: 'error',
    });
    await expect(loadDeviceRegion('success', 0)).resolves.toEqual({
      status: 'success',
      data: MOCK_CONNECTED,
    });
  });

  it('MOCK_CONNECTED mirrors the design numbers and carries devices', () => {
    expect(MOCK_CONNECTED.grade).toBe('A+');
    expect(MOCK_CONNECTED.gradePpm).toBe('3.2');
    expect(MOCK_CONNECTED.qualityLabel).toBe('Tuyệt vời');
    expect(MOCK_CONNECTED.status).toBe('normal');
    expect(MOCK_CONNECTED.stats).toEqual({
      efficiency: '85%',
      filtered: 'A+',
      inputPpm: '214',
    });
    expect(MOCK_CONNECTED.devices.length).toBeGreaterThanOrEqual(2);
    for (const d of MOCK_CONNECTED.devices) {
      expect(typeof d.id).toBe('string');
      expect(typeof d.room).toBe('string');
      expect(typeof d.name).toBe('string');
      expect(typeof d.statusText).toBe('string');
    }
  });

  it('loadProductRegion returns items only on success', async () => {
    await expect(loadProductRegion('success', 0)).resolves.toEqual({
      status: 'success',
      items: MOCK_PRODUCTS,
    });
    await expect(loadProductRegion('empty', 0)).resolves.toEqual({
      status: 'empty',
      items: [],
    });
    await expect(loadProductRegion('error', 0)).resolves.toEqual({
      status: 'error',
      items: [],
    });
  });

  it('mock products carry id, name, price and optional badge', () => {
    expect(MOCK_PRODUCTS.length).toBeGreaterThanOrEqual(4);
    for (const p of MOCK_PRODUCTS) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.price).toBe('number');
      expect(['hot', 'new', undefined]).toContain(p.badge);
    }
  });
});
