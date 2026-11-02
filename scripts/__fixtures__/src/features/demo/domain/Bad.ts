import axios from 'axios';

export interface BadEntity {
  id: string;
  fetch: typeof axios;
}
