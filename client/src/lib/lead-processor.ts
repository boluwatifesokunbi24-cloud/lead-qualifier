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
  // Simulate AI processing with realistic scoring logic
  let score = 50; // Base score
  const qualificationCriteria: string[] = [];
  const reasoningFactors: string[] = [];

  // Company name analysis
  if (lead.companyName) {
    if (lead.companyName.toLowerCase().includes('tech') || 
        lead.companyName.toLowerCase().includes('software') ||
        lead.companyName.toLowerCase().includes('digital')) {
      score += 15;
      qualificationCriteria.push("Technology sector alignment");
      reasoningFactors.push("Technology-focused company name suggests good product-market fit");
    }
    
    if (lead.companyName.toLowerCase().includes('inc') || 
        lead.companyName.toLowerCase().includes('corp') ||
        lead.companyName.toLowerCase().includes('llc')) {
      score += 10;
      qualificationCriteria.push("Established business entity");
      reasoningFactors.push("Formal business structure indicates stability");
    }
  }

  // Industry analysis
  if (lead.industry) {
    const highValueIndustries = ['technology', 'software', 'fintech', 'saas', 'healthcare', 'finance'];
    const mediumValueIndustries = ['manufacturing', 'retail', 'education', 'consulting'];
    const lowValueIndustries = ['nonprofit', 'government', 'agriculture'];
    
    const industry = lead.industry.toLowerCase();
    
    if (highValueIndustries.some(i => industry.includes(i))) {
      score += 20;
      qualificationCriteria.push("High-value industry");
      reasoningFactors.push(`${lead.industry} industry aligns well with our target market`);
    } else if (mediumValueIndustries.some(i => industry.includes(i))) {
      score += 10;
      qualificationCriteria.push("Moderate industry alignment");
      reasoningFactors.push(`${lead.industry} industry shows potential for our solutions`);
    } else if (lowValueIndustries.some(i => industry.includes(i))) {
      score -= 15;
      reasoningFactors.push(`${lead.industry} sector has budget constraints that may limit opportunities`);
    }
  }

  // Company size analysis
  if (lead.companySize) {
    const size = lead.companySize.toLowerCase();
    
    if (size.includes('1000+') || size.includes('large') || size.includes('enterprise')) {
      score += 25;
      qualificationCriteria.push("Enterprise scale");
      reasoningFactors.push("Large company size indicates substantial budget and decision-making capability");
    } else if (size.includes('100-') || size.includes('medium') || size.includes('500')) {
      score += 15;
      qualificationCriteria.push("Medium business scale");
      reasoningFactors.push("Mid-size company likely has growth initiatives requiring our solutions");
    } else if (size.includes('50-') || size.includes('small')) {
      score += 5;
      qualificationCriteria.push("Small business scale");
      reasoningFactors.push("Small business may have limited budget but could be agile in adoption");
    } else if (size.includes('1-') || size.includes('startup') || size.includes('freelance')) {
      score -= 10;
      reasoningFactors.push("Very small business size may not align with our minimum deal requirements");
    }
  }

  // Revenue analysis
  if (lead.revenue) {
    const revenue = lead.revenue.toLowerCase();
    
    if (revenue.includes('million') || revenue.includes('$1m+') || revenue.includes('$10m+')) {
      score += 20;
      qualificationCriteria.push("Strong revenue profile");
      reasoningFactors.push("High revenue indicates financial capability for premium solutions");
    } else if (revenue.includes('$500k') || revenue.includes('$100k')) {
      score += 10;
      qualificationCriteria.push("Moderate revenue profile");
      reasoningFactors.push("Decent revenue suggests potential budget for growth initiatives");
    }
  }

  // Email domain analysis
  if (lead.email) {
    const domain = lead.email.split('@')[1]?.toLowerCase();
    
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
      score += 10;
      qualificationCriteria.push("Professional email domain");
      reasoningFactors.push("Custom email domain suggests established business presence");
    }
    
    // Check for corporate email patterns
    if (lead.email.includes('ceo') || lead.email.includes('founder') || lead.email.includes('president')) {
      score += 15;
      qualificationCriteria.push("Executive contact");
      reasoningFactors.push("Direct access to decision-maker accelerates sales process");
    }
  }

  // Title analysis
  if (lead.title) {
    const title = lead.title.toLowerCase();
    const executiveTitles = ['ceo', 'cto', 'founder', 'president', 'vp', 'director'];
    const managerTitles = ['manager', 'lead', 'head'];
    
    if (executiveTitles.some(t => title.includes(t))) {
      score += 20;
      qualificationCriteria.push("Executive decision-maker");
      reasoningFactors.push("Executive title indicates budget authority and strategic decision-making power");
    } else if (managerTitles.some(t => title.includes(t))) {
      score += 10;
      qualificationCriteria.push("Management level contact");
      reasoningFactors.push("Management position suggests influence in purchase decisions");
    }
  }

  // Business setup alignment
  if (businessSetup.businessDescription || businessSetup.campaignGoals) {
    // Simple keyword matching simulation
    const businessKeywords = (businessSetup.businessDescription + ' ' + businessSetup.campaignGoals).toLowerCase();
    const leadText = `${lead.companyName} ${lead.industry} ${lead.title} ${lead.additionalData ? Object.values(lead.additionalData).join(' ') : ''}`.toLowerCase();
    
    const alignmentKeywords = ['enterprise', 'b2b', 'saas', 'technology', 'growth', 'scale', 'automation', 'digital'];
    const matchingKeywords = alignmentKeywords.filter(keyword => 
      businessKeywords.includes(keyword) && leadText.includes(keyword)
    );
    
    if (matchingKeywords.length > 0) {
      const alignmentBonus = Math.min(15, matchingKeywords.length * 5);
      score += alignmentBonus;
      qualificationCriteria.push("Business criteria alignment");
      reasoningFactors.push(`Strong alignment with qualification criteria: ${matchingKeywords.join(', ')}`);
    }
  }

  // Add some randomization to make it more realistic
  const randomFactor = (Math.random() - 0.5) * 20;
  score += randomFactor;

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  // Determine qualification status
  const qualified = score >= 60;
  
  // Generate reasoning text
  let reasoning: string;
  if (qualified) {
    const positiveFactors = reasoningFactors.filter(factor => 
      factor.includes('indicates') || factor.includes('suggests') || factor.includes('aligns') || factor.includes('strong')
    );
    reasoning = positiveFactors.length > 0 ? 
      positiveFactors.slice(0, 2).join('. ') + '.' :
      "Lead demonstrates strong potential based on company profile and business alignment.";
  } else {
    const negativeFactors = reasoningFactors.filter(factor => 
      factor.includes('limited') || factor.includes('constraints') || factor.includes('may not')
    );
    reasoning = negativeFactors.length > 0 ?
      negativeFactors[0] + '.' :
      "Lead profile doesn't align strongly with target qualification criteria.";
  }

  return {
    ...lead,
    score,
    qualified,
    reasoning,
    qualificationCriteria
  };
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
