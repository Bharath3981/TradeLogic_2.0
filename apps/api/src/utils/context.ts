import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  accessToken?: string;
  userId?: string;
}

export const context = new AsyncLocalStorage<RequestContext>();

export const getRequestId = (): string | undefined => {
  const store = context.getStore();
  return store?.requestId;
};

export const getAccessToken = (): string | undefined => {
  const store = context.getStore();
  return store?.accessToken;
};
