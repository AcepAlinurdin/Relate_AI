export interface Tenant {
  id: string;
  user_id: string;
  company_name: string;
  subscription_tier: 1 | 2; // 1: Chatbot Assistant, 2: AI Sales Agent
  created_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  name?: string;
  phone?: string;
  email?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  created_at: string;
}

export interface Message {
  id: string;
  tenant_id: string;
  lead_id?: string;
  content: string;
  sender_type: 'user' | 'ai' | 'lead';
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  price?: number;
  embedding?: number[]; // Vector embedding
  created_at: string;
}
