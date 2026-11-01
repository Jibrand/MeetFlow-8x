import * as React from 'react';
import hotToast, {
  Toaster as HotToaster,
  type ToasterProps as HotToasterProps,
} from 'react-hot-toast';

export type ToasterProps = HotToasterProps & {
  theme?: 'light' | 'dark';
};

export const Toaster: React.FC<ToasterProps> = ({
  position = 'top-center',
  theme = 'light',
  toastOptions,
  ...props
}) => {
  const isDark = theme === 'dark';

  return (
    <HotToaster
      position={position}
      containerStyle={{
        top: 24,
      }}
      toastOptions={{
        duration: 3500,
        style: {
          background: isDark ? '#18181b' : '#ffffff',
          color: isDark ? '#f4f4f5' : '#18181b',
          border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
          borderRadius: '0.5rem',
          padding: '10px 16px',
          fontSize: '12px',
          fontWeight: 500,
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          maxWidth: '420px',
        },
        success: {
          iconTheme: {
            primary: '#D97706', // Honey #D97706
            secondary: isDark ? '#18181b' : '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: isDark ? '#18181b' : '#ffffff',
          },
        },
        ...toastOptions,
      }}
      {...props}
    />
  );
};

// Polyfill toast.info on top of react-hot-toast for backwards compatibility
export const toast = Object.assign(
  (message: any, opts?: any) => hotToast(message, opts),
  hotToast,
  {
    info: (message: any, opts?: any) =>
      hotToast(message, {
        icon: 'ℹ️',
        ...opts,
      }),
  }
);

export default toast;
