// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  Avatar,
  Tab,
  Tabs,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  AlertTitle,
} from '@mui/material';
import {
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Profile Settings
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: 'Administration',
    role: 'Administrator',
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    systemAlerts: true,
    newUserRegistrations: true,
    dailyReports: false,
    weeklyReports: true,
    monthlyReports: false,
  });

  // System Settings
  const [system, setSystem] = useState({
    clinicName: 'Uzima Healthcare',
    clinicAddress: '123 Healthcare Ave, Medical District',
    clinicPhone: '+254 700 000 000',
    clinicEmail: 'info@uzimahealthcare.com',
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    maxAppointmentsPerDay: 50,
    appointmentDuration: 30,
    enableOnlineBooking: true,
    requireApproval: true,
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: 30,
  });

  // Security Settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    ipWhitelisting: false,
  });

  // Backup History
  const [backupHistory, setBackupHistory] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchBackupHistory();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetchLoading(true);
      const response = await api.get('/admin/settings');
      if (response.data) {
        // Update all settings states with data from backend
        if (response.data.notifications) {
          setNotifications(response.data.notifications);
        }
        if (response.data.system) {
          setSystem(response.data.system);
        }
        if (response.data.security) {
          setSecurity(response.data.security);
        }
        toast.success('Settings loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Don't show error toast on first load - just use defaults
      if (error.response?.status !== 404) {
        toast.error('Failed to load settings. Using defaults.');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchBackupHistory = async () => {
    try {
      const response = await api.get('/admin/backup/history');
      setBackupHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching backup history:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked,
    });
  };

  const handleSystemChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSystem({
      ...system,
      [e.target.name]: value,
    });
  };

  const handleSecurityChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSecurity({
      ...security,
      [e.target.name]: value,
    });
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await api.put('/admin/profile', profile);
      if (updateUser) {
        updateUser(profile);
      }
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/settings/notifications', notifications);
      toast.success('Notification settings saved');
      // Update with any returned data
      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystem = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/settings/system', system);
      toast.success('System settings saved');
      if (response.data?.system) {
        setSystem(response.data.system);
      }
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('Failed to save system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/settings/security', security);
      toast.success('Security settings saved');
      if (response.data?.security) {
        setSecurity(response.data.security);
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await api.post('/admin/backup');
      toast.success('Backup created successfully');
      
      // Refresh backup history
      fetchBackupHistory();
      
      // Trigger download if backend returns a file
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, color: '#333' }}>
        System Settings
      </Typography>

      <Paper sx={{ width: '100%', borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root.Mui-selected': {
              color: '#16a34a',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#16a34a',
            },
          }}
        >
          <Tab icon={<PersonIcon />} label="Profile" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
          <Tab icon={<StorageIcon />} label="System" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
          <Tab icon={<BackupIcon />} label="Backup" iconPosition="start" />
        </Tabs>

        {/* Profile Tab - unchanged */}
        <TabPanel value={tabValue} index={0}>
          {/* ... Profile tab content remains exactly the same ... */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#16a34a',
                      fontSize: 40,
                      margin: '0 auto 16px',
                    }}
                  >
                    {profile.name?.charAt(0) || 'A'}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {profile.name || 'Admin User'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {profile.role}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {profile.department}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 2 }}
                    size="small"
                  >
                    Change Photo
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        name="name"
                        label="Full Name"
                        value={profile.name}
                        onChange={handleProfileChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: '#16a34a' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        name="email"
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: '#16a34a' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        name="phone"
                        label="Phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon sx={{ color: '#16a34a' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Change Password
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        name="currentPassword"
                        label="Current Password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: '#16a34a' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        name="newPassword"
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                edge="end"
                                size="small"
                              >
                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                                size="small"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleChangePassword}
                      disabled={loading}
                    >
                      Change Password
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab - unchanged */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Notification Preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="emailNotifications"
                        checked={notifications.emailNotifications}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="smsNotifications"
                        checked={notifications.smsNotifications}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="SMS Notifications"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="appointmentReminders"
                        checked={notifications.appointmentReminders}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="Appointment Reminders"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="systemAlerts"
                        checked={notifications.systemAlerts}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="System Alerts"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="newUserRegistrations"
                        checked={notifications.newUserRegistrations}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="New User Registrations"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="dailyReports"
                        checked={notifications.dailyReports}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="Daily Reports"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="weeklyReports"
                        checked={notifications.weeklyReports}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="Weekly Reports"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="monthlyReports"
                        checked={notifications.monthlyReports}
                        onChange={handleNotificationChange}
                        color="primary"
                      />
                    }
                    label="Monthly Reports"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                >
                  Save Notification Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* System Tab - unchanged */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Clinic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="clinicName"
                    label="Clinic/Hospital Name"
                    value={system.clinicName}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="clinicAddress"
                    label="Address"
                    value={system.clinicAddress}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="clinicPhone"
                    label="Phone"
                    value={system.clinicPhone}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="clinicEmail"
                    label="Email"
                    value={system.clinicEmail}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Working Hours
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="workingHoursStart"
                    label="Start Time"
                    type="time"
                    value={system.workingHoursStart}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="workingHoursEnd"
                    label="End Time"
                    type="time"
                    value={system.workingHoursEnd}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Appointment Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="maxAppointmentsPerDay"
                    label="Max Appointments Per Day"
                    type="number"
                    value={system.maxAppointmentsPerDay}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="appointmentDuration"
                    label="Appointment Duration (minutes)"
                    type="number"
                    value={system.appointmentDuration}
                    onChange={handleSystemChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="enableOnlineBooking"
                        checked={system.enableOnlineBooking}
                        onChange={handleSystemChange}
                        color="primary"
                      />
                    }
                    label="Enable Online Booking"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="requireApproval"
                        checked={system.requireApproval}
                        onChange={handleSystemChange}
                        color="primary"
                      />
                    }
                    label="Require Approval for Appointments"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSystem}
                  disabled={loading}
                  sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                >
                  Save System Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Security Tab - unchanged */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Security Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="twoFactorAuth"
                        checked={security.twoFactorAuth}
                        onChange={handleSecurityChange}
                        color="primary"
                      />
                    }
                    label="Enable Two-Factor Authentication"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="ipWhitelisting"
                        checked={security.ipWhitelisting}
                        onChange={handleSecurityChange}
                        color="primary"
                      />
                    }
                    label="Enable IP Whitelisting"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    name="sessionTimeout"
                    label="Session Timeout (minutes)"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={handleSecurityChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    name="passwordExpiry"
                    label="Password Expiry (days)"
                    type="number"
                    value={security.passwordExpiry}
                    onChange={handleSecurityChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    name="maxLoginAttempts"
                    label="Max Login Attempts"
                    type="number"
                    value={security.maxLoginAttempts}
                    onChange={handleSecurityChange}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSecurity}
                  disabled={loading}
                  sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                >
                  Save Security Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Backup Tab - UPDATED with backup history */}
        <TabPanel value={tabValue} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Backup & Restore
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BackupIcon sx={{ fontSize: 40, color: '#16a34a', mr: 2 }} />
                      <Typography variant="h6">Manual Backup</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Create a manual backup of your entire system data including all patients, doctors, appointments, and settings.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<BackupIcon />}
                      onClick={handleBackup}
                      disabled={backupLoading}
                      fullWidth
                      sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                    >
                      {backupLoading ? 'Creating Backup...' : 'Create Backup Now'}
                    </Button>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <StorageIcon sx={{ fontSize: 40, color: '#3b82f6', mr: 2 }} />
                      <Typography variant="h6">Automatic Backup</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              name="autoBackup"
                              checked={system.autoBackup}
                              onChange={handleSystemChange}
                              color="primary"
                            />
                          }
                          label="Enable Automatic Backup"
                        />
                      </Grid>
                      {system.autoBackup && (
                        <>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              name="backupFrequency"
                              label="Backup Frequency"
                              select
                              value={system.backupFrequency}
                              onChange={handleSystemChange}
                              fullWidth
                              size="small"
                              SelectProps={{
                                native: true,
                              }}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              name="retentionPeriod"
                              label="Retention Period (days)"
                              type="number"
                              value={system.retentionPeriod}
                              onChange={handleSystemChange}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Paper>
                </Grid>

                {/* Backup History Section */}
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Backup History
                    </Typography>
                    {backupHistory.length > 0 ? (
                      <Grid container spacing={1}>
                        {backupHistory.map((backup, index) => (
                          <Grid size={{ xs: 12 }} key={index}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1,
                              bgcolor: '#f5f5f5',
                              borderRadius: 1
                            }}>
                              <Typography variant="body2">
                                {new Date(backup.date).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Size: {backup.size} KB
                              </Typography>
                              <Chip
                                label={backup.status}
                                color={backup.status === 'success' ? 'success' : 'error'}
                                size="small"
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No backups have been created yet.
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Alert severity="info">
                    <AlertTitle>Backup Information</AlertTitle>
                    Backups are stored securely in the cloud. The latest backup was created on {backupHistory[0]?.date ? new Date(backupHistory[0].date).toLocaleString() : 'Never'}.
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;