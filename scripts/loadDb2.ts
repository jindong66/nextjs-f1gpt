import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import OpenAI from "openai"

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

const fs = require("fs/promises");
const path = require("path");
const folderPath = "./data"; // 替换为你的文件夹路径

const readJsonFiles = async (folder) => {
    try {
        // 获取文件夹中所有文件的名称
        const files = await fs.readdir(folder);

        // 过滤出.json文件
        const jsonFiles = files.filter(file => file.startsWith("chunks") && file.endsWith(".json"));
        // console.log(jsonFiles)

        // 读取每个.json文件
        const allStrings = [];
        for (const file of jsonFiles) {
            const filePath = path.join(folder, file);
            // console.log(filePath)

            // 读取文件内容并解析为 JSON 对象（字符串数组）
            const content = await fs.readFile(filePath, "utf-8");
            const jsonData = JSON.parse(content); // 假设是字符串数组
            // console.log(jsonData)
            if (Array.isArray(jsonData)) {
                allStrings.push(...jsonData); // 将数组中的字符串添加到总集合
            } else {
                console.warn(`File ${file} does not contain an array, skipping.`);
            }
        }
        return allStrings;
    } catch (error) {
        console.error("Error reading JSON files:", error);
    }
}

const createCollection = async (similarityMetirc: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetirc
        }
    })
    console.log(res)
}

const BATCH_SIZE = 20; // 每次传递的最大文本块数量

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    const data = await readJsonFiles(folderPath); // 从文件夹中读取所有 JSON 文件中的数据
    // console.log(data);

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        // 分割为批次
        const batch = data.slice(i, i + BATCH_SIZE);

        try {
            // 批量获取 OpenAI 嵌入
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batch,
                encoding_format: "float"
            });

            // 提取嵌入向量
            const vectors = embeddingResponse.data.map((item) => item.embedding);

            // 准备批量插入到数据库的数据
            const documents = batch.map((chunk, index) => ({
                $vector: vectors[index],
                text: chunk
            }));

            // 批量插入到数据库
            const res = await collection.insertMany(documents);
            console.log(`Inserted ${res.insertedCount} documents into the database.`);
        } catch (error) {
            console.error("Error processing batch:", error);
        }
    }
};


// createCollection().then(() => loadSampleData())
loadSampleData()