import fs from "fs/promises";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

const data = [
    'http://en.wikipedia.org/wiki/Formula_One',
    'https://formula1.com/en/latest/all',
    'https://www.formula1.com/en/racing/2024.html',
    'https://www.formula1.com/en/latest/article/must-see-how-new-ferrari-driver-hamiltons-first-day-at-maranello-unfolded.4MyIn5BiFyK3PAyMPMbqC9',
    'https://www.planetf1.com/features/f1-driver-salaries-highest-paid-list',
    'https://www.formula1.com/en/results/2024/drivers',
    'https://newsroom.arm.com/news/arm-aston-martin-aramco-f1-partnership',
    'https://www.skysports.com/f1/news/12433/13256251/max-verstappen-wins-2024-f1-world-title-as-red-bull-driver-closes-out-drivers-championship-at-las-vegas-gp?utm_source=chatgpt.com',
    'https://www.formula1.com/en/latest/article/aston-martin-sign-swiss-racer-tina-hausmann-for-2024-f1-academy-campaign.npLWqVcdRgsaz6NOTXccN',
    'https://www.astonmartinf1.com/en-GB/driver/jessica-hawkins',
    'https://www.formula1.com/en/racing/2023',
    'https://www.formula1.com/en/racing/2022',
]

const scrapePage = async (url: string) => {
    console.log("Scraping... " + url);
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => {
                // 提取正文内容，排除不必要的部分
                const removeTags = (selector: string) => {
                    document.querySelectorAll(selector).forEach(el => el.remove());
                };
                // 移除脚本、样式等无用内容
                removeTags("script")
                removeTags("style")
                removeTags("noscript")

                // 提取主要内容
                const mainContent = document.querySelector("article, main, body");
                return (mainContent as HTMLElement)?.innerText || ""; //返回纯文本
            });
            await browser.close();
            return result;
        }
    });

    const rawText = await loader.scrape();

    // 进一步清洗：去掉多余空行或噪声字符
    return rawText?.replace(/\n\s*\n/g, "\n").trim() || "";
}

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const loadSampleData = async () => {
    const tasks = data.map(async (url) => {
        const content = await scrapePage(url);
        const chunks = await splitter.splitText(content);

        // 生成文件名
        const fileName = `./data/chunks_${encodeURIComponent(url)}.json`;

        try {
            await fs.writeFile(fileName, JSON.stringify(chunks, null, 2), "utf-8");
            console.log(`chunks saved to ${fileName}`);
        } catch (error) {
            console.error(`Failed to save chunks to ${fileName}:`, error);
        }
    });

    // 并行处理所有任务
    await Promise.all(tasks);
    console.log("All data loaded.");
}

loadSampleData()

