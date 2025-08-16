# Facebook Data Deletion Implementation

This document describes the implementation of Facebook's data deletion callback requirement for WhatsApp Business API integration.

## Overview

According to Facebook's [Data Deletion Callback documentation](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback), apps that collect user data must provide a data deletion endpoint that allows users to request the deletion of their data.

## Implementation Details

### Endpoints

#### 1. Data Deletion Callback
- **URL**: `POST /api/whatsapp/data-deletion`
- **Purpose**: Receives signed requests from Facebook and initiates data deletion
- **Authentication**: Public endpoint (no authentication required)
- **Request Body**:
  ```json
  {
    "signed_request": "eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjE2MzQ1Njc4OTksImlzc3VlZF9hdCI6MTYzNDU2NDI5OSwidXNlcl9pZCI6IjEyMzQ1Njc4OTAifQ==.signature"
  }
  ```
- **Response**:
  ```json
  {
    "url": "https://your-domain.com/api/whatsapp/data-deletion-status/abc123def456",
    "confirmation_code": "abc123def456"
  }
  ```

#### 2. Data Deletion Status Check
- **URL**: `GET /api/whatsapp/data-deletion-status/:requestId`
- **Purpose**: Allows users to check the status of their deletion request
- **Authentication**: Public endpoint
- **Response**:
  ```json
  {
    "id": "abc123def456",
    "status": "completed",
    "created_at": "2024-01-01T12:00:00.000Z",
    "completed_at": "2024-01-01T12:05:00.000Z",
    "message": "Your data has been successfully deleted from our systems."
  }
  ```

### Data Deletion Process

1. **Request Validation**: The signed request is validated using HMAC-SHA256
2. **User Identification**: User ID is extracted from the signed request
3. **Data Deletion**: The following data is deleted:
   - WhatsApp messages (from Messages table)
   - Conversations (from Conversations table)
   - Real estate agency data (if applicable)
   - User personal data (marked as deleted, not physically removed for audit purposes)
4. **Status Tracking**: Deletion status is tracked and can be queried

### Security Features

- **Signed Request Validation**: Uses Facebook's app secret to validate requests
- **Request Expiration**: Checks if the signed request has expired
- **Confirmation Codes**: Generates unique confirmation codes for each request
- **Audit Trail**: Keeps user records for audit purposes but marks them as deleted

### Environment Variables

Add these to your `.env` file:

```env
# Facebook App Configuration
WHATSAPP_CLIENT_SECRET=your_facebook_app_secret_here
APP_URL=https://your-domain.com
```

### Facebook App Dashboard Configuration

1. Go to your Facebook App Dashboard
2. Navigate to **App Settings** > **Advanced**
3. In the **Data Deletion Requests** section:
   - Set **Data Deletion Request URL** to: `https://your-domain.com/api/whatsapp/data-deletion`
   - Set **Data Deletion Request Status URL** to: `https://your-domain.com/api/whatsapp/data-deletion-status/{request-id}`

### Database Changes

The implementation requires the following database fields:

#### Users Table
- `whatsapp_id` (STRING, nullable): Facebook user ID
- `phone_number` (STRING, nullable): User's phone number
- `is_deleted` (BOOLEAN, default: false): Deletion flag
- `deleted_at` (DATE, nullable): Deletion timestamp

#### Migration
Run the migration to add the required fields:
```bash
npm run migrate
```

### Testing

#### Test the Data Deletion Endpoint
```bash
curl -X POST https://your-domain.com/api/whatsapp/data-deletion \
  -H "Content-Type: application/json" \
  -d '{
    "signed_request": "your_signed_request_here"
  }'
```

#### Test the Status Endpoint
```bash
curl https://your-domain.com/api/whatsapp/data-deletion-status/your-request-id
```

### Compliance Notes

- **GDPR Compliance**: This implementation helps meet GDPR requirements for data deletion
- **Audit Trail**: User records are preserved for audit purposes but marked as deleted
- **Logging**: All deletion activities are logged for compliance purposes
- **Error Handling**: Failed deletions are tracked and can be retried

### Monitoring

Monitor the following logs for data deletion activities:
- Data deletion initiation
- Data deletion completion
- Data deletion failures
- Status check requests

### Error Handling

The implementation handles various error scenarios:
- Invalid signed requests
- Expired requests
- Missing app secret
- Database errors
- User not found

### Future Enhancements

Consider implementing:
- Email notifications for deletion requests
- Admin dashboard for managing deletion requests
- Bulk deletion capabilities
- Data export before deletion
- Deletion request analytics
