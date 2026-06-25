import { NextRequest } from 'next/server';
import { authUser } from '@/lib/auth';
import {
  successResponse } from '@/lib/utils/response';
import { handleRouteError } from '@/lib/utils/handle-route-error';
import { listUpcomingReminders } from '@/services/repositories/documents';

export async function GET(_req: NextRequest) {
  try {
    const user = await authUser();
    const reminders = await listUpcomingReminders(user.id);
    return successResponse(reminders);
  } catch (error: any) {
    console.error('Upcoming reminders GET error', error);
    return handleRouteError(error);
  }
}
