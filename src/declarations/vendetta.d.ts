declare module "@vendetta/plugin" {
  export const storage: Record<string, any>;
}

declare module "@vendetta/plugins" {
  export const plugins: Record<string, any>;
  export function installPlugin(id: string, enabled?: boolean): Promise<void>;
}

declare module "@vendetta/storage" {
  export function useProxy<T extends object>(storage: T): T;
  export function createMMKVBackend(id: string): {
    get(): Promise<unknown>;
    set(value: unknown): Promise<void> | void;
  };
}

declare module "@vendetta/metro/common" {
  export const React: typeof import("react");
  export const ReactNative: typeof import("react-native");
  export const NavigationNative: {
    useNavigation(): {
      push(route: string, params?: Record<string, unknown>): void;
      goBack(): void;
    };
  };
}

declare module "@vendetta/ui/assets" {
  export function getAssetIDByName(name: string): number;
}

declare module "@vendetta/ui/alerts" {
  export function showConfirmationAlert(options: {
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
  }): void;
}

declare module "@vendetta/ui/components" {
  export const Forms: any;
  export const General: any;
}

declare module "@vendetta/ui/toasts" {
  export function showToast(content: string, asset?: number): void;
}
