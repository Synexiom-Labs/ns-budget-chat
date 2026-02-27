const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3-large'
const BATCH_SIZE = 128

async function callVoyageAPI(inputs: string[]): Promise<number[][]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: inputs,
      model: VOYAGE_MODEL,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Voyage AI API error ${response.status}: ${error}`)
  }

  const data = await response.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const results = await callVoyageAPI([text])
  return results[0]
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const batchResults = await callVoyageAPI(batch)
    results.push(...batchResults)

    // Respect rate limits between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  return results
}
