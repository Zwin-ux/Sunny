# Sunny AI for Kids

A cheerful, educational AI chat application designed to make learning fun for children while providing customizable lesson plans for teachers.

Sunny's main goal is to encourage kids to keep learning through short quizzes and playful challenges. Correct answers earn points which appear on a global scoreboard so everyone can celebrate their progress together.

![Sunny AI for Kids](public/rainbow.png)

---

## 🎨 Claymation-Inspired, Accessible Design
- Playful, tactile claymation visuals throughout the app
- Large, colorful buttons and high-contrast text for accessibility
- Animations and floating elements to keep young learners engaged

---

## Features

- **Child-Friendly AI Chat**: Engaging conversations with Sunny, a cheerful AI companion that answers questions in an age-appropriate way
- **Interactive Learning Gallery**: Visual educational content organized by topic with fun activities
- **Teacher Dashboard**: Create and manage custom lesson plans tailored to your classroom needs
- **Customizable Content**: Easily adapt lessons to different grade levels, subjects, and learning styles
- **Responsive & Accessible Design**: Works great on desktops, tablets, and interactive whiteboards. Built for accessibility (color, font, keyboard nav).
- **Quiz Scoreboard**: Earn points for correct answers and see how you rank on the shared scoreboard

## Quick Start for Teachers

1. **Access the Teacher Dashboard**: Click the "Teacher Dashboard" button on the top right of the main app
2. **Browse Existing Lessons**: Explore pre-made lesson plans organized by subject and grade level
3. **Create Custom Lessons**: Click "Create New Lesson" to build your own educational content
4. **Share with Students**: Use the generated lesson links to share directly with your class

---

## 🖼️ Claymation & Educational Assets
- All claymation and educational images are in the `public/` directory.
- Images are organized by category for easy reference and extension.
- You may add your own PNG or SVG assets for new lessons or activities.

---

## Getting Started for Developers

### Prerequisites

- Node.js 16.8 or later
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Zwin-ux/Sunny.git
cd sunny-ai-for-kids

# Install dependencies
npm install
# or
pnpm install

# Start the development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Project Structure

```
sunny-ai-for-kids/
├── app/                  # Next.js app router pages
│   ├── images/           # Learning gallery page
│   ├── teacher/          # Teacher dashboard and lesson plan management
│   └── page.tsx          # Main student chat interface
├── components/           # Reusable UI components
├── lib/                  # Utility functions and data models
│   ├── lesson-plans.ts   # Lesson plan structure and sample data
│   └── sunny-ai.ts       # AI response generation (mock implementation)
├── public/               # Static assets
└── styles/               # Global styles
```

## Customizing Lesson Plans

The application uses a structured format for lesson plans that makes them easy to create and modify:

1. **Basic Information**: Title, description, grade level, and subject category
2. **Learning Outcomes**: Clear goals that students should achieve
3. **Activities**: Interactive exercises of different types (multiple-choice, creative, discussion)
4. **Resources**: Additional materials to supplement the lesson

Each lesson plan is fully customizable and can include:

- Multiple activities with varying difficulty levels
- Age-appropriate content targeting specific grade ranges
- Visual aids using the included image library
- Related topics for extended learning

## Contributing

We welcome contributions from educators, developers, and designers! Here's how you can help:

1. **Create Lesson Plans**: Build and share educational content
2. **Improve the UI**: Enhance the user experience for both students and teachers
3. **Extend Functionality**: Add new features or improve existing ones
4. **Fix Bugs**: Help make the application more stable and reliable

Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## Open Source Development

This project is designed to be easily extendable. Key areas for contribution:

- **New Activity Types**: Add different types of educational activities
- **Subject Matter Content**: Create lesson plans for different subjects
- **AI Response Customization**: Improve the AI's responses for different age groups
- **Accessibility Improvements**: Make the application more accessible to all users

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- All the dedicated teachers who provided feedback
- The open source community for the amazing tools and libraries
- The children whose curiosity and joy inspire this project
