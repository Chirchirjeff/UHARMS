// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  ButtonGroup,
  Chip,
  Avatar,
  Divider,
  Grid,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
} from '@mui/material';
import {
  People,
  LocalHospital,
  Event,
  TrendingUp,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  FileDownload as FileDownloadIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { saveAs } from 'file-saver';

// Helper function to format date safely
const getFormattedDate = () => {
  try {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Loading date...';
  }
};

const StatCard = ({ title, value, icon, color, trend }) => (
  <Card sx={{ height: '100%', borderRadius: 2, position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {title || 'Loading...'}
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', mt: 1 }}>
            {value !== undefined ? value : '0'}
          </Typography>
          {trend && (
            <Chip
              label={trend}
              size="small"
              color={trend.includes('+') ? 'success' : 'error'}
              sx={{ mt: 1, fontSize: '0.75rem', height: 20 }}
            />
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: color || '#ccc',
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: color ? `0 4px 12px ${color}40` : 'none',
          }}
        >
          {icon || <People />}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth() || { user: null };
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    totalAppointments: 0,
    completionRate: 0,
    satisfactionRate: 0,
    availabilityRate: 0,
    nextAppointment: null,
    pendingConfirmations: 0,
    completedToday: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  
  // Export related state
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedReports, setSelectedReports] = useState({
    dashboard: true,
    doctors: true,
    patients: true,
    appointments: true,
  });
  const [reportData, setReportData] = useState({
    doctors: [],
    patients: [],
    appointments: [],
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    setCurrentDate(getFormattedDate());
    testConnection();
    fetchReportData();
  }, []);

  const testConnection = async () => {
    try {
      const response = await api.get('/health');
      console.log('Connection successful:', response.data);
      setConnectionStatus('connected');
      fetchDashboardData();
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('failed');
      
      let message = 'Could not connect to backend. Showing mock data.';
      if (error?.code === 'ECONNREFUSED') {
        message = 'Backend server is not running. Please start your backend server.';
      } else if (error?.response) {
        message = `Server responded with status ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`;
      } else if (error?.request) {
        message = 'No response from server. Check if backend is running.';
      }
      setErrorMessage(message);
      
      setMockData();
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    try {
      const [doctorsRes, patientsRes, appointmentsRes] = await Promise.all([
        api.get('/admin/doctors'),
        api.get('/admin/patients'),
        api.get('/admin/appointments'),
      ]);
      
      setReportData({
        doctors: doctorsRes.data || [],
        patients: patientsRes.data || [],
        appointments: appointmentsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const setMockData = () => {
    setStats({
      totalPatients: 150,
      totalDoctors: 25,
      todayAppointments: 18,
      totalAppointments: 342,
      completionRate: 85,
      satisfactionRate: 92,
      availabilityRate: 78,
      nextAppointment: '10:30 AM',
      pendingConfirmations: 3,
      completedToday: 7,
    });
    setChartData(generateChartData('week'));
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data?.stats) {
        const { totalAppointments, completedAppointments = 0, totalPatients, totalDoctors, todayAppointments, pendingAppointments } = response.data.stats;
        
        setStats({
          totalPatients: totalPatients || 0,
          totalDoctors: totalDoctors || 0,
          todayAppointments: todayAppointments || 0,
          totalAppointments: totalAppointments || 0,
          completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
          satisfactionRate: response.data.stats.satisfactionRate || 92,
          availabilityRate: response.data.stats.availabilityRate || 78,
          nextAppointment: response.data.stats.nextAppointment || 'No appointments',
          pendingConfirmations: pendingAppointments || 0,
          completedToday: response.data.stats.completedToday || 0,
        });
      }
      setChartData(response.data?.chartData || generateChartData(dateRange));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (range) => {
    if (range === 'week') {
      return [
        { name: 'Mon', appointments: 12 },
        { name: 'Tue', appointments: 19 },
        { name: 'Wed', appointments: 15 },
        { name: 'Thu', appointments: 22 },
        { name: 'Fri', appointments: 18 },
        { name: 'Sat', appointments: 8 },
        { name: 'Sun', appointments: 5 },
      ];
    } else if (range === 'month') {
      return [
        { name: 'Week 1', appointments: 45 },
        { name: 'Week 2', appointments: 52 },
        { name: 'Week 3', appointments: 48 },
        { name: 'Week 4', appointments: 38 },
      ];
    } else {
      return [
        { name: 'Jan', appointments: 120 },
        { name: 'Feb', appointments: 135 },
        { name: 'Mar', appointments: 150 },
        { name: 'Apr', appointments: 142 },
        { name: 'May', appointments: 160 },
        { name: 'Jun', appointments: 155 },
      ];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await testConnection();
    await fetchReportData();
    setRefreshing(false);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setChartData(generateChartData(range));
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleOpenExportDialog = () => {
    setExportAnchorEl(null);
    setExportDialogOpen(true);
  };

  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
  };

  const handleReportSelection = (report) => {
    setSelectedReports({
      ...selectedReports,
      [report]: !selectedReports[report],
    });
  };

  const generateDashboardReport = () => {
    const reportRows = [
      ['UHARMS System Report'],
      [`Generated on: ${new Date().toLocaleString()}`],
      [''],
      ['DASHBOARD STATISTICS'],
      ['Metric', 'Value'],
      ['Total Patients', stats.totalPatients],
      ['Total Doctors', stats.totalDoctors],
      ['Today\'s Appointments', stats.todayAppointments],
      ['Total Appointments', stats.totalAppointments],
      ['Completion Rate', `${stats.completionRate}%`],
      ['Patient Satisfaction', `${stats.satisfactionRate}%`],
      ['Doctor Availability', `${stats.availabilityRate}%`],
      ['Pending Confirmations', stats.pendingConfirmations],
      ['Completed Today', stats.completedToday],
      ['Next Appointment', stats.nextAppointment || 'None'],
      [''],
      ['WEEKLY APPOINTMENT TREND'],
      ['Day', 'Appointments'],
      ...chartData.map(item => [item.name, item.appointments]),
    ];
    
    return reportRows;
  };

  const generateDoctorsReport = () => {
    const reportRows = [
      ['DOCTORS REPORT'],
      [`Generated on: ${new Date().toLocaleString()}`],
      [''],
      ['ID', 'Name', 'Email', 'Phone', 'Specialization', 'Status'],
    ];
    
    reportData.doctors.forEach((doctor, index) => {
      reportRows.push([
        index + 1,
        doctor.userId?.name || doctor.name || 'N/A',
        doctor.userId?.email || doctor.email || 'N/A',
        doctor.userId?.phone || doctor.phone || 'N/A',
        doctor.specialization || 'General',
        doctor.status || 'active',
      ]);
    });
    
    return reportRows;
  };

  const generatePatientsReport = () => {
    const reportRows = [
      ['PATIENTS REPORT'],
      [`Generated on: ${new Date().toLocaleString()}`],
      [''],
      ['ID', 'Name', 'Email', 'Phone', 'Total Appointments', 'Status', 'Registered Date'],
    ];
    
    reportData.patients.forEach((patient, index) => {
      reportRows.push([
        index + 1,
        patient.userId?.name || patient.name || 'N/A',
        patient.userId?.email || patient.email || 'N/A',
        patient.userId?.phone || patient.phone || 'N/A',
        patient.totalAppointments || 0,
        patient.userId?.status || patient.status || 'active',
        patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A',
      ]);
    });
    
    return reportRows;
  };

  const generateAppointmentsReport = () => {
    const reportRows = [
      ['APPOINTMENTS REPORT'],
      [`Generated on: ${new Date().toLocaleString()}`],
      [''],
      ['ID', 'Patient', 'Doctor', 'Date', 'Time', 'Status', 'Booked On'],
    ];
    
    reportData.appointments.forEach((appointment, index) => {
      reportRows.push([
        index + 1,
        appointment.patientId?.name || appointment.patientId?.userId?.name || 'N/A',
        appointment.doctorId?.userId?.name || 'N/A',
        appointment.date || 'N/A',
        appointment.time || 'N/A',
        appointment.status || 'N/A',
        appointment.createdAt ? new Date(appointment.createdAt).toLocaleDateString() : 'N/A',
      ]);
    });
    
    return reportRows;
  };

  const generateCombinedReport = () => {
    const reportRows = [
      ['UHARMS COMPLETE SYSTEM REPORT'],
      [`Generated on: ${new Date().toLocaleString()}`],
      ['='.repeat(80)],
      ...generateDashboardReport(),
      ['='.repeat(80)],
      ...generateDoctorsReport(),
      ['='.repeat(80)],
      ...generatePatientsReport(),
      ['='.repeat(80)],
      ...generateAppointmentsReport(),
    ];
    
    return reportRows;
  };

  // Safe CSV/Excel export using Blob (no external library needed for basic CSV)
  const exportToCSV = (data, filename) => {
    // Convert array of arrays to CSV string
    const csvContent = data.map(row => 
      row.map(cell => {
        // Handle cells that contain commas, quotes, or newlines
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
    
    // Add BOM for UTF-8 encoding to handle special characters
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  const handleExportReports = async () => {
    setExportLoading(true);
    
    try {
      if (selectedReports.dashboard && selectedReports.doctors && selectedReports.patients && selectedReports.appointments) {
        // Export combined report
        const combinedData = generateCombinedReport();
        exportToCSV(combinedData, `UHARMS_Complete_Report_${new Date().toISOString().split('T')[0]}`);
      } else {
        // Export individual reports
        if (selectedReports.dashboard) {
          const dashboardData = generateDashboardReport();
          exportToCSV(dashboardData, `Dashboard_Report_${new Date().toISOString().split('T')[0]}`);
        }
        if (selectedReports.doctors) {
          const doctorsData = generateDoctorsReport();
          exportToCSV(doctorsData, `Doctors_Report_${new Date().toISOString().split('T')[0]}`);
        }
        if (selectedReports.patients) {
          const patientsData = generatePatientsReport();
          exportToCSV(patientsData, `Patients_Report_${new Date().toISOString().split('T')[0]}`);
        }
        if (selectedReports.appointments) {
          const appointmentsData = generateAppointmentsReport();
          exportToCSV(appointmentsData, `Appointments_Report_${new Date().toISOString().split('T')[0]}`);
        }
      }
      
      alert('Reports exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export reports. Please try again.');
    } finally {
      setExportLoading(false);
      handleCloseExportDialog();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const dashboardData = generateDashboardReport();
    const htmlContent = `
      <html>
        <head>
          <title>UHARMS Report - ${new Date().toLocaleString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #16a34a; text-align: center; }
            h2 { color: #333; margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #16a34a; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>UHARMS System Report</h1>
          <p style="text-align: center;">Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr><th>Metric</th><th>Value</th></tr>
            </thead>
            <tbody>
              ${dashboardData.slice(5, 15).map(row => `
                <tr><td>${row[0]}</td><td>${row[1]}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>UHARMS Healthcare Management System - Confidential Report</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Navigation Bar */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#16a34a' }}>
            Dashboard
          </Typography>
          <Chip 
            label={currentDate} 
            icon={<CalendarIcon />} 
            variant="outlined"
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button 
              onClick={() => handleDateRangeChange('week')}
              variant={dateRange === 'week' ? 'contained' : 'outlined'}
              color={dateRange === 'week' ? 'primary' : 'inherit'}
            >
              Week
            </Button>
            <Button 
              onClick={() => handleDateRangeChange('month')}
              variant={dateRange === 'month' ? 'contained' : 'outlined'}
              color={dateRange === 'month' ? 'primary' : 'inherit'}
            >
              Month
            </Button>
            <Button 
              onClick={() => handleDateRangeChange('year')}
              variant={dateRange === 'year' ? 'contained' : 'outlined'}
              color={dateRange === 'year' ? 'primary' : 'inherit'}
            >
              Year
            </Button>
          </ButtonGroup>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            size="small"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            size="small"
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Export
          </Button>
          
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={handleOpenExportDialog}>
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export Reports (CSV)</ListItemText>
            </MenuItem>
            <MenuItem onClick={handlePrint}>
              <ListItemIcon>
                <PrintIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Print Dashboard Report</ListItemText>
            </MenuItem>
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#16a34a', width: 35, height: 35 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {user?.name || 'Admin'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Administrator
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Export Report Dialog */}
      <Dialog open={exportDialogOpen} onClose={handleCloseExportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Export Reports</Typography>
            <IconButton onClick={handleCloseExportDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select which reports you want to export. All reports will be exported as CSV files.
          </Typography>
          <List>
            <ListItem>
              <Checkbox
                checked={selectedReports.dashboard}
                onChange={() => handleReportSelection('dashboard')}
              />
              <ListItemIcon>
                <DescriptionIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Dashboard Statistics" secondary="System overview, metrics, and charts" />
            </ListItem>
            <ListItem>
              <Checkbox
                checked={selectedReports.doctors}
                onChange={() => handleReportSelection('doctors')}
              />
              <ListItemIcon>
                <LocalHospital color="success" />
              </ListItemIcon>
              <ListItemText primary="Doctors Report" secondary="Complete list of all doctors" />
            </ListItem>
            <ListItem>
              <Checkbox
                checked={selectedReports.patients}
                onChange={() => handleReportSelection('patients')}
              />
              <ListItemIcon>
                <People color="info" />
              </ListItemIcon>
              <ListItemText primary="Patients Report" secondary="Complete list of all patients" />
            </ListItem>
            <ListItem>
              <Checkbox
                checked={selectedReports.appointments}
                onChange={() => handleReportSelection('appointments')}
              />
              <ListItemIcon>
                <Event color="warning" />
              </ListItemIcon>
              <ListItemText primary="Appointments Report" secondary="Complete list of all appointments" />
            </ListItem>
          </List>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            {selectedReports.dashboard && selectedReports.doctors && selectedReports.patients && selectedReports.appointments
              ? "📊 All reports selected - will be combined into one complete report"
              : "📄 Selected reports will be exported as separate files"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog}>Cancel</Button>
          <Button
            onClick={handleExportReports}
            variant="contained"
            disabled={exportLoading || (!selectedReports.dashboard && !selectedReports.doctors && !selectedReports.patients && !selectedReports.appointments)}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            {exportLoading ? 'Exporting...' : 'Export Selected'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Connection Status Alerts */}
      {connectionStatus === 'failed' && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Backend Connection Issue</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {connectionStatus === 'connected' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Connected to Backend</AlertTitle>
          Successfully connected to {import.meta.env.VITE_API_URL || 'backend'}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<People sx={{ color: '#fff', fontSize: 28 }} />}
            color="#3b82f6"
            trend={stats.totalPatients > 0 ? `+${Math.round(stats.totalPatients * 0.12)}` : '+0'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Doctors"
            value={stats.totalDoctors}
            icon={<LocalHospital sx={{ color: '#fff', fontSize: 28 }} />}
            color="#16a34a"
            trend={stats.totalDoctors > 0 ? `+${Math.round(stats.totalDoctors * 0.05)}` : '+0'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<Event sx={{ color: '#fff', fontSize: 28 }} />}
            color="#f59e0b"
            trend={stats.todayAppointments > stats.completedToday ? `-${stats.todayAppointments - stats.completedToday}` : '+0'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon={<TrendingUp sx={{ color: '#fff', fontSize: 28 }} />}
            color="#ef4444"
            trend={stats.totalAppointments > 0 ? `+${Math.round(stats.totalAppointments * 0.08)}` : '+0'}
          />
        </Grid>
      </Grid>

      {/* Chart Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Appointments Overview
              </Typography>
              <Chip 
                label={`${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}ly View`}
                color="primary"
                size="small"
              />
            </Box>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#16a34a" 
                    strokeWidth={3} 
                    dot={{ fill: '#16a34a', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <Typography color="textSecondary">No chart data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Quick Stats
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Appointment Completion Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1, bgcolor: '#e0e0e0', height: 8, borderRadius: 4 }}>
                  <Box sx={{ width: `${stats.completionRate}%`, bgcolor: '#16a34a', height: 8, borderRadius: 4 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.completionRate}%</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Patient Satisfaction
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1, bgcolor: '#e0e0e0', height: 8, borderRadius: 4 }}>
                  <Box sx={{ width: `${stats.satisfactionRate}%`, bgcolor: '#3b82f6', height: 8, borderRadius: 4 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.satisfactionRate}%</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Doctor Availability
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1, bgcolor: '#e0e0e0', height: 8, borderRadius: 4 }}>
                  <Box sx={{ width: `${stats.availabilityRate}%`, bgcolor: '#f59e0b', height: 8, borderRadius: 4 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.availabilityRate}%</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="textSecondary" gutterBottom>
              Today's Schedule
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Next Appointment</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.nextAppointment || 'None'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Pending Confirmations</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.pendingConfirmations}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Completed Today</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{stats.completedToday}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;