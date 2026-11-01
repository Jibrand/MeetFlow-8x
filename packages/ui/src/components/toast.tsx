import { Toaster as Sonner, toast } from 'sonner';

export type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ position = 'top-center', ...props }: ToasterProps) => {
  return (
    <Sonner
      position={position}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg text-xs font-medium rounded-lg',
          description: 'group-[.toast]:text-muted-foreground text-[11px]',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-xs font-medium',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs font-medium',
        },
      }}
      {...props}
    />
  );
};

export { toast };
