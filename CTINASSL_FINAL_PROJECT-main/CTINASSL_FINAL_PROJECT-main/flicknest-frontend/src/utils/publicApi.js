// src/utils/publicApi.js
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

const publicApi = axios.create({
  baseURL: API_BASE,
  // Don't set withCredentials here!
});

export default publicApi;
