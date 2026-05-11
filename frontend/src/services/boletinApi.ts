// src/services/boletinApi.ts
import { api }             from './api';
import type { BoletinData } from '../types/boletin';

export const boletinApi = {
  get: (id_matricula: number, periodo: number, year: number) =>
    api.get<BoletinData>(
      `/boletin/${id_matricula}?periodo=${periodo}&year=${year}`,
    ),
};