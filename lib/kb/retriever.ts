import { createClient } from '@/utils/supabase/server';
import { OpenAIEmbeddings } from '@langchain/openai';

export type KBHit = {
  doc_id: string;
  chunk_id: string;
  title: string | null;
  source_url: string | null;
  content: string;
  score: number;
};

export async function retrieveEvidenceSnippets(queryText: string, k = 2): Promise<KBHit[]> {
  const supabase = await createClient();

  // 1) Embed query (text-embedding-3-small, 1536-dim)
  const embedder = new OpenAIEmbeddings({ model: 'text-embedding-3-small' });
  const [queryEmbedding] = await embedder.embedDocuments([queryText]);

  // 2) RPC call
  const { data, error } = await supabase.rpc('kb_match_documents', {
    query_embedding: queryEmbedding,
    match_count: k,
    min_score: 0.2,
  });

  if (error) {
    throw { code: 'KB_RPC_ERROR', stage: 'kb_retrieval', message: error.message };
  }

  return (data ?? []) as KBHit[];
}


