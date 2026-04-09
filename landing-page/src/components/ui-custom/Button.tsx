
import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    icon, 
    iconPosition = 'left',
    fullWidth = false,
    href,
    children,
    ...props 
  }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rmmbr-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-rmmbr-500 text-white hover:bg-rmmbr-600 active:bg-rmmbr-700 shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border bg-transparent hover:bg-muted text-foreground",
      ghost: "hover:bg-muted text-foreground hover:text-foreground",
      link: "text-rmmbr-400 underline-offset-4 hover:underline p-0 h-auto",
    };
    
    const sizes = {
      sm: "text-xs px-3 py-1.5 h-8",
      md: "text-sm px-4 py-2 h-10",
      lg: "text-base px-6 py-3 h-12",
    };

    const widthClass = fullWidth ? "w-full" : "";
    
    if (href) {
      // Use type assertion to avoid TypeScript errors
      const anchorProps = {} as React.AnchorHTMLAttributes<HTMLAnchorElement>;
      for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
          // @ts-ignore - we know this might not be type-safe but it's a workaround
          anchorProps[key] = props[key];
        }
      }
      
      return (
        <a
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            widthClass,
            className
          )}
          href={href}
          {...anchorProps}
        >
          {icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2">{icon}</span>
          )}
        </a>
      );
    }

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          widthClass,
          className
        )}
        ref={ref}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
