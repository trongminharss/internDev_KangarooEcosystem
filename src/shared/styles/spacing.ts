import {StyleSheet} from 'react-native';
import {tokens} from './tokens';

const s = tokens.spacing;

/**
 * Shared component-spacing styles (Figma `spacing/*`): 3xs=4 · 2xs=8 · xs=12 · s=16.
 * Use these for padding/gap inside components instead of importing `tokens` each time.
 */
export const spacing = StyleSheet.create({
  // padding (all sides)
  p_3xs: {padding: s._3xs},
  p_2xs: {padding: s._2xs},
  p_xs: {padding: s.xs},
  p_s: {padding: s.s},

  // padding horizontal
  px_3xs: {paddingHorizontal: s._3xs},
  px_2xs: {paddingHorizontal: s._2xs},
  px_xs: {paddingHorizontal: s.xs},
  px_s: {paddingHorizontal: s.s},

  // padding vertical
  py_3xs: {paddingVertical: s._3xs},
  py_2xs: {paddingVertical: s._2xs},
  py_xs: {paddingVertical: s.xs},
  py_s: {paddingVertical: s.s},

  // gap
  gap_3xs: {gap: s._3xs},
  gap_2xs: {gap: s._2xs},
  gap_xs: {gap: s.xs},
  gap_s: {gap: s.s},
});
