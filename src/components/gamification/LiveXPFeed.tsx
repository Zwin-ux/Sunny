'use client';

import { useLeaderboardSSE } from '@/hooks/useLeaderboardSSE'

export default function LiveXPFeed() {
  const events = useLeaderboardSSE()
  if (events.length === 0) return null
  return (
    <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="font-bold mb-2">Live XP Feed</div>
      <div className="space-y-1 max-h-48 overflow-auto text-sm">
        {events.map((e, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="truncate">User {e.userId.slice(0,6)}… {e.reason ? `— ${e.reason}` : ''}</div>
            <div className="font-bold text-blue-600">+{e.amount} XP</div>
          </div>
        ))}
      </div>
    </div>
  )
}

