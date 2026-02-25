import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

// Auth
export const login = (username, password) => 
  axios.post(`${API_URL}/auth/login`, { username, password });

export const getMe = () => 
  axios.get(`${API_URL}/auth/me`, getAuthHeaders());

// Axes
export const getAxes = () => 
  axios.get(`${API_URL}/axes`, getAuthHeaders());

export const getAxis = (axisId) => 
  axios.get(`${API_URL}/axes/${axisId}`, getAuthHeaders());

// Indicators
export const getIndicators = (axisId = null) => 
  axios.get(`${API_URL}/indicators${axisId ? `?axis_id=${axisId}` : ''}`, getAuthHeaders());

export const createIndicator = (data) => 
  axios.post(`${API_URL}/indicators`, data, getAuthHeaders());

export const updateIndicator = (indicatorId, data) => 
  axios.put(`${API_URL}/indicators/${indicatorId}`, data, getAuthHeaders());

// Targets
export const getTargets = (year) => 
  axios.get(`${API_URL}/targets?year=${year}`, getAuthHeaders());

export const upsertTarget = (data) => 
  axios.post(`${API_URL}/targets`, data, getAuthHeaders());

// Values
export const getValues = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axios.get(`${API_URL}/values${query ? `?${query}` : ''}`, getAuthHeaders());
};

export const createValue = (data) => 
  axios.post(`${API_URL}/values`, data, getAuthHeaders());

export const updateValue = (valueId, data) => 
  axios.put(`${API_URL}/values/${valueId}`, data, getAuthHeaders());

// Dashboard
export const getDashboard = (year) => 
  axios.get(`${API_URL}/dashboard?year=${year}`, getAuthHeaders());

export const getAxisDetails = (axisId, year) => 
  axios.get(`${API_URL}/dashboard/axis/${axisId}?year=${year}`, getAuthHeaders());

// Reports
export const getAnnualReport = (year) => 
  axios.get(`${API_URL}/reports/annual?year=${year}`, getAuthHeaders());

// Users
export const getUsers = () => 
  axios.get(`${API_URL}/users`, getAuthHeaders());

export const createUser = (data) => 
  axios.post(`${API_URL}/users`, data, getAuthHeaders());