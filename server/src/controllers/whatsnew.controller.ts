import { Request, Response } from "express";
import { whatsNewTableClient as tableClient } from "../config/azureTable.js";
import {
  getBackupWhatsNew,
  saveBackupWhatsNew,
} from "../services/whatsNewBackup.services.js";
const PARTITION_KEY = "whatsnew";

interface WhatsNewPayload {
  title?: string | null;
  link?: string | null;
}

interface WhatsNewEntity {
  partitionKey: string;
  rowKey: string;
  id: number | string;
  Title: string;
  link?: string | null;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

function normalizeText(value: string | undefined | null) {
  return (value ?? "").trim().toLowerCase();
}

function formatWhatsNew(entities: WhatsNewEntity[]) {
  return entities.map((item) => ({
    id: item.id,
    _id: String(item.id),
    title: item.Title,
    link: item.link || null,
    createdAt: item.CreatedAt,
    updatedAt: item.UpdatedAt || null,
  }));
}

function validateCreatePayload(title: unknown, link: unknown): string | null {
  if (title === undefined || title === null || title === "") {
    return "Title is mandatory";
  }

  if (typeof title !== "string") {
    return "Title must be a string";
  }

  if (link !== undefined && link !== null && typeof link !== "string") {
    return "Link must be a string";
  }

  return null;
}

function validateUpdatePayload(title: unknown, link: unknown): string | null {
  if (title !== undefined && typeof title !== "string") {
    return "Title must be a string";
  }

  if (title !== undefined && typeof title === "string" && title.trim() === "") {
    return "Title cannot be empty";
  }

  if (link !== undefined && link !== null && typeof link !== "string") {
    return "Link must be a string";
  }

  return null;
}

async function getAllEntities(): Promise<WhatsNewEntity[]> {
  const results: WhatsNewEntity[] = [];

  for await (const entity of tableClient.listEntities()) {
    if (entity.partitionKey === PARTITION_KEY) {
      results.push(entity as WhatsNewEntity);
    }
  }

  return results.sort((a, b) => Number(a.id) - Number(b.id));
}

function isDuplicate(
  entities: any[],
  title: string,
  link: string,
  excludeId: string | number | null = null,
): boolean {
  const normalizedTitle = normalizeText(title);

  const normalizedLink = normalizeText(link || "");

  return entities.some((entity) => {
    if (Number(entity.id) === Number(excludeId)) {
      return false;
    }

    const entityTitle = entity.Title ?? entity.title ?? "";

    const entityLink = entity.link ?? "";

    return (
      normalizeText(entityTitle) === normalizedTitle &&
      normalizeText(entityLink) === normalizedLink
    );
  });
}

async function reIndex(): Promise<void> {
  const entities = await getAllEntities();

  for (const entity of entities) {
    await tableClient.deleteEntity(PARTITION_KEY, entity.rowKey);
  }

  for (let i = 0; i < entities.length; i++) {
    const id = i + 1;

    await tableClient.createEntity({
      partitionKey: PARTITION_KEY,
      rowKey: String(id),
      id,
      Title: entities[i].Title,
      link: entities[i].link || "",
      CreatedAt: entities[i].CreatedAt,
      UpdatedAt: entities[i].UpdatedAt || "",
    });
  }
}

export async function getWhatsNew(req: Request, res: Response): Promise<void> {
  try {
    if (!tableClient) {
      const backupItems = await getBackupWhatsNew();

      res.json({
        success: true,
        source: "backup",
        data: backupItems,
      });

      return;
    }

    const entities = await getAllEntities();

    res.json({
      success: true,
      source: "azure",
      data: formatWhatsNew(entities),
    });
  } catch (error) {
    try {
      const backupItems = await getBackupWhatsNew();

      res.json({
        success: true,
        source: "backup",
        data: backupItems,
      });
    } catch (backupError) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch whatsnew items",
        error:
          backupError instanceof Error
            ? backupError.message
            : String(backupError),
      });
    }
  }
}

export async function createWhatsNew(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { title, link } = req.body as WhatsNewPayload;

    const validationError = validateCreatePayload(title, link);

    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }

    const cleanTitle = title!.trim();
    const cleanLink = link?.trim() || "";

    const entities = tableClient
      ? await getAllEntities()
      : await getBackupWhatsNew();

    if (isDuplicate(entities, cleanTitle, cleanLink)) {
      res.status(409).json({
        success: false,
        message:
          "Duplicate item not allowed. Same title and link already exist.",
      });
      return;
    }

    const nextId = entities.length + 1;
    const now = new Date().toISOString();

    const entity: WhatsNewEntity = {
      partitionKey: PARTITION_KEY,
      rowKey: String(nextId),
      id: nextId,
      Title: cleanTitle,
      link: cleanLink,
      CreatedAt: now,
      UpdatedAt: "",
    };

    if (!tableClient) {
      const backupItems = await getBackupWhatsNew();

      const backupItem = {
        id: nextId,
        title: cleanTitle,
        link: cleanLink,
        createdAt: now,
        updatedAt: "",
      };

      backupItems.push(backupItem);

      await saveBackupWhatsNew(backupItems);

      res.status(201).json({
        success: true,
        source: "backup",
        message: "WhatsNew item created successfully",
        data: backupItems,
      });

      return;
    }

    await tableClient.createEntity(entity);

    const updatedEntities = await getAllEntities();

    res.status(201).json({
      success: true,
      source: "azure",
      message: "WhatsNew item created successfully",
      data: formatWhatsNew(updatedEntities),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create whatsnew item",
      error: (error as Error).message,
    });
  }
}

export async function updateWhatsNew(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    const { title, link } = req.body as WhatsNewPayload;

    const validationError = validateUpdatePayload(title, link);

    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }

    const entities = tableClient
      ? await getAllEntities()
      : await getBackupWhatsNew();
console.log("PARAM ID:", id);
console.log("ENTITIES:", entities);
    const existingEntity = entities.find(
      (entity: any) => Number(entity.id) === Number(id),
    );

    if (!existingEntity) {
      res.status(404).json({
        success: false,
        message: "Item not found",
      });
      return;
    }

    const updatedTitle =
      title !== undefined
        ? title.trim()
        : (existingEntity.Title ?? existingEntity.title);

    const updatedLink =
      link !== undefined ? link.trim() : existingEntity.link || "";

    if (isDuplicate(entities, updatedTitle, updatedLink, id)) {
      res.status(409).json({
        success: false,
        message:
          "Duplicate item not allowed. Same title and link already exist.",
      });
      return;
    }

    const entity: WhatsNewEntity = {
      partitionKey: PARTITION_KEY,
      rowKey: String(id),
      id: Number(id),
      Title: updatedTitle,
      link: updatedLink,
      CreatedAt:
        existingEntity.CreatedAt ??
        existingEntity.createdAt ??
        new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    if (!tableClient) {
      const backupItems = await getBackupWhatsNew();

      const index = backupItems.findIndex(
        (item: any) => Number(item.id) === Number(id),
      );

      backupItems[index] = {
        ...backupItems[index],
        title: updatedTitle,
        link: updatedLink,
        updatedAt: new Date().toISOString(),
      };

      await saveBackupWhatsNew(backupItems);

      res.json({
        success: true,
        source: "backup",
        message: "WhatsNew item updated successfully",
        data: backupItems,
      });

      return;
    }

    await tableClient.updateEntity(entity, "Replace");

    const updatedEntities = await getAllEntities();

    res.json({
      success: true,
      source: "azure",
      message: "WhatsNew item updated successfully",
      data: formatWhatsNew(updatedEntities),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update whatsnew item",
      error: (error as Error).message,
    });
  }
}

export async function deleteWhatsNew(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const entities = tableClient
      ? await getAllEntities()
      : await getBackupWhatsNew();
    const existingEntity = entities.find(
      (entity: any) => Number(entity.id) === Number(id),
    );

    if (!existingEntity) {
      res.status(404).json({
        success: false,
        message: "Item not found",
      });
      return;
    }

    if (!tableClient) {
      const backupItems = await getBackupWhatsNew();

      const filteredItems = backupItems.filter(
        (item: any) => Number(item.id) !== Number(id),
      );

      const reIndexedItems = filteredItems.map((item: any, index: number) => ({
        ...item,
        id: index + 1,
      }));

      await saveBackupWhatsNew(reIndexedItems);

      res.json({
        success: true,
        source: "backup",
        message: "Deleted successfully and IDs reindexed",
        data: reIndexedItems,
      });

      return;
    }

    await tableClient.deleteEntity(PARTITION_KEY, String(id));

    await reIndex();

    const updatedEntities = await getAllEntities();

    res.json({
      success: true,
      source: "azure",
      message: "Deleted successfully and IDs reindexed",
      data: formatWhatsNew(updatedEntities),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete whatsnew item",
      error: (error as Error).message,
    });
  }
}
