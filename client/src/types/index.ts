export interface Application {
  id: string | number;
  title: string;
  tagline: string;
  description: string;
  category: string[];
  link: string;
  visibility: boolean;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationFormData {
  title: string;
  tagline: string;
  description: string;
  category: string;
  link: string;
  visibility: boolean;
}

export interface WhatsNewItem {
  _id: string;
  title: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsNewFormData {
  title: string;
  link?: string;
}

export type ActiveTab = "applications" | "whats-new";
