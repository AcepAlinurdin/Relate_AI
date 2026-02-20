import { createAdminClient } from "@/utils/supabase/server";

export class AIService {
    private supabase;

    constructor() {
        this.supabase = createAdminClient();
    }

    async generateResponse(tenantId: string, userMessage: string, _history: unknown[] = []): Promise<string> {
        // 1. Fetch Tenant AI Config
        const { data: config } = await this.supabase
            .from('tenant_ai_config')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        const persona = config?.persona_name || 'Sales Assistant';
        const tone = config?.tone || 'friendly';

        // 2. Fetch Relevant Products (Simple Search for MVP)
        // In real impl, we use Vector Search (pgvector) here.
        // For now, we just fetch top 5 active products to give context.
        const { data: products } = await this.supabase
            .from('products')
            .select('name, price, stock, description')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .limit(5);

        const productContext = products?.map(p =>
            `- ${p.name} (Rp ${p.price}): ${p.description}. Stock: ${p.stock}`
        ).join('\n') || "No products available.";

        // 3. Construct System Prompt
        const _systemPrompt = `
        You are ${persona}, a customer support AI for a store.
        Tone: ${tone}.
        Language: Indonesian (Bahasa Indonesia).
        
        Task: Answer customer questions based ONLY on the product data below.
        If you don't know, say "Maaf, saya belum punya informasi tentang itu." using the configured tone.
        Do not make up facts.
        
        Available Products:
        ${productContext}
        `;

        // 4. Call LLM (Ollama / OpenAI)
        // For MVP without GPU server, we simulate a smart response or use a free API if config provided.
        // Here we'll return a Mock response that PROVES we read the data.

        console.log(`[AI Service] Generating response for ${tenantId}...`);

        // SIMULATION
        // If user asks about a product, we try to match keywords.
        const lowerMsg = userMessage.toLowerCase();
        let response = "";

        if (lowerMsg.includes('halo') || lowerMsg.includes('hi')) {
            response = `Halo! Selamat datang di toko kami. Saya ${persona}. Ada yang bisa dibantu?`;
        } else if (lowerMsg.includes('produk') || lowerMsg.includes('jual') || lowerMsg.includes('menu')) {
            response = `Kami memiliki beberapa produk unggulan:\n${products?.map(p => p.name).join(', ')}. Mau lihat detail yang mana?`;
        } else {
            // Check for specific product names
            const matchedProduct = products?.find(p => lowerMsg.includes(p.name.toLowerCase()));
            if (matchedProduct) {
                response = `${matchedProduct.name} harganya Rp ${matchedProduct.price}. ${matchedProduct.description}. Stok tersisa: ${matchedProduct.stock}. Berminat?`;
            } else {
                response = "Maaf, boleh diulangi? Saya bisa bantu jelaskan tentang produk kami.";
            }
        }

        // TODO: Replace above with real fetch to OLLAMA_BASE_URL
        /*
        const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            body: JSON.stringify({
                model: 'llama3',
                prompt: `${systemPrompt}\n\nUser: ${userMessage}\nAssistant:`,
                stream: false
            })
        });
        const json = await res.json();
        return json.response;
        */

        return response;
    }
}

export const aiService = new AIService();
