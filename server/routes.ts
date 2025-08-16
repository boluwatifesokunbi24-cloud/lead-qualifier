import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import type { BusinessSetup, Lead } from "@shared/schema";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Logger } from "./index";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting for production - more generous limits for lead processing
const analysisLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // increased to 200 requests per minute for better throughput
  message: {
    error: 'Too many analysis requests. Please try again in a moment.',
    retryAfter: 30
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Add skip condition for development
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

// Input validation schemas
const leadAnalysisSchema = z.object({
  lead: z.object({
    id: z.string().min(1),
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
  }),
  businessSetup: z.object({
    businessDescription: z.string().min(10).max(1000),
    campaignGoals: z.string().min(10).max(1000),
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Lead analysis endpoint with rate limiting
  app.post('/api/analyze-lead', analysisLimiter, async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate input with detailed error messages
      const validationResult = leadAnalysisSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.warn('Invalid request data:', validationResult.error.format());
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      const { lead, businessSetup } = validationResult.data;
      
      // Additional business validation
      const hasContactInfo = lead.phone || lead.email || lead.contactName;
      if (!hasContactInfo) {
        return res.status(400).json({ 
          error: 'Lead must have at least one contact method (phone, email, or contact name)' 
        });
      }

      // Prepare lead data for AI analysis - only include available data
      const leadInfo = {
        companyName: lead.companyName,
        email: lead.email,
        phone: lead.phone,
        industry: lead.industry,
        companySize: lead.companySize,
        title: lead.title,
        contactName: lead.contactName,
        website: lead.website,
        revenue: lead.revenue,
        additionalData: lead.additionalData || {}
      };

      // Build contact info string with only available data
      const contactParts = [];
      if (leadInfo.phone) contactParts.push(`Phone: ${leadInfo.phone}`);
      if (leadInfo.email) contactParts.push(`Email: ${leadInfo.email}`);
      const contactInfo = contactParts.length > 0 ? contactParts.join(' | ') : 'No contact info';

      const prompt = `Analyze this lead and respond with JSON only.

Business: ${businessSetup.businessDescription}
Goals: ${businessSetup.campaignGoals}

Lead: ${leadInfo.contactName || 'Unknown'} | Company: ${leadInfo.companyName || 'Unknown'} | ${contactInfo} | Location: ${leadInfo.additionalData?.['What local govt area do you stay'] || 'N/A'} | Status: ${leadInfo.additionalData?.['Call comments'] || 'N/A'}

Return this exact JSON structure:
{"score": number, "qualified": boolean, "reasoning": "brief explanation", "qualificationCriteria": ["key factors"]}`;

      // AI analysis with timeout and retry logic
      let response;
      let attempts = 0;
      const maxAttempts = 3; // Increased retry attempts for better reliability
      
      while (attempts < maxAttempts) {
        try {
          response = await Promise.race([
            openai.chat.completions.create({
              model: "gpt-3.5-turbo", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
              messages: [
                {
                  role: "system",
                  content: "You are a lead qualification expert. Analyze leads quickly and return only valid JSON."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 120
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('AI request timeout')), 10000)
            )
          ]) as any;
          break; // Success, exit retry loop
        } catch (error) {
          attempts++;
          console.warn(`AI request attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) {
            throw error; // Final attempt failed
          }
          // Brief delay before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Parse and validate AI response
      let analysis;
      try {
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty AI response');
        }
        analysis = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Invalid AI response format');
      }
      
      // Validate and sanitize the response with comprehensive checks
      const score = typeof analysis.score === 'number' 
        ? Math.max(0, Math.min(100, Math.round(analysis.score)))
        : 50;
      
      const qualified = typeof analysis.qualified === 'boolean' 
        ? analysis.qualified 
        : score >= 60;
        
      const reasoning = typeof analysis.reasoning === 'string' && analysis.reasoning.trim()
        ? analysis.reasoning.trim().substring(0, 500) // Limit reasoning length
        : "AI analysis completed successfully.";
        
      const qualificationCriteria = Array.isArray(analysis.qualificationCriteria) 
        ? analysis.qualificationCriteria
            .filter((c: any) => typeof c === 'string' && c.trim())
            .slice(0, 5)
            .map((c: string) => c.trim())
        : [];

      const processingTime = Date.now() - startTime;
      
      // Log successful analysis for monitoring
      console.log(`Lead ${lead.id} analyzed successfully in ${processingTime}ms - Score: ${score}, Qualified: ${qualified}`);
      
      res.json({
        success: true,
        score,
        qualified,
        reasoning,
        qualificationCriteria,
        processingTime
      });

    } catch (error) {
      console.error('Error analyzing lead:', error);
      
      // Enhanced fallback scoring with better error handling
      try {
        const { lead } = req.body;
        if (!lead) {
          return res.status(500).json({ 
            error: 'Failed to process lead - no lead data available' 
          });
        }
        
        let fallbackScore = 50;
        const fallbackCriteria: string[] = [];
        
        // Safe scoring with null checks
        if (lead.industry && lead.industry.toLowerCase().includes('tech')) {
          fallbackScore += 10;
          fallbackCriteria.push('Tech industry');
        }
        if (lead.companySize && lead.companySize.toLowerCase().includes('enterprise')) {
          fallbackScore += 15;
          fallbackCriteria.push('Enterprise size');
        }
        if (lead.title && (lead.title.toLowerCase().includes('ceo') || lead.title.toLowerCase().includes('founder'))) {
          fallbackScore += 20;
          fallbackCriteria.push('Executive contact');
        }
        if (lead.phone || lead.email) {
          fallbackScore += 5;
          fallbackCriteria.push('Contact info available');
        }
        
        const qualified = fallbackScore >= 60;
        
        res.json({
          score: Math.max(0, Math.min(100, fallbackScore)),
          qualified,
          reasoning: "AI analysis temporarily unavailable. Score based on lead qualification rules.",
          qualificationCriteria: fallbackCriteria
        });
        
      } catch (fallbackError) {
        console.error('Error in fallback scoring:', fallbackError);
        res.status(500).json({ 
          error: 'Failed to process lead analysis',
          score: 25,
          qualified: false,
          reasoning: 'Processing error occurred. Please try again.',
          qualificationCriteria: []
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
