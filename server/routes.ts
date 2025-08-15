import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import type { BusinessSetup, Lead } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Lead analysis endpoint
  app.post('/api/analyze-lead', async (req, res) => {
    console.log('API endpoint hit:', req.method, req.path);
    console.log('Request body:', req.body);
    try {
      const { lead, businessSetup }: { lead: Lead; businessSetup: BusinessSetup } = req.body;
      
      if (!lead || !businessSetup) {
        return res.status(400).json({ error: 'Missing lead or business setup data' });
      }

      // Prepare lead data for AI analysis
      const leadInfo = {
        companyName: lead.companyName || 'Unknown',
        email: lead.email || 'Not provided',
        phone: lead.phone || 'Not provided',
        industry: lead.industry || 'Not specified',
        companySize: lead.companySize || 'Not specified',
        title: lead.title || 'Not specified',
        contactName: lead.contactName || 'Not provided',
        website: lead.website || 'Not provided',
        revenue: lead.revenue || 'Not specified',
        additionalData: lead.additionalData || {}
      };

      const prompt = `You are an expert lead qualification analyst. Analyze the following lead against the business criteria and provide a detailed assessment.

**Business Information:**
- Business Description: ${businessSetup.businessDescription}
- Campaign Goals & Qualification Criteria: ${businessSetup.campaignGoals}

**Lead Information:**
- Company: ${leadInfo.companyName}
- Industry: ${leadInfo.industry}
- Company Size: ${leadInfo.companySize}
- Contact Title: ${leadInfo.title}
- Contact Name: ${leadInfo.contactName}
- Email: ${leadInfo.email}
- Phone: ${leadInfo.phone}
- Website: ${leadInfo.website}
- Revenue: ${leadInfo.revenue}
- Additional Data: ${JSON.stringify(leadInfo.additionalData)}

Please provide your analysis in JSON format with the following structure:
{
  "score": <number between 0-100>,
  "qualified": <boolean>,
  "reasoning": "<detailed explanation of why this lead is/isn't qualified>",
  "qualificationCriteria": ["<criterion1>", "<criterion2>", ...]
}

Consider factors like:
- Industry alignment with business goals
- Company size and revenue potential
- Contact title and decision-making authority
- Email domain professionalism
- Overall fit with the stated qualification criteria

Provide a thorough but concise reasoning that explains the score.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert lead qualification analyst. Always respond with valid JSON in the exact format requested. Be thorough but concise in your analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and sanitize the response
      const score = Math.max(0, Math.min(100, Math.round(analysis.score || 50)));
      const qualified = analysis.qualified === true || score >= 60;
      const reasoning = analysis.reasoning || "AI analysis completed but no detailed reasoning provided.";
      const qualificationCriteria = Array.isArray(analysis.qualificationCriteria) 
        ? analysis.qualificationCriteria.slice(0, 5)
        : [];

      res.json({
        score,
        qualified,
        reasoning,
        qualificationCriteria
      });

    } catch (error) {
      console.error('Error analyzing lead:', error);
      
      // Fallback scoring
      const { lead } = req.body;
      let fallbackScore = 50;
      const fallbackCriteria: string[] = [];
      
      if (lead?.industry?.toLowerCase().includes('tech')) fallbackScore += 10;
      if (lead?.companySize?.toLowerCase().includes('enterprise')) fallbackScore += 15;
      if (lead?.title?.toLowerCase().includes('ceo') || lead?.title?.toLowerCase().includes('founder')) {
        fallbackScore += 20;
        fallbackCriteria.push('Executive contact');
      }
      
      const qualified = fallbackScore >= 60;
      
      res.json({
        score: Math.max(0, Math.min(100, fallbackScore)),
        qualified,
        reasoning: "AI analysis temporarily unavailable. Score based on basic qualification rules.",
        qualificationCriteria: fallbackCriteria
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
