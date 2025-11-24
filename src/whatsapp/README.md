# WhatsApp Module

This module provides WhatsApp Business API integration for the Kondomino API.

## Features

- Webhook verification for WhatsApp Business API
- Webhook event handling (messages, status updates, etc.)
- Message sending functionality via WhatsApp Business API
- AI agent with predefined responses for real estate inquiries
- Real estate agent detection and conversation management
- Database storage for conversations and messages
- Media file reference storage (cloud storage ready)
- Automatic access token validation and refresh
- Comprehensive logging and error handling

## Setup

### Environment Variables

Add the following environment variables to your `.env` file:

```env
WHATSAPP_VERIFY_TOKEN=your_webhook_verification_token_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_CLIENT_ID=your_facebook_app_id_here
WHATSAPP_CLIENT_SECRET=your_facebook_app_secret_here
```

### Webhook Configuration

1. In your WhatsApp Business API dashboard, set the webhook URL to:
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```

2. Set the verify token to match your `WHATSAPP_VERIFY_TOKEN` environment variable.

### Token Management

The module includes automatic token validation and refresh capabilities:

- **Token Validation**: Validates the access token on startup and before each API call
- **Automatic Refresh**: Attempts to refresh expired tokens using Facebook's token exchange endpoint
- **Error Handling**: Provides specific error messages for token-related issues

**Note**: For token refresh to work, you need to provide your Facebook App ID and Secret in the environment variables.

## Conversation Management

The module includes a sophisticated conversation management system for real estate agents:

### Real Estate Agent Detection
- **Keyword-based detection**: Identifies real estate agents based on message content
- **Database lookup**: Checks if phone number is already registered
- **AI-powered detection**: Ready for advanced AI analysis (next step)

### Database Entities
- **RealEstateAgency**: Stores information about real estate agencies
- **Conversation**: Manages ongoing conversations with agents
- **Message**: Stores individual messages with media references

### Media Handling
- **Reference storage**: Only stores media metadata, not actual files
- **Cloud storage ready**: Designed for integration with cloud storage services
- **Multiple media types**: Supports images, documents, audio, video, location, contacts

### Conversation Flow
1. **Message received** → Agent detection
2. **If real estate agent** → Create/update agency and conversation
3. **Save message** → Store in database with media references
4. **AI response** → Generate and send appropriate response
5. **Save response** → Store outgoing message in database

## API Endpoints

### GET /api/whatsapp/webhook
Verifies the webhook with WhatsApp Business API.

**Query Parameters:**
- `hub.mode`: Webhook mode (should be "subscribe")
- `hub.verify_token`: Verification token
- `hub.challenge`: Challenge string from WhatsApp

**Response:** Returns the challenge string if verification is successful.

### POST /api/whatsapp/webhook
Handles incoming webhook events from WhatsApp.

**Request Body:** WhatsApp webhook payload

**Response:** "OK" if processed successfully.

### POST /api/whatsapp/send-message
Sends a message via WhatsApp.

**Request Body:**
```json
{
  "to": "5511999999999",
  "type": "text",
  "text": "Hello World"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "to": "5511999999999",
    "type": "text",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## AI Agent

The module includes a mock AI agent that provides intelligent responses to user messages:

### Supported Conversation Topics:
- **Greetings**: Responds to hello, hi, good morning, etc.
- **Apartment Search**: Helps users find apartments
- **Price Inquiries**: Provides pricing information
- **Visit Scheduling**: Helps schedule property visits
- **General Help**: Provides assistance and guidance

### Response Features:
- Contextual responses based on user input
- Quick reply buttons for easy navigation
- Emoji-rich messages for better user experience
- Multiple response variations for natural conversation

## Message Types

The module supports the following message types:

- `text`: Text messages
- `image`: Image messages
- `document`: Document messages
- `audio`: Audio messages
- `video`: Video messages

## Testing

Run the tests with:

```bash
npm test src/whatsapp
```

## Next Steps

To complete the WhatsApp integration, you'll need to:

1. Add the actual WhatsApp Business API client (e.g., using the official Meta SDK)
2. Implement proper message sending with the WhatsApp API
3. Add message persistence to the database
4. Implement business logic for handling different message types
5. Add rate limiting and error handling for API calls

## Example Usage

### Sending a Text Message

```typescript
const messageData = {
  to: '5511999999999',
  type: 'text',
  text: 'Hello! How can I help you today?'
};

const response = await whatsappService.sendMessage(messageData);
```

### Handling Incoming Messages

The webhook handler automatically processes incoming messages and logs them. You can extend the `handleTextMessage` and `handleImageMessage` methods in the service to add your business logic.
