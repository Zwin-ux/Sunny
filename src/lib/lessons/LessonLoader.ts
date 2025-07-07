// Lazy load Node.js modules to avoid bundling them in client builds
const fs = () => require('fs') as typeof import('fs');
const path = () => require('path') as typeof import('path');
import matter from 'gray-matter';
import { Lesson, MarkdownContent, LessonContent } from '../../types/lesson';

/**
 * LessonLoader provides utilities for loading lessons from Markdown and JSON files
 */
export class LessonLoader {
  /**
   * Load a lesson from a Markdown file with frontmatter
   * @param filePath Path to the markdown file
   * @returns Parsed Lesson object
   */
  public static loadMarkdownLesson(filePath: string): Lesson {
    try {
      // Read the file content
      const fileContent = fs().readFileSync(filePath, 'utf8');
      
      // Parse frontmatter and content
      const { data: frontmatter, content } = matter(fileContent);
      
      // Extract lesson metadata from frontmatter
      const lesson: Lesson = {
        id: frontmatter.id || path().basename(filePath, path().extname(filePath)),
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
      // Read and parse the JSON file
      const fileContent = fs().readFileSync(filePath, 'utf8');
      const lessonData = JSON.parse(fileContent);
      
      // Validate required fields
      if (!lessonData.id || !lessonData.title) {
        throw new Error('Lesson JSON must include at least id and title fields');
      }
      
      // Process any markdown content within the JSON
      if (lessonData.content) {
        lessonData.content = lessonData.content.map((item: LessonContent) => {
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
        type: 'markdown',
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
          type: 'quiz',
          title: quiz.title || 'Quiz',
          content: quiz,
          difficulty: quiz.difficulty || frontmatter.difficulty || 'beginner',
          estimatedDuration: quiz.duration || 5
        });
      });
    }
    
    return content;
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
      const files = fs().readdirSync(dirPath);
      
      // Process each file based on extension
      files.forEach(file => {
      const filePath = path().join(dirPath, file);
        const ext = path().extname(file).toLowerCase();
        
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
