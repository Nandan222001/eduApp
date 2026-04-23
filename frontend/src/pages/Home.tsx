import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  Rating,
  Stack,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { env } from '@/config/env';
import { motion, useScroll, useTransform } from 'motion/react';
import type { Variants } from 'motion/react';
import {
  AutoAwesome,
  School,
  Speed,
  Group,
  AssignmentTurnedIn,
  EmojiEvents,
  Analytics,
  NotificationsActive,
  CheckCircle,
  ArrowForward,
  PlayArrow,
  PeopleAlt,
  MenuBook,
  QueryStats,
  Verified,
  SupportAgent,
  FormatQuote,
} from '@mui/icons-material';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);
const MotionTypography = motion.create(Typography);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 16 } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 14 } },
};

// ── Trusted schools ticker ────────────────────────────────────────────────────
const trustedSchools = [
  'Delhi Public School',
  'Ryan International',
  'Kendriya Vidyalaya',
  'DAV Public School',
  "St. Xavier's School",
  'Bal Bharati Public School',
  'Army Public School',
  'Amity International',
  'The Heritage School',
  'Birla High School',
  'Modern School',
  'Springdales School',
  'Lotus Valley International',
  'GD Goenka World School',
];

// ── Gallery images ─────────────────────────────────────────────────────────────
const galleryImages = [
  {
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
    caption: 'Teachers sparking curiosity every day',
    tag: 'Teaching',
    color: '#FF7A45',
    height: 300,
  },
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
    caption: 'Collaborative learning in action',
    tag: 'Collaboration',
    color: '#6C5CE7',
    height: 240,
  },
  {
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
    caption: 'World-class school environments',
    tag: 'Campus',
    color: '#00CEC9',
    height: 280,
  },
  {
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
    caption: 'Nurturing young minds from day one',
    tag: 'Early Learning',
    color: '#FF7A45',
    height: 240,
  },
  {
    url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&auto=format&fit=crop&q=80',
    caption: 'Digital-first learning experiences',
    tag: 'EdTech',
    color: '#6C5CE7',
    height: 300,
  },
  {
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
    caption: 'Celebrating every achievement',
    tag: 'Achievement',
    color: '#FDCB6E',
    height: 240,
  },
];

// ── Stats bar data ────────────────────────────────────────────────────────────
const stats = [
  { value: '50K+', label: 'Active Students' },
  { value: '2K+', label: 'Educators' },
  { value: '300+', label: 'Institutions' },
  { value: '98%', label: 'Satisfaction Rate' },
];

// ── Feature cards ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: <School sx={{ fontSize: 28 }} />,
    title: 'Smart Attendance',
    desc: 'Real-time, subject-wise attendance with instant parent notifications and detailed analytics.',
    color: '#FF7A45',
    bg: 'rgba(255,122,69,0.08)',
  },
  {
    icon: <AssignmentTurnedIn sx={{ fontSize: 28 }} />,
    title: 'Assignment Hub',
    desc: 'Create, distribute, and auto-grade assignments. Track submissions with plagiarism detection.',
    color: '#6C5CE7',
    bg: 'rgba(108,92,231,0.08)',
  },
  {
    icon: <QueryStats sx={{ fontSize: 28 }} />,
    title: 'Exam & Assessments',
    desc: 'Schedule exams, manage question banks, publish results, and analyse performance trends.',
    color: '#00CEC9',
    bg: 'rgba(0,206,201,0.08)',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 28 }} />,
    title: 'Gamification',
    desc: 'Motivate learners with leaderboards, achievement badges, XP points and reward systems.',
    color: '#FDCB6E',
    bg: 'rgba(253,203,110,0.10)',
  },
  {
    icon: <Analytics sx={{ fontSize: 28 }} />,
    title: 'AI-Powered Analytics',
    desc: 'Predictive performance insights, weakness detection, and personalised learning paths.',
    color: '#6C5CE7',
    bg: 'rgba(108,92,231,0.08)',
  },
  {
    icon: <PeopleAlt sx={{ fontSize: 28 }} />,
    title: 'Parent Connect',
    desc: 'Keep parents informed — attendance, grades, fee dues, and events in one dashboard.',
    color: '#FF7A45',
    bg: 'rgba(255,122,69,0.08)',
  },
  {
    icon: <MenuBook sx={{ fontSize: 28 }} />,
    title: 'Study Planner & Goals',
    desc: 'Students set learning goals, track milestones, and get AI-suggested study schedules.',
    color: '#00CEC9',
    bg: 'rgba(0,206,201,0.08)',
  },
  {
    icon: <NotificationsActive sx={{ fontSize: 28 }} />,
    title: 'Communication Suite',
    desc: 'Announcements, instant messaging, doubt forums, and conference scheduling — all in-app.',
    color: '#FDCB6E',
    bg: 'rgba(253,203,110,0.10)',
  },
];

// ── Role cards ────────────────────────────────────────────────────────────────
const roles = [
  {
    role: 'Students',
    icon: '🎓',
    color: '#FF7A45',
    gradient: 'linear-gradient(135deg, #FFF4F0 0%, #FFDBC9 100%)',
    points: [
      'Track grades & assignments in one place',
      'Set goals and monitor progress',
      'Earn badges and climb leaderboards',
      'Access AI study recommendations',
    ],
  },
  {
    role: 'Teachers',
    icon: '📚',
    color: '#6C5CE7',
    gradient: 'linear-gradient(135deg, #F0EEFF 0%, #D2CCFF 100%)',
    points: [
      'Manage classes, sections & timetables',
      'Create assignments with rich rubrics',
      'Mark attendance in seconds',
      'Deep analytics on student performance',
    ],
  },
  {
    role: 'Parents',
    icon: '👨‍👩‍👧',
    color: '#00CEC9',
    gradient: 'linear-gradient(135deg, #E8FFFE 0%, #CCFCFA 100%)',
    points: [
      'Live attendance and grade updates',
      'Fee due reminders and payment history',
      'Message teachers directly',
      'Child performance trend reports',
    ],
  },
  {
    role: 'Administrators',
    icon: '🏫',
    color: '#815032',
    gradient: 'linear-gradient(135deg, #FFF8F4 0%, #FFEADC 100%)',
    points: [
      'Full institution overview dashboard',
      'Manage staff, students & subscriptions',
      'Generate compliance reports',
      'Multi-campus support with role control',
    ],
  },
];

// ── How it works steps ────────────────────────────────────────────────────────
const steps = [
  {
    step: '01',
    title: 'Set Up Your Institution',
    desc: 'Create your institution profile, configure academic years, grades, and sections in minutes.',
    icon: <School sx={{ fontSize: 32 }} />,
  },
  {
    step: '02',
    title: 'Onboard Your Team',
    desc: 'Invite teachers, students, and parents. Role-based access ensures everyone sees exactly what they need.',
    icon: <Group sx={{ fontSize: 32 }} />,
  },
  {
    step: '03',
    title: 'Run Everything Smarter',
    desc: 'Automate attendance, assignments, exams, and communications — while AI surfaces the insights that matter.',
    icon: <Speed sx={{ fontSize: 32 }} />,
  },
];

// ── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Principal, Greenwood High',
    avatar: 'PS',
    avatarImg:
      'https://images.unsplash.com/photo-1494790108755-2616b89f4891?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    quote: `We cut admin overhead by 60% in the first month. The attendance and exam modules alone justified the switch. Our teachers finally have time to teach.`,
    accentColor: '#FF7A45',
  },
  {
    name: 'Rahul Mehta',
    role: 'Class XII Student',
    avatar: 'RM',
    avatarImg:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    quote: `The gamification is genuinely addictive — in a good way. I check my leaderboard rank every morning and it pushes me to stay consistent with my studies.`,
    accentColor: '#6C5CE7',
  },
  {
    name: 'Anita Verma',
    role: 'Parent',
    avatar: 'AV',
    avatarImg:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    quote: `I no longer have to call the school to ask how my daughter is doing. Everything — attendance, marks, events — is on my phone, updated in real time.`,
    accentColor: '#00CEC9',
  },
];

// ── Impact stats ──────────────────────────────────────────────────────────────
const impactStats = [
  { value: '60%', label: 'Reduction in admin work' },
  { value: '3×', label: 'Parent engagement increase' },
  { value: '98%', label: 'School retention rate' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  return (
    <Box sx={{ overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* ── HERO (split layout) ───────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 10, md: 12 },
          pb: { xs: 10, md: 14 },
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #FFF4F0 0%, #FFEADC 35%, #EDE9FF 75%, #D2CCFF 100%)',
        }}
      >
        {/* Ambient orbs */}
        {[
          { top: '5%', left: '8%', size: 380, color: '#FF7A45', delay: 0 },
          { top: '55%', right: '5%', size: 420, color: '#6C5CE7', delay: 2 },
          { bottom: '10%', left: '40%', size: 260, color: '#00CEC9', delay: 4 },
        ].map((orb, i) => (
          <MotionBox
            key={i}
            animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.18, 0.12] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, delay: orb.delay }}
            sx={{
              position: 'absolute',
              top: orb.top,
              left: (orb as { left?: string }).left,
              right: (orb as { right?: string }).right,
              bottom: (orb as { bottom?: string }).bottom,
              width: orb.size,
              height: orb.size,
              borderRadius: '50%',
              background: orb.color,
              filter: 'blur(90px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
            {/* Left — text */}
            <Grid item xs={12} md={6}>
              <MotionBox variants={stagger} initial="hidden" animate="visible">
                {/* Badge */}
                <motion.div variants={scaleIn}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,122,69,0.25)',
                      borderRadius: 24,
                      px: 2.5,
                      py: 1,
                      mb: 3,
                    }}
                  >
                    <AutoAwesome sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.04em' }}
                    >
                      THE COMPLETE EDUCATION PLATFORM
                    </Typography>
                    <Chip
                      label="New: AI Insights"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: 'primary.main',
                        color: '#fff',
                        ml: 0.5,
                      }}
                    />
                  </Box>
                </motion.div>

                {/* Headline */}
                <MotionTypography
                  variants={fadeUp}
                  variant="h1"
                  sx={{
                    mb: 3,
                    fontSize: { xs: '2.6rem', md: '3.4rem' },
                    background: 'linear-gradient(135deg, #4B240A 0%, #FF7A45 50%, #6C5CE7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.15,
                  }}
                >
                  Smarter Schools,{' '}
                  <Box component="span" sx={{ display: 'block' }}>
                    Inspired Learners
                  </Box>
                </MotionTypography>

                {/* Subheadline */}
                <MotionTypography
                  variants={fadeUp}
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 5, fontWeight: 400, lineHeight: 1.65 }}
                >
                  {env.appName} unifies attendance, exams, assignments, gamification, and parent
                  engagement into one intelligent platform — so educators can focus on what matters
                  most.
                </MotionTypography>

                {/* CTAs */}
                <motion.div variants={fadeUp}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5 }}>
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="contained"
                        size="large"
                        component={RouterLink}
                        to="/login"
                        endIcon={<ArrowForward />}
                        sx={{
                          px: 4.5,
                          py: 1.75,
                          fontSize: '1rem',
                          boxShadow: '0 8px 30px rgba(255,122,69,0.35)',
                          cursor: 'pointer',
                        }}
                      >
                        Get Started Free
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        component={RouterLink}
                        to="/about"
                        startIcon={<PlayArrow />}
                        sx={{
                          px: 4.5,
                          py: 1.75,
                          fontSize: '1rem',
                          bgcolor: 'rgba(255,255,255,0.6)',
                          backdropFilter: 'blur(10px)',
                          borderColor: 'rgba(108,92,231,0.4)',
                          color: 'secondary.main',
                          borderWidth: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: 'secondary.main',
                            bgcolor: 'rgba(255,255,255,0.8)',
                          },
                        }}
                      >
                        See How It Works
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>

                {/* Trust badges */}
                <motion.div variants={fadeUp}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {[
                      'No credit card required',
                      'Free 30-day trial',
                      'Setup in under 10 minutes',
                    ].map((t) => (
                      <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {t}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </motion.div>
              </MotionBox>
            </Grid>

            {/* Right — image collage */}
            <Grid item xs={12} md={6}>
              <MotionBox
                style={{ y: heroY }}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.9, ease: 'easeOut' }}
                sx={{ position: 'relative', pr: { md: 2 } }}
              >
                {/* Primary image */}
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&auto=format&fit=crop&q=80"
                  alt="Students studying together"
                  sx={{
                    width: '100%',
                    height: { xs: 220, md: 280 },
                    objectFit: 'cover',
                    borderRadius: 4,
                    mb: 2,
                    boxShadow: '0 20px 60px rgba(75,36,10,0.15)',
                    display: 'block',
                  }}
                />
                {/* Secondary image */}
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=700&auto=format&fit=crop&q=80"
                  alt="Modern classroom"
                  sx={{
                    width: '78%',
                    height: { xs: 170, md: 210 },
                    objectFit: 'cover',
                    borderRadius: 4,
                    ml: 'auto',
                    display: 'block',
                    boxShadow: '0 20px 60px rgba(75,36,10,0.15)',
                  }}
                />

                {/* Floating stat — students */}
                <MotionBox
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring' }}
                  sx={{
                    position: 'absolute',
                    top: { xs: 12, md: 20 },
                    left: { xs: 12, md: -28 },
                    bgcolor: '#fff',
                    borderRadius: 3,
                    p: { xs: 1.5, md: 2 },
                    boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
                    minWidth: 120,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1 }}
                  >
                    50K+
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Active Students
                  </Typography>
                </MotionBox>

                {/* Floating stat — satisfaction */}
                <MotionBox
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1, type: 'spring' }}
                  sx={{
                    position: 'absolute',
                    bottom: { xs: 12, md: 24 },
                    left: { xs: 12, md: -28 },
                    bgcolor: '#6C5CE7',
                    borderRadius: 3,
                    p: { xs: 1.5, md: 2 },
                    boxShadow: '0 12px 40px rgba(108,92,231,0.35)',
                    minWidth: 120,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    98%
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
                  >
                    Satisfaction
                  </Typography>
                </MotionBox>

                {/* Floating stat — institutions */}
                <MotionBox
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3, type: 'spring' }}
                  sx={{
                    position: 'absolute',
                    top: { xs: 'auto', md: '42%' },
                    right: { xs: 12, md: -20 },
                    bottom: { xs: 12, md: 'auto' },
                    bgcolor: '#00CEC9',
                    borderRadius: 3,
                    p: { xs: 1.5, md: 2 },
                    boxShadow: '0 12px 40px rgba(0,206,201,0.35)',
                    minWidth: 110,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    300+
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
                  >
                    Institutions
                  </Typography>
                </MotionBox>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── TRUSTED SCHOOLS TICKER ───────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          py: 3,
          overflow: 'hidden',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 0.5, px: 3, opacity: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, letterSpacing: '0.1em', color: 'text.secondary', flexShrink: 0 }}
          >
            TRUSTED BY
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 5,
            width: 'max-content',
            '@keyframes tickerScroll': {
              '0%': { transform: 'translateX(0)' },
              '100%': { transform: 'translateX(-50%)' },
            },
            animation: 'tickerScroll 35s linear infinite',
            '&:hover': { animationPlayState: 'paused' },
          }}
        >
          {[...trustedSchools, ...trustedSchools].map((school, i) => (
            <Box
              key={i}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, py: 1.5 }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor:
                    i % 3 === 0
                      ? 'rgba(255,122,69,0.12)'
                      : i % 3 === 1
                        ? 'rgba(108,92,231,0.12)'
                        : 'rgba(0,206,201,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <School
                  sx={{
                    fontSize: 14,
                    color: i % 3 === 0 ? '#FF7A45' : i % 3 === 1 ? '#6C5CE7' : '#00CEC9',
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}
              >
                {school}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.default',
          py: 6,
          background: 'linear-gradient(135deg, #FFF4F0 0%, #EDE9FF 100%)',
        }}
      >
        <Container maxWidth="lg">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 4 }}
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 800 }}>
                    {s.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500, mt: 0.5 }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </MotionBox>
        </Container>
      </Box>

      {/* ── PHOTO GALLERY ────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp}>
              <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Chip
                  label="REAL SCHOOLS. REAL IMPACT."
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(0,206,201,0.1)',
                    color: 'info.main',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
                <Typography variant="h2" gutterBottom sx={{ color: 'text.primary' }}>
                  See real classrooms thriving
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ fontWeight: 400, maxWidth: 560, mx: 'auto' }}
                >
                  Thousands of schools, colleges, and coaching centres have already transformed how
                  they teach and learn.
                </Typography>
              </Box>
            </motion.div>

            {/* Masonry-style grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2.5,
              }}
            >
              {galleryImages.map((img, i) => (
                <MotionBox
                  key={i}
                  variants={fadeUp}
                  sx={{
                    position: 'relative',
                    height: img.height,
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover .gallery-overlay': { opacity: 1 },
                    '&:hover .gallery-img': { transform: 'scale(1.07)' },
                  }}
                >
                  <Box
                    component="img"
                    className="gallery-img"
                    src={img.url}
                    alt={img.caption}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                      display: 'block',
                    }}
                  />
                  {/* Hover overlay */}
                  <Box
                    className="gallery-overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                      opacity: 0,
                      transition: 'opacity 0.35s ease',
                      display: 'flex',
                      alignItems: 'flex-end',
                      p: 2.5,
                    }}
                  >
                    <Box>
                      <Chip
                        label={img.tag}
                        size="small"
                        sx={{
                          bgcolor: img.color,
                          color: '#fff',
                          mb: 1,
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 22,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.4 }}
                      >
                        {img.caption}
                      </Typography>
                    </Box>
                  </Box>
                </MotionBox>
              ))}
            </Box>
          </MotionBox>
        </Container>
      </Box>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp}>
              <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: '14px !important' }} />}
                  label="FULL PLATFORM OVERVIEW"
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(255,122,69,0.1)',
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
                <Typography variant="h2" gutterBottom sx={{ color: 'text.primary' }}>
                  Everything your institution needs
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ fontWeight: 400, maxWidth: 560, mx: 'auto' }}
                >
                  From daily attendance to AI-powered predictions — one platform, zero friction.
                </Typography>
              </Box>
            </motion.div>

            <Grid container spacing={3}>
              {features.map((f, i) => (
                <Grid item xs={12} sm={6} lg={3} key={i}>
                  <MotionCard
                    variants={fadeUp}
                    whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(75,36,10,0.1)' }}
                    sx={{ height: '100%', cursor: 'default' }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          bgcolor: f.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: f.color,
                          mb: 2.5,
                        }}
                      >
                        {f.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                        {f.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                        {f.desc}
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionBox>
        </Container>
      </Box>

      {/* ── IMPACT POSTER ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 10, md: 16 },
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(rgba(10,10,30,0.72), rgba(10,10,30,0.72)), url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            sx={{ textAlign: 'center' }}
          >
            <motion.div variants={fadeUp}>
              <Chip
                label="OUR IMPACT"
                sx={{
                  mb: 3,
                  bgcolor: 'rgba(255,122,69,0.85)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  color: '#fff',
                  mb: 2,
                  textShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  fontSize: { xs: '2.2rem', md: '3rem' },
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                Transforming education,
                <br />
                one school at a time.
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.75)',
                  mb: 8,
                  fontWeight: 400,
                  maxWidth: 520,
                  mx: 'auto',
                }}
              >
                Thousands of institutions have reimagined how they teach, track, and inspire every
                student.
              </Typography>
            </motion.div>

            <Grid container spacing={3} justifyContent="center">
              {impactStats.map((stat, i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <motion.div variants={scaleIn}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.10)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: 4,
                        p: { xs: 3, md: 4 },
                        transition: 'background 0.3s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                      }}
                    >
                      <Typography
                        variant="h2"
                        sx={{
                          color: i === 0 ? '#FF7A45' : i === 1 ? '#FDCB6E' : '#00CEC9',
                          fontWeight: 800,
                          mb: 1,
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </MotionBox>
        </Container>
      </Box>

      {/* ── ROLES ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: 'linear-gradient(160deg, #EDE9FF 0%, #FFF4F0 100%)',
        }}
      >
        <Container maxWidth="lg">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp}>
              <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Chip
                  icon={<Verified sx={{ fontSize: '14px !important' }} />}
                  label="BUILT FOR EVERYONE"
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(108,92,231,0.1)',
                    color: 'secondary.main',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
                <Typography variant="h2" gutterBottom>
                  One platform, every stakeholder
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ fontWeight: 400, maxWidth: 520, mx: 'auto' }}
                >
                  Tailored experiences for students, teachers, parents, and administrators.
                </Typography>
              </Box>
            </motion.div>

            <Grid container spacing={3}>
              {roles.map((r, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <MotionCard
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    sx={{ height: '100%', background: r.gradient }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.75rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          }}
                        >
                          {r.icon}
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: r.color }}>
                            For {r.role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Personalised dashboard
                          </Typography>
                        </Box>
                      </Box>

                      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                        {r.points.map((pt) => (
                          <Box
                            component="li"
                            key={pt}
                            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}
                          >
                            <CheckCircle
                              sx={{ fontSize: 18, color: r.color, mt: 0.15, flexShrink: 0 }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ color: 'text.primary', fontWeight: 500 }}
                            >
                              {pt}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionBox>
        </Container>
      </Box>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="md">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp}>
              <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Chip
                  label="HOW IT WORKS"
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(0,206,201,0.1)',
                    color: 'info.main',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
                <Typography variant="h2" gutterBottom>
                  Up and running in minutes
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  No complex setup. No IT team required.
                </Typography>
              </Box>
            </motion.div>

            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: 2, md: 4 },
                    mb: 5,
                    alignItems: 'flex-start',
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                  <Box sx={{ flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 4,
                        background:
                          i === 0
                            ? 'linear-gradient(135deg, #FF7A45, #FFDBC9)'
                            : i === 1
                              ? 'linear-gradient(135deg, #6C5CE7, #D2CCFF)'
                              : 'linear-gradient(135deg, #00CEC9, #CCFCFA)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      }}
                    >
                      {s.icon}
                    </Box>
                  </Box>
                  <Box sx={{ pt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}
                    >
                      STEP {s.step}
                    </Typography>
                    <Typography variant="h4" gutterBottom sx={{ mt: 0.5 }}>
                      {s.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {s.desc}
                    </Typography>
                  </Box>
                </Box>
                {i < steps.length - 1 && (
                  <Box
                    sx={{
                      ml: { sm: '36px' },
                      pl: { sm: '36px' },
                      borderLeft: { sm: '2px dashed' },
                      borderColor: 'divider',
                      height: 24,
                      mb: 3,
                    }}
                  />
                )}
              </motion.div>
            ))}
          </MotionBox>
        </Container>
      </Box>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: 'linear-gradient(160deg, #FFF4F0 0%, #EDE9FF 100%)',
        }}
      >
        <Container maxWidth="lg">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={fadeUp}>
              <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Chip
                  label="WHAT PEOPLE SAY"
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(255,122,69,0.1)',
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
                <Typography variant="h2" gutterBottom>
                  Loved by schools across the country
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Hear from principals, students, and parents who made the switch.
                </Typography>
              </Box>
            </motion.div>

            <Grid container spacing={3}>
              {testimonials.map((t, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <MotionCard
                    variants={fadeUp}
                    whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(75,36,10,0.12)' }}
                    sx={{ height: '100%', bgcolor: 'background.paper' }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      {/* Star rating */}
                      <Rating
                        value={t.rating}
                        readOnly
                        precision={0.5}
                        sx={{
                          mb: 2,
                          color: '#FDCB6E',
                          '& .MuiRating-iconEmpty': { color: 'rgba(0,0,0,0.15)' },
                        }}
                      />

                      {/* Quote icon */}
                      <FormatQuote
                        sx={{ fontSize: 36, color: t.accentColor, opacity: 0.4, mb: 1 }}
                      />

                      <Typography
                        variant="body1"
                        sx={{ color: 'text.primary', lineHeight: 1.75, mb: 3, fontStyle: 'italic' }}
                      >
                        {t.quote}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Avatar
                          src={t.avatarImg}
                          alt={t.name}
                          sx={{
                            width: 48,
                            height: 48,
                            fontWeight: 700,
                            bgcolor: t.accentColor,
                            border: `2px solid ${t.accentColor}30`,
                          }}
                        >
                          {t.avatar}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: 'text.primary' }}
                          >
                            {t.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.role}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionBox>
        </Container>
      </Box>

      {/* ── FINAL CTA (with background photo) ───────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(135deg, rgba(255,122,69,0.92) 0%, rgba(163,55,2,0.94) 50%, rgba(108,92,231,0.92) 100%), url(https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1600&auto=format&fit=crop&q=80)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Decorative rings */}
        <MotionBox
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />
        <MotionBox
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            sx={{ textAlign: 'center' }}
          >
            <motion.div variants={fadeUp}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <SupportAgent sx={{ fontSize: 52, color: 'rgba(255,255,255,0.9)' }} />
              </Box>

              <Typography
                variant="h2"
                sx={{ color: '#fff', mb: 2, fontSize: { xs: '2rem', md: '2.8rem' } }}
              >
                Ready to transform your institution?
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 400,
                  mb: 7,
                  maxWidth: 500,
                  mx: 'auto',
                }}
              >
                Join hundreds of institutions already running smarter with {env.appName}. Start your
                free trial today — no credit card needed.
              </Typography>

              {/* Social proof mini row */}
              <Stack
                direction="row"
                spacing={-1.5}
                justifyContent="center"
                alignItems="center"
                sx={{ mb: 5 }}
              >
                {[
                  'https://images.unsplash.com/photo-1494790108755-2616b89f4891?w=60&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
                ].map((src, i) => (
                  <Avatar
                    key={i}
                    src={src}
                    alt="User avatar"
                    sx={{
                      width: 40,
                      height: 40,
                      border: '2px solid rgba(255,255,255,0.8)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  />
                ))}
                <Box
                  sx={{
                    ml: 2,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 8,
                    px: 2,
                    py: 0.75,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                    50,000+ learners onboard
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="contained"
                    size="large"
                    component={RouterLink}
                    to="/login"
                    endIcon={<ArrowForward />}
                    sx={{
                      px: 6,
                      py: 1.75,
                      bgcolor: '#fff',
                      color: 'primary.main',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                    }}
                  >
                    Start Free Trial
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    component={RouterLink}
                    to="/about"
                    sx={{
                      px: 6,
                      py: 1.75,
                      fontSize: '1.05rem',
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.5)',
                      borderWidth: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#fff',
                        borderWidth: 2,
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    Request a Demo
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
}
