// src/pages/Appointments.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/appointments');

      console.log('Appointments API:', response.data);

      const data = Array.isArray(response.data) ? response.data : [];

      setAppointments(data);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      setStats({
        total: data.length,
        today: data.filter(a => a.date === today).length,
        upcoming: data.filter(a => a.status === 'booked' || a.status === 'confirmed').length,
        completed: data.filter(a => a.status === 'completed').length,
      });

    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/appointments/${id}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return 'warning';
      case 'confirmed': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // ✅ FILTER LOGIC
  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    if (filterDate && apt.date !== filterDate) return false;
    return true;
  });

  // ✅ CLEAN ROWS (FLATTENED)
  const rows = filteredAppointments.map((apt, index) => ({
    id: apt._id || index + 1,
    _id: apt._id,

    patientName: apt?.patientId?.name ?? apt?.patientId?.userId?.name ?? 'N/A',
    doctorName: apt?.doctorId?.userId?.name ?? 'N/A',

    date: apt?.date ?? 'N/A',
    time: apt?.time ?? 'N/A',
    status: apt?.status ?? 'booked',

    bookedOn: apt?.createdAt
      ? format(new Date(apt.createdAt), 'dd/MM/yyyy')
      : 'N/A',
  }));

  // ✅ CLEAN COLUMNS (NO valueGetter)
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },

    {
      field: 'patientName',
      headerName: 'Patient',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: '#3b82f6', fontSize: 20 }} />
          {params.row.patientName}
        </Box>
      ),
    },

    {
      field: 'doctorName',
      headerName: 'Doctor',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DoctorIcon sx={{ mr: 1, color: '#16a34a', fontSize: 20 }} />
          {params.row.doctorName}
        </Box>
      ),
    },

    { field: 'date', headerName: 'Date', width: 120 },
    { field: 'time', headerName: 'Time', width: 100 },

    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          color={getStatusColor(params.row.status)}
          size="small"
        />
      ),
    },

    {
      field: 'bookedOn',
      headerName: 'Booked On',
      width: 140,
    },

    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: (params) => (
        <Box>
          {(params.row.status === 'booked' || params.row.status === 'pending') && (
            <>
              <Chip
                label="Confirm"
                color="success"
                size="small"
                onClick={() => handleUpdateStatus(params.row._id, 'confirmed')}
                sx={{ mr: 0.5, cursor: 'pointer' }}
              />
              <Chip
                label="Cancel"
                color="error"
                size="small"
                onClick={() => handleUpdateStatus(params.row._id, 'cancelled')}
                sx={{ cursor: 'pointer' }}
              />
            </>
          )}

          {params.row.status === 'confirmed' && (
            <Chip
              label="Complete"
              color="primary"
              size="small"
              onClick={() => handleUpdateStatus(params.row._id, 'completed')}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>
      ),
    },
  ];

  // ✅ LOADING
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ✅ ERROR
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ✅ UI
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Appointment Management
      </Typography>

      {/* STATS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total', value: stats.total, color: '#3b82f6' },
          { label: 'Today', value: stats.today, color: '#16a34a' },
          { label: 'Upcoming', value: stats.upcoming, color: '#f59e0b' },
          { label: 'Completed', value: stats.completed, color: '#10b981' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary">{stat.label}</Typography>
                    <Typography variant="h4">{stat.value}</Typography>
                  </Box>
                  <EventIcon sx={{ fontSize: 40, color: stat.color, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FILTERS */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Status"
            size="small"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="booked">Booked</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <TextField
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          size="small"
        />
      </Box>

      {/* TABLE */}
      <Paper sx={{ height: 500, width: '100%', p: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
};

export default Appointments;