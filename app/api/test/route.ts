import { create } from 'domain'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// OPENAI

// async function openaiEmbedding(text: string) {

//     // const configuration = new Configuration({
//     //     apiKey: process.env.OPENAI_API_KEY,
//     //   });
//       const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
// });
//       const input = { input: text, model: "text-embedding-ada-002" };

//     openai.createEmbedding(input).then((response) => {
//         const query_embedding = response.data.data[0].embedding;
//     })

// }

const createEmbeddings = async (input) => {
  const model = 'text-embedding-ada-002'
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    method: 'POST',
    body: JSON.stringify({ input, model })
  })

  const { error, data, usage } = await response.json()

  return data[0].embedding
}

const { SearchIndexClient, SearchClient, AzureKeyCredential } = require('@azure/search-documents')

const axios = require('axios')

async function generateEmbeddings(text: string) {
  // Set Azure OpenAI API parameters from environment variables
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiBase = `https://${process.env.AZURE_OPENAI_SERVICE_NAME}.openai.azure.com`
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME

  const response = await axios.post(
    `${apiBase}/openai/deployments/${deploymentName}/embeddings?api-version=${apiVersion}`,
    {
      input: text,
      engine: 'text-embedding-ada-002'
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    }
  )

  const embeddings = response.data.data[0].embedding
  return embeddings
}

async function doPureVectorSearch() {
  const searchServiceEndpoint = process.env.AZURE_SEARCH_ENDPOINT
  const searchServiceApiKey = process.env.AZURE_SEARCH_ADMIN_KEY
  const searchIndexName = process.env.AZURE_SEARCH_INDEX_NAME

  const searchClient = new SearchClient(
    searchServiceEndpoint,
    searchIndexName,
    new AzureKeyCredential(searchServiceApiKey)
  )

  const query = 'tools for software development'
  const response = await searchClient.search(undefined, {
    vector: {
    //   value: await generateEmbeddings(query),
      value: await createEmbeddings(query),
      kNearestNeighborsCount: 3,
      fields: ['contentVector']
    },
    // select: ['title', 'content', 'category']
  })

  console.log(`\nPure vector search results:`)

  const results = []
  for await (const result of response.results) {
    console.log(`Title: ${result.document.title}`)
    console.log(`Score: ${result.score}`)
    console.log(`Content: ${result.document.content}`)
    console.log(`Category: ${result.document.category}`)
    console.log(`\n`)
    results.push(result)
  }

  return results
}

export async function GET(req: NextRequest) {
  const done = await doPureVectorSearch()

  // const done = await openaiEmbedding('test')

  // const done = await createEmbeddings({input: 'test'})

  console.log('done')
  console.log(done)

  return NextResponse.json({ message: 'test' }, { status: 200 })
}
