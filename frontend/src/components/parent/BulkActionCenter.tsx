import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Download as DownloadIcon,
  EventAvailable as EventIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parentsApi } from '@/api/parents';
import type {
  ChildOverview,
  BulkFeePaymentRequest,
  BulkEventRSVPRequest,
  SharedFamilyInfo,
} from '@/types/parent';

interface BulkActionCenterProps {
  allChildren: ChildOverview[];
}

type BulkActionType = 'fees' | 'reports' | 'rsvp' | 'info' | null;

export const BulkActionCenter: React.FC<BulkActionCenterProps> = ({ allChildren }) => {
  const [selectedChildren, setSelectedChildren] = useState<number[]>(allChildren.map((c) => c.id));
  const [currentAction, setCurrentAction] = useState<BulkActionType>(null);
  const [feePaymentData, setFeePaymentData] = useState({
    fee_structure_id: '',
    payment_method: 'cash',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [eventRSVPData, setEventRSVPData] = useState({
    event_id: '',
    status: 'accepted',
    number_of_guests: 0,
    remarks: '',
  });
  const queryClient = useQueryClient();

  const { data: sharedInfo } = useQuery({
    queryKey: ['shared-family-info'],
    queryFn: () => parentsApi.getSharedFamilyInfo(),
  });

  const [familyInfo, setFamilyInfo] = useState<SharedFamilyInfo>({});

  React.useEffect(() => {
    if (sharedInfo) {
      setFamilyInfo(sharedInfo);
    }
  }, [sharedInfo]);

  const bulkPayFeesMutation = useMutation({
    mutationFn: (request: BulkFeePaymentRequest) => parentsApi.bulkPayFees(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-overview-metrics'] });
      setCurrentAction(null);
    },
  });

  const bulkDownloadReportsMutation = useMutation({
    mutationFn: (studentIds: number[]) => parentsApi.bulkDownloadReportCards(studentIds),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-report-cards-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setCurrentAction(null);
    },
  });

  const bulkRSVPMutation = useMutation({
    mutationFn: (request: BulkEventRSVPRequest) => parentsApi.bulkRSVPEvents(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-calendar-events'] });
      setCurrentAction(null);
    },
  });

  const updateSharedInfoMutation = useMutation({
    mutationFn: (info: SharedFamilyInfo) => parentsApi.updateSharedFamilyInfo(info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-family-info'] });
      setCurrentAction(null);
    },
  });

  const handleChildToggle = (childId: number) => {
    setSelectedChildren((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const handleSelectAll = () => {
    setSelectedChildren(allChildren.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedChildren([]);
  };

  const handleBulkPayFees = () => {
    if (!feePaymentData.fee_structure_id || !feePaymentData.amount) {
      return;
    }

    const request: BulkFeePaymentRequest = {
      student_ids: selectedChildren,
      fee_structure_id: Number(feePaymentData.fee_structure_id),
      payment_method: feePaymentData.payment_method,
      amount: Number(feePaymentData.amount),
      payment_date: feePaymentData.payment_date,
    };

    bulkPayFeesMutation.mutate(request);
  };

  const handleBulkDownloadReports = () => {
    bulkDownloadReportsMutation.mutate(selectedChildren);
  };

  const handleBulkRSVP = () => {
    if (!eventRSVPData.event_id) {
      return;
    }

    const request: BulkEventRSVPRequest = {
      student_ids: selectedChildren,
      event_id: Number(eventRSVPData.event_id),
      status: eventRSVPData.status,
      number_of_guests: eventRSVPData.number_of_guests,
      remarks: eventRSVPData.remarks,
    };

    bulkRSVPMutation.mutate(request);
  };

  const handleUpdateSharedInfo = () => {
    updateSharedInfoMutation.mutate(familyInfo);
  };

  const closeDialog = () => {
    setCurrentAction(null);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Children for Bulk Actions
          </Typography>
          <Stack direction="row" spacing={2} mb={2}>
            <Button size="small" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="small" onClick={handleDeselectAll}>
              Deselect All
            </Button>
            <Chip label={`${selectedChildren.length} selected`} color="primary" />
          </Stack>
          <FormGroup row>
            {allChildren.map((child) => (
              <FormControlLabel
                key={child.id}
                control={
                  <Checkbox
                    checked={selectedChildren.includes(child.id)}
                    onChange={() => handleChildToggle(child.id)}
                  />
                }
                label={`${child.first_name} ${child.last_name}`}
              />
            ))}
          </FormGroup>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setCurrentAction('fees')}>
            <CardContent>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <PaymentIcon sx={{ fontSize: 48 }} color="primary" />
                <Typography variant="h6">Pay Fees</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay fees for multiple children at once
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ height: '100%', cursor: 'pointer' }}
            onClick={() => setCurrentAction('reports')}
          >
            <CardContent>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <DownloadIcon sx={{ fontSize: 48 }} color="primary" />
                <Typography variant="h6">Download Reports</Typography>
                <Typography variant="body2" color="text.secondary">
                  Download report cards for all children
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setCurrentAction('rsvp')}>
            <CardContent>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <EventIcon sx={{ fontSize: 48 }} color="primary" />
                <Typography variant="h6">RSVP Events</Typography>
                <Typography variant="body2" color="text.secondary">
                  RSVP to events for all children
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setCurrentAction('info')}>
            <CardContent>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <EditIcon sx={{ fontSize: 48 }} color="primary" />
                <Typography variant="h6">Update Info</Typography>
                <Typography variant="body2" color="text.secondary">
                  Update shared information across all children
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={currentAction === 'fees'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Fee Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            <Alert severity="info">Paying fees for {selectedChildren.length} child(ren)</Alert>
            <TextField
              fullWidth
              label="Fee Structure ID"
              value={feePaymentData.fee_structure_id}
              onChange={(e) =>
                setFeePaymentData({ ...feePaymentData, fee_structure_id: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Amount per Child"
              type="number"
              value={feePaymentData.amount}
              onChange={(e) => setFeePaymentData({ ...feePaymentData, amount: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={feePaymentData.payment_method}
                label="Payment Method"
                onChange={(e) =>
                  setFeePaymentData({ ...feePaymentData, payment_method: e.target.value })
                }
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Payment Date"
              type="date"
              value={feePaymentData.payment_date}
              onChange={(e) =>
                setFeePaymentData({ ...feePaymentData, payment_date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            {feePaymentData.amount && (
              <Alert severity="success">
                Total Amount: $
                {(Number(feePaymentData.amount) * selectedChildren.length).toFixed(2)}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBulkPayFees}
            disabled={bulkPayFeesMutation.isPending}
            startIcon={
              bulkPayFeesMutation.isPending ? <CircularProgress size={20} /> : <PaymentIcon />
            }
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={currentAction === 'reports'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Download Report Cards</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity="info">
              Downloading report cards for {selectedChildren.length} child(ren)
            </Alert>
            <List>
              {allChildren
                .filter((c) => selectedChildren.includes(c.id))
                .map((child) => (
                  <ListItem key={child.id}>
                    <ListItemText
                      primary={`${child.first_name} ${child.last_name}`}
                      secondary={`${child.grade_name} ${child.section_name}`}
                    />
                  </ListItem>
                ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBulkDownloadReports}
            disabled={bulkDownloadReportsMutation.isPending}
            startIcon={
              bulkDownloadReportsMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <DownloadIcon />
              )
            }
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={currentAction === 'rsvp'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Event RSVP</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            <Alert severity="info">RSVP for {selectedChildren.length} child(ren)</Alert>
            <TextField
              fullWidth
              label="Event ID"
              value={eventRSVPData.event_id}
              onChange={(e) => setEventRSVPData({ ...eventRSVPData, event_id: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Response</InputLabel>
              <Select
                value={eventRSVPData.status}
                label="Response"
                onChange={(e) => setEventRSVPData({ ...eventRSVPData, status: e.target.value })}
              >
                <MenuItem value="accepted">Accept</MenuItem>
                <MenuItem value="declined">Decline</MenuItem>
                <MenuItem value="tentative">Maybe</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Number of Guests"
              type="number"
              value={eventRSVPData.number_of_guests}
              onChange={(e) =>
                setEventRSVPData({ ...eventRSVPData, number_of_guests: Number(e.target.value) })
              }
            />
            <TextField
              fullWidth
              label="Remarks"
              multiline
              rows={3}
              value={eventRSVPData.remarks}
              onChange={(e) => setEventRSVPData({ ...eventRSVPData, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBulkRSVP}
            disabled={bulkRSVPMutation.isPending}
            startIcon={bulkRSVPMutation.isPending ? <CircularProgress size={20} /> : <EventIcon />}
          >
            Submit RSVP
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={currentAction === 'info'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Update Shared Family Information</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            <Alert severity="info">
              This information will be updated across all children&apos;s records
            </Alert>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">
              Address Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={familyInfo.address || ''}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={familyInfo.city || ''}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={familyInfo.state || ''}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={familyInfo.postal_code || ''}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, postal_code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={familyInfo.country || ''}
                  onChange={(e) => setFamilyInfo({ ...familyInfo, country: e.target.value })}
                />
              </Grid>
            </Grid>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">
              Emergency Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  value={familyInfo.emergency_contact_name || ''}
                  onChange={(e) =>
                    setFamilyInfo({ ...familyInfo, emergency_contact_name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  value={familyInfo.emergency_contact_phone || ''}
                  onChange={(e) =>
                    setFamilyInfo({ ...familyInfo, emergency_contact_phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={familyInfo.emergency_contact_relationship || ''}
                  onChange={(e) =>
                    setFamilyInfo({ ...familyInfo, emergency_contact_relationship: e.target.value })
                  }
                />
              </Grid>
            </Grid>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">
              Secondary Emergency Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Secondary Contact Name"
                  value={familyInfo.secondary_emergency_contact_name || ''}
                  onChange={(e) =>
                    setFamilyInfo({
                      ...familyInfo,
                      secondary_emergency_contact_name: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Secondary Contact Phone"
                  value={familyInfo.secondary_emergency_contact_phone || ''}
                  onChange={(e) =>
                    setFamilyInfo({
                      ...familyInfo,
                      secondary_emergency_contact_phone: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateSharedInfo}
            disabled={updateSharedInfoMutation.isPending}
            startIcon={
              updateSharedInfoMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <CheckCircleIcon />
              )
            }
          >
            Update Information
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
