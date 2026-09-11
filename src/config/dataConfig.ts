export interface DataConfig {
  mode: 'local' | 'api';
  local: {
    basePath: string;
  };
  api: {
    baseURL: string;
    timeout: number;
  };
  websocket: {
    enabled: boolean;
    url: string;
  };
}

const dataConfig: DataConfig = {
  mode: 'local',

  local: {
    basePath: '/data',
  },

  api: {
    baseURL: 'http://localhost:8000/api',
    timeout: 10000,
  },

  websocket: {
    enabled: false,
    url: 'ws://localhost:8000/ws',
  },
};

export default dataConfig;
