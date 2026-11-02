import React from 'react';
import {View, ViewStyle, TouchableOpacity} from 'react-native';
import {RangeSlider, Slider} from '@react-native-assets/slider';
import {useTheme} from '@/core/theme';
import {spacing, tokens} from '@/shared/styles';
import FText from './FText';

interface FSliderProps {
  inboundColor?: string;
  mode?: 'Ranger';
  iconLeft?: any;
  iconRight?: any;
  contentTitle?: string;
  TextActionView?: string;
  value?: string;
  onValueRanger?: (value: [number, number]) => void;
  value1?: string;
  style?: ViewStyle;
  range: [number, number];
  minValue?: number;
  maxValue?: number;
  onValue?: (value: number) => void;
}

const FSlider: React.FC<FSliderProps> = ({
  inboundColor,
  mode,
  iconLeft,
  iconRight,
  contentTitle,
  TextActionView,
  value,
  value1,
  style,
  minValue,
  maxValue,
  range,
  onValueRanger,
  onValue,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const trackColor = colors.grey1;
  const thumbBg = colors.white;

  return (
    <View style={{backgroundColor: colors.white}}>
      {mode ? (
        <View
          style={[spacing.p_3xs, spacing.px_s, {backgroundColor: colors.white}]}>
          {contentTitle && TextActionView && (
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
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: tokens.spacing._3xs,
            }}>
            <View>{iconLeft !== undefined && iconLeft}</View>
            <View style={[{flex: 1, marginHorizontal: tokens.spacing.s}, style]}>
              <RangeSlider
                range={range}
                minimumValue={minValue}
                maximumValue={maxValue}
                step={0}
                minimumRange={0}
                crossingAllowed={false}
                outboundColor={trackColor}
                inboundColor={inboundColor !== undefined ? inboundColor : colors.primary}
                thumbTintColor={colors.primary}
                thumbStyle={{
                  borderColor: colors.primary,
                  backgroundColor: thumbBg,
                  borderWidth: 1,
                }}
                trackStyle={{height: 8}}
                vertical={false}
                inverted={false}
                enabled={true}
                trackHeight={4}
                thumbSize={20}
                slideOnTap={true}
                onValueChange={range => onValueRanger && onValueRanger(range)}
              />
            </View>

            <View>{iconRight !== undefined && iconRight}</View>
          </View>
          {value && value1 && (
            <View style={{flexDirection: 'row', paddingHorizontal: tokens.spacing._2xs}}>
              <View style={{flex: 1}}>
                <FText typo="title6">{range[0]}</FText>
              </View>
              <View style={{flex: 1, alignItems: 'flex-end'}}>
                <FText typo="title6">{range[1]}</FText>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View
          style={[spacing.p_3xs, spacing.px_s, {backgroundColor: colors.white}]}>
          {contentTitle && TextActionView && (
            <View style={{flexDirection: 'row', paddingVertical: tokens.spacing._3xs}}>
              <View>
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
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: tokens.spacing._2xs,
            }}>
            <View>{iconLeft !== undefined && iconLeft}</View>
            <View style={[{flex: 1, marginHorizontal: tokens.spacing.s}, style]}>
              <Slider
                value={0.2}
                minimumValue={0}
                maximumValue={100}
                step={0}
                minimumTrackTintColor={
                  inboundColor !== undefined ? inboundColor : colors.primary
                }
                maximumTrackTintColor={trackColor}
                thumbTintColor={colors.primary}
                thumbStyle={{
                  borderColor: colors.primary,
                  backgroundColor: thumbBg,
                  borderWidth: 1,
                }}
                trackStyle={{height: 8, borderRadius: tokens.borderRadius.small}}
                vertical={false}
                inverted={false}
                enabled={true}
                trackHeight={4}
                thumbSize={20}
                slideOnTap={true}
                onValueChange={value => onValue && onValue(value)}
              />
            </View>

            <View>{iconRight !== undefined && iconRight}</View>
          </View>
          {value && value1 && (
            <View style={{flexDirection: 'row', paddingLeft: tokens.spacing._2xs}}>
              <View style={{flex: 1}}>
                <FText typo="title6">0%</FText>
              </View>
              <View style={{flex: 1, alignItems: 'flex-end'}}>
                <FText typo="title6">100%</FText>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default FSlider;
