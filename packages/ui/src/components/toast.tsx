import { Toaster as Sonner, toast } from 'sonner';

export type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg text-xs font-medium',
          description: 'group-[.toast]:text-muted-foreground text-[11px]',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-xs',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs',
        },
      }}
      {...props}
    />
  );
};

export { toast };
