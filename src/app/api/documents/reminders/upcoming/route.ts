import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  successResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils/response';
import { listUpcomingReminders } from '@/services/repositories/documents';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const reminders = await listUpcomingReminders(user.id);
    return successResponse(reminders);
  } catch (error: any) {
    console.error('Upcoming reminders GET error', error);
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return internalServerErrorResponse();
  }
}
