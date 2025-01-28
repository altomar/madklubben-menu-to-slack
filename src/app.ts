import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { WebClient } from '@slack/web-api';
import { SlackMessage, PdfLink } from './types';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';

dotenv.config();

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID as string;
// const BASE_URL = 'https://media.uheadless.com/aciiffac23';
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
    return data.text;
}

async function formatText(text: string): Promise<string> {
    // remove bullet points and extra spaces
    const start = text.indexOf('•');
    const end = text.lastIndexOf('•');
    if (start === -1 || end === -1 || start === end) {
        return text;
    }
    let selectedText = text.substring(start + 1, end);
    selectedText = selectedText.replace(/•/g, ' ');

    // remove lines containing "allergen"
    selectedText = selectedText.split('\n').filter((line) => !line.toLowerCase().includes('allergen')).join('\n');

    // if the line is only 1 or 2 characters long, replace it with an empty line
    selectedText = selectedText.split('\n').map((line) => line.length > 2 ? line : '').join('\n');

    // make the first line of the entire text bold
    const lines = selectedText.split('\n');
    if (lines.length > 0) {
        lines[0] = `*${lines[0].trim()}*`;
    }
    selectedText = lines.join('\n');

    console.log('PDF text:', selectedText.trim());
    return selectedText.trim();
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
            const extractedText = await extractTextFromPdf(filePath);
            const formattedText = await formatText(extractedText);
            await sendToSlack(formattedText);
        } else {
            console.log('No PDF link found for today.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();