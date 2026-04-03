// src/pages/Doctors.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Avatar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';
import toast from 'react-hot-toast';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/doctors');

      console.log('Doctors API:', response.data);

      setDoctors(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError(error.message);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await api.delete(`/admin/doctors/${id}`);
        toast.success('Doctor deleted successfully');
        fetchDoctors();
      } catch (error) {
        console.error('Error deleting doctor:', error);
        toast.error('Failed to delete doctor');
      }
    }
  };

  const handleView = (doctor) => {
    console.log('View doctor:', doctor);
  };

  const handleEdit = (doctor) => {
    console.log('Edit doctor:', doctor);
  };

  // ✅ CLEAN + SAFE ROW MAPPING
  const rows = (doctors || []).map((doc, index) => ({
    id: doc._id || index + 1, // IMPORTANT
    _id: doc._id,

    name: doc?.userId?.name ?? doc?.name ?? 'N/A',
    email: doc?.userId?.email ?? doc?.email ?? 'N/A',
    phone: doc?.userId?.phone ?? doc?.phone ?? 'N/A',

    specialization: doc?.specialization ?? 'General',
    status: doc?.status ?? 'active',
  }));

  // ✅ CLEAN COLUMNS (NO valueGetter)
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },

    {
      field: 'avatar',
      headerName: '',
      width: 70,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: '#16a34a', width: 35, height: 35 }}>
          {(params.row.name || 'D').charAt(0).toUpperCase()}
        </Avatar>
      ),
    },

    {
      field: 'name',
      headerName: 'Doctor Name',
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
      field: 'specialization',
      headerName: 'Specialization',
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
          <IconButton onClick={() => handleEdit(params.row)} color="primary" size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row._id)} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // ✅ LOADING STATE
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ✅ MAIN UI
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Manage Doctors
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
        >
          Add New Doctor
        </Button>
      </Box>

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

export default Doctors;