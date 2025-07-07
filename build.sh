#!/bin/bash
# Exit on error
set -e

echo "Installing dependencies..."
npm install

# Create UI components directory if it doesn't exist
echo "Setting up UI components directory..."
mkdir -p src/components/ui

# Create minimal components to satisfy imports
echo "Creating minimal UI components..."

# Create button component
cat > src/components/ui/button.tsx << 'EOL'
import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return <button ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, type ButtonProps };
EOL

# Create card component
cat > src/components/ui/card.tsx << 'EOL'
import * as React from "react";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} />;
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} />;
  }
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return <h3 ref={ref} {...props} />;
  }
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} {...props} />;
  }
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} />;
  }
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} {...props} />;
  }
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
EOL

# Create input component
cat > src/components/ui/input.tsx << 'EOL'
import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
EOL

# Create form component
cat > src/components/ui/form.tsx << 'EOL'
import * as React from "react";

const Form = ({ ...props }) => {
  return <form {...props} />;
};
Form.displayName = "Form";

const FormItem = ({ ...props }) => {
  return <div {...props} />;
};
FormItem.displayName = "FormItem";

const FormLabel = ({ ...props }) => {
  return <label {...props} />;
};
FormLabel.displayName = "FormLabel";

const FormControl = ({ ...props }) => {
  return <div {...props} />;
};
FormControl.displayName = "FormControl";

const FormDescription = ({ ...props }) => {
  return <p {...props} />;
};
FormDescription.displayName = "FormDescription";

const FormMessage = ({ ...props }) => {
  return <p {...props} />;
};
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
};
EOL

# Create badge component
cat > src/components/ui/badge.tsx << 'EOL'
import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div {...props} />;
}

export { Badge, type BadgeProps };
EOL

# Create select component
cat > src/components/ui/select.tsx << 'EOL'
import * as React from "react";

const Select = ({ children, ...props }) => {
  return <select {...props}>{children}</select>;
};
Select.displayName = "Select";

const SelectValue = ({ children, ...props }) => {
  return <span {...props}>{children}</span>;
};
SelectValue.displayName = "SelectValue";

const SelectTrigger = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};
SelectContent.displayName = "SelectContent";

const SelectItem = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem
};
EOL

# Create dropdown-menu component
cat > src/components/ui/dropdown-menu.tsx << 'EOL'
import * as React from "react";

const DropdownMenu = ({ children }) => {
  return <div>{children}</div>;
};

const DropdownMenuTrigger = ({ children }) => {
  return <button>{children}</button>;
};

const DropdownMenuContent = ({ children }) => {
  return <div>{children}</div>;
};

const DropdownMenuItem = ({ children }) => {
  return <div>{children}</div>;
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
};
EOL

# Build the Next.js application
echo "Building application..."
npm run build

echo "Build completed successfully!"
