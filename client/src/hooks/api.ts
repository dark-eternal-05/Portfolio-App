import axios from "axios";
import {
  Application,
  ApplicationFormData,
  WhatsNewItem,
  WhatsNewFormData,
} from "../types";

const api = axios.create({ baseURL: "/api" });

export const fetchApplications = async (): Promise<Application[]> => {
  const { data } = await api.get<{ success: boolean; data: Application[] }>(
    "/applications",
  );
  return data.data;
};

export const createApplication = async (
  payload: ApplicationFormData,
): Promise<Application> => {
  const { data } = await api.post<{ success: boolean; data: Application }>(
    "/applications",
    payload,
  );
  return data.data;
};

export const updateApplication = async (
  id: string | number,
  payload: Partial<ApplicationFormData>,
): Promise<Application[]> => {
  const { data } = await api.put<{ success: boolean; data: Application[] }>(
    `/applications/${id}`,
    payload,
  );
  return data.data;
};

export const deleteApplication = async (id: string | number): Promise<void> => {
  await api.delete(`/applications/${id}`);
};

export const fetchWhatsNew = async (): Promise<WhatsNewItem[]> => {
  const { data } = await api.get<{ success: boolean; data: WhatsNewItem[] }>(
    "/whats-new",
  );
  return data.data;
};

export const createWhatsNew = async (
  payload: WhatsNewFormData,
): Promise<WhatsNewItem> => {
  const { data } = await api.post<{ success: boolean; data: WhatsNewItem }>(
    "/whats-new",
    payload,
  );
  return data.data;
};

export const updateWhatsNew = async (
  id: string,
  payload: Partial<WhatsNewFormData>,
): Promise<WhatsNewItem[]> => {
  const { data } = await api.put<{ success: boolean; data: WhatsNewItem[] }>(
    `/whats-new/${id}`,
    payload,
  );
  return data.data;
};

export const deleteWhatsNew = async (id: string): Promise<void> => {
  await api.delete(`/whats-new/${id}`);
};
