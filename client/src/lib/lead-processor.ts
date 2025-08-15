import type { BusinessSetup, Lead, ProcessedLead, ProcessingStats } from "@shared/schema";

interface ProcessingResult {
  leads: ProcessedLead[];
  stats: ProcessingStats;
}

export async function processLeads(
  leads: Lead[],
  businessSetup: BusinessSetup,
  onProgress?: (progress: number) => void
): Promise<ProcessingResult> {
  const processedLeads: ProcessedLead[] = [];
  let qualifiedCount = 0;
  let totalScore = 0;

  // Process leads in batches to simulate real AI processing
  const batchSize = Math.max(1, Math.floor(leads.length / 20)); // Process in ~20 steps
  
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    for (const lead of batch) {
      const processedLead = await processLead(lead, businessSetup);
      processedLeads.push(processedLead);
      
      if (processedLead.qualified) {
        qualifiedCount++;
      }
      totalScore += processedLead.score;
    }
    
    const progress = Math.min(100, ((i + batchSize) / leads.length) * 100);
    onProgress?.(progress);
    
    // Add realistic processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }

  const stats: ProcessingStats = {
    totalLeads: leads.length,
    processedLeads: processedLeads.length,
    qualifiedLeads: qualifiedCount,
    notQualifiedLeads: processedLeads.length - qualifiedCount,
    averageScore: totalScore / processedLeads.length,
    qualificationRate: (qualifiedCount / processedLeads.length) * 100
  };

  return { leads: processedLeads, stats };
}

async function processLead(lead: Lead, businessSetup: BusinessSetup): Promise<ProcessedLead> {
  try {
    // Call backend API for AI analysis
    const response = await fetch('/api/analyze-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lead, businessSetup })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const analysis = await response.json();
    
    return {
      ...lead,
      score: analysis.score,
      qualified: analysis.qualified,
      reasoning: analysis.reasoning,
      qualificationCriteria: analysis.qualificationCriteria
    };

  } catch (error) {
    console.error('Error processing lead with AI:', error);
    
    // Fallback to basic rule-based scoring if API fails
    let fallbackScore = 50;
    const fallbackCriteria: string[] = [];
    
    // Basic scoring fallback
    if (lead.industry?.toLowerCase().includes('tech')) fallbackScore += 10;
    if (lead.companySize?.toLowerCase().includes('enterprise')) fallbackScore += 15;
    if (lead.title?.toLowerCase().includes('ceo') || lead.title?.toLowerCase().includes('founder')) {
      fallbackScore += 20;
      fallbackCriteria.push('Executive contact');
    }
    
    const qualified = fallbackScore >= 60;
    
    return {
      ...lead,
      score: Math.max(0, Math.min(100, fallbackScore)),
      qualified,
      reasoning: "AI analysis temporarily unavailable. Score based on basic qualification rules.",
      qualificationCriteria: fallbackCriteria
    };
  }
}

export function exportToCSV(leads: ProcessedLead[], filename: string) {
  const headers = [
    'Company Name',
    'Email', 
    'Phone',
    'Industry',
    'Company Size',
    'Title',
    'Contact Name',
    'Website',
    'Revenue',
    'Score',
    'Qualified',
    'AI Reasoning'
  ];

  const csvData = [
    headers.join(','),
    ...leads.map(lead => [
      `"${lead.companyName || ''}"`,
      `"${lead.email || ''}"`,
      `"${lead.phone || ''}"`,
      `"${lead.industry || ''}"`,
      `"${lead.companySize || ''}"`,
      `"${lead.title || ''}"`,
      `"${lead.contactName || ''}"`,
      `"${lead.website || ''}"`,
      `"${lead.revenue || ''}"`,
      lead.score,
      lead.qualified ? 'Yes' : 'No',
      `"${lead.reasoning.replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
