import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stage Creator - Sunny AI Learning',
  description: 'Create custom emotional learning stages for students.',
};

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
