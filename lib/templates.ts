import { Task } from './types';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  task: Partial<Task>;
  icon?: string;
}

export const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: 'meeting-prep',
    name: 'Meeting Prep',
    description: 'Prepare for a meeting',
    icon: '📅',
    task: {
      title: 'Meeting Preparation',
      description: '',
      priority: 'high',
      tags: ['meeting'],
      subtasks: [
        { id: '1', title: 'Review agenda', completed: false },
        { id: '2', title: 'Prepare questions', completed: false },
        { id: '3', title: 'Gather materials', completed: false },
      ],
    },
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Review code changes',
    icon: '💻',
    task: {
      title: 'Code Review',
      description: '',
      priority: 'medium',
      tags: ['development', 'review'],
      subtasks: [
        { id: '1', title: 'Read through code changes', completed: false },
        { id: '2', title: 'Test the changes', completed: false },
        { id: '3', title: 'Provide feedback', completed: false },
      ],
    },
  },
  {
    id: 'feature-development',
    name: 'Feature Development',
    description: 'Develop a new feature',
    icon: '🚀',
    task: {
      title: 'New Feature',
      description: '',
      priority: 'high',
      tags: ['development', 'feature'],
      subtasks: [
        { id: '1', title: 'Design the feature', completed: false },
        { id: '2', title: 'Implement the feature', completed: false },
        { id: '3', title: 'Write tests', completed: false },
        { id: '4', title: 'Update documentation', completed: false },
      ],
    },
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix',
    description: 'Fix a bug',
    icon: '🐛',
    task: {
      title: 'Bug Fix',
      description: '',
      priority: 'high',
      tags: ['bug', 'fix'],
      subtasks: [
        { id: '1', title: 'Reproduce the bug', completed: false },
        { id: '2', title: 'Identify the cause', completed: false },
        { id: '3', title: 'Implement fix', completed: false },
        { id: '4', title: 'Test the fix', completed: false },
      ],
    },
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Write or update documentation',
    icon: '📝',
    task: {
      title: 'Documentation',
      description: '',
      priority: 'medium',
      tags: ['documentation'],
      subtasks: [
        { id: '1', title: 'Research the topic', completed: false },
        { id: '2', title: 'Write content', completed: false },
        { id: '3', title: 'Review and edit', completed: false },
      ],
    },
  },
  {
    id: 'email-response',
    name: 'Email Response',
    description: 'Respond to emails',
    icon: '📧',
    task: {
      title: 'Email Response',
      description: '',
      priority: 'medium',
      tags: ['email', 'communication'],
      subtasks: [
        { id: '1', title: 'Read emails', completed: false },
        { id: '2', title: 'Draft responses', completed: false },
        { id: '3', title: 'Send replies', completed: false },
      ],
    },
  },
];

export function getTemplate(id: string): TaskTemplate | undefined {
  return DEFAULT_TEMPLATES.find((t) => t.id === id);
}

export function getAllTemplates(): TaskTemplate[] {
  return DEFAULT_TEMPLATES;
}

