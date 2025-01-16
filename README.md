# CPH Daily Menu

This project automates the process of downloading a daily PDF from a specified webpage and sending it to a designated Slack channel.

## Project Structure

```
my-automation-project
├── src
│   ├── app.ts          # Main entry point for the automation logic
│   └── types.ts        # Type definitions and interfaces
├── package.json        # npm configuration file
├── tsconfig.json       # TypeScript configuration file
└── README.md           # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd my-automation-project
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Environment Variables:**
   - Create a `.env` file in the root directory and add the following variables:
     ```
     SLACK_WEBHOOK_URL=<your-slack-webhook-url>
     SLACK_TOKEN=<your-slack-token>
     SLACK_CHANNEL_ID=<your-slack-channel-id>
     ```

## Usage

To run the automation script, use the following command:
```
npm start
```

This will execute the script in `src/app.ts`, which will:
- Scrape the specified webpage for the PDF link corresponding to the current date.
- Download the PDF file.
- Send the PDF to the specified Slack channel.

## Dependencies

- Axios: For making HTTP requests.
- Node-fetch: For fetching resources.
- dotenv: For managing environment variables.
- Slack API client: For sending messages to Slack.


## License

This project is licensed under the MIT License.