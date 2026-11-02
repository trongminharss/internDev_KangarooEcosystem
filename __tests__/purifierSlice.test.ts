import purifierReducer, {
  initialState,
  relocate,
  rename,
  setColdOn,
  setColdTemp,
  setEcoOn,
  setEcoRange,
  setHotOn,
  setHotTemp,
} from '@/features/device/presentation/redux/purifierSlice';

describe('purifierSlice reducer', () => {
  it('toggles each channel independently', () => {
    const s = purifierReducer(initialState, setHotOn(false));
    expect(s.hot.on).toBe(false);
    expect(s.cold.on).toBe(true);
    expect(purifierReducer(s, setColdOn(false)).hot.on).toBe(false);
  });

  it('snaps and clamps temperatures to each channel range', () => {
    expect(purifierReducer(initialState, setHotTemp(80.26)).hot.temp).toBe(
      80.5,
    );
    expect(purifierReducer(initialState, setHotTemp(120)).hot.temp).toBe(90);
    expect(purifierReducer(initialState, setColdTemp(-3)).cold.temp).toBe(0);
  });

  it('snaps the eco window to half-hours', () => {
    let s = purifierReducer(initialState, setEcoOn(true));
    s = purifierReducer(s, setEcoRange([6.2, 21.8]));
    expect(s.eco).toEqual({on: true, range: [6, 22]});
  });

  it('stores name and location edits', () => {
    let s = purifierReducer(initialState, rename('Máy phòng khách'));
    s = purifierReducer(s, relocate('Phòng khách'));
    expect(s.name).toBe('Máy phòng khách');
    expect(s.location).toBe('Phòng khách');
  });
});
