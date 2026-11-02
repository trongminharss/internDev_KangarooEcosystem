import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  useSharedValue: (init: any) => ({value: init}),
  runOnJS: (fn: any) => fn,
}));

const tapHandlers: Record<string, any> = {};
const panHandlers: Record<string, any> = {};
const mockTriggerHaptic = jest.fn();

jest.mock('react-native-haptic-feedback', () => {
  const trigger = (...args: any[]) => mockTriggerHaptic(...args);
  return {
    __esModule: true,
    default: {trigger},
    trigger,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const createMockGesture = (handlersStore: Record<string, any>) => {
    const obj: any = {};
    const chainMethods = [
      'maxDuration',
      'minDuration',
      'maxDeltaX',
      'maxDeltaY',
      'maxDistance',
      'minPointers',
      'maxPointers',
      'activateAfterLongPress',
      'shouldCancelWhenOutside',
      'enabled',
    ];
    chainMethods.forEach(m => {
      obj[m] = () => obj;
    });
    const callbackMethods = [
      'onStart',
      'onUpdate',
      'onEnd',
      'onFinalize',
      'onTouchesDown',
      'onTouchesMove',
      'onTouchesUp',
    ];
    callbackMethods.forEach(m => {
      obj[m] = (cb: any) => {
        handlersStore[m] = cb;
        return obj;
      };
    });
    return obj;
  };

  return {
    Gesture: {
      Tap: () => createMockGesture(tapHandlers),
      Pan: () => createMockGesture(panHandlers),
      Exclusive: (...gestures: any[]) => gestures[0],
    },
    runOnJS: (fn: any) => fn,
  };
});

import {BarGeometry} from '@/app/navigation/config/bottomBarMotion';
import {
  BottomBarGestureApi,
  useBottomBarGesture,
} from '@/app/navigation/hooks/useBottomBarGesture';
import {BottomBarMotionApi} from '@/app/navigation/hooks/useBottomBarMotion';

describe('useBottomBarGesture', () => {
  const routeKeys = ['route-home', 'route-auto', 'route-svc', 'route-store'];
  const geometry: BarGeometry = {
    barWidth: 364,
    padding: 6,
    tabCount: 4,
  };

  let mockMotion: jest.Mocked<BottomBarMotionApi>;
  let commitSelection: jest.Mock;
  let gestureApi: BottomBarGestureApi;

  const Probe: React.FC<{activeIndex?: number}> = ({activeIndex = 0}) => {
    gestureApi = useBottomBarGesture({
      routeKeys,
      motion: mockMotion,
      geometry,
      activeIndex,
      commitSelection,
    });
    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(tapHandlers)) {
      delete tapHandlers[key];
    }
    for (const key of Object.keys(panHandlers)) {
      delete panHandlers[key];
    }

    mockMotion = {
      edgeLeft: {value: 0} as any,
      edgeRight: {value: 0} as any,
      capsuleOpacity: {value: 1} as any,
      iconScales: [
        {value: 1},
        {value: 1},
        {value: 1},
        {value: 1},
      ] as any,
      placeAt: jest.fn(),
      snapTo: jest.fn(),
      followDrag: jest.fn(),
      dragStretch: jest.fn(),
      pressIn: jest.fn(),
      pressOut: jest.fn(),
      previewIcon: jest.fn(),
      cancelEdges: jest.fn(),
    };
    commitSelection = jest.fn();
  });

  it('performs quick tap and commits selected tab', () => {
    renderer.act(() => {
      renderer.create(<Probe activeIndex={0} />);
    });

    // Touch down on Tab 2 (x = 226)
    renderer.act(() => {
      tapHandlers.onTouchesDown({allTouches: [{x: 226, y: 30}]});
    });
    expect(mockMotion.pressIn).toHaveBeenCalledWith(2);

    // Release before 220ms (tap recognized)
    renderer.act(() => {
      tapHandlers.onEnd({x: 226, y: 30});
    });
    expect(mockMotion.pressOut).toHaveBeenCalledWith(2);
    expect(commitSelection).toHaveBeenCalledWith('route-svc');
  });

  it('activates hold preview at 220ms and commits on release without drag', () => {
    renderer.act(() => {
      renderer.create(<Probe activeIndex={0} />);
    });

    // Touch down on Tab 1 (x = 138)
    renderer.act(() => {
      tapHandlers.onTouchesDown({allTouches: [{x: 138, y: 30}]});
      panHandlers.onTouchesDown({allTouches: [{x: 138, y: 30}]});
    });
    expect(mockMotion.pressIn).toHaveBeenCalledWith(1);

    // 220ms hold threshold reached: pan activates
    renderer.act(() => {
      panHandlers.onStart({x: 138, y: 30});
    });

    expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
    expect(mockMotion.cancelEdges).toHaveBeenCalled();
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(1, true);
    expect(mockMotion.followDrag).toHaveBeenCalledWith(geometry, 138);

    // User releases without dragging
    renderer.act(() => {
      panHandlers.onEnd({x: 138, y: 30}, true);
    });

    expect(mockMotion.previewIcon).toHaveBeenCalledWith(1, false);
    expect(commitSelection).toHaveBeenCalledWith('route-auto');
  });

  it('allows continuous drag across tabs and commits dropped tab', () => {
    renderer.act(() => {
      renderer.create(<Probe activeIndex={0} />);
    });

    // Touch down and start hold on Tab 0 (x = 50)
    renderer.act(() => {
      tapHandlers.onTouchesDown({allTouches: [{x: 50, y: 30}]});
      panHandlers.onTouchesDown({allTouches: [{x: 50, y: 30}]});
      panHandlers.onStart({x: 50, y: 30});
    });
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(0, true);

    // Drag to Tab 1 (x = 145)
    renderer.act(() => {
      panHandlers.onUpdate({x: 145, y: 30});
    });
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(0, false);
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(1, true);
    expect(mockMotion.followDrag).toHaveBeenCalledWith(geometry, 145);

    // Drag to Tab 3 (x = 314)
    renderer.act(() => {
      panHandlers.onUpdate({x: 314, y: 30});
    });
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(1, false);
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(3, true);
    expect(mockMotion.followDrag).toHaveBeenCalledWith(geometry, 314);

    // Release on Tab 3
    renderer.act(() => {
      panHandlers.onEnd({x: 314, y: 30}, true);
    });
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(3, false);
    expect(commitSelection).toHaveBeenCalledWith('route-store');
  });

  it('cancels preview and restores to activeIndex when dropped outside drop zone', () => {
    renderer.act(() => {
      renderer.create(<Probe activeIndex={1} />);
    });

    // Touch down and start hold on Tab 1 (x = 138)
    renderer.act(() => {
      tapHandlers.onTouchesDown({allTouches: [{x: 138, y: 30}]});
      panHandlers.onTouchesDown({allTouches: [{x: 138, y: 30}]});
      panHandlers.onStart({x: 138, y: 30});
    });

    // Drag far above bar into screen content (y = -80)
    renderer.act(() => {
      panHandlers.onUpdate({x: 200, y: -80});
    });
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(1, false);

    // Release outside drop zone
    renderer.act(() => {
      panHandlers.onEnd({x: 200, y: -80}, true);
    });

    expect(commitSelection).not.toHaveBeenCalled();
    expect(mockMotion.snapTo).toHaveBeenCalledWith(geometry, 1, 'restore');
  });

  it('fails gesture if finger moves > 8dp before 220ms hold activation', () => {
    renderer.act(() => {
      renderer.create(<Probe activeIndex={0} />);
    });

    // Touch down at (50, 30)
    renderer.act(() => {
      tapHandlers.onTouchesDown({allTouches: [{x: 50, y: 30}]});
      panHandlers.onTouchesDown({allTouches: [{x: 50, y: 30}]});
    });

    // Move to (70, 30) before 220ms -> movement is 20dp > 8dp
    const manager = {fail: jest.fn()};
    renderer.act(() => {
      panHandlers.onTouchesMove({allTouches: [{x: 70, y: 30}]}, manager);
    });
    expect(manager.fail).toHaveBeenCalledTimes(1);
  });

  it('cancelPreview restores visual and clears preview state', () => {
    renderer.act(() => {
      renderer.create(<Probe activeIndex={0} />);
    });

    renderer.act(() => {
      tapHandlers.onTouchesDown({allTouches: [{x: 50, y: 30}]});
      panHandlers.onTouchesDown({allTouches: [{x: 50, y: 30}]});
      panHandlers.onStart({x: 50, y: 30});
    });
    expect(mockMotion.previewIcon).toHaveBeenCalledWith(0, true);

    renderer.act(() => {
      gestureApi.cancelPreview(2);
    });

    expect(mockMotion.previewIcon).toHaveBeenCalledWith(0, false);
    expect(mockMotion.snapTo).toHaveBeenCalledWith(geometry, 2, 'restore');
  });
});
