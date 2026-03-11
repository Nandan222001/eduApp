import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Avatar,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Redeem as RedeemIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { gamificationAPI } from '../../api/gamification';
import { Reward, UserRedemption, UserPoints } from '../../types/gamification';

interface RewardsRedemptionProps {
  userId: number;
  institutionId: number;
}

const RewardsRedemption: React.FC<RewardsRedemptionProps> = ({ userId, institutionId }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<UserRedemption[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, institutionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rewardsData, redemptionsData, pointsData] = await Promise.all([
        gamificationAPI.getRewards(institutionId),
        gamificationAPI.getUserRedemptions(userId, institutionId),
        gamificationAPI.getUserPoints(userId, institutionId),
      ]);
      setRewards(rewardsData);
      setRedemptions(redemptionsData);
      setUserPoints(pointsData);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setConfirmOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    try {
      setRedeeming(true);
      await gamificationAPI.redeemReward(userId, selectedReward.id, institutionId);
      await loadData();
      setConfirmOpen(false);
      setSelectedReward(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  const canAfford = (reward: Reward): boolean => {
    return userPoints ? userPoints.total_points >= reward.points_cost : false;
  };

  const isOutOfStock = (reward: Reward): boolean => {
    return reward.stock_quantity !== null && reward.stock_quantity <= 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'delivered':
        return <ShippingIcon color="info" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'delivered':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const availableRewards = rewards.filter((r) => r.is_active);
  const categorizedRewards = availableRewards.reduce(
    (acc, reward) => {
      if (!acc[reward.category]) {
        acc[reward.category] = [];
      }
      acc[reward.category].push(reward);
      return acc;
    },
    {} as Record<string, Reward[]>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Rewards Shop
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Redeem your points for exciting rewards
            </Typography>
          </Box>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <StarIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {userPoints?.total_points.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available Points
              </Typography>
            </Box>
          </Paper>
        </Stack>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Available Rewards" />
          <Tab label={`My Redemptions (${redemptions.length})`} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {Object.keys(categorizedRewards).length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <RedeemIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No rewards available
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Check back later for exciting rewards!
              </Typography>
            </Paper>
          ) : (
            Object.entries(categorizedRewards).map(([category, categoryRewards]) => (
              <Box key={category} mb={4}>
                <Typography variant="h5" fontWeight="bold" mb={2}>
                  {category}
                </Typography>
                <Grid container spacing={3}>
                  {categoryRewards.map((reward) => {
                    const affordable = canAfford(reward);
                    const outOfStock = isOutOfStock(reward);
                    const disabled = !affordable || outOfStock;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={reward.id}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            opacity: disabled ? 0.6 : 1,
                            transition: 'all 0.3s',
                            '&:hover': {
                              transform: disabled ? 'none' : 'translateY(-4px)',
                              boxShadow: disabled ? 'none' : 6,
                            },
                          }}
                        >
                          {reward.icon_url && (
                            <Box
                              sx={{
                                height: 200,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'grey.100',
                              }}
                            >
                              <img
                                src={reward.icon_url}
                                alt={reward.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          )}
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                              {reward.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 2, minHeight: 40 }}
                            >
                              {reward.description}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                icon={<StarIcon />}
                                label={`${reward.points_cost.toLocaleString()} points`}
                                color="primary"
                                sx={{ fontWeight: 'bold' }}
                              />
                              {reward.stock_quantity !== null && (
                                <Chip
                                  label={
                                    outOfStock ? 'Out of Stock' : `${reward.stock_quantity} left`
                                  }
                                  size="small"
                                  color={outOfStock ? 'error' : 'default'}
                                />
                              )}
                            </Stack>
                          </CardContent>
                          <CardActions>
                            <Button
                              fullWidth
                              variant="contained"
                              disabled={disabled}
                              onClick={() => handleRedeemClick(reward)}
                              startIcon={<RedeemIcon />}
                            >
                              {outOfStock
                                ? 'Out of Stock'
                                : !affordable
                                  ? 'Not Enough Points'
                                  : 'Redeem'}
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            ))
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {redemptions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No redemptions yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Redeem rewards to see them here
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {redemptions.map((redemption) => (
                <Grid item xs={12} key={redemption.id}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                          {getStatusIcon(redemption.status)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold">
                            {redemption.reward?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {redemption.reward?.description}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={redemption.status.toUpperCase()}
                              color={
                                getStatusColor(redemption.status) as
                                  | 'default'
                                  | 'primary'
                                  | 'secondary'
                                  | 'error'
                                  | 'info'
                                  | 'success'
                                  | 'warning'
                              }
                              size="small"
                            />
                            <Chip
                              label={`${redemption.points_spent.toLocaleString()} points`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="caption" color="text.secondary">
                            Redeemed
                          </Typography>
                          <Typography variant="body2">
                            {new Date(redemption.redeemed_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                      {redemption.notes && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Notes:</strong> {redemption.notes}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <Dialog open={confirmOpen} onClose={() => !redeeming && setConfirmOpen(false)}>
        <DialogTitle>Confirm Redemption</DialogTitle>
        <DialogContent>
          {selectedReward && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to redeem <strong>{selectedReward.name}</strong>?
              </Typography>
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Cost:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedReward.points_cost.toLocaleString()} points
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Your Points:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {userPoints?.total_points.toLocaleString()} points
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Remaining:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {(
                        (userPoints?.total_points || 0) - selectedReward.points_cost
                      ).toLocaleString()}{' '}
                      points
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={redeeming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRedeem}
            variant="contained"
            disabled={redeeming}
            startIcon={redeeming ? <CircularProgress size={20} /> : <RedeemIcon />}
          >
            {redeeming ? 'Redeeming...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RewardsRedemption;
