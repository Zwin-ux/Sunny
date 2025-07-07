import { Lesson, ContentType } from '../../types/lesson';
import beeLesson from './bees';
import LessonLoader from './LessonLoader';
import path from 'path';

/**
 * LessonRepository is a singleton that manages all lessons
 */
class LessonRepository {
  private lessons: Map<string, Lesson> = new Map();
  private topicIndex: Map<string, Set<string>> = new Map(); // Maps topics to lesson IDs
  private keywordIndex: Map<string, Set<string>> = new Map(); // Maps keywords to lesson IDs
  private difficultyIndex: Map<string, Set<string>> = new Map(); // Maps difficulty levels to lesson IDs
  private contentTypeIndex: Map<string, Map<string, string[]>> = new Map(); // Maps content types to lesson IDs and content IDs
  private static instance: LessonRepository;

  private constructor() {
    this.initializeLessons();
  }

  public static getInstance(): LessonRepository {
    if (!LessonRepository.instance) {
      LessonRepository.instance = new LessonRepository();
    }
    return LessonRepository.instance;
  }

  private initializeLessons(): void {
    // Initialize with default lessons
    this.addLesson(beeLesson);
  }

  /**
   * Load lessons from a directory containing Markdown and JSON files
   * @param directoryPath Path to directory containing lesson files
   */
  public loadLessonsFromDirectory(directoryPath: string): void {
    try {
      const lessons = LessonLoader.loadLessonsFromDirectory(directoryPath);
      lessons.forEach(lesson => this.addLesson(lesson));
      console.log(`Loaded ${lessons.length} lessons from ${directoryPath}`);
    } catch (error) {
      console.error(`Error loading lessons from directory ${directoryPath}:`, error);
    }
  }

  /**
   * Load a single lesson from a Markdown file
   * @param filePath Path to Markdown file
   */
  public loadMarkdownLesson(filePath: string): void {
    try {
      const lesson = LessonLoader.loadMarkdownLesson(filePath);
      this.addLesson(lesson);
      console.log(`Loaded lesson ${lesson.id} from ${filePath}`);
    } catch (error) {
      console.error(`Error loading markdown lesson from ${filePath}:`, error);
    }
  }

  /**
   * Load a single lesson from a JSON file
   * @param filePath Path to JSON file
   */
  public loadJsonLesson(filePath: string): void {
    try {
      const lesson = LessonLoader.loadJsonLesson(filePath);
      this.addLesson(lesson);
      console.log(`Loaded lesson ${lesson.id} from ${filePath}`);
    } catch (error) {
      console.error(`Error loading JSON lesson from ${filePath}:`, error);
    }
  }

  public addLesson(lesson: Lesson): void {
    this.lessons.set(lesson.id, lesson);
    
    // Index the lesson by topics
    lesson.topics.forEach(topic => {
      const normalizedTopic = topic.toLowerCase();
      if (!this.topicIndex.has(normalizedTopic)) {
        this.topicIndex.set(normalizedTopic, new Set());
      }
      this.topicIndex.get(normalizedTopic)?.add(lesson.id);
    });
    
    // Index the lesson by keywords
    lesson.keywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      if (!this.keywordIndex.has(normalizedKeyword)) {
        this.keywordIndex.set(normalizedKeyword, new Set());
      }
      this.keywordIndex.get(normalizedKeyword)?.add(lesson.id);
    });
    
    // Index the lesson by difficulty
    const difficulty = lesson.difficulty;
    if (!this.difficultyIndex.has(difficulty)) {
      this.difficultyIndex.set(difficulty, new Set());
    }
    this.difficultyIndex.get(difficulty)?.add(lesson.id);
    
    // Index the lesson content by content type
    lesson.content.forEach(content => {
      if (!this.contentTypeIndex.has(content.type)) {
        this.contentTypeIndex.set(content.type, new Map());
      }
      const contentTypeMap = this.contentTypeIndex.get(content.type);
      if (!contentTypeMap?.has(lesson.id)) {
        contentTypeMap?.set(lesson.id, []);
      }
      contentTypeMap?.get(lesson.id)?.push(content.id);
    });
  }

  public getLesson(id: string): Lesson | undefined {
    return this.lessons.get(id);
  }

  public getAllLessons(): Lesson[] {
    return Array.from(this.lessons.values());
  }

  public findLessonsByTopic(topic: string): Lesson[] {
    const normalizedTopic = topic.toLowerCase();
    
    // First, try exact match using our index
    const exactMatches = new Set<string>();
    
    // Check topic index for exact matches
    this.topicIndex.forEach((lessonIds, indexedTopic) => {
      if (indexedTopic === normalizedTopic) {
        lessonIds.forEach(id => exactMatches.add(id));
      }
    });
    
    // Check keyword index for exact matches
    this.keywordIndex.forEach((lessonIds, indexedKeyword) => {
      if (indexedKeyword === normalizedTopic) {
        lessonIds.forEach(id => exactMatches.add(id));
      }
    });
    
    // If we have exact matches, return those lessons
    if (exactMatches.size > 0) {
      return Array.from(exactMatches)
        .map(id => this.lessons.get(id))
        .filter((lesson): lesson is Lesson => lesson !== undefined);
    }
    
    // Otherwise, fall back to partial matching
    return this.getAllLessons().filter(lesson => 
      lesson.title.toLowerCase().includes(normalizedTopic) ||
      lesson.topics.some(t => t.toLowerCase().includes(normalizedTopic)) ||
      lesson.keywords.some(k => k.toLowerCase().includes(normalizedTopic))
    );
  }

  public findLessonsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Lesson[] {
    // Use the difficulty index for faster lookup
    const lessonIds = this.difficultyIndex.get(difficulty);
    if (!lessonIds) return [];
    
    return Array.from(lessonIds)
      .map(id => this.lessons.get(id))
      .filter((lesson): lesson is Lesson => lesson !== undefined);
  }

  public searchLessons(query: string): Lesson[] {
    const normalizedQuery = query.toLowerCase();
    const matchedLessonIds = new Set<string>();
    
    // Check topic index
    this.topicIndex.forEach((lessonIds, topic) => {
      if (topic.includes(normalizedQuery)) {
        lessonIds.forEach(id => matchedLessonIds.add(id));
      }
    });
    
    // Check keyword index
    this.keywordIndex.forEach((lessonIds, keyword) => {
      if (keyword.includes(normalizedQuery)) {
        lessonIds.forEach(id => matchedLessonIds.add(id));
      }
    });
    
    // If we found matches in our indexes, use those
    if (matchedLessonIds.size > 0) {
      const indexMatches = Array.from(matchedLessonIds)
        .map(id => this.lessons.get(id))
        .filter((lesson): lesson is Lesson => lesson !== undefined);
      
      // Sort by relevance (exact title match first, then topic match, then keyword match)
      return indexMatches.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(normalizedQuery) ? 1 : 0;
        const bTitle = b.title.toLowerCase().includes(normalizedQuery) ? 1 : 0;
        return bTitle - aTitle;
      });
    }
    
    // Fall back to full search if no index matches
    return this.getAllLessons().filter(lesson => 
      lesson.title.toLowerCase().includes(normalizedQuery) ||
      lesson.description.toLowerCase().includes(normalizedQuery) ||
      lesson.topics.some(topic => topic.toLowerCase().includes(normalizedQuery)) ||
      lesson.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery)) ||
      lesson.learningObjectives.some(obj => obj.toLowerCase().includes(normalizedQuery))
    );
  }

  public getLessonContent(lessonId: string, contentId: string) {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;
    
    return lesson.content.find(item => item.id === contentId) || null;
  }

  public getNextContent(lessonId: string, currentContentId: string) {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;
    
    const currentIndex = lesson.content.findIndex(item => item.id === currentContentId);
    if (currentIndex === -1 || currentIndex >= lesson.content.length - 1) {
      return null; // No next content
    }
    
    return lesson.content[currentIndex + 1];
  }

  public getPreviousContent(lessonId: string, currentContentId: string) {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;
    
    const currentIndex = lesson.content.findIndex(item => item.id === currentContentId);
    if (currentIndex <= 0) {
      return null; // No previous content
    }
    
    return lesson.content[currentIndex - 1];
  }
  
  // Find lessons that have specific content types
  public findLessonsByContentType(contentType: string): Lesson[] {
    const contentTypeMap = this.contentTypeIndex.get(contentType);
    if (!contentTypeMap) return [];
    
    return Array.from(contentTypeMap.keys())
      .map(id => this.lessons.get(id))
      .filter((lesson): lesson is Lesson => lesson !== undefined);
  }
  
  // Get content items of a specific type from a lesson
  public getLessonContentByType(lessonId: string, contentType: string): any[] {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return [];
    
    return lesson.content.filter(item => item.type === contentType);
  }
  
  // Find the most relevant lesson for a given topic and difficulty
  public findBestLessonMatch(topic: string, difficulty?: 'beginner' | 'intermediate' | 'advanced'): Lesson | null {
    const topicMatches = this.findLessonsByTopic(topic);
    
    if (topicMatches.length === 0) return null;
    
    // If difficulty is specified, filter by difficulty
    if (difficulty) {
      const difficultyMatches = topicMatches.filter(lesson => lesson.difficulty === difficulty);
      if (difficultyMatches.length > 0) {
        return difficultyMatches[0];
      }
    }
    
    // Otherwise return the first match
    return topicMatches[0];
  }
  
  // Get available topics for suggestions
  public getAvailableTopics(): string[] {
    const topics = new Set<string>();
    this.getAllLessons().forEach(lesson => {
      lesson.topics.forEach(topic => topics.add(topic));
    });
    return Array.from(topics);
  }
}



export default LessonRepository.getInstance();
