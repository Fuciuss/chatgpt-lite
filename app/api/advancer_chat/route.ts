import { NextRequest, NextResponse } from 'next/server'





import { QdrantVectorStore } from "langchain/vectorstores/qdrant";


import { HuggingFaceInferenceEmbeddings } from "langchain/embeddings/hf";




// async function dovectors() {

    

//     console.log('here')

    const embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: process.env.HUGGINGFACE_API_KEY, // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
        model: 'sentence-transformers/all-minilm-l6-v2'
      });

//     const vectorStore = await QdrantVectorStore.fromExistingCollection(
//         embeddings,
//         {
//             url: 'http://127.0.0.1:6333/',
//             collectionName: 'poc_collection_2'
//         }
//     )

//     // console.log(vectorStore)
    
//     // console.log(embeddings)
//     console.log('fetching')
//     const response = await vectorStore.similaritySearchWithScore("hello world", 2);
//     console.log(response)

//     return response

//     // return 'dovectors'
    
    

// }


import {QdrantClient} from '@qdrant/js-client-rest';


async function justQdrant(queryVector: any) {

    const client = new QdrantClient({url: 'http://127.0.0.1:6333'});

    // const result = await client.getCollections();
    // console.log('List of collections:', result.collections);

    const res1 = await client.search('poc_collection_2', {
        vector: queryVector,
        limit: 3,
    });

    console.log(res1)
    return res1


}





async function get_query_vector(data: any) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/obrizum/all-MiniLM-L6-v2",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}


export async function GET(req: NextRequest) {

    console.log(`Node.js version: ${process.version}`);


    try {
    // const response = await dovectors()

    // const response = await justQdrant()


    // const embeddings = new HuggingFaceInferenceEmbeddings({
    //     apiKey: process.env.HUGGINGFACE_API_KEY, // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
    //     model: 'sentence-transformers/all-minilm-l6-v2'
    //   });
    
    //   console.log('getting embedding')
    // const test = await embeddings.embedDocuments(['hello world'])

    // console.log(test)

    const output = await get_query_vector({"inputs": "Today is a sunny day and I'll get some ice cream."})
    // .then((response) => {
    //     console.log(JSON.stringify(response));
    // });

    console.log(output[0])


    const qdrant_result = await justQdrant(output)


    console.log('here')
    console.log(qdrant_result)




    



    return NextResponse.json(
        { success: true, message: 'Hello World', response: qdrant_result },
        { status: 200 }
    )
} catch (error) {  
    return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
    )
}
}