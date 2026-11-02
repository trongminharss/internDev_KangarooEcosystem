import React, {useEffect, useState, ReactNode} from 'react';
import {Animated, Dimensions, ViewStyle} from 'react-native';

interface FExpansionPanelProps {
  expanded: boolean;
  height1: number;
  children: ReactNode;
  style?: ViewStyle;
}

const FExpansionPanel: React.FC<FExpansionPanelProps> = ({
  expanded,
  height1,
  children,
  style,
}) => {
  const [height] = useState(new Animated.Value(0));
  const screenHeight = Dimensions.get('window').height;
  useEffect(() => {
    Animated.timing(height, {
      toValue: expanded ? screenHeight * height1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [expanded, height, height1, screenHeight]);

  return <Animated.View style={[{height}, style]}>{children}</Animated.View>;
};

export default FExpansionPanel;
