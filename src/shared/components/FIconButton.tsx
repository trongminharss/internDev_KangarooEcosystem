import React from 'react';
import {IconButton} from 'react-native-paper';
import {SvgXml} from 'react-native-svg';
import {useTheme} from '@/core/theme';

interface FIconButtonProps {
  icon: string;
  onPress?: () => void;
  iconColor?: string;
  size?: number;
  disabled?: boolean;
}

const FIconButton: React.FC<FIconButtonProps> = ({
  icon,
  onPress,
  iconColor,
  size,
  disabled = false,
}) => {
  const {theme} = useTheme();
  const color = iconColor ?? theme.colors.subtitle;
  const modifiedColor = icon.replaceAll('fill="black"', 'fill="' + color + '"');

  return (
    <IconButton
      icon={() => <SvgXml xml={modifiedColor} width={size} height={size} />}
      iconColor={color}
      size={size}
      disabled={disabled}
      onPress={onPress}
      rippleColor={theme.colors.border1}
    />
  );
};

export default FIconButton;