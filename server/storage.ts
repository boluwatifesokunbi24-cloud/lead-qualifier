import { type Lead, type ProcessedLead } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getLead(id: string): Promise<Lead | undefined>;
  getProcessedLead(id: string): Promise<ProcessedLead | undefined>;
  storeLead(lead: Lead): Promise<Lead>;
  storeProcessedLead(lead: ProcessedLead): Promise<ProcessedLead>;
}

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;
  private processedLeads: Map<string, ProcessedLead>;

  constructor() {
    this.leads = new Map();
    this.processedLeads = new Map();
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getProcessedLead(id: string): Promise<ProcessedLead | undefined> {
    return this.processedLeads.get(id);
  }

  async storeLead(lead: Lead): Promise<Lead> {
    this.leads.set(lead.id, lead);
    return lead;
  }

  async storeProcessedLead(processedLead: ProcessedLead): Promise<ProcessedLead> {
    this.processedLeads.set(processedLead.id, processedLead);
    return processedLead;
  }
}

export const storage = new MemStorage();
