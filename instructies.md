# 🛠️ Development Guide voor Gemini Chatbot Project

## 📋 Project Overview
Dit is een Next.js 15.3.3 project met TypeScript, Tailwind CSS en Gemini AI integratie. Het project gebruikt een specifieke structuur en styling patterns die consistent gehouden moeten worden.

## 🏗️ Tech Stack
- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.17
- **AI**: Google Gemini API (@google/generative-ai)
- **File Processing**: 
  - DOCX: `mammoth` + `docx` packages
  - PDF: `pdf-parse`
- **Voice**: Web Speech API (browser native)

## 📁 Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Gemini AI endpoint
│   │   └── upload-docx/route.ts   # File upload endpoint
│   ├── globals.css               # Tailwind imports
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
└── components/
    ├── TestChatBot.tsx          # Main chat component
    ├── FileUpload.tsx           # File upload component
    └── VoiceInput.tsx           # Voice recognition component
```

## 🎨 Design System & Styling Patterns

### Color Scheme
- **Primary**: Purple (`purple-600`, `purple-700`, `purple-800`)
- **Background**: Gradient (`from-purple-50 to-indigo-100`)
- **Cards**: White background with subtle shadows
- **Accents**: Purple tints for interactive elements

### Component Patterns
```tsx
// Standard component wrapper
<div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
    <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
      <span className="text-white text-sm">💬</span>
    </span>
    Component Title
  </h3>
  {/* Component content */}
</div>

// Button patterns
<button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Button Text
</button>

// Input patterns
<textarea className="w-full p-2 border-0 resize-none focus:outline-none" />
```

## 🚀 Adding New Features - IMPORTANT GUIDELINES

### ⚠️ CRITICAL: Prevent Import Errors
**ALWAYS follow this order when adding new components:**

1. **FIRST**: Create the component file with complete implementation
2. **SECOND**: Add imports to other files
3. **NEVER**: Import components that don't exist yet

### Example: Adding a Quiz Component
```bash
# ✅ CORRECT WAY:
# Step 1: Create the component file FIRST
# Step 2: Import it in page.tsx SECOND

# ❌ WRONG WAY:
# Don't add import before the file exists
```

### New Component Template
```tsx
'use client'

import { useState } from 'react'

export default function NewComponent() {
  const [state, setState] = useState('')

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
        <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
          <span className="text-white text-sm">🎯</span>
        </span>
        Component Name
      </h3>
      
      <div className="space-y-4">
        {/* Component content */}
      </div>
    </div>
  )
}
```

## 🔗 API Integration Patterns

### Gemini AI Chat
```tsx
const sendMessage = async () => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  const data = await res.json()
  setResponse(data.response)
}
```

### File Upload
```tsx
const handleFileUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/upload-docx', {
    method: 'POST',
    body: formData,
  })
  
  const data = await response.json()
  setUploadedContent(data.content)
}
```

## 🎯 Best Practices for this Project

### 1. State Management
- Use `useState` for component state
- Use `useRef` for DOM references
- Keep state local to components

### 2. Error Handling
```tsx
try {
  // API call
} catch (error) {
  console.error('Error:', error)
  setError('User-friendly error message')
}
```

### 3. Loading States
```tsx
const [isLoading, setIsLoading] = useState(false)

// In JSX:
{isLoading ? '⏳' : '🚀'}
```

### 4. Responsive Design
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`
- Mobile-first approach
- Test on different screen sizes

## 🔧 Environment Setup
```env
# .env.local (required)
GEMINI_API_KEY=your_actual_api_key_here
```

## 📱 Features to Maintain
1. **Chat with Gemini**: Text-based conversation
2. **Voice Input**: Dutch language support (`nl-NL`)
3. **File Upload**: DOCX and PDF support
4. **Responsive Design**: Works on all devices
5. **Loading States**: Visual feedback for all actions

## 🎨 Icon Usage
- Use emoji for visual elements: 💬, 🚀, ⏳, 🎯, 📱
- SVG icons for interface elements (from Heroicons style)
- Consistent sizing: `w-5 h-5` for buttons, `w-6 h-6` for headings

## 🚨 Common Pitfalls to Avoid
1. **Import errors**: Always create files before importing
2. **Missing 'use client'**: Add to components using hooks
3. **API key issues**: Check .env.local file exists
4. **File type restrictions**: Only .docx and .pdf allowed
5. **TypeScript errors**: Use proper typing for all props

## 📝 Development Workflow for Bolt
1. Plan the feature
2. Create component file with full implementation
3. Test component in isolation
4. Add imports to parent components
5. Test integration
6. Add styling consistency checks

## 🎯 Instructions for AI Development Tools (like Bolt)

### When Adding New Components:
1. **NEVER add imports before creating the actual component file**
2. **ALWAYS create the complete component file first**
3. **Use the exact styling patterns shown above**
4. **Follow the existing naming conventions**
5. **Include 'use client' directive for interactive components**
6. **Use TypeScript properly with proper typing**

### Safe Development Steps:
```
Step 1: "Create src/components/NewComponent.tsx file"
Step 2: "Add import to src/app/page.tsx"
Step 3: "Test the integration"
```

## 💡 Tips for Successful Development
- Always check existing components for styling consistency
- Use the purple color scheme throughout
- Include proper loading and error states
- Test voice recognition in Dutch (`nl-NL`)
- Ensure file uploads work for both .docx and .pdf
- Keep components focused and reusable 