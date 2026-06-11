export interface Application {
  id: string | number;
  title: string;
  tagline: string;
  description: string;
  categories: string[];
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
  categories: string[];
  link: string;
  visibility: boolean;
}

export interface WhatsNewItem {
  _id: string;
  id?: string | number;
  title: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsNewFormData {
  title: string;
  link?: string;
}