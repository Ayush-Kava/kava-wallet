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

export const listByUser = async (userId: string): Promise<Document[]> => {
  const documents = await prisma.document.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: 'desc' },
  });
  return documents.map(toDocumentType);
};

export const getById = async (userId: string, id: string): Promise<DocumentWithLinks | null> => {
  const document = await prisma.document.findFirst({
    where: { id, userId },
    include: { links: true, reminders: true },
  });
  if (!document) return null;
  return {
    ...toDocumentType(document),
    links: document.links.map(toDocumentLinkType),
    reminders: document.reminders.map(toDocumentReminderType),
  };
};

export const create = async (userId: string, data: CreateDocumentData): Promise<Document> => {
  const created = await prisma.document.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      file_url: data.file_url,
      file_type: data.file_type,
      file_size: data.file_size,
      tags: data.tags ?? [],
      notes: data.notes,
    },
  });
  return toDocumentType(created);
};

export const update = async (
  userId: string,
  id: string,
  data: Partial<CreateDocumentData>,
): Promise<boolean> => {
  const result = await prisma.document.updateMany({
    where: { id, userId },
    data: {
      name: data.name,
      description: data.description,
      file_url: data.file_url,
      file_type: data.file_type,
      file_size: data.file_size,
      tags: data.tags,
      notes: data.notes,
    },
  });
  return result.count > 0;
};

export const archive = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.document.updateMany({
    where: { id, userId },
    data: { archived: true },
  });
  return result.count > 0;
};

export const remove = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.document.deleteMany({ where: { id, userId } });
  return result.count > 0;
};

export const addLink = async (
  userId: string,
  data: CreateDocumentLinkData,
): Promise<DocumentLink | null> => {
  const document = await prisma.document.findFirst({
    where: { id: data.document_id, userId },
  });
  if (!document) return null;

  const created = await prisma.documentLink.create({
    data: {
      documentId: data.document_id,
      userId,
      linked_entity_type: data.linked_entity_type,
      linked_entity_id: data.linked_entity_id,
    },
  });
  return toDocumentLinkType(created);
};

export const removeLink = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.documentLink.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
};

export const createReminder = async (
  userId: string,
  data: CreateDocumentReminderData,
): Promise<DocumentReminder | null> => {
  const document = await prisma.document.findFirst({
    where: { id: data.document_id, userId },
  });
  if (!document) return null;

  const created = await prisma.documentReminder.create({
    data: {
      documentId: data.document_id,
      userId,
      reminder_type: data.reminder_type,
      reminder_date: new Date(data.reminder_date),
      title: data.title,
      description: data.description,
    },
  });
  return toDocumentReminderType(created);
};

export const updateReminder = async (
  userId: string,
  id: string,
  data: Partial<CreateDocumentReminderData & { completed?: boolean }>,
): Promise<boolean> => {
  const result = await prisma.documentReminder.updateMany({
    where: { id, userId },
    data: {
      reminder_type: data.reminder_type,
      reminder_date: data.reminder_date ? new Date(data.reminder_date) : undefined,
      title: data.title,
      description: data.description,
      completed: (data as any).completed,
    },
  });
  return result.count > 0;
};

export const removeReminder = async (userId: string, id: string): Promise<boolean> => {
  const result = await prisma.documentReminder.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
};

export const listUpcomingReminders = async (userId: string): Promise<DocumentReminder[]> => {
  const today = new Date().toISOString().slice(0, 10);
  const reminders = await prisma.documentReminder.findMany({
    where: {
      userId,
      completed: false,
      reminder_date: { gte: new Date(today) },
    },
    orderBy: { reminder_date: 'asc' },
    take: 50,
  });
  return reminders.map(toDocumentReminderType);
};

export const listByLinkedEntity = async (
  userId: string,
  linkedEntityId: string,
): Promise<DocumentWithLinks[]> => {
  const links = await prisma.documentLink.findMany({
    where: { userId, linked_entity_id: linkedEntityId },
    include: {
      document: { include: { links: true, reminders: true } },
    },
  });

  return links.map((link: (typeof links)[number]) => ({
    ...toDocumentType(link.document),
    links: link.document.links.map(toDocumentLinkType),
    reminders: link.document.reminders.map(toDocumentReminderType),
  }));
};
