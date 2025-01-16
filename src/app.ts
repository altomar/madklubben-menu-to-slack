import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { WebClient } from '@slack/web-api';
import { SlackMessage, PdfLink } from './types';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';

dotenv.config();

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID as string;
const BASE_URL = 'https://media.uheadless.com/aciiffac23';
const TARGET_URL = 'https://www.madklubben.dk/en/lunch/madklubben';

const web = new WebClient(SLACK_TOKEN);

function getCurrentDateSuffix(): string {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // Months are zero-based
    return `${day}-${month}`;
}

async function fetchPdfLink(): Promise<PdfLink | null> {
    const response = await axios.get(TARGET_URL);
    const dateSuffix = getCurrentDateSuffix();
    const baseUrlMatch = response.data.match(/https:\/\/media\.uheadless\.com\/[^/]*/);
    // Match the PDF path that contains the current date suffix in the format /media/.../.../day-month.pdf
    const pdfPathMatch = response.data.match(new RegExp(`\\/media\\/[^"]*?\\/${dateSuffix}\\.pdf`));
    
    if (baseUrlMatch && pdfPathMatch) {
        const baseUrl = baseUrlMatch[0];
        const pdfPath = pdfPathMatch[0];
        console.log('PDF link:', baseUrl, pdfPath);
        return { url: `${baseUrl}${pdfPath}` };
    }
    console.log('No PDF link found in the response data for:', dateSuffix);
    console.log('Response data:', response.data);
    return null;
}

async function downloadPdf(pdfLink: PdfLink): Promise<string> {
    const response = await axios.get(pdfLink.url, { responseType: 'arraybuffer' });
    const filePath = path.join(__dirname, 'daily.pdf');
    fs.writeFileSync(filePath, response.data);
    console.log('PDF downloaded:', filePath);
    return filePath;
}

async function extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    console.log('PDF text:', data.text);
    return data.text;
}

async function sendToSlack(text: string): Promise<void> {
    console.log('Sending text to Slack...');
    const result = await web.chat.postMessage({
        channel: CHANNEL_ID,
        text: text,
    });
    if (result.ok) {
        console.log('Text sent to Slack successfully.');
    } else {
        console.error('Failed to send text to Slack:', result.error);
    }
}

async function main() {
    try {
        const pdfLink = await fetchPdfLink();
        if (pdfLink) {
            const filePath = await downloadPdf(pdfLink);
            const text = await extractTextFromPdf(filePath);
            await sendToSlack(text);
        } else {
            console.log('No PDF link found for today.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();