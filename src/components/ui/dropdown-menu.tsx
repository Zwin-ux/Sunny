'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

// Simple dropdown menu system that doesn't use complex props like asChild

type DropdownMenuProps = {
  children: React.ReactNode;
};

type DropdownMenuTriggerProps = {
  children: React.ReactNode;
};

type DropdownMenuContentProps = {
  children: React.ReactNode;
};

type DropdownMenuItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Pass isOpen and toggle function to child components
          return React.cloneElement(child, { 
            isOpen, 
            setIsOpen 
          } as Partial<any>);
        }
        return child;
      })}
    </div>
  );
}

export function DropdownMenuTrigger({ children, isOpen, setIsOpen }: DropdownMenuTriggerProps & { isOpen?: boolean, setIsOpen?: (isOpen: boolean) => void }) {
  const handleClick = () => {
    if (setIsOpen) {
      setIsOpen(!isOpen);
    }
  };
  
  return (
    <div className="inline-flex" onClick={handleClick}>
      {children}
    </div>
  );
}

export function DropdownMenuContent({ children, isOpen }: DropdownMenuContentProps & { isOpen?: boolean }) {
  if (!isOpen) {
    return null;
  }
  
  return (
    <div 
      className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

export function DropdownMenuItem({ children, className = '', ...props }: DropdownMenuItemProps) {
  return (
    <button
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
