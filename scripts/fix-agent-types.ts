/**
 * Quick fixes for agent TypeScript errors
 * Run this to patch critical type issues blocking the agent system
 */

// This file documents the fixes needed:

/*
1. game-agent.ts - Fix processMessage signature:
   - Change: processMessage(message: AgentMessage, context: LearningState)
   - To: processMessage(message: AgentMessage)
   - Store context in instance variable or pass via message payload

2. Fix recommendation type:
   - Change 'activity' to valid RecommendationType
   - Valid types: 'content', 'intervention', 'strategy', 'action'

3. Fix AgentResponse structure:
   - Remove 'agentId' (not in interface)
   - Ensure all required fields present

These will be applied via sed commands or direct edits.
*/

export const fixes = [
  {
    file: 'src/lib/agents/game-agent.ts',
    issue: 'processMessage signature mismatch',
    fix: 'Add context parameter to base class or extract from message'
  },
  {
    file: 'src/lib/agents/types.ts',
    issue: 'Missing RecommendationType',
    fix: 'Add "activity" to RecommendationType union'
  }
];
