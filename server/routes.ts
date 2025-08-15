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

      const prompt = `Analyze this lead against business criteria. Return JSON only.

Business: ${businessSetup.businessDescription}
Goals: ${businessSetup.campaignGoals}

Lead:
- Company: ${leadInfo.companyName}
- Industry: ${leadInfo.industry} 
- Size: ${leadInfo.companySize}
- Title: ${leadInfo.title}
- Contact: ${leadInfo.contactName}
- Location/Data: ${JSON.stringify(leadInfo.additionalData)}

Return:
{
  "score": <0-100>,
  "qualified": <true/false>,
  "reasoning": "<brief explanation>",
  "qualificationCriteria": ["<key factors>"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using faster model for quick processing
        messages: [
          {
            role: "system",
            content: "You are a lead qualification analyst. Respond only with valid JSON in the exact format requested. Be concise."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 300
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
