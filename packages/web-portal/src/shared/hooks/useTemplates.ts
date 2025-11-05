"use client";

/**
 * Templates Hooks
 * 
 * React Query hooks for template management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TemplateService, type CreateTemplateInput, type UpdateTemplateInput } from '../services/templates';
import type { Template } from '../types/database';

export const TEMPLATES_QUERY_KEY = 'templates';

/**
 * Hook to get all templates for a user
 */
export function useTemplates(userId: string) {
  return useQuery<Template[], Error>({
    queryKey: [TEMPLATES_QUERY_KEY, userId],
    queryFn: () => TemplateService.list(userId),
    enabled: !!userId
  });
}

/**
 * Hook to get a single template
 */
export function useTemplate(templateId: string, userId: string) {
  return useQuery<Template | null, Error>({
    queryKey: [TEMPLATES_QUERY_KEY, templateId, userId],
    queryFn: () => TemplateService.get(templateId, userId),
    enabled: !!templateId && !!userId
  });
}

/**
 * Hook to create a template
 */
export function useCreateTemplate(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<Template, Error, CreateTemplateInput>({
    mutationFn: (input) => TemplateService.create(input, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, userId] });
    }
  });
}

/**
 * Hook to update a template
 */
export function useUpdateTemplate(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<Template, Error, { id: string; input: UpdateTemplateInput }>({
    mutationFn: ({ id, input }) => TemplateService.update(id, input, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, data.id, userId] });
    }
  });
}

/**
 * Hook to delete a template
 */
export function useDeleteTemplate(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => TemplateService.delete(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, userId] });
    }
  });
}

/**
 * Hook to add a flow to a template
 */
export function useAddFlowToTemplate(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { templateId: string; flowId: string }>({
    mutationFn: ({ templateId, flowId }) => TemplateService.addFlow(templateId, flowId, userId),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, templateId, userId] });
    }
  });
}

/**
 * Hook to remove a flow from a template
 */
export function useRemoveFlowFromTemplate(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { templateId: string; flowId: string }>({
    mutationFn: ({ templateId, flowId }) => TemplateService.removeFlow(templateId, flowId, userId),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, templateId, userId] });
    }
  });
}
