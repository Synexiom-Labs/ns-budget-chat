/**
 * scripts/index-vectors.ts
 * Generates embeddings for all chunks and upserts them into Pinecone.
 * Run: npm run index
 */

import fs from 'fs'
import path from 'path'
import { Pinecone } from '@pinecone-database/pinecone'
import { generateEmbeddings } from '../lib/rag/embeddings'
import { ProcessedChunk } from '../types'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const CHUNKS_DIR = path.join(process.cwd(), 'data', 'chunks')
const UPSERT_BATCH_SIZE = 100
const INDEX_NAME = process.env.PINECONE_INDEX || 'ns-budget-chat'
// voyage-3-large produces 1024-dimensional vectors
const VECTOR_DIMENSION = 1024

async function ensureIndex(pc: Pinecone): Promise<void> {
  const indexes = await pc.listIndexes()
  const exists = indexes.indexes?.some((idx) => idx.name === INDEX_NAME)

  if (!exists) {
    console.log(`Creating Pinecone index: ${INDEX_NAME}`)
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: VECTOR_DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    })
    // Wait for index to be ready
    console.log('Waiting for index to be ready...')
    await new Promise((resolve) => setTimeout(resolve, 60000))
  } else {
    console.log(`Using existing Pinecone index: ${INDEX_NAME}`)
  }
}

async function main() {
  console.log('\n🔢 NS Budget Chat — Vector Indexing\n')

  if (!process.env.PINECONE_API_KEY) {
    console.error('Missing PINECONE_API_KEY in environment')
    process.exit(1)
  }
  if (!process.env.VOYAGE_API_KEY) {
    console.error('Missing VOYAGE_API_KEY in environment')
    process.exit(1)
  }

  const allChunksFile = path.join(CHUNKS_DIR, '_all-chunks.json')
  if (!fs.existsSync(allChunksFile)) {
    console.error('No chunks file found. Run npm run process first.')
    process.exit(1)
  }

  const chunks: ProcessedChunk[] = JSON.parse(fs.readFileSync(allChunksFile, 'utf-8'))
  console.log(`Loaded ${chunks.length} chunks`)

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  await ensureIndex(pc)
  const index = pc.index(INDEX_NAME)

  let upserted = 0

  for (let i = 0; i < chunks.length; i += UPSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + UPSERT_BATCH_SIZE)
    const texts = batch.map((c) => c.content)

    console.log(`Embedding batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / UPSERT_BATCH_SIZE)}...`)
    const embeddings = await generateEmbeddings(texts)

    const vectors = batch.map((chunk, j) => ({
      id: chunk.id,
      values: embeddings[j],
      metadata: {
        ...chunk.metadata,
        content: chunk.content.slice(0, 2000), // Pinecone metadata limit
      },
    }))

    // Pinecone v7 API: upsert({ records: [...] })
    await index.upsert({ records: vectors })
    upserted += vectors.length
    console.log(`  Upserted ${upserted}/${chunks.length} vectors`)

    // Small delay to respect rate limits
    if (i + UPSERT_BATCH_SIZE < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(`\n✅ Indexed ${upserted} vectors into Pinecone`)
  console.log('\nNext step: npm run validate\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
