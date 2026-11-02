import {axiosClient} from '../../../../core/api/axiosClient';
import {StubDto} from '../models/Stub';

export const goodRemote = {
  client: axiosClient,
  fetch: (): StubDto => ({id: '1'}),
};
