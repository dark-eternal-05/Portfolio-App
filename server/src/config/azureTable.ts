import dotenv from "dotenv";
import { TableClient } from "@azure/data-tables";

dotenv.config();

const connectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

export let whatsNewTableClient:
  | TableClient
  | null = null;

export let applicationTableClient:
  | TableClient
  | null = null;

async function initializeTable(
  client: TableClient,
  tableName: string,
) {
  try {
    await client.createTable();
    console.log(`Table '${tableName}' ready`);
  } catch (error: any) {
    if (error?.statusCode !== 409) {
      throw error;
    }
  }
}

try {
  if (connectionString) {
    whatsNewTableClient =
      TableClient.fromConnectionString(
        connectionString,
        process.env.AZURE_WHATSNEW_TABLE_NAME ||
          "whatsnew",
      );

    applicationTableClient =
      TableClient.fromConnectionString(
        connectionString,
        process.env.AZURE_APPLICATION_TABLE_NAME ||
          "application",
      );

    await initializeTable(
      whatsNewTableClient,
      process.env.AZURE_WHATSNEW_TABLE_NAME ||
        "whatsnew",
    );

    await initializeTable(
      applicationTableClient,
      process.env.AZURE_APPLICATION_TABLE_NAME ||
        "application",
    );

    console.log(
      "Azure Table Storage connected",
    );
  } else {
    console.warn(
      "Azure connection string missing. Running in JSON backup mode.",
    );
  }
} catch (error) {
  console.error(
    "Azure initialization failed. Running in JSON backup mode.",
    error,
  );

  whatsNewTableClient = null;
  applicationTableClient = null;
}