import React from 'react';
import {Text, TextStyle} from 'react-native';
import FTheme from '@/core/theme/FTheme';
import {useTheme} from '@/core/theme';

interface FTextProps {
  typo: keyof typeof FTheme.fonts;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number | undefined;
  color?: string;
}

const FText: React.FC<FTextProps> = ({
  typo,
  children,
  style,
  numberOfLines,
  color,
}) => {
  const {theme} = useTheme();
  const typoStyle = theme.fonts[typo];

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        typoStyle,
        {
          color: color ?? theme.colors.title,
        },
        style,
      ]}>
      {children}
    </Text>
  );
};

export default FText;
