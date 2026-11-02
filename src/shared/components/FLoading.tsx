import React from 'react';
import {Dialog, Portal, ActivityIndicator} from 'react-native-paper';
import {Pulse, Bounce} from 'react-native-animated-spinkit';
import {useTheme} from '@/core/theme';
import {View} from 'react-native';
import LogoKSvg from '@/assets/svg/logo_k.svg';

interface FLoadingProps {
  visible: boolean;
  loadFullScreen?: boolean;
}

const FLoading: React.FC<FLoadingProps> = ({visible, loadFullScreen = true}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return loadFullScreen ? (
    <Portal>
      <Dialog
        visible={visible}
        dismissable={false}
        style={{
          height: 0,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: 'transparent',
        }}>
        <Dialog.Content
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Pulse
            size={150}
            color={colors.primary}
            style={{position: 'absolute'}}></Pulse>
          <Bounce
            size={80}
            color={colors.primarySub}
            style={{position: 'absolute'}}></Bounce>
          <ActivityIndicator
            size={60}
            color={colors.primary}
            style={{position: 'absolute'}}
          />
          <LogoKSvg width={50} height={50} style={{position: 'absolute'}} />
        </Dialog.Content>
      </Dialog>
    </Portal>
  ) : (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Pulse
        size={150}
        color={colors.primary}
        style={{position: 'absolute'}}></Pulse>
      <Bounce
        size={80}
        color={colors.primarySub}
        style={{position: 'absolute'}}></Bounce>
      <ActivityIndicator
        size={60}
        color={colors.primary}
        style={{position: 'absolute'}}
      />
      <LogoKSvg width={50} height={50} style={{position: 'absolute'}} />
    </View>
  );
};

export default FLoading;