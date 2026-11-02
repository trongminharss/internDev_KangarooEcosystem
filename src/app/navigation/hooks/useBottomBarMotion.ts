import {useCallback, useMemo} from 'react';
import {
  cancelAnimation,
  SharedValue,
  useReducedMotion,
  useSharedValue,
  WithSpringConfig,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  BarGeometry,
  MOTION,
  clampCenterX,
  pillWidth,
  tabCenterX,
} from '../config/bottomBarMotion';

export interface BottomBarMotionApi {
  edgeLeft: SharedValue<number>;
  edgeRight: SharedValue<number>;
  capsuleOpacity: SharedValue<number>;
  iconScales: SharedValue<number>[];
  placeAt: (g: BarGeometry, index: number) => void;
  snapTo: (
    g: BarGeometry,
    index: number,
    kind: 'tap' | 'snap' | 'restore',
  ) => void;
  followDrag: (g: BarGeometry, pointerX: number) => void;
  dragStretch: (deltaX: number) => void;
  pressIn: (index: number) => void;
  pressOut: (index: number) => void;
  previewIcon: (index: number, on: boolean) => void;
  cancelEdges: () => void;
}

/**
 * Owns all capsule/icon shared values. Every method is a worklet so gesture
 * callbacks can call it on the UI thread; they are also safe from JS.
 * Two independent edge springs create the tap stretch (spec 7): the leading
 * edge uses higher stiffness, so the capsule stretches mid-flight and
 * contracts on settle. Render-side clamps keep edges/width sane.
 */
export const useBottomBarMotion = (): BottomBarMotionApi => {
  const reducedMotion = useReducedMotion();
  const edgeLeft = useSharedValue(0);
  const edgeRight = useSharedValue(0);
  const capsuleOpacity = useSharedValue(1);
  const dragStretchFactor = useSharedValue(1);
  const s0 = useSharedValue(1);
  const s1 = useSharedValue(1);
  const s2 = useSharedValue(1);
  const s3 = useSharedValue(1);
  const iconScales = useMemo(() => [s0, s1, s2, s3], [s0, s1, s2, s3]);

  const placeAt = useCallback(
    (g: BarGeometry, index: number) => {
      'worklet';
      const half = pillWidth(g) / 2;
      const center = tabCenterX(g, index);
      cancelAnimation(edgeLeft);
      cancelAnimation(edgeRight);
      edgeLeft.value = center - half;
      edgeRight.value = center + half;
      capsuleOpacity.value = 1;
    },
    [edgeLeft, edgeRight, capsuleOpacity],
  );

  const snapTo = useCallback(
    (g: BarGeometry, index: number, kind: 'tap' | 'snap' | 'restore') => {
      'worklet';
      const half = pillWidth(g) / 2;
      const center = tabCenterX(g, index);
      if (reducedMotion) {
        // Reduce Motion: không spring/giãn — đặt thẳng (spec 9).
        edgeLeft.value = center - half;
        edgeRight.value = center + half;
        return;
      }
      const movingRight = center >= (edgeLeft.value + edgeRight.value) / 2;
      let lead: WithSpringConfig = MOTION.springSnap;
      let trail: WithSpringConfig = MOTION.springSnap;
      if (kind === 'tap') {
        lead = movingRight ? MOTION.springTapLead : MOTION.springTapTrail;
        trail = movingRight ? MOTION.springTapTrail : MOTION.springTapLead;
      } else if (kind === 'restore') {
        lead = MOTION.springRestore;
        trail = MOTION.springRestore;
      }
      edgeLeft.value = withSpring(center - half, trail);
      edgeRight.value = withSpring(center + half, lead);
    },
    [edgeLeft, edgeRight, reducedMotion],
  );

  const followDrag = useCallback(
    (g: BarGeometry, pointerX: number) => {
      'worklet';
      // Tâm bám tay trực tiếp mỗi event; chỉ stretch được làm mềm (spec 5.2).
      const half = (pillWidth(g) / 2) * dragStretchFactor.value;
      const center = clampCenterX(pointerX, g);
      edgeLeft.value = center - half;
      edgeRight.value = center + half;
    },
    [edgeLeft, edgeRight, dragStretchFactor],
  );

  const dragStretch = useCallback(
    (deltaX: number) => {
      'worklet';
      if (reducedMotion) {
        return;
      }
      const target = Math.min(
        1 + Math.abs(deltaX) / MOTION.dragDeltaDivisor,
        MOTION.dragStretchMax,
      );
      dragStretchFactor.value = withTiming(target > 1.02 ? target : 1, {
        duration: MOTION.dragStretchMs,
      });
    },
    [dragStretchFactor, reducedMotion],
  );

  const pressIn = useCallback(
    (index: number) => {
      'worklet';
      iconScales[index].value = withTiming(MOTION.pressScale, {
        duration: MOTION.pressInMs,
      });
    },
    [iconScales],
  );

  const pressOut = useCallback(
    (index: number) => {
      'worklet';
      iconScales[index].value = withTiming(1, {duration: MOTION.pressOutMs});
    },
    [iconScales],
  );

  const previewIcon = useCallback(
    (index: number, on: boolean) => {
      'worklet';
      iconScales[index].value = withTiming(
        on ? MOTION.previewScale : 1,
        {duration: MOTION.previewMs},
      );
    },
    [iconScales],
  );

  const cancelEdges = useCallback(() => {
    'worklet';
    cancelAnimation(edgeLeft);
    cancelAnimation(edgeRight);
  }, [edgeLeft, edgeRight]);

  return useMemo(
    () => ({
      edgeLeft,
      edgeRight,
      capsuleOpacity,
      iconScales,
      placeAt,
      snapTo,
      followDrag,
      dragStretch,
      pressIn,
      pressOut,
      previewIcon,
      cancelEdges,
    }),
    [
      edgeLeft,
      edgeRight,
      capsuleOpacity,
      iconScales,
      placeAt,
      snapTo,
      followDrag,
      dragStretch,
      pressIn,
      pressOut,
      previewIcon,
      cancelEdges,
    ],
  );
};
