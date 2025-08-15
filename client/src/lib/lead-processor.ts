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

  // Process leads in optimized batches for maximum speed and stability
  const batchSize = 4; // Process 4 leads at a time for optimal balance
  
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (lead, batchIndex) => {
      try {
        const processedLead = await processLead(lead, businessSetup);
        return { success: true, lead: processedLead, index: i + batchIndex };
      } catch (error) {
        console.error(`Failed to process lead ${i + batchIndex + 1}:`, error);
        
        const fallbackLead: ProcessedLead = {
          ...lead,
          score: 45,
          qualified: false,
          reasoning: "AI analysis failed. Please try again later.",
          qualificationCriteria: []
        };
        
        return { success: false, lead: fallbackLead, index: i + batchIndex };
      }
    });
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add results and update stats
    for (const result of batchResults) {
      processedLeads.push(result.lead);
      
      if (result.lead.qualified) {
        qualifiedCount++;
      }
      totalScore += result.lead.score;
    }
    
    // Update progress after each batch
    const progress = Math.min(100, ((i + batchSize) / leads.length) * 100);
    onProgress?.(progress);
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
    // Validate input data
    if (!lead.id) {
      throw new Error('Lead ID is required');
    }
    
    // Call backend API for AI analysis with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout for stability
    
    const response = await fetch('/api/analyze-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lead, businessSetup }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const analysis = await response.json();
    
    // Validate analysis response
    if (typeof analysis.score !== 'number' || typeof analysis.qualified !== 'boolean') {
      throw new Error('Invalid response format from AI analysis');
    }
    
    return {
      ...lead,
      score: Math.max(0, Math.min(100, Math.round(analysis.score))),
      qualified: analysis.qualified,
      reasoning: analysis.reasoning || 'AI analysis completed successfully.',
      qualificationCriteria: Array.isArray(analysis.qualificationCriteria) ? analysis.qualificationCriteria : []
    };

  } catch (error) {
    console.error('Error processing lead with AI:', error);
    
    // Enhanced fallback to basic rule-based scoring if API fails
    let fallbackScore = 45;
    const fallbackCriteria: string[] = [];
    
    try {
      // Safe scoring with proper null checks
      if (lead.industry && lead.industry.toLowerCase().includes('tech')) {
        fallbackScore += 10;
        fallbackCriteria.push('Tech industry');
      }
      if (lead.companySize && lead.companySize.toLowerCase().includes('enterprise')) {
        fallbackScore += 15;
        fallbackCriteria.push('Enterprise company');
      }
      if (lead.title && (lead.title.toLowerCase().includes('ceo') || lead.title.toLowerCase().includes('founder') || lead.title.toLowerCase().includes('director'))) {
        fallbackScore += 20;
        fallbackCriteria.push('Senior executive');
      }
      if (lead.phone || lead.email) {
        fallbackScore += 10;
        fallbackCriteria.push('Contact details available');
      }
      if (lead.contactName) {
        fallbackScore += 5;
        fallbackCriteria.push('Named contact');
      }
      
      const qualified = fallbackScore >= 60;
      
      return {
        ...lead,
        score: Math.max(0, Math.min(100, fallbackScore)),
        qualified,
        reasoning: "AI temporarily unavailable. Using backup scoring system.",
        qualificationCriteria: fallbackCriteria
      };
      
    } catch (fallbackError) {
      console.error('Error in fallback processing:', fallbackError);
      
      // Ultimate fallback
      return {
        ...lead,
        score: 30,
        qualified: false,
        reasoning: "Processing error occurred. Lead requires manual review.",
        qualificationCriteria: ['Manual review needed']
      };
    }
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
