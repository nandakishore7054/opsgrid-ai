import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../ui/utils';

import logoLight from '../../../assets/branding/logo-light.png';
import logoDark from '../../../assets/branding/logo-dark.png';
import logonameLight from '../../../assets/branding/logoname-light.png';
import logonameDark from '../../../assets/branding/logoname-dark.png';

export function Logo({
  variant = 'full', // 'full' | 'mark'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  to,
  forceTheme, // 'dark' | 'light' | undefined
  className = '',
  imgClassName = '',
}) {
  // Height definitions for aspect ratio preservation
  const sizeClasses = {
    sm: variant === 'mark' ? 'h-7 w-7' : 'h-7 w-auto',
    md: variant === 'mark' ? 'h-9 w-9' : 'h-9 w-auto',
    lg: variant === 'mark' ? 'h-11 w-11' : 'h-11 w-auto',
    xl: variant === 'mark' ? 'h-14 w-14' : 'h-14 w-auto',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  const renderContent = () => {
    if (forceTheme === 'dark') {
      return (
        <img
          src={variant === 'mark' ? logoDark : logonameDark}
          alt={variant === 'mark' ? "OpsGrid Mark" : "OpsGrid Logo"}
          className={cn("object-contain max-w-full", currentSizeClass, imgClassName)}
        />
      );
    }

    if (forceTheme === 'light') {
      return (
        <img
          src={variant === 'mark' ? logoLight : logonameLight}
          alt={variant === 'mark' ? "OpsGrid Mark" : "OpsGrid Logo"}
          className={cn("object-contain max-w-full", currentSizeClass, imgClassName)}
        />
      );
    }

    // Default: Dynamic Theme Reactive
    return variant === 'mark' ? (
      <>
        <img
          src={logoLight}
          alt="OpsGrid Mark"
          className={cn("object-contain max-w-full dark:hidden", currentSizeClass, imgClassName)}
        />
        <img
          src={logoDark}
          alt="OpsGrid Mark"
          className={cn("object-contain max-w-full hidden dark:block", currentSizeClass, imgClassName)}
        />
      </>
    ) : (
      <>
        <img
          src={logonameLight}
          alt="OpsGrid Logo"
          className={cn("object-contain max-w-full dark:hidden", currentSizeClass, imgClassName)}
        />
        <img
          src={logonameDark}
          alt="OpsGrid Logo"
          className={cn("object-contain max-w-full hidden dark:block", currentSizeClass, imgClassName)}
        />
      </>
    );
  };

  const content = (
    <div className={cn("inline-flex items-center justify-center select-none shrink-0", className)}>
      {renderContent()}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
