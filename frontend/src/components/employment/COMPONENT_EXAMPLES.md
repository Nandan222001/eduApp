# Employment Component Examples

## JobCard Component

### Basic Usage
```tsx
import { JobCard } from '@/components/employment';

function JobListingPage() {
  const [jobs, setJobs] = useState<StudentJobListing[]>([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<number>>(new Set());

  const handleViewDetails = (job: StudentJobListing) => {
    navigate(`/student/employment/jobs/${job.id}`);
  };

  const handleBookmarkToggle = (jobId: number) => {
    setBookmarkedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  return (
    <Grid container spacing={3}>
      {jobs.map((job) => (
        <Grid item xs={12} md={6} lg={4} key={job.id}>
          <JobCard
            job={job}
            onViewDetails={handleViewDetails}
            onBookmarkToggle={handleBookmarkToggle}
            isBookmarked={bookmarkedJobs.has(job.id)}
          />
        </Grid>
      ))}
    </Grid>
  );
}
```

### Without Bookmark Feature
```tsx
<JobCard
  job={job}
  onViewDetails={handleViewDetails}
/>
```

## WorkPermitCard Component

### Basic Usage
```tsx
import { WorkPermitCard } from '@/components/employment';

function WorkPermitList() {
  const [permits, setPermits] = useState<WorkPermit[]>([]);

  return (
    <Grid container spacing={3}>
      {permits.map((permit) => (
        <Grid item xs={12} md={6} lg={4} key={permit.id}>
          <WorkPermitCard permit={permit} />
        </Grid>
      ))}
    </Grid>
  );
}
```

## EmploymentCard Component

### Basic Usage
```tsx
import { EmploymentCard } from '@/components/employment';

function EmploymentHistory() {
  const [employments, setEmployments] = useState<StudentEmployment[]>([]);

  const handleRequestReference = (employment: StudentEmployment) => {
    // Open reference request dialog
    setSelectedJob(employment);
    setReferenceDialogOpen(true);
  };

  return (
    <Grid container spacing={3}>
      {employments.map((employment) => (
        <Grid item xs={12} md={6} key={employment.id}>
          <EmploymentCard
            employment={employment}
            onRequestReference={handleRequestReference}
          />
        </Grid>
      ))}
    </Grid>
  );
}
```

### Without Reference Request
```tsx
<EmploymentCard employment={employment} />
```

## TimesheetIntegration Component

### Basic Usage
```tsx
import { TimesheetIntegration } from '@/components/employment';

function CurrentJobDetails() {
  const [currentJob, setCurrentJob] = useState<StudentEmployment | null>(null);

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {/* Job details */}
          </Grid>
          <Grid item xs={12} md={6}>
            <TimesheetIntegration
              employmentId={currentJob.id}
              currentHours={currentJob.total_hours_worked}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
```

## Complete Example: Job Board Page

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, CircularProgress } from '@mui/material';
import { JobCard } from '@/components/employment';
import employmentApi from '@/api/employment';
import { StudentJobListing } from '@/types/employment';

export default function JobBoardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<StudentJobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await employmentApi.listJobListings({ is_active: true });
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (job: StudentJobListing) => {
    navigate(`/student/employment/jobs/${job.id}`);
  };

  const handleBookmarkToggle = (jobId: number) => {
    setBookmarkedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} md={6} lg={4} key={job.id}>
            <JobCard
              job={job}
              onViewDetails={handleViewDetails}
              onBookmarkToggle={handleBookmarkToggle}
              isBookmarked={bookmarkedJobs.has(job.id)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
```

## Complete Example: Employment Dashboard

```tsx
import { useState, useEffect } from 'react';
import { Box, Grid, Tabs, Tab } from '@mui/material';
import { EmploymentCard, TimesheetIntegration } from '@/components/employment';
import employmentApi from '@/api/employment';
import { StudentEmployment } from '@/types/employment';
import { useAuth } from '@/hooks/useAuth';

export default function EmploymentDashboard() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [currentJobs, setCurrentJobs] = useState<StudentEmployment[]>([]);
  const [pastJobs, setPastJobs] = useState<StudentEmployment[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchEmployments();
    }
  }, [user]);

  const fetchEmployments = async () => {
    const studentId = parseInt(user!.id);
    const jobs = await employmentApi.getStudentEmployments(studentId);
    setCurrentJobs(jobs.filter((j) => j.is_current));
    setPastJobs(jobs.filter((j) => !j.is_current));
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
        <Tab label="Current Employment" />
        <Tab label="Employment History" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {currentJobs.map((job) => (
            <Grid item xs={12} key={job.id}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <EmploymentCard employment={job} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TimesheetIntegration
                    employmentId={job.id}
                    currentHours={job.total_hours_worked}
                  />
                </Grid>
              </Grid>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {pastJobs.map((job) => (
            <Grid item xs={12} md={6} key={job.id}>
              <EmploymentCard employment={job} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
```

## Styling Tips

### Custom Job Card Colors
```tsx
// Override job type colors
const customJobTypeColor = (type: string) => {
  switch (type) {
    case 'part_time':
      return 'primary';
    case 'seasonal':
      return 'secondary';
    case 'internship':
      return 'success';
    case 'volunteer':
      return 'info';
    default:
      return 'default';
  }
};
```

### Custom Card Styling
```tsx
<Card
  sx={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  }}
>
  <JobCard job={job} onViewDetails={handleViewDetails} />
</Card>
```

## Integration with Other Systems

### With Loading States
```tsx
function JobListWithLoading() {
  const [jobs, setJobs] = useState<StudentJobListing[]>([]);
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} md={4} key={i}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {jobs.map((job) => (
        <Grid item xs={12} md={4} key={job.id}>
          <JobCard job={job} onViewDetails={handleViewDetails} />
        </Grid>
      ))}
    </Grid>
  );
}
```

### With Error Handling
```tsx
function JobListWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <Alert severity="error" onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  // ... rest of component
}
```

### With Pagination
```tsx
function JobListWithPagination() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  const paginatedJobs = jobs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <Grid container spacing={3}>
        {paginatedJobs.map((job) => (
          <Grid item xs={12} md={4} key={job.id}>
            <JobCard job={job} onViewDetails={handleViewDetails} />
          </Grid>
        ))}
      </Grid>
      <Pagination
        count={Math.ceil(jobs.length / itemsPerPage)}
        page={page}
        onChange={(_, value) => setPage(value)}
      />
    </>
  );
}
```

## Component Props Reference

### JobCard Props
```typescript
interface JobCardProps {
  job: StudentJobListing;           // Required: Job listing data
  onViewDetails: (job: StudentJobListing) => void;  // Required: View details handler
  onBookmarkToggle?: (jobId: number) => void;       // Optional: Bookmark toggle handler
  isBookmarked?: boolean;            // Optional: Bookmark state
}
```

### WorkPermitCard Props
```typescript
interface WorkPermitCardProps {
  permit: WorkPermit;                // Required: Work permit data
}
```

### EmploymentCard Props
```typescript
interface EmploymentCardProps {
  employment: StudentEmployment;     // Required: Employment record
  onRequestReference?: (employment: StudentEmployment) => void;  // Optional: Reference request handler
}
```

### TimesheetIntegration Props
```typescript
interface TimesheetIntegrationProps {
  employmentId: number;              // Required: Employment record ID
  currentHours?: number;             // Optional: Current total hours
}
```
