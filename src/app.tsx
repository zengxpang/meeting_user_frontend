// 运行时配置

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
import {
  RequestConfig,
  RunTimeLayoutConfig,
  request as maxRequest,
  history,
} from '@umijs/max';
import localforage from 'localforage';
import { Setting } from '@/components';
import to from 'await-to-js';
import { message } from 'antd';
import { refreshToken } from '@/services';

export async function getInitialState(): Promise<{ name: string }> {
  return { name: 'zxp' };
}

// @ts-ignore
export const layout: RunTimeLayoutConfig = (initialState) => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
    },
    layout: 'mix',
    menuHeaderRender: undefined,
    fixedHeader: true,
    rightRender: () => {
      return <Setting />;
    },
  };
};

// 与后端约定的响应数据格式
interface ResponseStructure {
  data: any;
  code: number;
  message: string;
  success: boolean;
}

interface PendingTask {
  config: any;
  resolve: Function;
}
let refreshing = false; // 正在刷新token
const queue: PendingTask[] = []; // 请求队列

export const request: RequestConfig = {
  timeout: 5000,
  baseURL: '/api',
  requestInterceptors: [
    (url, options) => {
      const accessToken = localStorage.getItem('meeting-room/access_token');
      if (accessToken) {
        options.headers.authorization =
          'Bearer ' + accessToken.substring(1, accessToken.length - 1);
      }
      return { url, options };
    },
  ],
  responseInterceptors: [
    [
      (response: any) => {
        return response?.data;
      },
      async (error: any) => {
        const { data, config } = error.response;
        if (refreshing) {
          return new Promise((resolve) => {
            queue.push({ config, resolve });
          });
        }
        if (data.code === 401 && !config.url.includes('/user/refresh')) {
          refreshing = true;
          const [_, res] = await to(refreshToken());
          await localforage.setItem('access_token', res.accessToken);
          await localforage.setItem('refresh_token', res.refreshToken);
          refreshing = false;
          if (res.status === 200) {
            queue.forEach(({ config, resolve }) => {
              resolve(maxRequest(config));
            });
            return maxRequest(config);
          } else {
            console.log(res);
            message.error(res.data);
            // history.push('/login');
          }
        }
        return Promise.reject(error?.response?.data?.data);
      },
    ],
  ],
};

localforage.config({
  driver: localforage.LOCALSTORAGE,
  name: 'meeting-room',
});
