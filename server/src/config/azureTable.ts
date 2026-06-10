import dotenv from "dotenv";
import { TableClient } from "@azure/data-tables";

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING is missing");
}

export const whatsNewTableClient = TableClient.fromConnectionString(
  connectionString,
  process.env.AZURE_WHATSNEW_TABLE_NAME || "whatsnew"
);

export const applicationTableClient = TableClient.fromConnectionString(
  connectionString,
  process.env.AZURE_APPLICATION_TABLE_NAME || "application"
);

async function initializeTable(client, tableName) {
  try {
    await client.createTable();
    console.log(`Table '${tableName}' ready`);
  } catch (error) {
    if (error.statusCode !== 409) {
      throw error;
    }
  }
}

await initializeTable(
  whatsNewTableClient,
  process.env.AZURE_WHATSNEW_TABLE_NAME || "whatsnew"
);

await initializeTable(
  applicationTableClient,
  process.env.AZURE_APPLICATION_TABLE_NAME || "application"
);

