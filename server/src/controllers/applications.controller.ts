import { Request, Response } from "express";
import { applicationTableClient as tableClient } from "../config/azureTable.js";

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
  categories?: string | null;
  tagline?: string | null;
  visibility?: VisibilityValue;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
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

function parseCategories(value?: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function validateCategories(categories: unknown): string | null {
  if (!Array.isArray(categories)) {
    return "Categories must be an array";
  }

  const cleaned = cleanCategories(categories);

  if (cleaned.length === 0) {
    return "At least one category is required";
  }

  for (const category of cleaned) {
    if (typeof category !== "string") {
      return "Each category must be a string";
    }

    if (!isAlphabetOnly(category)) {
      return "Categories must contain only upper and lower case alphabets";
    }
  }

  return null;
}

function formatApplications(entities: ApplicationEntity[]) {
  return entities.map((item) => ({
    id: item.id,
    title: item.Title,
    link: item.link,
    description: item.description || null,
    categories: parseCategories(item.categories),
    tagline: item.tagline || null,
    visibility: item.visibility === false ? false : true,
    createdAt: item.CreatedAt,
    updatedAt: item.UpdatedAt || null,
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

  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return "Title must be a non-empty string";
  }

  if (link !== undefined && (typeof link !== "string" || link.trim() === "")) {
    return "Link must be a non-empty string";
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    return "Description must be a string";
  }

  if (tagline !== undefined && tagline !== null && typeof tagline !== "string") {
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
  const results: ApplicationEntity[] = [];

  for await (const entity of tableClient.listEntities()) {
    if (entity.partitionKey === PARTITION_KEY) {
      results.push(entity as ApplicationEntity);
    }
  }

  return results.sort((a, b) => Number(a.id) - Number(b.id));
}

function hasDuplicateTitle(
  entities: ApplicationEntity[],
  title: string,
  excludeId: string | number | null = null,
): boolean {
  return entities.some((entity) => {
    if (Number(entity.id) === Number(excludeId)) return false;
    return normalizeText(entity.Title) === normalizeText(title);
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
      categories: entities[i].categories || "[]",
      tagline: entities[i].tagline || "",
      visibility: entities[i].visibility === false ? false : true,
      CreatedAt: entities[i].CreatedAt,
      UpdatedAt: entities[i].UpdatedAt || "",
    });
  }
}

export async function getApplications(req: Request, res: Response): Promise<void> {
  try {
    const entities = await getAllEntities();

    const visibleEntities = entities.filter(
      (item) =>
        item.visibility === true ||
        item.visibility === 1 ||
        item.visibility === "1",
    );

    res.json({
      success: true,
      data: formatApplications(visibleEntities),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: (error as Error).message,
    });
  }
}

export async function createApplication(req: Request, res: Response): Promise<void> {
  try {
    const validationError = validateCreatePayload(req.body as ApplicationPayload);

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

    const entities = await getAllEntities();

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
      categories: JSON.stringify(cleanCategoriesValue),
      tagline: cleanTagline,
      visibility: cleanVisibility,
      CreatedAt: now,
      UpdatedAt: "",
    };

    await tableClient.createEntity(entity);

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: formatApplications([entity])[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: (error as Error).message,
    });
  }
}

export async function updateApplication(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const validationError = validateUpdatePayload(req.body as ApplicationPayload);

    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }

    const entities = await getAllEntities();

    const existingEntity = entities.find(
      (entity) => Number(entity.id) === Number(id),
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
        : existingEntity.Title;

    const updatedLink =
      req.body.link !== undefined
        ? (req.body.link as string).trim()
        : existingEntity.link;

    const updatedDescription =
      req.body.description !== undefined
        ? ((req.body.description as string)?.trim() || "")
        : existingEntity.description || "";

    const updatedCategories =
      req.body.categories !== undefined
        ? cleanCategories(req.body.categories)
        : parseCategories(existingEntity.categories);

    const updatedTagline =
      req.body.tagline !== undefined
        ? ((req.body.tagline as string)?.trim() || "")
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
      categories: JSON.stringify(updatedCategories),
      tagline: updatedTagline,
      visibility: updatedVisibility,
      CreatedAt: existingEntity.CreatedAt,
      UpdatedAt: new Date().toISOString(),
    };

    await tableClient.updateEntity(entity, "Replace");

    const updatedEntities = await getAllEntities();

    res.json({
      success: true,
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

export async function deleteApplication(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const entities = await getAllEntities();

    const existingEntity = entities.find(
      (entity) => Number(entity.id) === Number(id),
    );

    if (!existingEntity) {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    await tableClient.deleteEntity(PARTITION_KEY, String(id));
    await reIndex();

    res.json({
      success: true,
      message: "Application deleted successfully and IDs reindexed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: (error as Error).message,
    });
  }
}