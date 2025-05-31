import { getLessonPlanById, sampleLessonPlans, LessonPlan } from './lesson-plans';

// Mock console methods to avoid cluttering test output and to verify calls
let mockConsoleError: jest.SpyInstance;
let mockConsoleWarn: jest.SpyInstance;

// Mock localStorage
let mockLocalStorageGetItem: jest.SpyInstance;

// Helper to create a valid LessonPlan object with minimal fields for testing
const createMockLessonPlan = (id: string, title: string, category: string = 'test'): LessonPlan => ({
  id,
  title,
  category,
  gradeLevel: ['K-2'],
  author: { name: 'Test Author' },
  isPublic: false,
  dateCreated: new Date().toISOString(),
  dateModified: new Date().toISOString(),
  content: {
    id: `${id}-content`,
    title: `${title} Content`,
    description: 'Test description',
    keywords: ['test'],
    learningOutcomes: ['outcome1'],
    activities: [],
    relatedTopics: [],
  },
  tags: ['test-tag'],
});

describe('getLessonPlanById', () => {
  beforeEach(() => {
    // Spy on localStorage.getItem before each test
    // Note: In a real Jest environment, you might set up jsdom and use `window.localStorage`
    // For this environment, we directly mock Storage.prototype.
    // This also assumes 'typeof window !== "undefined"' will be true in the test context,
    // or the localStorage part of getLessonPlanById won't run.
    // For functions running in Node.js without DOM, 'window' would be undefined.
    // However, getLessonPlanById has a 'typeof window !== "undefined"' check.
    // We'll assume a testing environment where 'window' is defined (like with Jest's jsdom).
    mockLocalStorageGetItem = jest.spyOn(Storage.prototype, 'getItem');
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore the original implementations after each test
    mockLocalStorageGetItem.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  test('should return a lesson plan from sampleLessonPlans if ID matches', () => {
    const existingSampleId = sampleLessonPlans[0].id;
    const result = getLessonPlanById(existingSampleId);
    expect(result).toEqual(sampleLessonPlans[0]);
    expect(mockLocalStorageGetItem).not.toHaveBeenCalled();
  });

  test('should return a lesson plan from localStorage if not in samples and found in localStorage', () => {
    const localPlan = createMockLessonPlan('local123', 'Local Plan One');
    mockLocalStorageGetItem.mockReturnValueOnce(JSON.stringify([localPlan]));

    const result = getLessonPlanById('local123');
    expect(result).toEqual(localPlan);
    expect(mockLocalStorageGetItem).toHaveBeenCalledWith('sunnyLessonPlans');
  });

  test('should return undefined if not in samples and localStorage is empty', () => {
    mockLocalStorageGetItem.mockReturnValueOnce(JSON.stringify([]));
    const result = getLessonPlanById('nonExistentId1');
    expect(result).toBeUndefined();
    expect(mockLocalStorageGetItem).toHaveBeenCalledWith('sunnyLessonPlans');
  });

  test('should return undefined if not in samples and localStorage key does not exist', () => {
    mockLocalStorageGetItem.mockReturnValueOnce(null);
    const result = getLessonPlanById('nonExistentId2');
    expect(result).toBeUndefined();
    expect(mockLocalStorageGetItem).toHaveBeenCalledWith('sunnyLessonPlans');
  });

  test('should return undefined if plan ID is not in samples nor in localStorage', () => {
    const localPlan = createMockLessonPlan('local-other', 'Another Local Plan');
    mockLocalStorageGetItem.mockReturnValueOnce(JSON.stringify([localPlan]));
    const result = getLessonPlanById('completelyNonExistent');
    expect(result).toBeUndefined();
  });

  test('should return plan from sampleLessonPlans even if localStorage throws an error', () => {
    mockLocalStorageGetItem.mockImplementationOnce(() => {
      throw new Error('LocalStorage Read Error');
    });
    const existingSampleId = sampleLessonPlans[0].id;
    // To test this properly, we need an ID that's ONLY in samples, and then one that's not.
    // The current function design checks samples first. If found, it returns and never tries localStorage.
    // So, if the plan is in samples, localStorage error is irrelevant.
    expect(getLessonPlanById(existingSampleId)).toEqual(sampleLessonPlans[0]);
    expect(mockConsoleError).not.toHaveBeenCalled(); // Error is not from getLessonPlanById's try-catch

    // Test for a non-sample ID when localStorage throws error
    const nonSampleId = 'nonSampleErrorCase';
    const result = getLessonPlanById(nonSampleId);
    expect(result).toBeUndefined();
    expect(mockLocalStorageGetItem).toHaveBeenCalledWith('sunnyLessonPlans');
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Error reading or parsing lesson plans from localStorage:",
      expect.any(Error)
    );
  });

  test('should return plan from sampleLessonPlans if localStorage data is malformed JSON', () => {
    mockLocalStorageGetItem.mockReturnValueOnce('this is not json');
     // Test for a non-sample ID when localStorage is malformed
    const nonSampleId = 'nonSampleMalformedCase';
    const result = getLessonPlanById(nonSampleId);
    expect(result).toBeUndefined();
    expect(mockLocalStorageGetItem).toHaveBeenCalledWith('sunnyLessonPlans');
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Error reading or parsing lesson plans from localStorage:",
      expect.any(SyntaxError) // or Error, depending on what JSON.parse throws
    );
  });

  test('should return plan from sampleLessonPlans if localStorage data is not an array', () => {
    mockLocalStorageGetItem.mockReturnValueOnce(JSON.stringify({ not: "an array" }));
    const nonSampleId = 'nonSampleNotArrayCase';
    const result = getLessonPlanById(nonSampleId);
    expect(result).toBeUndefined();
    expect(mockLocalStorageGetItem).toHaveBeenCalledWith('sunnyLessonPlans');
    expect(mockConsoleWarn).toHaveBeenCalledWith("Stored 'sunnyLessonPlans' is not an array.");
  });

  test('should return sample plan if ID exists in both sample and localStorage (samples take precedence)', () => {
    const conflictingId = sampleLessonPlans[0].id;
    const localVersionPlan = createMockLessonPlan(conflictingId, 'Local Version of Sample Plan');
    mockLocalStorageGetItem.mockReturnValueOnce(JSON.stringify([localVersionPlan]));

    const result = getLessonPlanById(conflictingId);
    expect(result).toEqual(sampleLessonPlans[0]); // Expect the sample version
    expect(result?.title).not.toBe(localVersionPlan.title); // Ensure it's not the local version
    expect(mockLocalStorageGetItem).not.toHaveBeenCalled(); // Because it was found in samples first
  });

  test('should return undefined for an undefined ID input', () => {
    const result = getLessonPlanById(undefined as any); // Cast to any to test invalid input
    expect(result).toBeUndefined();
     // It might not call localStorage if the initial check for ID fails or sample search is empty.
     // Depending on implementation, it might still try to find `undefined` in samples.
     // sampleLessonPlans.find(plan => plan.id === undefined) would run.
  });
});

// Note: To run these tests, you'd typically use Jest.
// You would need to have Jest installed and configured in your project.
// For example, you might run `npx jest` or `npm test`.
// The `jest.spyOn` and `expect` syntax are specific to Jest (or compatible test runners like Vitest).
// The global `describe`, `test`, `beforeEach`, `afterEach` are also Jest globals.
// The `Storage.prototype` mocking is a way to mock `localStorage` which is part of the `window` object.
// In a Node.js environment for testing (like Jest default), `window` and `localStorage` are not available
// unless you set up a DOM environment (e.g., using `jsdom`).
// `getLessonPlanById` includes a `typeof window !== 'undefined'` check, so the localStorage logic
// would only run if `window` is defined in the testing environment.
// If `window` is undefined, it would behave as if localStorage is always unavailable.
// For these tests to fully pass as written, a JSDOM environment for Jest is assumed.
// If testing in pure Node without JSDOM, tests involving localStorage would see it as unavailable.
// `jest.spyOn(Storage.prototype, 'getItem')` might need adjustment if `Storage` is not defined.
// A common way is `global.localStorage = { getItem: jest.fn(), ... };` after setting up JSDOM or similar.
// However, `Storage.prototype` is often used for more robust mocking if `window.localStorage` exists.
