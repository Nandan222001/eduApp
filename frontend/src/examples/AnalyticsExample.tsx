import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Alert } from '@mui/material';
import { useFeatureTracking, useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsHelper } from '@/utils/analyticsHelpers';
import { captureException, captureMessage } from '@/lib/sentry';

const AnalyticsExample: React.FC = () => {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const { trackEvent, trackFeatureUsage } = useAnalytics();

  useFeatureTracking('analytics_example');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      AnalyticsHelper.trackFormSubmission('example_form', {
        has_title: !!formData.title,
        has_description: !!formData.description,
      });

      captureMessage('Form submitted successfully', 'info');

      setFormData({ title: '', description: '' });
    } catch (error) {
      captureException(error as Error, {
        extra: {
          form_data: formData,
        },
      });
    }
  };

  const handleButtonClick = (buttonId: string) => {
    AnalyticsHelper.trackButtonClick(buttonId, {
      timestamp: new Date().toISOString(),
    });
  };

  const handleFeatureUse = () => {
    trackFeatureUsage('example_feature', {
      usage_context: 'demo',
    });
  };

  const handleCustomEvent = () => {
    trackEvent({
      event_name: 'custom_action',
      event_type: 'user_interaction',
      properties: {
        action_type: 'example',
        value: 42,
      },
    });
  };

  const handleErrorTest = () => {
    try {
      throw new Error('Test error for Sentry');
    } catch (error) {
      captureException(error as Error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analytics & Monitoring Examples
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This component demonstrates various analytics and monitoring features. Check the browser
        console, Sentry, and GA4 to see the tracked events.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Form Submission Tracking
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained">
              Submit Form (Tracked)
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Event Tracking
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button variant="contained" onClick={() => handleButtonClick('track_button')}>
              Track Button Click
            </Button>
            <Button variant="contained" color="secondary" onClick={handleFeatureUse}>
              Track Feature Usage
            </Button>
            <Button variant="contained" color="success" onClick={handleCustomEvent}>
              Track Custom Event
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Assignment Analytics Example
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="contained"
              onClick={() =>
                AnalyticsHelper.trackAssignment('CREATE', {
                  subject: 'Mathematics',
                  grade: '10',
                  due_date: '2024-01-15',
                })
              }
            >
              Track Assignment Create
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                AnalyticsHelper.trackAssignment('SUBMIT', {
                  assignment_id: '123',
                  on_time: true,
                  score: 95,
                })
              }
            >
              Track Assignment Submit
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Exam Analytics Example
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="contained"
              onClick={() =>
                AnalyticsHelper.trackExam('CREATE', {
                  exam_type: 'midterm',
                  total_marks: 100,
                })
              }
            >
              Track Exam Create
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                AnalyticsHelper.trackExam('TAKE', {
                  exam_id: '456',
                  start_time: new Date().toISOString(),
                })
              }
            >
              Track Exam Start
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Media Tracking
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="contained"
              onClick={() =>
                AnalyticsHelper.trackVideoPlay('video_123', {
                  title: 'Introduction to Algebra',
                  duration: 600,
                })
              }
            >
              Track Video Play
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                AnalyticsHelper.trackDownload('notes.pdf', 'pdf', {
                  subject: 'Physics',
                  chapter: 'Mechanics',
                })
              }
            >
              Track File Download
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Error Tracking (Sentry)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button variant="contained" color="error" onClick={handleErrorTest}>
              Test Error Capture
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => captureMessage('This is a warning message', 'warning')}
            >
              Send Warning
            </Button>
            <Button
              variant="contained"
              onClick={() => captureMessage('This is an info message', 'info')}
            >
              Send Info
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsExample;
