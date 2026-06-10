import { Request, Response } from "express";
import { applicationTableClient as tableClient } from "../config/azureTable.js";
import {
  getBackupApplications,
  saveBackupApplications,
} from "../services/applicationBackup.services.js";
const PARTITION_KEY = "application";

type VisibilityValue = boolean | number | string | null | undefined;

interface ApplicationPayload {
  title?: string | null;
  link?: string | null;
  description?: string | null;
  category?: string | null;
  tagline?: string | null;
  visibility?: VisibilityValue;
}

interface ApplicationEntity {
  partitionKey: string;
  rowKey: string;
  id: number | string;
  Title: string;
  link: string;
  description?: string | null;
  category?: string | null;
  tagline?: string | null;
  visibility?: VisibilityValue;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

function normalizeText(value: string | undefined | null) {
  return (value ?? "").trim().toLowerCase();
}

function isAlphabetOnly(value: string) {
  return /^[A-Za-z]+$/.test(value);
}

function parseVisibility(value: VisibilityValue): boolean | null {
  if (value === undefined || value === null || value === "") return true;
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  return null;
}

function formatApplications(entities: ApplicationEntity[]) {
  return entities.map((item) => ({
    id: item.id,
    title: item.Title,
    link: item.link,
    description: item.description || null,
    category: item.category || null,
    tagline: item.tagline || null,
    visibility: item.visibility === false ? false : true,
    createdAt: item.CreatedAt,
    updatedAt: item.UpdatedAt || null,
  }));
}

function validateCreatePayload(payload: ApplicationPayload): string | null {
  const { title, link, description, category, tagline, visibility } = payload;

  if (!title) return "Title is mandatory";
  if (!description) return "Description is mandatory";
  if (!link) return "Link is mandatory";
  if (!tagline) return "Tagline is mandatory";
  if (!category) return "Category is mandatory";

  if (typeof title !== "string") return "Title must be a string";
  if (typeof link !== "string") return "Link must be a string";
  if (typeof description !== "string") return "Description must be a string";
  if (typeof tagline !== "string") return "Tagline must be a string";
  if (typeof category !== "string") return "Category must be a string";

  if (!isAlphabetOnly(category.trim())) {
    return "Category must contain only upper and lower case alphabets";
  }

  if (parseVisibility(visibility) === null) {
    return "Visibility must be boolean, 1, or 0";
  }

  return null;
}

function validateUpdatePayload(payload: ApplicationPayload): string | null {
  const { title, link, description, category, tagline, visibility } = payload;

  if (
    title !== undefined &&
    (typeof title !== "string" || title.trim() === "")
  ) {
    return "Title must be a non-empty string";
  }

  if (link !== undefined && (typeof link !== "string" || link.trim() === "")) {
    return "Link must be a non-empty string";
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "Description must be a string";
  }

  if (
    tagline !== undefined &&
    tagline !== null &&
    typeof tagline !== "string"
  ) {
    return "Tagline must be a string";
  }

  if (category !== undefined && category !== null) {
    if (typeof category !== "string") return "Category must be a string";

    if (category.trim() !== "" && !isAlphabetOnly(category.trim())) {
      return "Category must contain only upper and lower case alphabets";
    }
  }

  if (visibility !== undefined && parseVisibility(visibility) === null) {
    return "Visibility must be boolean, 1, or 0";
  }

  return null;
}

async function getAllEntities(): Promise<ApplicationEntity[]> {
  const results: ApplicationEntity[] = [];

  for await (const entity of tableClient.listEntities()) {
    if (entity.partitionKey === PARTITION_KEY) {
      results.push(entity as ApplicationEntity);
    }
  }

  return results.sort((a, b) => Number(a.id) - Number(b.id));
}

function hasDuplicateTitle(
  entities: any[],
  title: string,
  excludeId: string | number | null = null,
): boolean {
  return entities.some((entity) => {
    if (Number(entity.id) === Number(excludeId)) {
      return false;
    }

    const entityTitle = entity.Title ?? entity.title ?? "";

    return normalizeText(entityTitle) === normalizeText(title);
  });
}
function hasDuplicateLink(
  entities: ApplicationEntity[],
  link: string,
  excludeId: string | number | null = null,
): boolean {
  return entities.some((entity) => {
    if (Number(entity.id) === Number(excludeId)) return false;
    return normalizeText(entity.link) === normalizeText(link);
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
      link: entities[i].link,
      description: entities[i].description || "",
      category: entities[i].category || "",
      tagline: entities[i].tagline || "",
      visibility: entities[i].visibility === false ? false : true,
      CreatedAt: entities[i].CreatedAt,
      UpdatedAt: entities[i].UpdatedAt || "",
    });
  }
}

export async function getApplications(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    // Azure unavailable → use backup JSON
    if (!tableClient) {
      const backupApps = await getBackupApplications();

      const visibleApps = backupApps.filter((app) => app.visibility === true);

      res.json({
        success: true,
        source: "backup",
        data: visibleApps,
      });

      return;
    }

    // Azure available
    const entities = await getAllEntities();

    const visibleEntities = entities.filter(
      (item) =>
        item.visibility === true ||
        item.visibility === 1 ||
        item.visibility === "1",
    );

    res.json({
      success: true,
      source: "azure",
      data: formatApplications(visibleEntities),
    });
  } catch (error) {
    console.error("GET APPLICATIONS ERROR:", error);

    try {
      // Azure request failed → fallback
      const backupApps = await getBackupApplications();

      const visibleApps = backupApps.filter((app) => app.visibility === true);

      res.json({
        success: true,
        source: "backup",
        data: visibleApps,
      });

      return;
    } catch (backupError) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch applications",
        error:
          backupError instanceof Error
            ? backupError.message
            : String(backupError),
      });
    }
  }
}

export async function createApplication(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const validationError = validateCreatePayload(
      req.body as ApplicationPayload,
    );

    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }

    const { title, link, description, category, tagline, visibility } =
      req.body as ApplicationPayload;

    const cleanTitle = title!.trim();
    const cleanLink = link!.trim();
    const cleanDescription = description!.trim();
    const cleanCategory = category!.trim();
    const cleanTagline = tagline!.trim();
    const cleanVisibility = parseVisibility(visibility);

    let entities = [];

    if (tableClient) {
      entities = await getAllEntities();
    } else {
      entities = await getBackupApplications();
    }

    if (hasDuplicateTitle(entities, cleanTitle)) {
      res.status(409).json({
        success: false,
        message: "Title already exists. Title must be unique.",
      });
      return;
    }

    if (hasDuplicateLink(entities, cleanLink)) {
      res.status(409).json({
        success: false,
        message: "Link already exists. Link must be unique.",
      });
      return;
    }

    const nextId = entities.length + 1;
    const now = new Date().toISOString();

    const entity: ApplicationEntity = {
      partitionKey: PARTITION_KEY,
      rowKey: String(nextId),
      id: nextId,
      Title: cleanTitle,
      link: cleanLink,
      description: cleanDescription,
      category: cleanCategory,
      tagline: cleanTagline,
      visibility: cleanVisibility,
      CreatedAt: now,
      UpdatedAt: "",
    };

    if (!tableClient) {
      const backupApps = await getBackupApplications();

      const backupApp = {
        id: nextId,
        title: cleanTitle,
        tagline: cleanTagline,
        description: cleanDescription,
        category: cleanCategory,
        link: cleanLink,
        visibility: cleanVisibility,
        createdAt: now,
        updatedAt: "",
      };

      backupApps.push(backupApp);

      await saveBackupApplications(backupApps);

      res.status(201).json({
        success: true,
        source: "backup",
        message: "Application created successfully",
        data: backupApp,
      });

      return;
    }

    await tableClient.createEntity(entity);

    res.status(201).json({
      success: true,
      source: "azure",
      message: "Application created successfully",
      data: formatApplications([entity])[0],
    });
  } catch (error) {
    console.error("CREATE APPLICATION ERROR:");
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: (error as Error).message,
    });
  }
}

export async function updateApplication(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const validationError = validateUpdatePayload(
      req.body as ApplicationPayload,
    );

    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }

    const entities = tableClient
      ? await getAllEntities()
      : await getBackupApplications();

    const existingEntity = entities.find(
      (entity: any) => Number(entity.id) === Number(id),
    );

    if (!existingEntity) {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    const updatedTitle =
      req.body.title !== undefined
        ? (req.body.title as string).trim()
        : (existingEntity.Title ?? existingEntity.title);

    const updatedLink =
      req.body.link !== undefined
        ? (req.body.link as string).trim()
        : existingEntity.link;

    const updatedDescription =
      req.body.description !== undefined
        ? (req.body.description as string)?.trim() || ""
        : existingEntity.description || "";

    const updatedCategory =
      req.body.category !== undefined
        ? (req.body.category as string)?.trim() || ""
        : existingEntity.category || "";

    const updatedTagline =
      req.body.tagline !== undefined
        ? (req.body.tagline as string)?.trim() || ""
        : existingEntity.tagline || "";

    const updatedVisibility =
      req.body.visibility !== undefined
        ? parseVisibility(req.body.visibility)!
        : existingEntity.visibility === false
          ? false
          : true;

    if (hasDuplicateTitle(entities, updatedTitle, id)) {
      res.status(409).json({
        success: false,
        message: "Title already exists. Title must be unique.",
      });
      return;
    }

    if (hasDuplicateLink(entities, updatedLink, id)) {
      res.status(409).json({
        success: false,
        message: "Link already exists. Link must be unique.",
      });
      return;
    }

    const entity: ApplicationEntity = {
      partitionKey: PARTITION_KEY,
      rowKey: String(id),
      id: Number(id),
      Title: updatedTitle,
      link: updatedLink,
      description: updatedDescription,
      category: updatedCategory,
      tagline: updatedTagline,
      visibility: updatedVisibility,
      CreatedAt:
        existingEntity.CreatedAt ??
        existingEntity.createdAt ??
        new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    if (!tableClient) {
      const backupApps = await getBackupApplications();

      const index = backupApps.findIndex(
        (app: any) => Number(app.id) === Number(id),
      );

      if (index === -1) {
        res.status(404).json({
          success: false,
          message: "Application not found",
        });
        return;
      }

      backupApps[index] = {
        ...backupApps[index],
        title: updatedTitle,
        tagline: updatedTagline,
        description: updatedDescription,
        category: updatedCategory,
        link: updatedLink,
        visibility: updatedVisibility,
        updatedAt: new Date().toISOString(),
      };

      await saveBackupApplications(backupApps);

      res.json({
        success: true,
        source: "backup",
        message: "Application updated successfully",
        data: backupApps,
      });

      return;
    }

    await tableClient.updateEntity(entity, "Replace");

    const updatedEntities = await getAllEntities();

    res.json({
      success: true,
      source: "azure",
      message: "Application updated successfully",
      data: formatApplications(updatedEntities),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: (error as Error).message,
    });
  }
}

export async function deleteApplication(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const entities = tableClient
  ? await getAllEntities()
  : await getBackupApplications();

    const existingEntity = entities.find(
  (entity: any) =>
    Number(entity.id) === Number(id),
);
    if (!existingEntity) {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    if (!tableClient) {
  const backupApps =
    await getBackupApplications();

  const filteredApps =
    backupApps.filter(
      (app: any) =>
        Number(app.id) !== Number(id),
    );

  // Re-index IDs
  const reIndexedApps =
    filteredApps.map(
      (app: any, index: number) => ({
        ...app,
        id: index + 1,
      }),
    );

  await saveBackupApplications(
    reIndexedApps,
  );

  res.json({
    success: true,
    source: "backup",
    message:
      "Application deleted successfully and IDs reindexed",
    data: reIndexedApps,
  });

  return;
}

await tableClient.deleteEntity(
  PARTITION_KEY,
  String(id),
);

await reIndex();

const updatedEntities =
  await getAllEntities();

res.json({
  success: true,
  source: "azure",
  message:
    "Application deleted successfully and IDs reindexed",
  data: formatApplications(
    updatedEntities,
  ),
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: (error as Error).message,
    });
  }
}
