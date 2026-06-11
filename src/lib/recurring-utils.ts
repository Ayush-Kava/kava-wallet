import type { RecurringFrequency, RecurringRule } from '@/types/recurring-types';

const formatDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

export const computeNextRunDate = (current: string, frequency: RecurringFrequency): string => {
  const date = new Date(current);
  if (Number.isNaN(date.getTime())) {
    return formatDateOnly(new Date());
  }

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
    return formatDateOnly(date);
  }

  if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
    return formatDateOnly(date);
  }

  // monthly default
  const day = date.getDate();
  date.setMonth(date.getMonth() + 1);

  // If the month rolled over (e.g., Jan 31 -> Mar 3), clamp to last day of month
  if (date.getDate() < day) {
    date.setDate(0);
  }

  return formatDateOnly(date);
};

export const isRuleDue = (rule: RecurringRule, today: string): boolean => {
  if (rule.paused) return false;
  if (rule.end_date && rule.next_run_date > rule.end_date) return false;
  return rule.next_run_date <= today;
};
