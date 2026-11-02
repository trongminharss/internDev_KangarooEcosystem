import React from 'react';
import {SvgXml} from 'react-native-svg';
import {useTheme} from '@/core/theme';

interface FIconProps {
  icon: string;
  iconColor?: string;
  size?: number;
}

const FIcon: React.FC<FIconProps> = ({icon, iconColor, size}) => {
  const {theme} = useTheme();
  const color = iconColor ?? theme.colors.subtitle;
  const modifiedColor = icon.replaceAll('"black"', '"' + color + '"');

  return <SvgXml xml={modifiedColor} width={size} height={size} />;
};

export default FIcon;