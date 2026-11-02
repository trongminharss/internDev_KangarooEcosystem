import React from 'react';
import {View, ViewStyle, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '@/core/theme';
import {spacing, tokens} from '@/shared/styles';
import FText from './FText';

interface FProgressProps {
  iconLeft?: any;
  iconRight?: any;
  action: any;
  colorAction?: string;
  contentTitle?: string;
  TextActionView?: string;
  value?: string;
  value1?: string;
  style?: ViewStyle;
}

const FProgress: React.FC<FProgressProps> = ({
  iconLeft,
  iconRight,
  action,
  colorAction,
  contentTitle,
  TextActionView,
  value,
  value1,
  style,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <View style={[spacing.p_3xs, spacing.px_s, {backgroundColor: colors.white}]}>
      <View style={{flexDirection: 'row', paddingVertical: tokens.spacing._3xs}}>
        <View style={{flex: 1}}>
          {contentTitle !== undefined && (
            <FText typo="title4">{contentTitle}</FText>
          )}
        </View>
        <TouchableOpacity style={{flex: 1, alignItems: 'flex-end'}}>
          {TextActionView !== undefined && (
            <FText typo="buttonText2">{TextActionView}</FText>
          )}
        </TouchableOpacity>
      </View>
      {iconLeft && iconRight ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: tokens.spacing._3xs,
          }}>
          <View>{iconLeft !== undefined && iconLeft}</View>
          <View
            style={[
              {
                flex: 1,
                backgroundColor: colors.grey1,
                borderRadius: tokens.borderRadius.small,
                height: 10,
                marginHorizontal: tokens.spacing._2xs,
              },
              style,
            ]}>
            <Text
              style={{
                width: action,
                backgroundColor: colorAction ? colorAction : colors.primary,
                borderRadius: tokens.borderRadius.small,
              }}></Text>
          </View>
          <View>{iconRight !== undefined && iconRight}</View>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: tokens.spacing._3xs,
          }}>
          <View>
            <FText typo="title6">{value}</FText>
          </View>
          <View
            style={[
              {
                flex: 1,
                backgroundColor: colors.grey1,
                borderRadius: tokens.borderRadius.small,
                height: 10,
                marginHorizontal: tokens.spacing._2xs,
              },
              style,
            ]}>
            <Text
              style={{
                width: action,
                backgroundColor: colorAction ? colorAction : colors.primary,
                borderRadius: tokens.borderRadius.small,
              }}></Text>
          </View>
          <View>
            <FText typo="title6">{value1}</FText>
          </View>
        </View>
      )}

      {value && value1 && iconLeft && iconRight && (
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}>
            <FText typo="title6">{value}</FText>
          </View>
          <View style={{flex: 1, alignItems: 'flex-end'}}>
            <FText typo="title6">{value1}</FText>
          </View>
        </View>
      )}
    </View>
  );
};

export default FProgress;