// src/pages/Patients.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';
import toast from 'react-hot-toast';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/patients');

      console.log('Patients API:', response.data);

      setPatients(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(error.message);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.patch(`/admin/patients/${id}/status`, { status: newStatus });

      toast.success(`Patient ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient status:', error);
      toast.error('Failed to update patient status');
    }
  };

  const handleView = (patient) => {
    console.log('View patient:', patient);
  };

  // ✅ CLEAN ROWS (FLATTENED + SAFE)
  const rows = (patients || []).map((patient, index) => ({
    id: patient._id || index + 1, // IMPORTANT FIX
    _id: patient._id,

    name: patient?.userId?.name ?? patient?.name ?? 'N/A',
    email: patient?.userId?.email ?? patient?.email ?? 'N/A',
    phone: patient?.userId?.phone ?? patient?.phone ?? 'N/A',

    status: patient?.userId?.status ?? patient?.status ?? 'active',
    totalAppointments: patient?.totalAppointments ?? 0,

    registeredDate: patient?.createdAt
      ? new Date(patient.createdAt).toLocaleDateString()
      : patient?.userId?.createdAt
      ? new Date(patient.userId.createdAt).toLocaleDateString()
      : 'N/A',
  }));

  // ✅ CLEAN COLUMNS (NO valueGetter)
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },

    {
      field: 'avatar',
      headerName: '',
      width: 70,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: '#3b82f6', width: 35, height: 35 }}>
          {(params.row.name || 'P').charAt(0).toUpperCase()}
        </Avatar>
      ),
    },

    {
      field: 'name',
      headerName: 'Patient Name',
      width: 200,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'totalAppointments',
      headerName: 'Appointments',
      width: 130,
      type: 'number',
    },
    {
      field: 'registeredDate',
      headerName: 'Registered',
      width: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          color={params.row.status === 'active' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleView(params.row)} color="info" size="small">
            <ViewIcon />
          </IconButton>

          {params.row.status === 'active' ? (
            <IconButton
              onClick={() => handleToggleStatus(params.row._id, params.row.status)}
              color="warning"
              size="small"
            >
              <BlockIcon />
            </IconButton>
          ) : (
            <IconButton
              onClick={() => handleToggleStatus(params.row._id, params.row.status)}
              color="success"
              size="small"
            >
              <ActivateIcon />
            </IconButton>
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
        Manage Patients
      </Typography>

      <Paper sx={{ height: 600, width: '100%', p: 2 }}>
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

export default Patients;