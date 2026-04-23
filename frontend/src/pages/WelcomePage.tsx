import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack,
  Chip,
  alpha,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import type { Variants } from 'motion/react';
import { Link as RouterLink } from 'react-router-dom';
import {
  TrendingUp,
  Lightbulb,
  Bolt,
  TrackChanges,
  MenuBook,
  Group,
  BarChart,
  EmojiEvents,
  ChevronRight,
  PlayArrow,
  Star,
} from '@mui/icons-material';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);
const MotionTypography = motion.create(Typography);
const MotionButton = motion.create(Button);

// ──────────────────────────────────────────────────────────────────────────────
// ANIMATIONS
// ──────────────────────────────────────────────────────────────────────────────

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.1 },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: 'easeOut', delay: 0.3 },
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// DATA
// ──────────────────────────────────────────────────────────────────────────────

const journeySteps = [
  {
    number: '01',
    title: 'Discover Your Path',
    description:
      'Get personalized learning recommendations based on your unique learning style and goals.',
    icon: <Lightbulb sx={{ fontSize: 32 }} />,
    color: '#FF7A45',
    bgGradient: 'linear-gradient(135deg, #FFF4F0 0%, #FFDBC9 100%)',
  },
  {
    number: '02',
    title: 'Learn at Your Pace',
    description: 'Engage with curated content, interactive assignments, and adaptive challenges.',
    icon: <MenuBook sx={{ fontSize: 32 }} />,
    color: '#6C5CE7',
    bgGradient: 'linear-gradient(135deg, #F0EEFF 0%, #D2CCFF 100%)',
  },
  {
    number: '03',
    title: 'Track Progress',
    description: 'Watch real-time analytics show your growth with detailed performance insights.',
    icon: <TrendingUp sx={{ fontSize: 32 }} />,
    color: '#00CEC9',
    bgGradient: 'linear-gradient(135deg, #E8FFFE 0%, #CCFCFA 100%)',
  },
  {
    number: '04',
    title: 'Achieve Excellence',
    description:
      'Earn badges, climb leaderboards, and unlock achievements as you master new skills.',
    icon: <EmojiEvents sx={{ fontSize: 32 }} />,
    color: '#FDCB6E',
    bgGradient: 'linear-gradient(135deg, #FFF9E6 0%, #FFF4CC 100%)',
  },
];

const capabilities = [
  {
    icon: <Bolt sx={{ fontSize: 28 }} />,
    title: 'Real-Time Analytics',
    description: 'Instant insights into performance with AI-powered predictions.',
  },
  {
    icon: <TrackChanges sx={{ fontSize: 28 }} />,
    title: 'Smart Goals',
    description: 'Set milestones and get adaptive study plans tailored just for you.',
  },
  {
    icon: <Group sx={{ fontSize: 28 }} />,
    title: 'Community Learning',
    description: 'Collaborate with peers, join study groups, and share knowledge.',
  },
  {
    icon: <BarChart sx={{ fontSize: 28 }} />,
    title: 'Deep Insights',
    description: 'Understand your strengths and areas for improvement with visual dashboards.',
  },
];

const testimonials = [
  {
    name: 'Maya Singh',
    role: 'Class X Student',
    quote:
      'I used to struggle with organization. This platform made learning feel so structured and rewarding.',
    avatar: '🎓',
    achievement: '+40% grade improvement',
  },
  {
    name: 'Arjun Patel',
    role: 'Class XII Student',
    quote: 'The gamification keeps me motivated. Every badge earned feels like a real achievement.',
    avatar: '⭐',
    achievement: 'Top 5% nationally',
  },
  {
    name: 'Zara Khan',
    role: 'College Student',
    quote:
      'Finally, a platform that understands how modern learners want to study — with data and fun.',
    avatar: '🚀',
    achievement: 'Consistent 95+ scores',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  return (
    <Box
      sx={{
        position: 'relative',
        pt: { xs: 8, md: 12 },
        pb: { xs: 10, md: 16 },
        overflow: 'hidden',
        background: 'linear-gradient(165deg, #FFF4F0 0%, #FFEADC 30%, #EDE9FF 70%, #D2CCFF 100%)',
      }}
    >
      {/* Animated gradient orbs */}
      {[
        { top: '10%', left: '5%', size: 300, color: '#FF7A45', delay: 0 },
        { top: '50%', right: '8%', size: 350, color: '#6C5CE7', delay: 2 },
        { bottom: '5%', left: '45%', size: 250, color: '#00CEC9', delay: 4 },
      ].map((orb, i) => (
        <MotionBox
          key={i}
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
          style={{ y: heroY }}
          sx={{
            position: 'absolute',
            top: orb.top,
            left: (orb.left as string) || undefined,
            right: (orb.right as string) || undefined,
            bottom: (orb.bottom as string) || undefined,
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: orb.color,
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} md={6}>
            <MotionBox variants={staggerContainer} initial="hidden" animate="visible">
              {/* Badge */}
              <motion.div variants={fadeInScale}>
                <Chip
                  icon={<Star sx={{ fontSize: 16 }} />}
                  label="Welcome to Your Learning Journey"
                  sx={{
                    mb: 3,
                    height: 36,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    bgcolor: alpha('#FF7A45', 0.12),
                    color: '#FF7A45',
                    border: `1px solid ${alpha('#FF7A45', 0.3)}`,
                  }}
                />
              </motion.div>

              {/* Main Heading */}
              <MotionTypography
                variant="h2"
                variants={fadeInUp}
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: 'linear-gradient(135deg, #FF7A45 0%, #6C5CE7 50%, #00CEC9 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                Propel Through Your Learning Journey
              </MotionTypography>

              {/* Subheading */}
              <MotionTypography
                variant="h6"
                variants={fadeInUp}
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  fontWeight: 400,
                  maxWidth: 500,
                  lineHeight: 1.6,
                }}
              >
                Built with motion, depth, and extreme clarity. Experience learning transformed
                through intelligent, immersive technology.
              </MotionTypography>

              {/* CTA Buttons */}
              <motion.div variants={fadeInUp}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 6 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      component={RouterLink}
                      to="/student-dashboard"
                      variant="contained"
                      size="large"
                      endIcon={<ChevronRight />}
                      sx={{
                        px: 4,
                        py: 1.8,
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #FF7A45 0%, #FF6B4A 100%)',
                        textTransform: 'none',
                        color: 'white',
                        boxShadow: '0 12px 30px rgba(255, 122, 69, 0.25)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #FF8659 0%, #FF7A45 100%)',
                          boxShadow: '0 20px 40px rgba(255, 122, 69, 0.3)',
                        },
                      }}
                    >
                      Start Learning
                    </Button>
                  </motion.div>

                  <MotionButton
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrow />}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    sx={{
                      px: 4,
                      py: 1.8,
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: 3,
                      borderWidth: 2,
                      color: '#FF7A45',
                      borderColor: '#FF7A45',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#FF6B4A',
                        bgcolor: alpha('#FF7A45', 0.08),
                      },
                    }}
                  >
                    Take the Tour
                  </MotionButton>
                </Stack>
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeInUp}>
                <Stack direction="row" spacing={4} sx={{ mt: 8 }}>
                  {[
                    { value: '50K+', label: 'Active Learners' },
                    { value: '300+', label: 'Institutions' },
                    { value: '98%', label: 'Satisfaction' },
                  ].map((stat, i) => (
                    <Box key={i}>
                      <Typography
                        sx={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #FF7A45 0%, #6C5CE7 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </motion.div>
            </MotionBox>
          </Grid>

          {/* Right Visual */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}
          >
            <MotionBox
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 500,
                height: 500,
              }}
            >
              {/* Layered gradient cards for depth */}
              {[
                { delay: 0, rotation: -8, y: -20, blur: 0 },
                { delay: 0.1, rotation: -4, y: -10, blur: 8 },
                { delay: 0.2, rotation: 0, y: 0, blur: 0 },
              ].map((layer, i) => (
                <MotionBox
                  key={i}
                  animate={{ y: [layer.y, layer.y - 8, layer.y] }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: layer.delay,
                  }}
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: 300,
                    borderRadius: 3,
                    background: [
                      'linear-gradient(135deg, rgba(255, 122, 69, 0.8) 0%, rgba(255, 107, 74, 0.6) 100%)',
                      'linear-gradient(135deg, rgba(108, 92, 231, 0.8) 0%, rgba(108, 92, 231, 0.6) 100%)',
                      'linear-gradient(135deg, rgba(0, 206, 201, 0.8) 0%, rgba(0, 206, 201, 0.6) 100%)',
                    ][i],
                    backdropFilter: `blur(${layer.blur}px)`,
                    border: `1px solid ${alpha('#ffffff', 0.2)}`,
                    boxShadow: i === 2 ? '0 30px 60px rgba(0, 0, 0, 0.15)' : 'none',
                    transform: `rotate(${layer.rotation}deg)`,
                    top: i * 15,
                    left: i * 10,
                  }}
                >
                  <Stack
                    sx={{
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      p: 3,
                      color: 'white',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {['Discover', 'Learn', 'Achieve'][i]}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {['Your unique path', 'At your pace', 'Your goals'][i]}
                    </Typography>
                  </Stack>
                </MotionBox>
              ))}
            </MotionBox>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function JourneySection() {
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <MotionBox
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          sx={{ textAlign: 'center', mb: 10 }}
        >
          <Chip
            label="Your Learning Path"
            sx={{
              mb: 2,
              height: 32,
              fontSize: '0.85rem',
              bgcolor: alpha('#6C5CE7', 0.12),
              color: '#6C5CE7',
              border: `1px solid ${alpha('#6C5CE7', 0.3)}`,
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            The Journey to Excellence
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            A structured path designed to transform how you learn and grow
          </Typography>
        </MotionBox>

        {/* Journey Steps */}
        <Grid container spacing={4}>
          {journeySteps.map((step, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <MotionCard
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
                sx={{
                  height: '100%',
                  border: 'none',
                  background: step.bgGradient,
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: step.color,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  {/* Step Number */}
                  <Typography
                    sx={{
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      color: step.color,
                      opacity: 0.2,
                      mb: -1,
                    }}
                  >
                    {step.number}
                  </Typography>

                  {/* Icon */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      bgcolor: alpha(step.color, 0.15),
                      color: step.color,
                      mb: 2,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {step.icon}
                  </Box>

                  {/* Title */}
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                    {step.title}
                  </Typography>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {step.description}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {/* Connection Line */}
        {!_isMobile && (
          <Box
            sx={{
              mt: 6,
              display: 'flex',
              justifyContent: 'space-around',
              opacity: 0.3,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: '20%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #FF7A45, transparent)',
                }}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

function CapabilitiesSection() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #F5F5F5 0%, #FAFAFA 100%)',
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <MotionBox
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          sx={{ textAlign: 'center', mb: 8 }}
        >
          <Chip
            label="Powerful Features"
            sx={{
              mb: 2,
              height: 32,
              fontSize: '0.85rem',
              bgcolor: alpha('#00CEC9', 0.12),
              color: '#00CEC9',
              border: `1px solid ${alpha('#00CEC9', 0.3)}`,
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            Everything You Need to Succeed
          </Typography>
        </MotionBox>

        {/* Capabilities Grid */}
        <Grid container spacing={3}>
          {capabilities.map((capability, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <MotionBox
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: `1px solid ${alpha('#000', 0.08)}`,
                  textAlign: 'center',
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#00CEC9',
                    boxShadow: '0 12px 30px rgba(0, 206, 201, 0.15)',
                  },
                }}
              >
                <Box sx={{ color: '#00CEC9', mb: 2 }}>{capability.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {capability.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {capability.description}
                </Typography>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function TestimonialsSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <MotionBox
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          sx={{ textAlign: 'center', mb: 8 }}
        >
          <Chip
            label="Success Stories"
            sx={{
              mb: 2,
              height: 32,
              fontSize: '0.85rem',
              bgcolor: alpha('#FF7A45', 0.12),
              color: '#FF7A45',
              border: `1px solid ${alpha('#FF7A45', 0.3)}`,
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            Hear From Our Learners
          </Typography>
        </MotionBox>

        {/* Testimonials Grid */}
        <Grid container spacing={3}>
          {testimonials.map((testimonial, i) => (
            <Grid item xs={12} md={4} key={i}>
              <MotionCard
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)' }}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  {/* Stars */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} sx={{ fontSize: 18, color: '#FDCB6E' }} />
                    ))}
                  </Box>

                  {/* Quote */}
                  <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', fontWeight: 500 }}>
                    &ldquo;{testimonial.quote}&rdquo;
                  </Typography>

                  {/* Achievement Badge */}
                  <Chip
                    label={testimonial.achievement}
                    size="small"
                    sx={{
                      mb: 2,
                      bgcolor: alpha('#00CEC9', 0.12),
                      color: '#00CEC9',
                      fontWeight: 600,
                    }}
                  />

                  {/* Author */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 3 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #FF7A45 0%, #6C5CE7 100%)',
                        fontSize: '1.5rem',
                      }}
                    >
                      {testimonial.avatar}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function CTASection() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 },
        background: 'linear-gradient(135deg, #FF7A45 0%, #6C5CE7 50%, #00CEC9 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background animation */}
      <MotionBox
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        sx={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionBox
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          sx={{ textAlign: 'center' }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Ready to Transform Your Learning?
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 4,
              fontWeight: 400,
              opacity: 0.95,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Join thousands of learners on their journey to excellence
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'center' }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button
                component={RouterLink}
                to="/student-dashboard"
                variant="contained"
                size="large"
                endIcon={<ChevronRight />}
                sx={{
                  px: 4,
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  bgcolor: 'white',
                  color: '#FF7A45',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: alpha('white', 0.9),
                  },
                }}
              >
                Get Started Now
              </Button>
            </motion.div>

            <MotionButton
              variant="outlined"
              size="large"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              sx={{
                px: 4,
                py: 1.8,
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 3,
                borderColor: 'white',
                color: 'white',
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: alpha('white', 0.1),
                },
              }}
            >
              Learn More
            </MotionButton>
          </Stack>
        </MotionBox>
      </Container>
    </Box>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <AnimatePresence>
        {!isLoading && (
          <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HeroSection />
            <JourneySection />
            <CapabilitiesSection />
            <TestimonialsSection />
            <CTASection />
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}
