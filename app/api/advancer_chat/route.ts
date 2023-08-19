import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import { NextRequest, NextResponse } from 'next/server'
export interface Message {
  role: string
  content: string
}


async function prompt_injection(input_message: string) {


    const relevantDocuments = await getRelevantDocuments(input_message)

    const prompt = `The following is a conversation with an AI assistant. 
    The assistant is helpful, creative, clever, and very friendly.
        ${input_message}
    `


    const injected_message = prompt

    return {injected_message, relevantDocuments}

}


export async function POST(req: NextRequest) {
  try {
    const { prompt, messages, input } = (await req.json()) as {
      prompt: string
      messages: Message[]
      input: string
    }

    const {injected_message, relevantDocuments} = await prompt_injection(input)

    const messagesWithHistory = [
      { content: prompt, role: 'system' },
      ...messages,
      { content: injected_message, role: 'user' }
    ]


    const { apiUrl, apiKey, model } = getApiConfig()
    
    const stream = await getOpenAIStream(apiUrl, apiKey, model, messagesWithHistory)

    return new NextResponse({
        stream: stream,
        relevantDocuments: relevantDocuments
    },    
    {
      headers: { 'Content-Type': 'text/event-stream' }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

const getApiConfig = () => {
  const useAzureOpenAI =
    process.env.AZURE_OPENAI_API_BASE_URL && process.env.AZURE_OPENAI_API_BASE_URL.length > 0

  let apiUrl: string
  let apiKey: string
  let model: string
  if (useAzureOpenAI) {
    let apiBaseUrl = process.env.AZURE_OPENAI_API_BASE_URL
    const version = '2023-05-15'
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || ''
    if (apiBaseUrl && apiBaseUrl.endsWith('/')) {
      apiBaseUrl = apiBaseUrl.slice(0, -1)
    }
    apiUrl = `${apiBaseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${version}`
    apiKey = process.env.AZURE_OPENAI_API_KEY || ''
    model = '' // Azure Open AI always ignores the model and decides based on the deployment name passed through.
  } else {
    let apiBaseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com'
    if (apiBaseUrl && apiBaseUrl.endsWith('/')) {
      apiBaseUrl = apiBaseUrl.slice(0, -1)
    }
    apiUrl = `${apiBaseUrl}/v1/chat/completions`
    apiKey = process.env.OPENAI_API_KEY || ''
    model = 'gpt-3.5-turbo' // todo: allow this to be passed through from client and support gpt-4
  }

  return { apiUrl, apiKey, model }
}

const getOpenAIStream = async (
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: Message[]
) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const res = await fetch(apiUrl, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'api-key': `${apiKey}`
    },
    method: 'POST',
    body: JSON.stringify({
      model: model,
      frequency_penalty: 0,
      max_tokens: 2000,
      messages: messages,
      presence_penalty: 0,
      stream: true,
      temperature: 0.5,
      top_p: 0.95
    })
  })

  if (res.status !== 200) {
    const statusText = res.statusText
    const responseBody = await res.text()
    console.error(responseBody)
    throw new Error(
      `The OpenAI API has encountered an error with a status code of ${res.status} ${statusText}: ${responseBody}`
    )
  }

  return new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data

          if (data === '[DONE]') {
            controller.close()
            return
          }

          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta.content
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(onParse)

      for await (const chunk of res.body as any) {
        // An extra newline is required to make AzureOpenAI work.
        const str = decoder.decode(chunk).replace('[DONE]\n', '[DONE]\n\n')
        parser.feed(str)
      }
    }
  })
}



import {QdrantClient} from '@qdrant/js-client-rest';


async function qdrantVectorQuery(queryVector: any) {

    const client = new QdrantClient({url: 'http://127.0.0.1:6333'});

    const vectorQuery = await client.search('poc_collection_2', {
        vector: queryVector,
        limit: 3,
    });

    return vectorQuery
}

async function getQueryVector(data: any) {

    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
	const response = await fetch(
		"https://api-inference.huggingface.co/models/obrizum/all-MiniLM-L6-v2",
		{
			headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}


async function getRelevantDocuments(input_query: string) {

    const output = await getQueryVector({"inputs": input_query})

    const qdrant_result = await qdrantVectorQuery(output)

    return qdrant_result
}




// export async function GET(req: NextRequest) {

//     console.log(`Node.js version: ${process.version}`);


//     try {
    

//     const output = await get_query_vector({"inputs": "Today is a sunny day and I'll get some ice cream."})

//     const qdrant_result = await qdrantVectorQuery(output)


//     console.log(qdrant_result)


//     return NextResponse.json(
//         { success: true, message: 'Hello World', response: qdrant_result },
//         { status: 200 }
//     )
// } catch (error) {  
//     return NextResponse.json(
//         { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
//         { status: 500 }
//     )
// }
// }