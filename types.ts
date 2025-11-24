import { Type } from "@google/genai";

export enum ThreatLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export interface DeepAnalysis {
  technicalAnalysis: string;
  mitigationStrategies: string[];
  iocs: string[];
  actorProfile: string;
}

export interface ThreatIntel {
  id: string;
  name: string;
  type: string;
  description: string;
  severity: ThreatLevel;
  affectedSectors: string[];
  dateDetected: string;
  sourceUrl?: string;
  coordinates?: [number, number]; // Lat, Lon
  details?: DeepAnalysis; // Populated via Deep Scan
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedDate: string;
  summary: string;
  url: string;
}

export interface NetworkBlip {
  id: string;
  coordinates: [number, number];
  color: string;
  timestamp: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  status: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
}

export interface SystemMetrics {
  threatCount: number;
  apiLatency: number;
  memoryUsage: number;
  uptime: number;
  lastUpdate: string;
}

export interface DefenseProtocol {
  id: string;
  title: string;
  command: string; // e.g., iptables rule
  description: string;
  type: 'FIREWALL' | 'IDS' | 'PATCH';
}

export enum AgentStatus {
  IDLE = "VEILLE",
  SCANNING = "SCAN ACTIF",
  ANALYZING = "ANALYSE IA",
  ALERT = "ALERTE"
}

// Schema definitions for Gemini JSON output
export const threatAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    threats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, description: "Type of attack (e.g. Ransomware, DDoS, Phishing)" },
          description: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          affectedSectors: { type: Type.ARRAY, items: { type: Type.STRING } },
          approximateLocation: { 
            type: Type.OBJECT, 
            properties: {
              lat: { type: Type.NUMBER },
              lon: { type: Type.NUMBER }
            },
            description: "Approximate geolocation of origin or target if known, else random realistic coordinates."
          }
        },
        required: ["name", "type", "description", "severity", "affectedSectors"]
      }
    },
    summary: { type: Type.STRING, description: "A high-level executive summary of the findings." }
  }
};

export const deepAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    technicalAnalysis: { type: Type.STRING, description: "Detailed technical explanation of the attack vector and mechanism." },
    mitigationStrategies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of actionable defense steps." },
    iocs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Indicators of Compromise (IPs, Hashes, Domains) - simulated or real." },
    actorProfile: { type: Type.STRING, description: "Profile of the threat actor or group (e.g. APT29, Script Kiddie)." }
  },
  required: ["technicalAnalysis", "mitigationStrategies", "iocs", "actorProfile"]
};

export const newsAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    articles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          source: { type: Type.STRING },
          publishedDate: { type: Type.STRING },
          summary: { type: Type.STRING },
          url: { type: Type.STRING }
        },
        required: ["title", "source", "publishedDate", "summary"]
      }
    }
  }
};

export const defenseRecommendationSchema = {
  type: Type.OBJECT,
  properties: {
    protocols: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            command: { type: Type.STRING, description: "Actual shell command or config snippet (e.g. iptables, snort rule)" },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['FIREWALL', 'IDS', 'PATCH'] }
        },
        required: ["title", "command", "description", "type"]
      }
    },
    advisory: { type: Type.STRING, description: "Strategic overview of the defense posture." }
  }
};