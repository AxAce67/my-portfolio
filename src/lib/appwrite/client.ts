import { Account, Client, Storage, TablesDB } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const tablesDB = new TablesDB(client);
export const account = new Account(client);
export const storage = new Storage(client);

export const DATABASE_ID = 'portfolio';
export const PROJECTS_TABLE_ID = 'projects';
export const ACTIVE_PROJECTS_TABLE_ID = 'active_projects';
export const SITE_SETTINGS_TABLE_ID = 'site_settings';
export const ASSETS_BUCKET_ID = 'portfolio-assets';
