import { GoogleGenAI } from "@google/genai";
import { threatAnalysisSchema, deepAnalysisSchema, newsAnalysisSchema, defenseRecommendationSchema, ThreatIntel } from "../types";

/**
 * Helper to clean Markdown code blocks from JSON strings.
 */
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove ```json ... ``` or ``` ... ``` wrappers
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  return cleaned.trim();
};

export const GeminiService = {
  /**
   * Performs an autonomous OSINT scan based on a query using Gemini Search Grounding.
   */
  scanThreatLandscape: async (query: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Using gemini-2.5-flash for tools support
      const model = "gemini-2.5-flash";
      
      const response = await ai.models.generateContent({
        model: model,
        contents: `SYSTEM OVERRIDE: CTI PROTOCOL ALPHA.
        Role: You are 'Cyber Threat Consulting', an elite autonomous Cyber Threat Intelligence unit.
        Mission: Scan the global digital surface for real-time threats based on the user directive.
        
        Directive: "${query}"
        
        Parameters:
        1. Engage Google Search to extract VERIFIED, RECENT facts (CVEs, Campaigns, APT Groups).
        2. Extract IOCs and TTPs where possible.
        3. STRICT JSON OUTPUT ONLY. Do not use Markdown.
        4. Geolocation: If exact coords unknown, triangulate approximate location based on country/region context.
        5. LANGUAGE: All text content (descriptions, names, types) MUST be in FRENCH.

        Response Schema (Strictly follow this JSON structure):
        ${JSON.stringify(threatAnalysisSchema, null, 2)}
        `,
        config: {
          tools: [{ googleSearch: {} }],
          // CRITICAL: responseMimeType must NOT be set when using tools
          systemInstruction: "You are a planetary defense system named Cyber Threat Consulting. Output raw JSON only. Be technical, precise, and concise. WRITE IN FRENCH.",
        },
      });

      const jsonText = cleanJson(response.text || "");
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (e) {
        console.warn("JSON Parse Error in Scan, attempting fallback", e);
        parsedData = { threats: [], summary: "Échec de l'analyse des données." };
      }
      
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web?.uri)
        .filter((uri: string) => uri !== undefined) || [];

      return {
        data: parsedData,
        sources: sources
      };

    } catch (error) {
      console.error("CTC CORE ERROR:", error);
      throw error;
    }
  },

  /**
   * Fetches latest Cyber Security News for the Feed View
   */
  fetchLatestNews: async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find the top 5 most critical cybersecurity news articles, data breaches, or zero-day vulnerabilities from the last 24 hours. Summarize them in FRENCH.
        
        OUTPUT FORMAT: RAW JSON ONLY. NO MARKDOWN.
        Match this structure exactly:
        ${JSON.stringify(newsAnalysisSchema, null, 2)}`,
        config: {
            tools: [{ googleSearch: {} }],
            // CRITICAL: responseMimeType cannot be used with googleSearch.
            // We rely on the system instruction and prompt to enforce JSON.
            systemInstruction: "You are a high-speed news aggregator. Prioritize accuracy and recentness. Return only valid raw JSON. Summaries must be in French."
        }
      });
      
      const jsonText = cleanJson(response.text || "");
      try {
          return JSON.parse(jsonText);
      } catch (e) {
          console.error("News JSON Parse Failed", jsonText);
          return { articles: [] };
      }
    } catch (error) {
        console.error("NEWS FETCH FAILED", error);
        return { articles: [] };
    }
  },

  /**
   * Performs a deep technical analysis on a specific threat entity.
   */
  generateThreatDeepDive: async (threat: {name: string, type: string, description: string}) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // gemini-2.5-flash allows responseMimeType when NO tools are used.
      const model = "gemini-2.5-flash"; 
      
      const response = await ai.models.generateContent({
        model: model,
        contents: `
          TARGET ENTITY: ${threat.name}
          TYPE: ${threat.type}
          CONTEXT: ${threat.description}

          MISSION: Provide a deep-dive technical analysis report (Level 5 Clearance).
          REQUIREMENTS:
          1. Explain the technical attack vector (TTPs).
          2. Generate specific mitigation strategies.
          3. List probable Indicators of Compromise (IOCs) typical for this threat type.
          4. Profile the threat actor.
          5. LANGUAGE: FRENCH.
          
          OUTPUT: JSON matching the schema.
        `,
        config: {
           responseMimeType: "application/json",
           responseSchema: deepAnalysisSchema
        }
      });

      return JSON.parse(response.text || "{}");

    } catch (error) {
      console.error("DEEP DIVE FAILED:", error);
      throw error;
    }
  },

  /**
   * Generates defensive measures (Iptables/Snort) based on a list of threats.
   */
  generateDefenseStrategies: async (threats: ThreatIntel[]) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const context = threats.length > 0 
            ? threats.map(t => `${t.name} (${t.type}): ${t.description}`).join('\n')
            : "General High-Alert Posture. Prepare for DDoS and Ransomware.";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                CONTEXT: The following threats are active in the CTI Network:
                ${context}

                MISSION: Generate IMMEDIATE actionable defense protocols.
                REQUIREMENTS:
                1. Provide specific shell commands (iptables), Snort rules, or system config changes.
                2. Focus on blocking the specific vectors mentioned (e.g. ports for ransomware, IPs for botnets).
                3. Be realistic and syntax-correct for Linux/Enterprise environments.
                4. LANGUAGE: The descriptions and titles must be in FRENCH. The commands must be valid code.
                
                OUTPUT: JSON.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: defenseRecommendationSchema
            }
        });

        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("DEFENSE STRATEGY GENERATION FAILED", error);
        throw error;
    }
  }
};