declare module 'authApp/EventBus' {
  export const eventBus: {
    subscribe: (event: string, callback: (payload?: any) => void) => () => void;
    publish: (event: string, payload?: any) => void;
  };
}
