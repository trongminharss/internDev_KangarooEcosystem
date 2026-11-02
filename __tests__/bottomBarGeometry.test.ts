import {
  BarGeometry,
  MOTION,
  capsuleEdges,
  candidateFromX,
  clampCenterX,
  indexFromX,
  isInsideDropZone,
  pillWidth,
  slotWidth,
  tabCenterX,
} from '@/app/navigation/config/bottomBarMotion';

const g: BarGeometry = {barWidth: 364, padding: 6, tabCount: 4};
// slotWidth = (364 - 12) / 4 = 88

describe('bottomBarGeometry', () => {
  it('computes slot, center and pill width', () => {
    expect(slotWidth(g)).toBe(88);
    expect(tabCenterX(g, 0)).toBe(50); // 6 + 88 * 0.5
    expect(tabCenterX(g, 3)).toBe(314); // 6 + 88 * 3.5
    expect(pillWidth(g)).toBe(84); // 88 - 4
  });

  it('clamps capsule edges inside the bar inner area, width >= 0', () => {
    expect(capsuleEdges(50, 42, g)).toEqual({left: 8, width: 84});
    const stretched = capsuleEdges(330, 51, g); // right = 381 > 358
    expect(stretched.left + stretched.width).toBeLessThanOrEqual(358);
    expect(capsuleEdges(50, 0, g).width).toBe(0);
  });

  it('clamps drag center between first and last tab centers', () => {
    expect(clampCenterX(-20, g)).toBe(50);
    expect(clampCenterX(500, g)).toBe(314);
    expect(clampCenterX(200, g)).toBe(200);
  });

  it('maps pointer x to tab index without hysteresis (tap)', () => {
    expect(indexFromX(50, g)).toBe(0);
    expect(indexFromX(93, g)).toBe(0); // 94 là ranh giới tab 0/1
    expect(indexFromX(94, g)).toBe(1);
    expect(indexFromX(313, g)).toBe(3);
    expect(indexFromX(-50, g)).toBe(0);
    expect(indexFromX(400, g)).toBe(3);
  });

  it('selects drag candidate with 6dp hysteresis around boundaries', () => {
    // ranh giới tab 0/1 tại x = 94
    expect(candidateFromX(94 + 5, g, 0)).toBe(0); // trong vùng hysteresis
    expect(candidateFromX(94 + 6, g, 0)).toBe(1); // đã vượt
    expect(candidateFromX(94 - 5, g, 1)).toBe(1);
    expect(candidateFromX(94 - 6, g, 1)).toBe(0);
    // nhảy nhiều ô trong 1 event: tính thẳng ô tại vị trí mới
    expect(candidateFromX(300, g, 0)).toBe(3);
    expect(candidateFromX(-50, g, 0)).toBe(0);
    expect(candidateFromX(400, g, 3)).toBe(3);
  });

  it('checks drop zone as bar rect expanded 16dp each side', () => {
    expect(isInsideDropZone(-16, 30, 364, 64)).toBe(true);
    expect(isInsideDropZone(-17, 30, 364, 64)).toBe(false);
    expect(isInsideDropZone(364 + 16, 30, 364, 64)).toBe(true);
    expect(isInsideDropZone(364 + 17, 30, 364, 64)).toBe(false);
    expect(isInsideDropZone(100, -16, 364, 64)).toBe(true);
    expect(isInsideDropZone(100, -17, 364, 64)).toBe(false);
    expect(isInsideDropZone(100, 64 + 17, 364, 64)).toBe(false); // 80 vẫn trong vùng, 81 ngoài
    expect(MOTION.holdActivationMs).toBe(220);
  });
});
