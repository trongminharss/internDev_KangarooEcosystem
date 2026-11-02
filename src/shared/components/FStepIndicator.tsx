import React, {useMemo} from 'react';
import StepIndicator from 'react-native-step-indicator';
import {useTheme} from '@/core/theme';

interface FStepIndicatorProps {
  lable: string[];
  stepCount: number;
  direction?: 'vertical';
  currentPosition: number | any;
  customStyles?: Record<string, any>;
}

const FStepIndicator: React.FC<FStepIndicatorProps> = ({
  lable,
  stepCount,
  direction,
  currentPosition,
  customStyles,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  const indicatorStyles = useMemo(
    () => ({
      stepIndicatorCurrentColor: colors.white,
      stepIndicatorFinishedColor: colors.primary,
      stepIndicatorUnFinishedColor: colors.grey1,
      stepStrokeCurrentColor: colors.primary,
      stepStrokeFinishedColor: colors.primary,
      stepStrokeUnFinishedColor: colors.disable,
      separatorFinishedColor: colors.primary,
      separatorUnFinishedColor: colors.disable,
      currentStepLabelColor: colors.primary,
      labelColor: colors.subtitle,
      ...customStyles,
    }),
    [colors, customStyles],
  );

  return (
    <StepIndicator
      customStyles={indicatorStyles}
      currentPosition={currentPosition}
      labels={lable}
      direction={direction}
      stepCount={stepCount}
    />
  );
};
export default FStepIndicator;
