import React from 'react';
import {Text} from 'react-native';
import renderer from 'react-test-renderer';
import {useCountdown} from '@/shared/hooks/useCountdown';

let hookResult: ReturnType<typeof useCountdown>;

const Probe: React.FC = () => {
  hookResult = useCountdown(30);
  return <Text>{hookResult.seconds}</Text>;
};

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down from 30 to 0 then allows resend', () => {
    renderer.act(() => {
      renderer.create(<Probe />);
    });
    expect(hookResult.seconds).toBe(30);
    expect(hookResult.isDone).toBe(false);

    for (let i = 0; i < 30; i++) {
      renderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(hookResult.seconds).toBe(0);
    expect(hookResult.isDone).toBe(true);
  });

  it('restarts the countdown', () => {
    renderer.act(() => {
      renderer.create(<Probe />);
    });
    for (let i = 0; i < 30; i++) {
      renderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(hookResult.isDone).toBe(true);

    renderer.act(() => {
      hookResult.restart();
    });
    expect(hookResult.seconds).toBe(30);
    expect(hookResult.isDone).toBe(false);
  });
});
