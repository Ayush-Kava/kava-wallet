'use client';

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/organisms/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/molecules/common/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecurringForm } from '@/components/organisms/modules/recurring/RecurringForm';
import { useRecurringRules } from '@/hooks/useRecurringRules';

function NewRecurringRulePageInner() {
  const router = useRouter();
  const { createRule } = useRecurringRules();

  const handleSubmit = async (
    payload: Parameters<typeof createRule.mutateAsync>[0],
  ) => {
    await createRule.mutateAsync(payload);
    router.push('/recurring');
  };

  return (
    <DashboardLayout
      title="New Recurring Rule"
      description="Create a schedule to automate transactions"
    >
      <Card className="shadow-card border-border/70">
        <CardHeader>
          <CardTitle className="font-display">Rule details</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurringForm
            onSubmit={handleSubmit}
            isSubmitting={createRule.isPending}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default function NewRecurringRulePage() {
  return (
    <ProtectedRoute>
      <NewRecurringRulePageInner />
    </ProtectedRoute>
  );
}
