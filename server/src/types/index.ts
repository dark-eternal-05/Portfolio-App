export interface Application {
  _id: string;

  name: string;

  tagline: string;

  description: string;

  categories: string[];

  link: string;

  visibility: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFormData {
  name: string;

  tagline: string;

  description: string;

  categories: string[];

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