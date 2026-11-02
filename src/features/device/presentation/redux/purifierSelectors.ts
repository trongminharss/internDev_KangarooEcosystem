import {createSelector} from '@reduxjs/toolkit';
import type {RootState} from '@/app/store/rootReducer';
import {PURIFIER_MOCK} from '../purifierMock';

export const selectPurifierState = (state: RootState) => state.purifier;

/** Demo device merged with the user-editable fields kept in the store. */
export const selectPurifierDevice = createSelector(
  [selectPurifierState],
  s => ({...PURIFIER_MOCK, name: s.name, location: s.location}),
);
