import {StyleSheet} from 'react-native';
import React, {useState, useEffect} from 'react';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import * as Animatable from 'react-native-animatable';
import {useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';

type FSwitchProps = {
  status: boolean;
  onChange?: (value: boolean) => void;
};

export default function FSwitch({status, onChange}: FSwitchProps) {
  const {theme} = useTheme();
  const {colors} = theme;
  const [isEnabled, setIsEnabled] = useState(status ? status : false);
  const toggleSwitch = () => {
    setIsEnabled(!isEnabled);
    onChange?.(!isEnabled);
  };

  useEffect(() => {
    setIsEnabled(status);
  }, [status]);
  Animatable.initializeRegistryWithDefinitions({
    moveRight: {
      0: {
        transform: [{translateX: 0}],
      },
      1: {
        transform: [{translateX: 20}],
      },
    },
    moveLeft: {
      0: {
        transform: [{translateX: 20}],
      },
      1: {
        transform: [{translateX: 0}],
      },
    },
  } as any);
  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      <Animatable.View
        style={[
          styles.switch,
          {backgroundColor: isEnabled ? colors.primary : colors.disable},
        ]}>
        <Animatable.View
          duration={400}
          animation={isEnabled ? 'moveRight' : 'moveLeft'}
          style={[styles.circle, {backgroundColor: colors.white}]}></Animatable.View>
      </Animatable.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: tokens.borderRadius.full, // pill — track height 24
    justifyContent: 'center',
    paddingHorizontal: 1, // thumb inset, geometry — not a spacing token
  },
  circle: {
    height: 22,
    width: 22,
    borderRadius: tokens.borderRadius.full, // circle — 22×22
  },
});
