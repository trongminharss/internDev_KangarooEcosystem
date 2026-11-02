import {useCallback, useMemo} from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {runOnJS, useSharedValue} from 'react-native-reanimated';
import {Gesture, LegacyExclusiveGesture} from 'react-native-gesture-handler';

import {
  BarGeometry,
  MOTION,
  candidateFromX,
  indexFromX,
  isInsideDropZone,
} from '../config/bottomBarMotion';
import {BottomBarMotionApi} from './useBottomBarMotion';

export interface BottomBarGestureParams {
  routeKeys: string[];
  motion: BottomBarMotionApi;
  geometry: BarGeometry | null;
  activeIndex: number;
  commitSelection: (routeKey: string) => void;
}

export interface BottomBarGestureApi {
  composed: LegacyExclusiveGesture;
  cancelPreview: (restoreIndex: number) => void;
  selectTab: (routeKey: string) => void;
}

// UI-thread gesture phases (spec section 6).
const PHASE = {Idle: 0, Pressed: 1, Preview: 2, Settling: 3} as const;

const triggerHaptic = () => {
  ReactNativeHapticFeedback.trigger('impactLight', {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });
};

/**
 * The single arbiter for the whole bar (spec 8.4): Tap and Pan share
 * `phase` + `previewIndex`, so one touch sequence can never commit twice.
 * Navigation is only ever reached through runOnJS(commitSelection) at commit
 * time — never from a worklet, never per-frame (spec 8.3/8.5).
 */
export const useBottomBarGesture = (
  params: BottomBarGestureParams,
): BottomBarGestureApi => {
  const {routeKeys, motion, geometry, activeIndex, commitSelection} = params;

  const phase = useSharedValue<number>(PHASE.Idle);
  const previewIndex = useSharedValue(-1);
  const lastDragX = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const lastTouchX = useSharedValue(0);

  const restoreVisual = (restoreIndex: number) => {
    'worklet';
    if (geometry) {
      motion.snapTo(geometry, restoreIndex, 'restore');
    }
  };

  const tap = Gesture.Tap()
    .maxDuration(MOTION.holdActivationMs)
    .maxDeltaX(MOTION.moveSlop)
    .maxDeltaY(MOTION.moveSlop)
    .onTouchesDown(event => {
      'worklet';
      if (phase.value === PHASE.Preview) {
        return; // ngón thứ hai trong khi đang drag: bỏ qua hoàn toàn (NAV-16)
      }
      // Mọi touch bắt đầu tại đây: press feedback trên tab dưới ngón (spec 4).
      phase.value = PHASE.Pressed;
      if (geometry && event.allTouches.length > 0) {
        const x = event.allTouches[0].x;
        const y = event.allTouches[0].y;
        originX.value = x;
        originY.value = y;
        lastTouchX.value = x;
        lastDragX.value = x;
        motion.pressIn(indexFromX(x, geometry));
      }
    })
    .onEnd(event => {
      'worklet';
      if (!geometry) {
        return;
      }
      const index = indexFromX(event.x, geometry);
      motion.pressOut(index);
      if (phase.value !== PHASE.Pressed) {
        return; // hold đã kích hoạt → tap của chuỗi này phải thất bại (spec 8.4)
      }
      phase.value = PHASE.Settling;
      runOnJS(commitSelection)(routeKeys[index]);
    })
    .onFinalize(() => {
      'worklet';
      if (phase.value === PHASE.Pressed) {
        // Tap fail vì movement: onEnd không chạy → nhả highlight tại ngón cuối.
        if (geometry) {
          motion.pressOut(indexFromX(lastTouchX.value, geometry));
        }
        phase.value = PHASE.Idle;
      }
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .activateAfterLongPress(MOTION.holdActivationMs)
    .onTouchesDown(event => {
      'worklet';
      if (phase.value === PHASE.Preview) {
        return;
      }
      if (event.allTouches.length > 0) {
        const x = event.allTouches[0].x;
        const y = event.allTouches[0].y;
        originX.value = x;
        originY.value = y;
        lastTouchX.value = x;
        lastDragX.value = x;
      }
    })
    .onTouchesMove((event, manager) => {
      'worklet';
      if (
        phase.value === PHASE.Pressed &&
        event.allTouches.length > 0 &&
        Math.sqrt(
          (event.allTouches[0].x - originX.value) ** 2 +
            (event.allTouches[0].y - originY.value) ** 2,
        ) > MOTION.moveSlop
      ) {
        manager.fail(); // >8dp trước 220ms: hủy cả tap lẫn pan (NAV-12)
      }
    })
    .onStart(event => {
      'worklet';
      // Giữ đủ 220ms: vào preview (spec 5.1). Haptic đúng 1 lần.
      phase.value = PHASE.Preview;
      if (geometry) {
        const startX = event.x;
        lastDragX.value = startX;
        lastTouchX.value = startX;
        const startIdx = indexFromX(startX, geometry);
        previewIndex.value = startIdx;
        motion.cancelEdges();
        motion.previewIcon(startIdx, true);
        motion.followDrag(geometry, startX);
      }
      runOnJS(triggerHaptic)();
    })
    .onUpdate(event => {
      'worklet';
      if (phase.value !== PHASE.Preview || !geometry) {
        return;
      }
      const x = event.x;
      const y = event.y;
      motion.dragStretch(Math.abs(x - lastDragX.value));
      lastDragX.value = x;

      const inside = isInsideDropZone(
        x,
        y,
        geometry.barWidth,
        MOTION.barHeight,
      );

      if (!inside) {
        if (previewIndex.value >= 0) {
          motion.previewIcon(previewIndex.value, false);
        }
      } else {
        const next = candidateFromX(x, geometry, previewIndex.value);
        if (next !== previewIndex.value) {
          if (previewIndex.value >= 0) {
            motion.previewIcon(previewIndex.value, false);
          }
          motion.previewIcon(next, true);
          previewIndex.value = next;
        } else if (previewIndex.value >= 0) {
          motion.previewIcon(previewIndex.value, true);
        }
      }

      motion.followDrag(geometry, x);
    })
    .onEnd((event, success) => {
      'worklet';
      motion.dragStretch(0); // nhả giãn drag về 1 ở cả commit lẫn restore
      if (phase.value !== PHASE.Preview || !geometry) {
        return; // hủy trước khi preview — tap/onFinalize đã xử lý
      }
      if (previewIndex.value >= 0) {
        motion.previewIcon(previewIndex.value, false);
      }
      const inside = isInsideDropZone(
        event.x,
        event.y,
        geometry.barWidth,
        MOTION.barHeight,
      );
      if (success && inside && previewIndex.value >= 0) {
        // Thả trong vùng: chọn preview, không dự đoán velocity (spec 5.3).
        const index = previewIndex.value;
        previewIndex.value = -1;
        phase.value = PHASE.Settling;
        runOnJS(commitSelection)(routeKeys[index]);
      } else {
        // Thả ngoài vùng / OS cancel / hủy: quay về active thực tế (spec 5.4).
        phase.value = PHASE.Idle;
        previewIndex.value = -1;
        restoreVisual(activeIndex);
      }
    })
    .onFinalize(() => {
      'worklet';
      if (phase.value === PHASE.Preview) {
        phase.value = PHASE.Idle;
        if (previewIndex.value >= 0) {
          motion.previewIcon(previewIndex.value, false);
          previewIndex.value = -1;
        }
        restoreVisual(activeIndex);
      }
    });

  const composed = useMemo(
    () => Gesture.Exclusive(pan, tap),
    [pan, tap],
  );

  /** NAV-14: navigation đổi từ ngoài (back/deep link) trong khi preview. */
  const cancelPreview = useCallback(
    (restoreIndex: number) => {
      if (previewIndex.value >= 0) {
        motion.previewIcon(previewIndex.value, false);
      }
      previewIndex.value = -1;
      if (
        phase.value === PHASE.Preview ||
        phase.value === PHASE.Pressed ||
        phase.value === PHASE.Settling
      ) {
        phase.value = PHASE.Idle;
      }
      if (geometry) {
        motion.snapTo(geometry, restoreIndex, 'restore');
      }
    },
    [motion, phase, previewIndex, geometry],
  );

  /** A11y activate (spec 9): commit trực tiếp, không qua gesture. */
  const selectTab = useCallback(
    (routeKey: string) => {
      commitSelection(routeKey);
    },
    [commitSelection],
  );

  return {composed, cancelPreview, selectTab};
};
