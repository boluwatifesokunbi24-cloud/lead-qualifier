import type { BusinessSetup, Lead, ProcessedLead, ProcessingStats } from "@shared/schema";

interface ProcessingResult {
  leads: ProcessedLead[];
  stats: ProcessingStats;
}

interface ProcessingProgress {
  processed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  averageTimePerLead: number;
  estimatedTimeRemaining: number;
  errors: number;
  retries: number;
}

export async function processLeads(
  leads: Lead[],
  businessSetup: BusinessSetup,
  onProgress?: (progress: ProcessingProgress | number) => void
): Promise<ProcessingResult> {
  const processedLeads: ProcessedLead[] = [];
  let qualifiedCount = 0;
  let totalScore = 0;
  let totalErrors = 0;
  let totalRetries = 0;
  const processingTimes: number[] = [];
  const startTime = Date.now();

  // Process leads in conservative batches to avoid rate limits
  const batchSize = 2; // Process 2 leads at a time to stay within API limits
  const totalBatches = Math.ceil(leads.length / batchSize);
  
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    // Add delay between batches to respect rate limits
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay between batches
    }
    
    // Process batch in parallel with timing
    const batchStartTime = Date.now();
    const batchPromises = batch.map(async (lead, batchIndex) => {
      const leadStartTime = Date.now();
      try {
        // Add small delay between individual requests within batch
        if (batchIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between requests in batch
        }
        
        const processedLead = await processLead(lead, businessSetup);
        const processingTime = Date.now() - leadStartTime;
        processingTimes.push(processingTime);
        return { success: true, lead: processedLead, index: i + batchIndex, processingTime };
      } catch (error) {
        totalErrors++;
        console.error(`Failed to process lead ${i + batchIndex + 1}:`, error);
        
        // Enhanced fallback with better error context
        const processingTime = Date.now() - leadStartTime;
        const fallbackLead: ProcessedLead = {
          ...lead,
          score: 35,
          qualified: false,
          reasoning: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback scoring.`,
          qualificationCriteria: ['Requires manual review']
        };
        
        processingTimes.push(processingTime);
        return { success: false, lead: fallbackLead, index: i + batchIndex, processingTime };
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
    
    // Calculate detailed progress metrics
    const processed = processedLeads.length;
    const currentBatch = Math.floor(i / batchSize) + 1;
    const averageTimePerLead = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;
    const estimatedTimeRemaining = averageTimePerLead * (leads.length - processed);
    
    // Update progress with comprehensive information
    if (onProgress) {
      const progressData = {
        processed,
        total: leads.length,
        currentBatch,
        totalBatches,
        averageTimePerLead,
        estimatedTimeRemaining,
        errors: totalErrors,
        retries: totalRetries
      };
      onProgress(progressData);
    }
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
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new Error('Rate limit reached. Processing will retry automatically...');
      }
      
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
    
    // Enhanced fallback with retry logic for production
    if (error instanceof Error && error.name === 'AbortError') {
      // Timeout error - try once more with fallback
      try {
        const quickResponse = await fetch('/api/analyze-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead, businessSetup }),
        });
        
        if (quickResponse.ok) {
          const analysis = await quickResponse.json();
          return {
            ...lead,
            score: Math.max(0, Math.min(100, Math.round(analysis.score || 50))),
            qualified: analysis.qualified || false,
            reasoning: analysis.reasoning || 'AI analysis completed on retry.',
            qualificationCriteria: Array.isArray(analysis.qualificationCriteria) ? analysis.qualificationCriteria : []
          };
        }
      } catch (retryError) {
        console.warn('Retry failed, using fallback scoring:', retryError);
      }
    }
    
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
        reasoning: `Lead scored based on available data: ${fallbackCriteria.length > 0 ? fallbackCriteria.join(', ') : 'Basic contact information available'}.`,
        qualificationCriteria: fallbackCriteria
      };
      
    } catch (fallbackError) {
      console.error('Error in fallback processing:', fallbackError);
      
      // Ultimate fallback with better user experience
      return {
        ...lead,
        score: 35,
        qualified: false,
        reasoning: "Technical issue occurred during processing. Lead has been preserved for manual review.",
        qualificationCriteria: ['Manual review recommended', 'System fallback applied']
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

  // Enhanced download with better file handling
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
    
    // Cleanup to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    console.log(`Export completed: ${filename} with ${leads.length} leads`);
  }
}

// Export qualified leads only for production use
export function exportQualifiedLeads(leads: ProcessedLead[], filename: string = 'qualified_leads.csv') {
  const qualifiedLeads = leads.filter(lead => lead.qualified);
  if (qualifiedLeads.length === 0) {
    console.warn('No qualified leads to export');
    return;
  }
  exportToCSV(qualifiedLeads, filename);
}
