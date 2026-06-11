import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { recurringRulesApi } from '@/services/api/recurring-rules';
import type {
  CreateRecurringRuleData,
  RecurringRule,
  UpdateRecurringRuleData,
} from '@/types/recurring-types';

export const useRecurringRules = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: recurringRules = [], isLoading } = useQuery<RecurringRule[]>({
    queryKey: ['recurring-rules', user?.id],
    queryFn: async () => recurringRulesApi.getRecurringRules(user!.id),
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['recurring-rules'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['loans'] });
  };

  const createRule = useMutation({
    mutationFn: async (data: CreateRecurringRuleData) =>
      recurringRulesApi.createRecurringRule(user!.id, data),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Recurring rule created' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRule = useMutation({
    mutationFn: async (data: UpdateRecurringRuleData) =>
      recurringRulesApi.updateRecurringRule(user!.id, data),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Recurring rule updated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => recurringRulesApi.deleteRecurringRule(user!.id, id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Recurring rule deleted' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const togglePause = useMutation({
    mutationFn: async ({ id, paused }: { id: string; paused: boolean }) =>
      recurringRulesApi.togglePause(user!.id, id, paused),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Rule status updated' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const processDue = useMutation({
    mutationFn: async () => recurringRulesApi.processDueRules(user!.id),
    onSuccess: ({ created }) => {
      invalidate();
      if (created > 0) {
        toast({
          title: 'Recurring transactions added',
          description: `${created} scheduled item${created === 1 ? '' : 's'} processed`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error processing recurring rules',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const runRuleNow = useMutation({
    mutationFn: async (ruleId: string) => recurringRulesApi.runRuleNow(user!.id, ruleId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Rule executed' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error running rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    recurringRules,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
    togglePause,
    processDue,
    runRuleNow,
  };
};
