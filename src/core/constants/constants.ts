import { Dimensions, Insets } from 'react-native';

// Hitslop constants
export const createHitslop = (size: number): Insets => ({
  top: size,
  left: size,
  bottom: size,
  right: size,
});
export const HITSLOP_10 = createHitslop(10);
export const HITSLOP_20 = createHitslop(20);
export const HITSLOP_30 = createHitslop(30);

// Dimension
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

