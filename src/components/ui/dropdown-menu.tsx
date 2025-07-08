'use client';

import * as React from 'react';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <div className="relative inline-block text-left">{children}</div>;
}

export function DropdownMenuTrigger({ children, asChild, ...props }: DropdownMenuTriggerProps) {
  // If asChild is true, just return the children directly
  if (asChild) {
    // Cast children to avoid TypeScript errors
    return React.isValidElement(children) 
      ? React.cloneElement(children, { ...props })
      : children;
  }
  // Otherwise, wrap in a div with the inline-flex class
  return <div className="inline-flex" {...props}>{children}</div>;
}

export function DropdownMenuContent({ children, align = 'center' }: DropdownMenuContentProps) {
  return (
    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
      <div className="py-1">{children}</div>
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${className || ''}`}
    >
      {children}
    </button>
  );
}
