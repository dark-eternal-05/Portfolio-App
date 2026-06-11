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
  categories?: string[] | null;
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
  categories?: string | string[] | null;
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

function cleanCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const category of categories) {
    const cleaned = category.trim();

    if (!cleaned) continue;

    const key = cleaned.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }

  return result;
}

function parseCategories(value?: string | string[] | null): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return cleanCategories(value.filter((item) => typeof item === "string"));
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? cleanCategories(parsed.filter((item) => typeof item === "string"))
      : [];
  } catch {
    return [];
  }
}

function validateCategories(categories: unknown): string | null {
  if (!Array.isArray(categories)) {
    return "Categories must be an array";
  }

  for (const category of categories) {
    if (typeof category !== "string") {
      return "Each category must be a string";
    }
  }

  const cleaned = cleanCategories(categories);

  if (cleaned.length === 0) {
    return "At least one category is required";
  }

  for (const category of cleaned) {
    if (!isAlphabetOnly(category)) {
      return "Categories must contain only upper and lower case alphabets";
    }
  }

  return null;
}

function formatApplications(entities: any[]) {
  return entities.map((item) => ({
    id: item.id,
    title: item.Title ?? item.title,
    link: item.link,
    description: item.description || "",
    categories: parseCategories(item.categories ?? item.category),
    tagline: item.tagline || "",
    visibility: item.visibility === false ? false : true,
    createdAt: item.CreatedAt ?? item.createdAt ?? "",
    updatedAt: item.UpdatedAt ?? item.updatedAt ?? "",
  }));
}

function validateCreatePayload(payload: ApplicationPayload): string | null {
  const { title, link, description, categories, tagline, visibility } = payload;

  if (!title) return "Title is mandatory";
  if (!description) return "Description is mandatory";
  if (!link) return "Link is mandatory";
  if (!tagline) return "Tagline is mandatory";

  if (typeof title !== "string") return "Title must be a string";
  if (typeof link !== "string") return "Link must be a string";
  if (typeof description !== "string") return "Description must be a string";
  if (typeof tagline !== "string") return "Tagline must be a string";

  const categoryError = validateCategories(categories);
  if (categoryError) return categoryError;

  if (parseVisibility(visibility) === null) {
    return "Visibility must be boolean, 1, or 0";
  }

  return null;
}

function validateUpdatePayload(payload: ApplicationPayload): string | null {
  const { title, link, description, categories, tagline, visibility } = payload;

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

  if (categories !== undefined && categories !== null) {
    const categoryError = validateCategories(categories);
    if (categoryError) return categoryError;
  }

  if (visibility !== undefined && parseVisibility(visibility) === null) {
    return "Visibility must be boolean, 1, or 0";
  }

  return null;
}

async function getAllEntities(): Promise<ApplicationEntity[]> {
  if (!tableClient) return [];

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
    if (Number(entity.id) === Number(excludeId)) return false;

    const entityTitle = entity.Title ?? entity.title ?? "";

    return normalizeText(entityTitle) === normalizeText(title);
  });
}

function hasDuplicateLink(
  entities: any[],
  link: string,
  excludeId: string | number | null = null,
): boolean {
  return entities.some((entity) => {
    if (Number(entity.id) === Number(excludeId)) return false;

    return normalizeText(entity.link) === normalizeText(link);
  });
}

async function reIndex(): Promise<void> {
  if (!tableClient) return;

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
      categories:
        typeof entities[i].categories === "string"
          ? entities[i].categories
          : JSON.stringify(entities[i].categories ?? []),
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
  const includeHidden = req.query.includeHidden === "true";

  try {
    if (!tableClient) {
      const backupApps = await getBackupApplications();
      const formattedApps = formatApplications(backupApps);

      res.json({
        success: true,
        source: "backup",
        data: includeHidden
          ? formattedApps
          : formattedApps.filter((app) => app.visibility === true),
      });

      return;
    }

    const entities = await getAllEntities();

    const finalEntities = includeHidden
      ? entities
      : entities.filter(
          (item) =>
            item.visibility === true ||
            item.visibility === 1 ||
            item.visibility === "1",
        );

    res.json({
      success: true,
      source: "azure",
      data: formatApplications(finalEntities),
    });
  } catch (error) {
    console.error("GET APPLICATIONS ERROR:", error);

    try {
      const backupApps = await getBackupApplications();
      const formattedApps = formatApplications(backupApps);

      res.json({
        success: true,
        source: "backup",
        data: includeHidden
          ? formattedApps
          : formattedApps.filter((app) => app.visibility === true),
      });
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

    const { title, link, description, categories, tagline, visibility } =
      req.body as ApplicationPayload;

    const cleanTitle = title!.trim();
    const cleanLink = link!.trim();
    const cleanDescription = description!.trim();
    const cleanCategoriesValue = cleanCategories(categories!);
    const cleanTagline = tagline!.trim();
    const cleanVisibility = parseVisibility(visibility);
    const now = new Date().toISOString();

    const entities = tableClient
      ? await getAllEntities()
      : formatApplications(await getBackupApplications());

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

    if (!tableClient) {
      const backupApps = await getBackupApplications();

      const backupApp = {
        id: nextId,
        title: cleanTitle,
        tagline: cleanTagline,
        description: cleanDescription,
        categories: cleanCategoriesValue,
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
        data: formatApplications(backupApps),
      });

      return;
    }

    const entity: ApplicationEntity = {
      partitionKey: PARTITION_KEY,
      rowKey: String(nextId),
      id: nextId,
      Title: cleanTitle,
      link: cleanLink,
      description: cleanDescription,
      categories: JSON.stringify(cleanCategoriesValue),
      tagline: cleanTagline,
      visibility: cleanVisibility,
      CreatedAt: now,
      UpdatedAt: "",
    };

    await tableClient.createEntity(entity);

    const updatedEntities = await getAllEntities();

    res.status(201).json({
      success: true,
      source: "azure",
      message: "Application created successfully",
      data: formatApplications(updatedEntities),
    });
  } catch (error) {
    console.error("CREATE APPLICATION ERROR:", error);

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

    const rawEntities = tableClient
      ? await getAllEntities()
      : await getBackupApplications();

    const entities = formatApplications(rawEntities);

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
        : existingEntity.title;

    const updatedLink =
      req.body.link !== undefined
        ? (req.body.link as string).trim()
        : existingEntity.link;

    const updatedDescription =
      req.body.description !== undefined
        ? (req.body.description as string)?.trim() || ""
        : existingEntity.description || "";

    const updatedCategories =
      req.body.categories !== undefined
        ? cleanCategories(req.body.categories)
        : existingEntity.categories || [];

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
        categories: updatedCategories,
        link: updatedLink,
        visibility: updatedVisibility,
        updatedAt: new Date().toISOString(),
      };

      await saveBackupApplications(backupApps);

      res.json({
        success: true,
        source: "backup",
        message: "Application updated successfully",
        data: formatApplications(backupApps),
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
      categories: JSON.stringify(updatedCategories),
      tagline: updatedTagline,
      visibility: updatedVisibility,
      CreatedAt: existingEntity.createdAt || new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

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

    const rawEntities = tableClient
      ? await getAllEntities()
      : await getBackupApplications();

    const entities = formatApplications(rawEntities);

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

    if (!tableClient) {
      const backupApps = await getBackupApplications();

      const reIndexedApps = backupApps
        .filter((app: any) => Number(app.id) !== Number(id))
        .map((app: any, index: number) => ({
          ...app, id: index + 1,
        }));

      await saveBackupApplications(reIndexedApps);

      res.json({
        success: true,
        source: "backup",
        message: "Application deleted successfully and IDs reindexed",
        data: formatApplications(reIndexedApps),
      });

      return;
    }

    await tableClient.deleteEntity(PARTITION_KEY, String(id));
    await reIndex();

    const updatedEntities = await getAllEntities();

    res.json({
      success: true,
      source: "azure",
      message: "Application deleted successfully and IDs reindexed",
      data: formatApplications(updatedEntities),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: (error as Error).message,
    });
  }
}