// admin_dashboard/src/pages/Departments.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });
  const [fetchError, setFetchError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      setErrorDetails('');
      
      console.log('Fetching departments from admin API...');
      // Use the correct admin endpoint
      const response = await api.get('/admin/departments');
      console.log('Departments response:', response.data);
      
      setDepartments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      console.error('Error response:', error.response?.data);
      
      setFetchError(true);
      setErrorDetails(error.response?.data?.message || error.message || 'Unknown error');
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (department = null) => {
    if (department) {
      setSelectedDepartment(department);
      setFormData({
        name: department.name,
        description: department.description || '',
        icon: department.icon || '',
      });
    } else {
      setSelectedDepartment(null);
      setFormData({
        name: '',
        description: '',
        icon: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDepartment(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      if (selectedDepartment) {
        console.log('Updating department:', selectedDepartment._id);
        await api.put(`/admin/departments/${selectedDepartment._id}`, formData);
        toast.success('Department updated successfully');
      } else {
        console.log('Creating new department');
        await api.post('/admin/departments', formData);
        toast.success('Department created successfully');
      }
      fetchDepartments();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department? This will affect all doctors in this department.')) {
      try {
        console.log('Deleting department:', id);
        await api.delete(`/admin/departments/${id}`);
        toast.success('Department deleted successfully');
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        toast.error(error.response?.data?.message || 'Failed to delete department');
      }
    }
  };

  const handleRetry = () => {
    fetchDepartments();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Failed to Load Departments</AlertTitle>
          {errorDetails || 'Please check your connection and try again.'}
        </Alert>
        <Paper sx={{ p: 3, mt: 2, bgcolor: '#fef2f2' }}>
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            Debug Information:
          </Typography>
          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {`Error: ${errorDetails}\n\nMake sure you are:\n1. Logged in as admin\n2. Using the correct endpoint: /api/admin/departments\n3. Backend server is running on port 5000`}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (departments.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Manage Departments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Add New Department
          </Button>
        </Box>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HospitalIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Departments Found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Click "Add New Department" to create your first department.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            Add Department
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Manage Departments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
        >
          Add New Department
        </Button>
      </Box>

      <Grid container spacing={3}>
        {departments.map((dept) => (
          <Grid item xs={12} sm={6} md={4} key={dept._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#16a34a', mr: 2 }}>
                    <HospitalIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {dept.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 60 }}>
                  {dept.description || 'No description provided'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                  <IconButton onClick={() => handleOpenDialog(dept)} color="primary" size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(dept._id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Department Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDepartment ? 'Edit Department' : 'Add New Department'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Department Name *"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="icon"
                label="Icon Name (optional)"
                value={formData.icon}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                helperText="Enter icon name from Material Icons (e.g., 'heart', 'child', 'baby')"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            {submitting ? 'Saving...' : (selectedDepartment ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;