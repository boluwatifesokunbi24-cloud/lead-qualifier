import { z } from "zod";

export const businessSetupSchema = z.object({
  businessDescription: z.string().min(10, "Business description must be at least 10 characters"),
  campaignGoals: z.string().min(10, "Campaign goals must be at least 10 characters"),
});

export const leadSchema = z.object({
  id: z.string(),
  companyName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  title: z.string().optional(),
  contactName: z.string().optional(),
  website: z.string().optional(),
  revenue: z.string().optional(),
  additionalData: z.record(z.any()).optional(),
});

export const processedLeadSchema = leadSchema.extend({
  score: z.number().min(0).max(100),
  qualified: z.boolean(),
  reasoning: z.string(),
  qualificationCriteria: z.array(z.string()).optional(),
});

export type BusinessSetup = z.infer<typeof businessSetupSchema>;
export type Lead = z.infer<typeof leadSchema>;
export type ProcessedLead = z.infer<typeof processedLeadSchema>;

export interface ProcessingStats {
  totalLeads: number;
  processedLeads: number;
  qualifiedLeads: number;
  notQualifiedLeads: number;
  averageScore: number;
  qualificationRate: number;
}
