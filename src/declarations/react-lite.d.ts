declare namespace JSX {
  interface IntrinsicAttributes {
    key?: any;
  }

  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "react" {
  export function useReducer<T>(reducer: (state: T, action?: any) => T, initialState: T): [T, (action?: any) => void];
  export function useState<T>(initialState: T): [T, (value: T | ((previous: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export const Fragment: any;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react-native" {
  export const NativeModules: Record<string, any>;
  export const Share: { share(options: Record<string, any>): Promise<unknown> };
  export const ScrollView: any;
  export const View: any;
  export const Pressable: any;
  export const Text: any;
}
