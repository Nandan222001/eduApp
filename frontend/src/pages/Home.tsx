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
  TrendingUp,
  PeopleAlt,
  MenuBook,
  QueryStats,
  Verified,
  SupportAgent,
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
    quote: `We cut admin overhead by 60% in the first month. The attendance and exam modules alone justified the switch. Our teachers finally have time to teach.`,
  },
  {
    name: 'Rahul Mehta',
    role: 'Class XII Student',
    avatar: 'RM',
    quote: `The gamification is genuinely addictive — in a good way. I check my leaderboard rank every morning and it pushes me to stay consistent with my studies.`,
  },
  {
    name: 'Anita Verma',
    role: 'Parent',
    avatar: 'AV',
    quote: `I no longer have to call the school to ask how my daughter is doing. Everything — attendance, marks, events — is on my phone, updated in real time.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  return (
    <Box sx={{ overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 10, md: 14 },
          pb: { xs: 12, md: 18 },
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #FFF4F0 0%, #FFEADC 35%, #EDE9FF 75%, #D2CCFF 100%)',
        }}
      >
        {/* Floating ambient orbs */}
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
              left: (orb as unknown as { left?: string }).left,
              right: (orb as unknown as { right?: string }).right,
              bottom: (orb as unknown as { bottom?: string }).bottom,
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
          <MotionBox
            variants={stagger}
            initial="hidden"
            animate="visible"
            sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto' }}
          >
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
                  mb: 4,
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
              component="h1"
              sx={{
                mb: 3,
                background: 'linear-gradient(135deg, #4B240A 0%, #FF7A45 50%, #6C5CE7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
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
              variant="h5"
              color="text.secondary"
              sx={{ mb: 6, fontWeight: 400, maxWidth: 620, mx: 'auto', lineHeight: 1.6 }}
            >
              {env.appName} unifies attendance, exams, assignments, gamification, and parent
              engagement into one intelligent platform — so educators can focus on what matters
              most.
            </MotionTypography>

            {/* CTAs */}
            <motion.div variants={fadeUp}>
              <Box
                sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}
              >
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="contained"
                    size="large"
                    component={RouterLink}
                    to="/login"
                    endIcon={<ArrowForward />}
                    sx={{
                      px: 5,
                      py: 1.75,
                      fontSize: '1.05rem',
                      boxShadow: '0 8px 30px rgba(255,122,69,0.35)',
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
                      px: 5,
                      py: 1.75,
                      fontSize: '1.05rem',
                      bgcolor: 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(10px)',
                      borderColor: 'rgba(108,92,231,0.4)',
                      color: 'secondary.main',
                      borderWidth: 2,
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
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['No credit card required', 'Free 30-day trial', 'Setup in under 10 minutes'].map(
                  (t) => (
                    <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {t}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            </motion.div>
          </MotionBox>

          {/* Hero visual — floating dashboard preview */}
          <MotionBox
            style={{ y: heroY }}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            sx={{
              mt: 8,
              mx: 'auto',
              maxWidth: 880,
              bgcolor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: 6,
              p: { xs: 2, md: 4 },
              boxShadow: '0 30px 80px rgba(75,36,10,0.12), 0 0 0 1px rgba(255,122,69,0.1)',
            }}
          >
            {/* Fake dashboard header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              {['#FF5F57', '#FFBD2E', '#28C840'].map((c) => (
                <Box key={c} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c }} />
              ))}
              <Box
                sx={{
                  flex: 1,
                  mx: 2,
                  height: 28,
                  bgcolor: 'rgba(75,36,10,0.05)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  app.{env.appName?.toLowerCase().replace(/\s/g, '')}.edu
                </Typography>
              </Box>
            </Box>

            {/* Mini stat cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                {
                  label: 'Total Students',
                  value: '1,248',
                  icon: '🎓',
                  delta: '+12%',
                  color: '#FF7A45',
                },
                {
                  label: "Today's Attendance",
                  value: '94.2%',
                  icon: '✅',
                  delta: '+2.1%',
                  color: '#00CEC9',
                },
                {
                  label: 'Pending Assignments',
                  value: '23',
                  icon: '📋',
                  delta: '-5',
                  color: '#6C5CE7',
                },
                {
                  label: 'Avg. Exam Score',
                  value: '78.4',
                  icon: '📊',
                  delta: '+3.8',
                  color: '#FDCB6E',
                },
              ].map((card) => (
                <Grid item xs={6} md={3} key={card.label}>
                  <Box
                    sx={{
                      bgcolor: card.color + '10',
                      borderRadius: 3,
                      p: 2,
                      border: `1px solid ${card.color}25`,
                    }}
                  >
                    <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{card.icon}</Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: card.color, lineHeight: 1 }}
                    >
                      {card.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25 }}
                    >
                      {card.label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <TrendingUp sx={{ fontSize: 12, color: 'success.main', mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {card.delta} this week
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Mini activity feed */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[
                {
                  text: 'Assignment "Chapter 4 Quiz" submitted by 38 students',
                  time: '2m ago',
                  color: '#6C5CE7',
                },
                {
                  text: 'Attendance marked for Class X-A — 96% present',
                  time: '14m ago',
                  color: '#00CEC9',
                },
                {
                  text: 'Rohan Kapoor earned the "Streak Master" badge 🏆',
                  time: '1h ago',
                  color: '#FDCB6E',
                },
              ].map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: '1 1 200px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    bgcolor: 'rgba(75,36,10,0.03)',
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      mt: 0.75,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 500,
                        display: 'block',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </MotionBox>
        </Container>
      </Box>

      {/* ── STATS BAR ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          py: 5,
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <MotionBox
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            sx={{
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: 4,
            }}
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
              </Box>
            </motion.div>

            <Grid container spacing={3}>
              {testimonials.map((t, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <MotionCard
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    sx={{ height: '100%', p: 1 }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h4" sx={{ color: 'primary.main', mb: 2, lineHeight: 1 }}>
                        ❝
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: 'text.primary', lineHeight: 1.7, mb: 3, fontStyle: 'italic' }}
                      >
                        {t.quote}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor:
                              i === 0 ? 'primary.main' : i === 1 ? 'secondary.main' : 'info.main',
                            fontWeight: 700,
                            width: 44,
                            height: 44,
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

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: 'linear-gradient(135deg, #FF7A45 0%, #A33702 50%, #6C5CE7 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <SupportAgent sx={{ fontSize: 48, color: 'rgba(255,255,255,0.9)' }} />
              </Box>
              <Typography variant="h2" sx={{ color: '#fff', mb: 2 }}>
                Ready to transform your institution?
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 400,
                  mb: 6,
                  maxWidth: 500,
                  mx: 'auto',
                }}
              >
                Join hundreds of institutions already running smarter with {env.appName}. Start your
                free trial today — no credit card needed.
              </Typography>
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
