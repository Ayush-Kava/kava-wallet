import { prisma } from '@/lib/prisma';
import type {
  Document,
  DocumentWithLinks,
  DocumentLink,
  DocumentReminder,
  CreateDocumentData,
  CreateDocumentLinkData,
  CreateDocumentReminderData,
} from '@/types/document-types';
import { toDocumentType, toDocumentLinkType, toDocumentReminderType } from '@/types/document-types';

const documentInclude = { links: true, reminders: true } as const;

export const listByUser = async (userId: number): Promise<Document[]> => {
  const documents = await prisma.document.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: 'desc' },
  });
  return documents.map(toDocumentType);
};

export const getById = async (
  userId: number,
  publicId: string,
): Promise<DocumentWithLinks | null> => {
  const document = await prisma.document.findFirst({
    where: { publicId, userId },
    include: documentInclude,
  });
  if (!document) return null;
  return {
    ...toDocumentType(document),
    links: document.links.map(toDocumentLinkType),
    reminders: document.reminders.map(toDocumentReminderType),
  };
};

export const create = async (userId: number, data: CreateDocumentData): Promise<Document> => {
  const created = await prisma.document.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      file_url: data.file_url,
      file_type: data.file_type,
      file_extension: data.file_extension,
      mime_type: data.mime_type,
      file_size: data.file_size,
      tags: data.tags ?? [],
      notes: data.notes,
    },
  });
  return toDocumentType(created);
};

export const update = async (
  userId: number,
  publicId: string,
  data: Partial<CreateDocumentData>,
): Promise<boolean> => {
  const result = await prisma.document.updateMany({
    where: { publicId, userId },
    data: {
      name: data.name,
      description: data.description,
      file_url: data.file_url,
      file_type: data.file_type,
      file_extension: data.file_extension,
      mime_type: data.mime_type,
      file_size: data.file_size,
      tags: data.tags,
      notes: data.notes,
    },
  });
  return result.count > 0;
};

export const archive = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.document.updateMany({
    where: { publicId, userId },
    data: { archived: true },
  });
  return result.count > 0;
};

export const remove = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.document.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};

export const addLink = async (
  userId: number,
  data: CreateDocumentLinkData,
): Promise<DocumentLink | null> => {
  const document = await prisma.document.findFirst({
    where: { publicId: data.document_id, userId },
  });
  if (!document) return null;

  const created = await prisma.documentLink.create({
    data: {
      documentId: document.id,
      userId,
      linked_entity_type: data.linked_entity_type,
      linked_entity_public_id: data.linked_entity_id,
    },
    include: { document: true },
  });
  return toDocumentLinkType(created);
};

export const removeLink = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.documentLink.deleteMany({
    where: { publicId, userId },
  });
  return result.count > 0;
};

export const createReminder = async (
  userId: number,
  data: CreateDocumentReminderData,
): Promise<DocumentReminder | null> => {
  const document = await prisma.document.findFirst({
    where: { publicId: data.document_id, userId },
  });
  if (!document) return null;

  const created = await prisma.documentReminder.create({
    data: {
      documentId: document.id,
      userId,
      reminder_type: data.reminder_type,
      reminder_date: new Date(data.reminder_date),
      title: data.title,
      description: data.description,
    },
    include: { document: true },
  });
  return toDocumentReminderType(created);
};

export const updateReminder = async (
  userId: number,
  publicId: string,
  data: Partial<CreateDocumentReminderData & { completed?: boolean }>,
): Promise<boolean> => {
  const result = await prisma.documentReminder.updateMany({
    where: { publicId, userId },
    data: {
      reminder_type: data.reminder_type,
      reminder_date: data.reminder_date ? new Date(data.reminder_date) : undefined,
      title: data.title,
      description: data.description,
      completed: data.completed,
    },
  });
  return result.count > 0;
};

export const removeReminder = async (userId: number, publicId: string): Promise<boolean> => {
  const result = await prisma.documentReminder.deleteMany({
    where: { publicId, userId },
  });
  return result.count > 0;
};

export const listUpcomingReminders = async (userId: number): Promise<DocumentReminder[]> => {
  const today = new Date().toISOString().slice(0, 10);
  const reminders = await prisma.documentReminder.findMany({
    where: {
      userId,
      completed: false,
      reminder_date: { gte: new Date(today) },
    },
    orderBy: { reminder_date: 'asc' },
    take: 50,
    include: { document: true },
  });
  return reminders.map(toDocumentReminderType);
};

export const listByLinkedEntity = async (
  userId: number,
  entityType: string,
  entityPublicId: string,
): Promise<DocumentWithLinks[]> => {
  const links = await prisma.documentLink.findMany({
    where: {
      userId,
      linked_entity_type: entityType,
      linked_entity_public_id: entityPublicId,
    },
    include: {
      document: { include: documentInclude },
    },
  });

  return links.map((link: (typeof links)[number]) => ({
    ...toDocumentType(link.document),
    links: link.document.links.map(toDocumentLinkType),
    reminders: link.document.reminders.map(toDocumentReminderType),
  }));
};
