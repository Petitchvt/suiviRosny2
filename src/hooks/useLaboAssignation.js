import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { laboratoiresBase44 } from '@/api/moduleClients';

export function useLaboAssignations() {
  const queryClient = useQueryClient();

  const { data: assignations = [] } = useQuery({
    queryKey: ['assignations_labo'],
    queryFn: () => laboratoiresBase44.entities.AssignationLabo.list(),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ laboratoire, acheteur_id }) => {
      const existing = assignations.find(a => a.laboratoire === laboratoire);
      if (existing) {
        return laboratoiresBase44.entities.AssignationLabo.update(existing.id, { acheteur_id });
      }
      return laboratoiresBase44.entities.AssignationLabo.create({ laboratoire, acheteur_id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignations_labo'] }),
  });

  const getAssignation = (laboratoire) => assignations.find(a => a.laboratoire === laboratoire);

  return { assignations, assign: assignMutation.mutate, getAssignation };
}
