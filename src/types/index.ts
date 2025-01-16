export interface SlackMessage {
    channel: string;
    text: string;
    attachments?: Array<{
        fallback: string;
        color?: string;
        title?: string;
        title_link?: string;
        text?: string;
        footer?: string;
        footer_icon?: string;
        ts?: number;
    }>;
}

export interface PdfLink {
    url: string; // Only keep the url property in PdfLink interface
}