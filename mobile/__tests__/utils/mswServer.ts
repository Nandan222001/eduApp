import { setupServer } from 'msw/node';
import { rest } from 'msw';

const API_URL = 'http://localhost:8000';

export const handlers = [
  // Auth endpoints
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'student',
            roles: ['student'],
            avatar: null,
            phone: '1234567890',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
        },
      })
    );
  }),

  rest.post(`${API_URL}/auth/logout`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: { message: 'Logged out successfully' } }));
  }),

  rest.post(`${API_URL}/auth/refresh`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          token_type: 'Bearer',
        },
      })
    );
  }),

  rest.get(`${API_URL}/auth/me`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'student',
          roles: ['student'],
          avatar: null,
          phone: '1234567890',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      })
    );
  }),

  // Assignments endpoints
  rest.get(`${API_URL}/api/v1/assignments`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: 1,
            title: 'Math Homework',
            description: 'Complete exercises 1-10',
            dueDate: '2024-12-31T23:59:59Z',
            subject: 'Mathematics',
            status: 'pending',
            totalMarks: 100,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            title: 'Science Project',
            description: 'Build a solar system model',
            dueDate: '2024-12-25T23:59:59Z',
            subject: 'Science',
            status: 'submitted',
            totalMarks: 50,
            submittedAt: '2024-12-20T10:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      })
    );
  }),

  rest.get(`${API_URL}/api/v1/assignments/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          id: parseInt(id as string),
          title: 'Math Homework',
          description: 'Complete exercises 1-10',
          dueDate: '2024-12-31T23:59:59Z',
          subject: 'Mathematics',
          status: 'pending',
          totalMarks: 100,
          teacherName: 'Mr. Smith',
          attachments: [],
          createdAt: '2024-01-01T00:00:00Z',
        },
      })
    );
  }),

  rest.post(`${API_URL}/api/v1/submissions`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: {
          id: 1,
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          comments: 'Submitted',
          attachments: [],
        },
      })
    );
  }),

  // Grades endpoints
  rest.get(`${API_URL}/api/v1/grades`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: 1,
            subject: 'Mathematics',
            grade: 'A',
            marks: 95,
            totalMarks: 100,
            examType: 'Mid-term',
            date: '2024-01-15T00:00:00Z',
          },
        ],
      })
    );
  }),

  // Attendance endpoints
  rest.get(`${API_URL}/api/v1/attendance`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: 1,
            date: '2024-01-01',
            status: 'present',
            subject: 'Mathematics',
          },
        ],
      })
    );
  }),

  rest.get(`${API_URL}/api/v1/attendance/summary`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          totalDays: 100,
          presentDays: 95,
          absentDays: 5,
          percentage: 95,
        },
      })
    );
  }),
];

export const server = setupServer(...handlers);
