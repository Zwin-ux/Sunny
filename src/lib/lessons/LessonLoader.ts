// import path from 'path';
import matter from 'gray-matter';

// Import fs and path only on server side
const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;
import { Lesson, MarkdownContent, LessonContent, ContentType } from '../../types/lesson';

/**
 * LessonLoader provides utilities for loading lessons from Markdown and JSON files
 */
export class LessonLoader {
  /**
   * Provides a fallback lesson when running in a browser environment
   * @param filePath Path that was attempted to be loaded
   * @returns A minimal default lesson
   */
  public static getFallbackLesson(filePath: string): Lesson {
    const filename = path.basename(filePath, path.extname(filePath));
    return {
      id: filename,
      title: 'Browser Fallback Lesson',
      description: 'This is a fallback lesson displayed when running in browser environment.',
      topics: ['example'],
      difficulty: 'beginner',
      targetAgeRange: { min: 6, max: 12 },
      learningObjectives: ['Understand client/server rendering'],
      keywords: ['example', 'fallback'],
      content: [
        {
          id: 'fallback-content-1',
          type: ContentType.Text,
          title: 'Fallback Content',
          content: 'This content is a fallback for browser rendering.',
          difficulty: 'beginner',
          estimatedDuration: 5
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  /**
   * Load a lesson from a Markdown file with frontmatter
   * @param filePath Path to the markdown file
   * @returns Parsed Lesson object
   */
  public static loadMarkdownLesson(filePath: string): Lesson {
    try {
      // Check if we're in a server environment
      if (!fs) {
        console.warn('Attempted to load lesson file in browser environment');
        return this.getFallbackLesson(filePath);
      }
      
      // Read the file content (server-side only)
      const fileContent = this.readFileContent(filePath);
      console.log(`File content for ${filePath}:`, fileContent.substring(0, 100) + '...'); // Log first 100 chars
      if (!fileContent) {
        console.error(`fs.readFileSync returned undefined for file: ${filePath}`);
        throw new Error(`Failed to read file ${filePath}`);
      }
      
      // Parse frontmatter and content
      const { data: frontmatter, content } = matter(fileContent);
      
      // Extract lesson metadata from frontmatter
      const lesson: Lesson = {
        id: frontmatter.id || path.basename(filePath, path.extname(filePath)),
        title: frontmatter.title || 'Untitled Lesson',
        description: frontmatter.description || '',
        topics: frontmatter.topics || [],
        difficulty: frontmatter.difficulty || 'beginner',
        targetAgeRange: frontmatter.targetAgeRange || { min: 6, max: 12 },
        learningObjectives: frontmatter.learningObjectives || [],
        keywords: frontmatter.keywords || [],
        content: this.parseMarkdownContent(content, frontmatter),
        createdAt: frontmatter.createdAt || new Date().toISOString(),
        updatedAt: frontmatter.updatedAt || new Date().toISOString()
      };
      
      return lesson;
    } catch (error) {
      console.error(`Error loading markdown lesson from ${filePath}:`, error);
      throw new Error(`Failed to load lesson from ${filePath}`);
    }
  }
  
  /**
   * Load a lesson from a JSON file
   * @param filePath Path to the JSON file
   * @returns Parsed Lesson object
   */
  public static loadJsonLesson(filePath: string): Lesson {
    try {
      // Check if we're in a server environment
      if (!fs) {
        console.warn('Attempted to load JSON lesson file in browser environment');
        return this.getFallbackLesson(filePath);
      }

      // Read and parse the JSON file (server-side only)
      const fileContent = this.readFileContent(filePath);
      console.log(`File content for ${filePath}:`, fileContent.substring(0, 100) + '...'); // Log first 100 chars
      if (!fileContent) {
        console.error(`fs.readFileSync returned undefined for file: ${filePath}`);
        throw new Error(`Failed to read file ${filePath}`);
      }
      const lessonData = JSON.parse(fileContent);
      
      // Validate required fields
      if (!lessonData.id || !lessonData.title) {
        throw new Error('Lesson JSON must include at least id and title fields');
      }
      
      // Process any markdown content within the JSON
      if (lessonData.content) {
        lessonData.content = lessonData.content.map((item: any) => {
          if (item.type === 'markdown' && typeof item.content === 'string') {
            // Convert string content to MarkdownContent object
            return {
              ...item,
              content: {
                source: item.content,
                isPath: false
              }
            };
          }
          return item;
        });
      }
      
      return lessonData as Lesson;
    } catch (error) {
      console.error(`Error loading JSON lesson from ${filePath}:`, error);
      throw new Error(`Failed to load lesson from ${filePath}`);
    }
  }
  
  /**
   * Parse markdown content into lesson content sections
   * @param markdown Raw markdown content
   * @param frontmatter Frontmatter metadata
   * @returns Array of LessonContent items
   */
  private static parseMarkdownContent(markdown: string, frontmatter: any): LessonContent[] {
    const content: LessonContent[] = [];
    
    // Split markdown by section headers (## headers)
    const sections = markdown.split(/^## /gm);
    
    // Process each section
    sections.forEach((section, index) => {
      if (!section.trim()) return;
      
      // For the first section (intro), it might not have a header
      const title = index === 0 && !section.startsWith('#') 
        ? 'Introduction' 
        : section.split('\n')[0].replace(/^#+\s+/, '').trim();
      
      const sectionContent = index === 0 && !section.startsWith('#')
        ? section
        : section.split('\n').slice(1).join('\n');
      
      // Create a content item for this section
      const contentItem: LessonContent = {
        id: `section-${index}`,
        type: ContentType.Text,
        title,
        content: {
          source: sectionContent.trim(),
          isPath: false,
          frontmatter: {
            section: index,
            // Include any section-specific metadata from frontmatter if available
            ...(frontmatter.sections && frontmatter.sections[index] ? frontmatter.sections[index] : {})
          }
        },
        difficulty: (frontmatter.sections && frontmatter.sections[index]?.difficulty) || frontmatter.difficulty || 'beginner',
        estimatedDuration: (frontmatter.sections && frontmatter.sections[index]?.duration) || 5
      };
      
      content.push(contentItem);
    });
    
    // Add any quiz content defined in frontmatter
    if (frontmatter.quizzes && Array.isArray(frontmatter.quizzes)) {
      frontmatter.quizzes.forEach((quiz: any, index: number) => {
        content.push({
          id: `quiz-${index}`,
          type: ContentType.Quiz,
          title: quiz.title || 'Quiz',
          content: quiz,
          difficulty: quiz.difficulty || frontmatter.difficulty || 'beginner',
          estimatedDuration: quiz.duration || 5
        });
      });
    }
    
    return content;
  }
  
  private static readFileContent(file: string): string {
    try {
      return fs.readFileSync(file, 'utf8');
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
      return '';
    }
  }
  
  /**
   * Load all lessons from a directory
   * @param dirPath Directory containing lesson files (.md and .json)
   * @returns Array of loaded Lesson objects
   */
  public static loadLessonsFromDirectory(dirPath: string): Lesson[] {
    try {
      const lessons: Lesson[] = [];
      
      // Read all files in the directory
      const files = fs.readdirSync(dirPath);
      console.log(`Files in directory ${dirPath}:`, files);
      if (!files) {
        console.error(`fs.readdirSync returned undefined for directory: ${dirPath}`);
        return [];
      }
      
      // Process each file based on extension
      files.forEach((file: string) => {
        const filePath = path.join(dirPath, file);
        const ext = path.extname(file).toLowerCase();
        
        if (ext === '.md') {
          lessons.push(this.loadMarkdownLesson(filePath));
        } else if (ext === '.json') {
          lessons.push(this.loadJsonLesson(filePath));
        }
      });
      
      return lessons;
    } catch (error) {
      console.error(`Error loading lessons from directory ${dirPath}:`, error);
      return [];
    }
  }
}

export default LessonLoader;
