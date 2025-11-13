import { v4 as uuidv4 } from 'uuid';

import {
  AdaptiveNarrativeState,
  EnhancedStudentProfile,
  LearningState,
  LessonIdeaBlueprint,
  PersonalizedLessonPlan,
  PlanActivity,
  ProgressionStage,
  ProfileSummary,
} from './types';

interface LessonEvolutionInput {
  studentId: string;
  learningState: LearningState;
  profile?: EnhancedStudentProfile;
  interaction: any;
  baseResponse?: string;
}

interface LessonEvolutionResult {
  plan: PersonalizedLessonPlan;
  response: string;
  actions: string[];
  updates: Partial<LearningState>;
}

export function summarizeProfile(profile: EnhancedStudentProfile): ProfileSummary {
  const strengths: string[] = [];
  const growthAreas: string[] = [];

  if (profile.cognitiveProfile.processingSpeed >= 0.75) {
    strengths.push('lightning-fast thinker');
  } else {
    growthAreas.push('building confident quick responses');
  }

  if (profile.cognitiveProfile.metacognition >= 0.65) {
    strengths.push('reflective learner');
  } else {
    growthAreas.push('celebrating reflections to deepen learning');
  }

  if (profile.motivationFactors.intrinsicMotivation >= 0.7) {
    strengths.push('curiosity-driven explorer');
  }

  if (profile.motivationFactors.collaborativePreference >= 0.7) {
    strengths.push('collaboration catalyst');
  }

  const motivationalDrivers = [
    profile.motivationFactors.intrinsicMotivation > profile.motivationFactors.extrinsicMotivation
      ? 'achievement unlocked by curiosity'
      : 'earning rewards through consistent wins',
  ];

  if (profile.motivationFactors.autonomyPreference > 0.6) {
    motivationalDrivers.push('owning the learning journey');
  }

  const preferredPacing: ProfileSummary['preferredPacing'] =
    profile.learningVelocity.conceptAcquisitionRate > 2.2
      ? 'accelerated'
      : profile.learningVelocity.conceptAcquisitionRate >= 1.5
      ? 'steady'
      : 'explorer';

  const collaborationStyle: ProfileSummary['collaborationStyle'] =
    profile.motivationFactors.collaborativePreference > 0.75
      ? 'team-player'
      : profile.motivationFactors.collaborativePreference < 0.45
      ? 'solo-adventurer'
      : 'balanced';

  return {
    identityStatement: `${profile.name || 'This learner'} shines when new ideas feel like adventures and progress is a story that unfolds with every step.`,
    coreStrengths: Array.from(new Set(strengths)).slice(0, 4),
    growthAreas: Array.from(new Set(growthAreas)).slice(0, 4),
    motivationalDrivers,
    preferredPacing,
    collaborationStyle,
  };
}

export function createInitialNarrativeState(profile: EnhancedStudentProfile): AdaptiveNarrativeState {
  const theme = profile.motivationFactors.intrinsicMotivation >= profile.motivationFactors.extrinsicMotivation
    ? 'Curiosity Quest'
    : 'Achievement Sprint';

  return {
    theme,
    chapter: 1,
    momentum: 0.6,
    lastUpdated: Date.now(),
    breadcrumbs: [],
  };
}

export function evolvePersonalizedLesson({
  studentId,
  learningState,
  profile,
  interaction,
  baseResponse,
}: LessonEvolutionInput): LessonEvolutionResult | null {
  if (!learningState) {
    return null;
  }

  const safeProfile = profile ?? createFallbackProfile(learningState);
  const plan = buildPlan(learningState, safeProfile, interaction);
  const narrative = advanceNarrative(learningState.adaptiveNarrative, plan);
  const momentum = calculateMomentum(learningState, plan);

  const response = craftResponse({
    baseResponse,
    plan,
    narrative,
    profileSummary: learningState.profileSummary ?? summarizeProfile(safeProfile),
  });

  const actions = buildActions(plan);

  return {
    plan,
    response,
    actions,
    updates: {
      personalizedPlan: plan,
      adaptiveNarrative: narrative,
      momentumScore: momentum,
      profileSummary: learningState.profileSummary ?? summarizeProfile(safeProfile),
    },
  };
}

function synthesizeLessonIdea(
  state: LearningState,
  profile: EnhancedStudentProfile,
  interaction: any
): LessonIdeaBlueprint {
  const interactionText = typeof interaction?.content === 'string' ? interaction.content.trim() : '';
  const primaryObjective = state.currentObjectives?.find(obj => obj.priority === 'high') ?? state.currentObjectives?.[0];
  const knowledgeGap = state.knowledgeMap.knowledgeGaps?.[0];

  const rawIdea =
    interactionText ||
    knowledgeGap?.description ||
    knowledgeGap?.concept ||
    primaryObjective?.description ||
    'a fresh learning spark';

  const desiredOutcome = determineDesiredOutcome(rawIdea, knowledgeGap?.concept, primaryObjective?.title);
  const refinedTheme = refineIdeaTheme(rawIdea, desiredOutcome);
  const powerSkill = determinePowerSkill(profile, knowledgeGap?.concept);
  const narrativeLens = determineNarrativeLens(profile, state);

  return {
    rawIdea,
    refinedTheme,
    powerSkill,
    desiredOutcome,
    narrativeLens,
  };
}

function determineDesiredOutcome(rawIdea: string, gapConcept?: string, objectiveTitle?: string): string {
  const trimmedIdea = rawIdea?.trim();
  if (gapConcept) {
    return `${gapConcept} mastery`;
  }

  if (objectiveTitle) {
    return objectiveTitle;
  }

  if (trimmedIdea) {
    return trimmedIdea.length > 48 ? `${trimmedIdea.split(' ').slice(0, 6).join(' ')} mastery` : trimmedIdea;
  }

  return 'a new confidence boost';
}

function refineIdeaTheme(rawIdea: string, desiredOutcome: string): string {
  const sanitizedIdea = rawIdea?.trim() || 'your next idea';
  const sanitizedOutcome = desiredOutcome?.trim() || 'your next win';

  if (sanitizedIdea.toLowerCase().includes(sanitizedOutcome.toLowerCase())) {
    return capitalize(sanitizedIdea);
  }

  return `${capitalize(sanitizedIdea)} evolving into ${sanitizedOutcome}`;
}

function determinePowerSkill(profile: EnhancedStudentProfile, gapConcept?: string): string {
  const { cognitiveProfile } = profile;

  if (cognitiveProfile.metacognition > 0.75) return 'metacognitive superpower';
  if (cognitiveProfile.processingSpeed > 0.75) return 'rapid synthesis';
  if (cognitiveProfile.attentionControl > 0.7) return 'deep focus';

  if (gapConcept) {
    return `${gapConcept} confidence`;
  }

  return 'learning agility';
}

function determineNarrativeLens(profile: EnhancedStudentProfile, state: LearningState): string {
  if (profile.motivationFactors.intrinsicMotivation >= profile.motivationFactors.extrinsicMotivation) {
    return 'curiosity';
  }

  if (profile.motivationFactors.extrinsicMotivation > 0.65) {
    return 'achievement';
  }

  if ((state.momentumScore ?? 0.6) < 0.5) {
    return 'recovery';
  }

  return 'growth';
}

function buildDrivingQuestion(idea: LessonIdeaBlueprint, stages: ProgressionStage[]): string {
  const finalStage = stages[stages.length - 1];
  const successPhrase = finalStage
    ? finalStage.successCriteria.replace(/^[A-Z]/, c => c.toLowerCase())
    : `turn ${idea.rawIdea} into action`;

  return `How might we transform "${idea.rawIdea}" into ${idea.desiredOutcome} by ${successPhrase}?`;
}

function generateProgressionStages(
  state: LearningState,
  profile: EnhancedStudentProfile,
  idea: LessonIdeaBlueprint
): ProgressionStage[] {
  const baseStages: Array<{
    name: string;
    mission: string;
    experience: string;
    successCriteria: string;
    upgradeSignal: string;
    modalityHints: PlanActivity['type'][];
  }> = [
    {
      name: 'Ignite',
      mission: `Surface what you already know about ${idea.rawIdea} and why it matters to you`,
      experience: `A quick pulse to anchor ${idea.refinedTheme} in your world`,
      successCriteria: 'you can explain the core spark in your own words',
      upgradeSignal: 'you share a personal reason this matters',
      modalityHints: ['discussion', 'exploration', 'game'],
    },
    {
      name: 'Build',
      mission: `Practice the core moves that make ${idea.desiredOutcome} click`,
      experience: `Hands-on reps with feedback tuned to your ${idea.powerSkill}`,
      successCriteria: 'you demonstrate the new move with supportive feedback',
      upgradeSignal: 'confidence climbs and mistakes turn into strategies',
      modalityHints: ['practice', 'quiz', 'game'],
    },
    {
      name: 'Stretch',
      mission: `Apply ${idea.rawIdea} in a new context so it feels unforgettable`,
      experience: `Create or teach something that shows your evolving mastery`,
      successCriteria: 'you remix the idea into something original',
      upgradeSignal: 'you spot the next extension you want to chase',
      modalityHints: ['creative', 'discussion', 'lesson'],
    },
  ];

  if ((state.momentumScore ?? 0.6) > 0.75 || profile.motivationFactors.autonomyPreference > 0.65) {
    baseStages.push({
      name: 'Launch',
      mission: `Design your own remix of ${idea.desiredOutcome} and invite feedback`,
      experience: 'A co-created artifact, challenge, or micro-project you lead',
      successCriteria: 'you can describe the impact your remix could have',
      upgradeSignal: 'you propose the next quest or challenge to pursue',
      modalityHints: ['creative', 'exploration', 'discussion'],
    });
  }

  return baseStages.map(stage => ({
    id: uuidv4(),
    name: stage.name,
    mission: stage.mission,
    modality: selectStageModality(stage.modalityHints, profile),
    experience: stage.experience,
    successCriteria: stage.successCriteria,
    upgradeSignal: stage.upgradeSignal,
  }));
}

function selectStageModality(
  hints: PlanActivity['type'][],
  profile: EnhancedStudentProfile
): PlanActivity['type'] {
  const preferences = ensurePreferenceList(profile);
  const preferredModalities = preferences.map(preference => preference.activityType);

  for (const hint of hints) {
    if (preferredModalities.includes(hint)) {
      return hint;
    }
  }

  return hints[0] ?? preferredModalities[0] ?? 'exploration';
}

function ensurePreferenceList(profile: EnhancedStudentProfile) {
  if (profile.preferredActivityTypes && profile.preferredActivityTypes.length > 0) {
    return [...profile.preferredActivityTypes].sort((a, b) => b.preference - a.preference);
  }

  return [
    { activityType: 'discussion', preference: 0.65, effectiveness: 0.6, optimalDuration: 10 },
    { activityType: 'creative', preference: 0.6, effectiveness: 0.65, optimalDuration: 15 },
    { activityType: 'game', preference: 0.58, effectiveness: 0.55, optimalDuration: 10 },
    { activityType: 'quiz', preference: 0.55, effectiveness: 0.6, optimalDuration: 8 },
  ];
}

function buildPlan(
  state: LearningState,
  profile: EnhancedStudentProfile,
  interaction: any
): PersonalizedLessonPlan {
  const idea = synthesizeLessonIdea(state, profile, interaction);
  const focusArea = idea.desiredOutcome || idea.refinedTheme;

  const narrativeHook = selectNarrativeHook(profile, state, idea);
  const stages = generateProgressionStages(state, profile, idea);
  const activities = selectActivities(state, profile, focusArea, stages, idea);

  const adaptationHighlights = buildHighlights(state, profile, focusArea, idea, stages);
  const reflectionPrompt = buildReflectionPrompt(idea, stages, profile);
  const coCreationOpportunities = deriveCoCreationOpportunities(profile, idea, stages);

  return {
    id: uuidv4(),
    engineVersion: '1.1.0',
    focusArea,
    drivingQuestion: buildDrivingQuestion(idea, stages),
    narrativeHook,
    energyLevel: determineEnergyLevel(state, profile),
    evolutionReason: deriveEvolutionReason(state, interaction, idea),
    lessonIdea: idea,
    progressionStages: stages,
    recommendedActivities: activities,
    adaptationHighlights,
    celebrationMessage: craftCelebration(state, focusArea, stages),
    reflectionPrompt,
    coCreationOpportunities,
  };
}

function selectNarrativeHook(
  profile: EnhancedStudentProfile,
  state: LearningState,
  idea: LessonIdeaBlueprint
): string {
  if ((state.momentumScore ?? 0.6) > 0.8) {
    return `Momentum is soaring—Chapter ${state.adaptiveNarrative?.chapter ?? 1} unlocks a new ${idea.powerSkill} breakthrough!`;
  }

  if (idea.narrativeLens === 'curiosity') {
    return 'Your curiosity just opened a new quest—let’s chase the spark together!';
  }

  if (idea.narrativeLens === 'achievement') {
    return 'A new badge is within reach—this move levels up your highlight reel.';
  }

  if (profile.motivationFactors.collaborativePreference > 0.7) {
    return 'Team up with Sunny—this stage is a co-op mission tailor-made for your style!';
  }

  return 'We’re evolving your learning story in real time—here’s the next vivid step.';
}

function selectActivities(
  state: LearningState,
  profile: EnhancedStudentProfile,
  focusArea: string,
  stages: ProgressionStage[],
  idea: LessonIdeaBlueprint
): PlanActivity[] {
  const preferences = ensurePreferenceList(profile);
  const priorTypes = new Set(state.personalizedPlan?.recommendedActivities?.map(activity => activity.type));
  const usedTypes = new Set<string>();

  return stages.map((stage, index) => {
    let chosenType = stage.modality;
    if (priorTypes.has(chosenType) || usedTypes.has(chosenType)) {
      const alternate = preferences.find(pref => !priorTypes.has(pref.activityType) && !usedTypes.has(pref.activityType));
      if (alternate) {
        chosenType = alternate.activityType;
      }
    }

    usedTypes.add(chosenType);

    const preference = preferences.find(pref => pref.activityType === chosenType);
    const effectiveness = preference?.effectiveness ?? 0.65;
    const confidenceBase = effectiveness + (state.momentumScore ?? 0.6) * 0.15 + index * 0.05;

    return {
      id: uuidv4(),
      type: chosenType,
      title: buildActivityTitle(chosenType, focusArea, index, stage),
      description: describeActivity(chosenType, focusArea, profile, stage, idea),
      personalizationReason: buildPersonalizationReason(stage, idea, preference),
      expectedOutcome: expectationFor(chosenType, focusArea, stage),
      confidence: Math.min(1, confidenceBase),
      pacing: determinePacing(chosenType, state, stage),
      stageId: stage.id,
      stageName: stage.name,
    };
  });
}

function buildHighlights(
  state: LearningState,
  profile: EnhancedStudentProfile,
  focusArea: string,
  idea: LessonIdeaBlueprint,
  stages: ProgressionStage[]
): string[] {
  const highlights: string[] = [];

  const igniteStage = stages[0];
  if (igniteStage) {
    highlights.push(`Igniting with ${igniteStage.modality} so you can ${igniteStage.mission.toLowerCase()}.`);
  }

  if (state.recentAchievements && state.recentAchievements.length > 0) {
    highlights.push(`Celebrating your recent win: ${state.recentAchievements[0]} and folding that energy into ${idea.refinedTheme}.`);
  }

  if (state.knowledgeMap.knowledgeGaps?.length) {
    highlights.push(`Transforming the "${focusArea}" gap into a ${idea.powerSkill} showcase.`);
  }

  if (profile.motivationFactors.autonomyPreference > 0.6 && stages.length > 2) {
    highlights.push(`Stage ${stages[stages.length - 1].name} gives you creative control over how the lesson evolves.`);
  }

  if ((state.engagementMetrics.currentLevel || 0.5) < 0.5) {
    highlights.push('Injecting bursts of play and creativity to recharge your momentum.');
  }

  return Array.from(new Set(highlights)).slice(0, 4);
}

function determineEnergyLevel(state: LearningState, profile: EnhancedStudentProfile): PersonalizedLessonPlan['energyLevel'] {
  const engagement = state.engagementMetrics.currentLevel;

  if (engagement > 0.75) return 'energized';
  if (engagement < 0.45 && profile.motivationFactors.intrinsicMotivation < 0.5) return 'playful';
  return 'calm';
}

function deriveEvolutionReason(
  state: LearningState,
  interaction: any,
  idea: LessonIdeaBlueprint
): string {
  if (interaction?.type === 'message' && typeof interaction.content === 'string') {
    return `Responding to your idea: "${interaction.content}" and amplifying it into a full journey.`;
  }

  if (state.knowledgeMap.knowledgeGaps?.length) {
    return `Upgrading the ${idea.desiredOutcome} gap into a personalized quest.`;
  }

  return 'Keeping the momentum flowing with adaptive next steps.';
}

function craftCelebration(
  state: LearningState,
  focusArea: string,
  stages: ProgressionStage[]
): string {
  if (state.momentumScore && state.momentumScore > 0.75) {
    return `🔥 Momentum unlocked! ${stages[0]?.name ?? 'Stage 1'} lit the fuse for your ${focusArea} mastery.`;
  }

  const finale = stages[stages.length - 1];
  return finale
    ? `🌟 ${finale.name} turns ${focusArea} into your next highlight reel.`
    : `🌟 We’re turning ${focusArea} into your next highlight reel.`;
}

function buildPersonalizationReason(
  stage: ProgressionStage,
  idea: LessonIdeaBlueprint,
  preference?: { activityType: PlanActivity['type']; preference: number }
): string {
  const affinity = preference ? `${Math.round(preference.preference * 100)}%` : 'a strong';
  return `Stage "${stage.name}" focuses on ${idea.powerSkill}; this modality aligns with your ${affinity} match.`;
}

function buildReflectionPrompt(
  idea: LessonIdeaBlueprint,
  stages: ProgressionStage[],
  profile: EnhancedStudentProfile
): string {
  const finale = stages[stages.length - 1];
  const tone = profile.motivationFactors.intrinsicMotivation > 0.6 ? 'story' : 'score';
  return finale
    ? `After ${finale.name}, capture a quick ${tone}: How did your ${idea.powerSkill} grow and what’s the next remix?`
    : `Capture how your ${idea.powerSkill} evolved and what you want to try next.`;
}

function deriveCoCreationOpportunities(
  profile: EnhancedStudentProfile,
  idea: LessonIdeaBlueprint,
  stages: ProgressionStage[]
): string[] {
  const opportunities: string[] = [];

  if (profile.motivationFactors.autonomyPreference > 0.55) {
    opportunities.push('Choose the artifact or story you want to create for the final stage.');
  }

  if (profile.motivationFactors.collaborativePreference > 0.6) {
    opportunities.push('Invite a peer or mentor to react to your Stretch or Launch stage output.');
  }

  if (profile.motivationFactors.intrinsicMotivation > profile.motivationFactors.extrinsicMotivation) {
    opportunities.push(`Pitch a curiosity question that could become the next ${idea.powerSkill} quest.`);
  }

  opportunities.push(`Tell Sunny how ${idea.rawIdea} connects to your world so the engine can evolve the next chapter.`);

  return Array.from(new Set(opportunities)).slice(0, 3);
}

function buildActivityTitle(
  type: PlanActivity['type'],
  focusArea: string,
  index: number,
  stage: ProgressionStage
): string {
  const label = focusArea.length > 40 ? focusArea.split(' ')[0] : focusArea;

  switch (type) {
    case 'game':
      return `${capitalize(label)} Power-Up (${stage.name})`;
    case 'quiz':
      return `${capitalize(label)} Lightning Check`; 
    case 'creative':
      return `${capitalize(label)} Story Forge (${stage.name})`;
    case 'discussion':
      return `${capitalize(label)} Hot Take Circle`;
    case 'practice':
      return `${capitalize(label)} Skill Lab`;
    case 'exploration':
      return `${capitalize(label)} Curiosity Trail`;
    default:
      return `${capitalize(label)} Boost ${index + 1}`;
  }
}

function describeActivity(
  type: PlanActivity['type'],
  focusArea: string,
  _profile: EnhancedStudentProfile,
  stage: ProgressionStage,
  idea: LessonIdeaBlueprint
): string {
  switch (type) {
    case 'game':
      return `A fast-paced mission to test-drive ${focusArea} while keeping energy high during ${stage.name}.`;
    case 'quiz':
      return `A smart checkpoint that checks your ${focusArea} instincts with instant feedback before ${stage.upgradeSignal}.`;
    case 'creative':
      return `Design something bold that shows how ${focusArea} fits into your world—perfect for ${stage.experience.toLowerCase()}.`;
    case 'discussion':
      return `Talk it out loud—teaching back ${focusArea} with your voice activates ${idea.powerSkill}.`;
    case 'exploration':
      return `Follow a curiosity trail around ${focusArea} and collect insights to fuel the next stage.`;
    case 'practice':
      return `Hands-on reps with coaching that adapts to your ${idea.powerSkill} strengths.`;
    default:
      return `A bespoke move to evolve ${focusArea} exactly how you like to learn.`;
  }
}

function expectationFor(
  type: PlanActivity['type'],
  focusArea: string,
  stage: ProgressionStage
): string {
  switch (type) {
    case 'quiz':
      return `Prove your growing mastery of ${focusArea} so you’re ready for ${stage.name}.`;
    case 'game':
      return `Boost energy while leveling up your ${focusArea} instincts during ${stage.name}.`;
    case 'discussion':
      return `Share your take on ${focusArea} and capture insights for ${stage.upgradeSignal}.`;
    case 'creative':
      return `Show what ${focusArea} looks like in your world with a creative twist.`;
    case 'practice':
      return `Build automaticity with ${focusArea} through deliberate reps.`;
    default:
      return `Grow your ${focusArea} skills in a way that feels natural.`;
  }
}

function determinePacing(
  type: PlanActivity['type'],
  state: LearningState,
  stage: ProgressionStage
): PlanActivity['pacing'] {
  if (type === 'quiz' || type === 'game') {
    return stage.name === 'Ignite' ? 'quick-win' : 'deep-dive';
  }

  if (type === 'discussion' || type === 'creative') {
    return stage.name === 'Stretch' || stage.name === 'Launch' ? 'reflection' : 'quick-win';
  }

  return state.learningPath.length > 3 ? 'deep-dive' : 'quick-win';
}

function advanceNarrative(
  narrative: AdaptiveNarrativeState | undefined,
  plan: PersonalizedLessonPlan
): AdaptiveNarrativeState {
  const updatedNarrative: AdaptiveNarrativeState = narrative
    ? { ...narrative }
    : {
        theme: 'Curiosity Quest',
        chapter: 1,
        momentum: 0.6,
        lastUpdated: Date.now(),
        breadcrumbs: [],
      };

  updatedNarrative.chapter += 1;
  updatedNarrative.momentum = Math.min(1, updatedNarrative.momentum + 0.08);
  updatedNarrative.lastUpdated = Date.now();
  const nextStage = plan.progressionStages[0];
  updatedNarrative.breadcrumbs = [
    {
      id: plan.id,
      summary: nextStage
        ? `Shifted focus to ${plan.focusArea} with stage ${nextStage.name} (${nextStage.modality}).`
        : `Shifted focus to ${plan.focusArea} with ${plan.recommendedActivities[0]?.type || 'a custom activity'}.`,
      timestamp: Date.now(),
      impact: plan.energyLevel === 'energized' ? 'confidence' : 'curiosity',
    },
    ...(updatedNarrative.breadcrumbs || []),
  ].slice(0, 8);

  return updatedNarrative;
}

function calculateMomentum(state: LearningState, plan: PersonalizedLessonPlan): number {
  const base = state.momentumScore ?? 0.55;
  const engagementBoost = (state.engagementMetrics.currentLevel - 0.5) * 0.3;
  const noveltyBoost = plan.recommendedActivities.filter(activity =>
    !state.personalizedPlan?.recommendedActivities?.some(prev => prev.type === activity.type)
  ).length * 0.05;
  const stageBoost = plan.progressionStages.length > 3 ? 0.05 : 0.02;
  const ideaBoost = plan.lessonIdea.narrativeLens === 'curiosity' ? 0.03 : 0.01;

  return Math.min(1, Math.max(0, base + engagementBoost + noveltyBoost + stageBoost + ideaBoost));
}

function craftResponse({
  baseResponse,
  plan,
  narrative,
  profileSummary,
}: {
  baseResponse?: string;
  plan: PersonalizedLessonPlan;
  narrative: AdaptiveNarrativeState;
  profileSummary: ProfileSummary;
}): string {
  const intro = baseResponse && baseResponse.trim().length > 0 ? baseResponse : 'Got it!';

  const narrativeLine = `${narrative.theme} · Chapter ${narrative.chapter}`;
  const ideaLine = `Idea Engine → **${plan.lessonIdea.refinedTheme}** powering your ${plan.lessonIdea.powerSkill}.`;
  const focusLine = `Next focus: **${plan.focusArea}** — ${plan.drivingQuestion}`;
  const progressionLine = plan.progressionStages
    .map(stage => `• ${stage.name}: ${stage.mission}`)
    .slice(0, 3)
    .join('\n');
  const activityLine = `Activities ignite ${plan.recommendedActivities
    .slice(0, 2)
    .map(activity => `${activity.title}`)
    .join(' → ')} to lean on your ${profileSummary.coreStrengths[0] || 'unique style'}.`;
  const reflectionLine = `Reflection prompt: ${plan.reflectionPrompt}`;
  const coCreateLine = plan.coCreationOpportunities.length
    ? `Co-create: ${plan.coCreationOpportunities[0]}`
    : '';
  const celebration = plan.celebrationMessage;

  return [intro, narrativeLine, plan.narrativeHook, ideaLine, focusLine, progressionLine, activityLine, reflectionLine, coCreateLine, celebration]
    .filter(Boolean)
    .join('\n\n');
}

function buildActions(plan: PersonalizedLessonPlan): string[] {
  const activityActions = plan.recommendedActivities.map(activity => `suggest-activity:${activity.type}:${activity.id}`);
  const stageActions = plan.progressionStages.map(stage => `lesson_stage:${stage.id}:${stage.name}`);
  const reflectionAction = plan.reflectionPrompt ? [`prompt-reflection:${plan.id}`] : [];
  return ['personalized_plan_updated', `focus:${plan.focusArea}`, ...stageActions, ...activityActions, ...reflectionAction];
}

function capitalize(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createFallbackProfile(state: LearningState): EnhancedStudentProfile {
  return {
    name: state.studentId,
    level: 1,
    points: 0,
    completedLessons: [],
    cognitiveProfile: {
      processingSpeed: 0.6,
      workingMemoryCapacity: 0.6,
      attentionControl: 0.5,
      metacognition: 0.5,
    },
    motivationFactors: {
      intrinsicMotivation: 0.6,
      extrinsicMotivation: 0.6,
      competitiveSpirit: 0.5,
      collaborativePreference: 0.5,
      autonomyPreference: 0.5,
    },
    learningVelocity: {
      conceptAcquisitionRate: 1.4,
      skillDevelopmentRate: 1.2,
      retentionRate: 0.7,
      transferRate: 0.6,
    },
    responsePatterns: [],
    engagementPatterns: [],
    preferredActivityTypes: [
      { activityType: 'discussion', preference: 0.62, effectiveness: 0.6, optimalDuration: 10 },
      { activityType: 'creative', preference: 0.6, effectiveness: 0.65, optimalDuration: 15 },
      { activityType: 'game', preference: 0.58, effectiveness: 0.55, optimalDuration: 10 },
      { activityType: 'quiz', preference: 0.55, effectiveness: 0.58, optimalDuration: 8 },
    ],
    optimalLearningTimes: [],
    attentionSpanData: {
      averageSpan: 15,
      peakSpan: 20,
      declinePattern: [1, 0.9, 0.8],
      recoveryTime: 5,
    },
    sessionHistory: [],
    progressTimeline: [],
    interventionHistory: [],
  } as EnhancedStudentProfile;
}
