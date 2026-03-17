import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  alpha,
  useTheme,
  Chip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  CardGiftcard as RewardIcon,
  WorkspacePremium as CertificateIcon,
} from '@mui/icons-material';
import { Prize } from '@/api/olympics';

interface PrizeShowcaseProps {
  prizes: Prize[];
}

export default function PrizeShowcase({ prizes }: PrizeShowcaseProps) {
  const theme = useTheme();

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case 'trophy':
        return <TrophyIcon sx={{ fontSize: 48 }} />;
      case 'medal':
        return <MedalIcon sx={{ fontSize: 48 }} />;
      case 'certificate':
        return <CertificateIcon sx={{ fontSize: 48 }} />;
      case 'reward':
        return <RewardIcon sx={{ fontSize: 48 }} />;
      default:
        return <TrophyIcon sx={{ fontSize: 48 }} />;
    }
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return theme.palette.grey[400];
  };

  const getRankLabel = (rankFrom: number, rankTo: number) => {
    if (rankFrom === rankTo) {
      if (rankFrom === 1) return '🥇 1st Place';
      if (rankFrom === 2) return '🥈 2nd Place';
      if (rankFrom === 3) return '🥉 3rd Place';
      return `${rankFrom}th Place`;
    }
    return `Rank ${rankFrom} - ${rankTo}`;
  };

  const topPrizes = prizes.filter((p) => p.rank_from <= 3);
  const otherPrizes = prizes.filter((p) => p.rank_from > 3);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <TrophyIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Prizes & Awards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compete for amazing prizes and recognition
          </Typography>
        </Box>
      </Stack>

      {topPrizes.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Top Prizes
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {topPrizes
              .sort((a, b) => a.rank_from - b.rank_from)
              .map((prize) => (
                <Grid item xs={12} sm={6} md={4} key={prize.id}>
                  <Card
                    sx={{
                      height: '100%',
                      background: `linear-gradient(135deg, ${alpha(getRankColor(prize.rank_from), 0.1)} 0%, ${alpha(getRankColor(prize.rank_from), 0.05)} 100%)`,
                      border: `2px solid ${getRankColor(prize.rank_from)}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            color: getRankColor(prize.rank_from),
                            mb: 1,
                          }}
                        >
                          {getPrizeIcon(prize.prize_type)}
                        </Box>
                        <Chip
                          label={getRankLabel(prize.rank_from, prize.rank_to)}
                          sx={{
                            bgcolor: getRankColor(prize.rank_from),
                            color: '#000',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>

                      <Typography variant="h6" fontWeight="bold" textAlign="center" gutterBottom>
                        {prize.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 2 }}
                      >
                        {prize.description}
                      </Typography>

                      {prize.value && (
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: alpha(getRankColor(prize.rank_from), 0.2),
                            borderRadius: 1,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {prize.value}
                          </Typography>
                        </Box>
                      )}

                      {prize.image_url && (
                        <Box
                          component="img"
                          src={prize.image_url}
                          alt={prize.name}
                          sx={{
                            width: '100%',
                            height: 120,
                            objectFit: 'contain',
                            mt: 2,
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {otherPrizes.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Additional Prizes
          </Typography>
          <Grid container spacing={2}>
            {otherPrizes
              .sort((a, b) => a.rank_from - b.rank_from)
              .map((prize) => (
                <Grid item xs={12} sm={6} md={4} key={prize.id}>
                  <Card
                    sx={{
                      height: '100%',
                      border: 1,
                      borderColor: 'divider',
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                        <Box sx={{ color: theme.palette.primary.main }}>
                          {getPrizeIcon(prize.prize_type)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {prize.name}
                          </Typography>
                          <Chip
                            label={getRankLabel(prize.rank_from, prize.rank_to)}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {prize.description}
                      </Typography>

                      {prize.value && (
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {prize.value}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {prizes.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Prize information will be announced soon
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
