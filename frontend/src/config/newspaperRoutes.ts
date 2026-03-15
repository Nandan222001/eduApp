// Student Newspaper Platform - Route Configuration
// Add these routes to your main router configuration

export const newspaperRoutes = [
  {
    path: '/newspaper',
    name: 'Student Newspaper',
    description: 'Browse and read school newspaper articles',
    roles: ['student', 'teacher', 'parent', 'admin'],
  },
  {
    path: '/journalist-dashboard',
    name: 'Journalist Dashboard',
    description: 'Write and manage article drafts',
    roles: ['student'], // Student journalists
  },
  {
    path: '/newspaper-editor',
    name: 'Newspaper Editor',
    description: 'Review submissions and manage publication',
    roles: ['teacher', 'admin'], // Faculty advisors and editors
  },
  {
    path: '/newspaper-archive',
    name: 'Newspaper Archive',
    description: 'Browse past newspaper editions',
    roles: ['student', 'teacher', 'parent', 'admin'],
  },
  {
    path: '/newspaper-analytics',
    name: 'Newspaper Analytics',
    description: 'View readership and engagement metrics',
    roles: ['teacher', 'admin'], // Editors and administrators
  },
];

// Example router configuration (React Router v6):
/*
import { Routes, Route } from 'react-router-dom';
import StudentNewspaper from '@/pages/StudentNewspaper';
import JournalistDashboard from '@/pages/JournalistDashboard';
import NewspaperEditor from '@/pages/NewspaperEditor';
import NewspaperArchive from '@/pages/NewspaperArchive';
import NewspaperAnalytics from '@/pages/NewspaperAnalytics';

<Routes>
  <Route path="/newspaper" element={<StudentNewspaper />} />
  <Route path="/journalist-dashboard" element={<JournalistDashboard />} />
  <Route path="/newspaper-editor" element={<NewspaperEditor />} />
  <Route path="/newspaper-archive" element={<NewspaperArchive />} />
  <Route path="/newspaper-analytics" element={<NewspaperAnalytics />} />
</Routes>
*/

// Example navigation menu items:
export const newspaperNavItems = [
  {
    label: 'Newspaper',
    icon: 'Article',
    path: '/newspaper',
    children: [
      { label: 'Read Articles', path: '/newspaper' },
      { label: 'Archive', path: '/newspaper-archive' },
      { label: 'Write Article', path: '/journalist-dashboard', roles: ['journalist'] },
      { label: 'Editor Dashboard', path: '/newspaper-editor', roles: ['editor', 'admin'] },
      { label: 'Analytics', path: '/newspaper-analytics', roles: ['editor', 'admin'] },
    ],
  },
];
