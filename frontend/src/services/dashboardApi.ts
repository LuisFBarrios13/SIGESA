// src/services/dashboardApi.ts
import { api } from './api';
import type { DashboardData } from '../types/dashboard';

export const dashboardApi = {
  obtener: (year: number) => api.get<DashboardData>(`/dashboard?year=${year}`),
};
