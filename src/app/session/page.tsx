import { SessionProvider } from '@/contexts/SessionContext';
import { SessionPageContent } from './sessionPageContent';

export default function SessionPage() {
  return (
    <SessionProvider>
      <SessionPageContent />
    </SessionProvider>
  );
}
