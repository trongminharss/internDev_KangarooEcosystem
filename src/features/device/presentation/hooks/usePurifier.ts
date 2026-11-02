import {useAppDispatch, useAppSelector} from '@/app/store';
import {
  relocate,
  rename,
  setColdOn,
  setColdTemp,
  setEcoOn,
  setEcoRange,
  setHotOn,
  setHotTemp,
} from '../redux/purifierSlice';
import {
  selectPurifierDevice,
  selectPurifierState,
} from '../redux/purifierSelectors';

export type {WaterChannel} from '../redux/purifierSlice';

export const usePurifier = () => {
  const dispatch = useAppDispatch();
  const {hot, cold, eco} = useAppSelector(selectPurifierState);
  const device = useAppSelector(selectPurifierDevice);

  return {
    device,
    hot,
    cold,
    eco,
    setHotOn: (on: boolean) => dispatch(setHotOn(on)),
    setColdOn: (on: boolean) => dispatch(setColdOn(on)),
    setHotTemp: (v: number) => dispatch(setHotTemp(v)),
    setColdTemp: (v: number) => dispatch(setColdTemp(v)),
    setEcoOn: (on: boolean) => dispatch(setEcoOn(on)),
    setEcoRange: (r: [number, number]) => dispatch(setEcoRange(r)),
    rename: (name: string) => dispatch(rename(name)),
    relocate: (location: string) => dispatch(relocate(location)),
  };
};

export type PurifierHook = ReturnType<typeof usePurifier>;
