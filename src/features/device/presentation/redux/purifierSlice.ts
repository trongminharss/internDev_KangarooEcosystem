import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PURIFIER_MOCK} from '../purifierMock';
import {COLD_RANGE, HOT_RANGE, snapTemp} from '../purifierUtils';

export interface WaterChannel {
  on: boolean;
  temp: number;
}

// Shared by the detail screen and the full-screen water-mode control.
export interface PurifierState {
  name: string;
  location: string;
  hot: WaterChannel;
  cold: WaterChannel;
  eco: {on: boolean; range: [number, number]};
}

// ponytail: seeded from the demo device until the device API exists.
export const initialState: PurifierState = {
  name: PURIFIER_MOCK.name,
  location: PURIFIER_MOCK.location,
  hot: {on: true, temp: 85},
  cold: {on: true, temp: 6},
  eco: {on: false, range: [6, 22]},
};

const halfHour = (h: number) => Math.round(h * 2) / 2;

const purifierSlice = createSlice({
  name: 'purifier',
  initialState,
  reducers: {
    setHotOn(state, action: PayloadAction<boolean>) {
      state.hot.on = action.payload;
    },
    setColdOn(state, action: PayloadAction<boolean>) {
      state.cold.on = action.payload;
    },
    setHotTemp(state, action: PayloadAction<number>) {
      state.hot.temp = snapTemp(action.payload, HOT_RANGE);
    },
    setColdTemp(state, action: PayloadAction<number>) {
      state.cold.temp = snapTemp(action.payload, COLD_RANGE);
    },
    setEcoOn(state, action: PayloadAction<boolean>) {
      state.eco.on = action.payload;
    },
    // RangeSlider emits raw floats; snap to half-hours.
    setEcoRange(state, action: PayloadAction<[number, number]>) {
      state.eco.range = [
        halfHour(action.payload[0]),
        halfHour(action.payload[1]),
      ];
    },
    rename(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    relocate(state, action: PayloadAction<string>) {
      state.location = action.payload;
    },
  },
});

export const {
  setHotOn,
  setColdOn,
  setHotTemp,
  setColdTemp,
  setEcoOn,
  setEcoRange,
  rename,
  relocate,
} = purifierSlice.actions;

export default purifierSlice.reducer;
