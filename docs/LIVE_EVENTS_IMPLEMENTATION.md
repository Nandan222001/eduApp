# Live Events Streaming Implementation

## Overview

This document provides technical details about the implementation of the school event live streaming feature.

## Architecture

### Components

1. **Models** (`src/models/live_events.py`)
   - `LiveEvent`: Main event model
   - `EventViewer`: Viewer tracking and analytics
   - `EventChatMessage`: Chat messages with moderation
   - `EventTicket`: Monetization and ticketing
   - `ChatModerationRule`: Configurable chat moderation
   - `StreamAnalytics`: Time-series stream quality data

2. **API Endpoints** (`src/api/v1/live_events.py`)
   - Event CRUD operations
   - Stream management (start/stop/generate keys)
   - Access control and permissions
   - Viewer tracking
   - Chat messaging and moderation
   - Ticket purchase and management
   - Analytics and reporting
   - Recording management

3. **WebSocket** (`src/api/v1/live_events_websocket.py`)
   - Real-time chat
   - Viewer count updates
   - Moderation actions
   - Keep-alive ping/pong

4. **Services**
   - `YouTubeLiveService`: YouTube Live API integration
   - `VimeoLiveService`: Vimeo Live API integration
   - `ChatModerationService`: Real-time chat moderation
   - `EventTicketService`: Ticket management and payment

5. **Schemas** (`src/schemas/live_event.py`)
   - Request/response validation
   - Data transformation
   - Type safety

## Database Schema

### Tables

#### live_events
Primary event table storing all live streaming event information.

**Key Fields:**
- Event metadata (name, type, description, timestamps)
- Stream configuration (platform, URLs, keys)
- Analytics (viewer counts, total views)
- Features (chat, moderation, recording)
- Access control (restrictions, allowed grades/sections)
- Monetization (ticket pricing)

#### event_viewers
Tracks individual viewer sessions and engagement.

**Metrics Tracked:**
- Join/leave timestamps
- Watch duration
- Message count
- Device/browser info
- Location

#### event_chat_messages
Stores all chat messages with moderation data.

**Features:**
- Message content and type
- Moderation status (deleted, flagged)
- Moderator information
- Reply threading
- Reactions

#### event_tickets
Manages ticket sales for monetized events.

**Workflow:**
- Ticket generation
- Payment tracking
- Redemption
- Refunds

#### chat_moderation_rules
Configurable moderation rules per institution.

**Rule Types:**
- Banned words
- Regex patterns
- Spam detection
- Profanity filter
- URL blocking
- Caps lock detection

#### stream_analytics
Time-series data for stream quality monitoring.

**Metrics:**
- Viewer count snapshots
- Chat message rate
- Bitrate
- Buffering events

## Features Implemented

### 1. Event Types
- Sports games
- Concerts
- Plays/theater
- Graduations
- Assemblies
- Parent meetings

### 2. Stream Platforms

#### YouTube Live
- Automatic broadcast creation
- Stream key generation
- RTMP endpoint configuration
- Status management (ready, live, complete)
- Statistics retrieval
- Automatic recording

#### Vimeo Live
- Event creation
- Stream configuration
- Privacy settings
- Embed URL generation
- Statistics and analytics

#### Agora (Future Enhancement)
- SDK-based streaming
- Lower latency
- Better quality control

### 3. Access Control

#### Public Events
Anyone can watch (with optional login requirement)

#### Parents Only
Restricted to users associated with students

#### Specific Grades/Sections
Fine-grained access based on:
- Grade IDs
- Section IDs
- Combinations of both

### 4. Chat Moderation

#### Automatic Moderation
- Banned word filtering
- Regex pattern matching
- Spam detection (repeated characters, excessive punctuation)
- Profanity filtering
- URL blocking
- Excessive caps detection

#### Moderator Actions
- Delete messages
- Flag for review
- Mute/unmute chat
- Block users (future enhancement)

#### Moderation Rules
Configurable per institution with:
- Rule type (banned_word, regex, spam, etc.)
- Action (flag, delete, block_user)
- Severity levels (low, medium, high)

### 5. Monetization

#### Ticket System
- Unique ticket codes
- Payment integration (Razorpay ready)
- Payment status tracking
- Automatic redemption
- Refund support

#### Revenue Tracking
- Total revenue
- Refunded amounts
- Net revenue
- Ticket counts by status

### 6. Analytics

#### Viewer Analytics
- Total viewers
- Current viewers
- Peak viewer count
- Average watch duration
- Total watch time
- Demographic data (device, browser, location)

#### Engagement Analytics
- Messages sent per viewer
- Reaction counts
- Chat participation rate

#### Stream Quality
- Viewer count over time
- Chat message rate
- Bitrate trends
- Buffering incidents

### 7. Recording Management

#### Automatic Recording
- Platform-native recording (YouTube/Vimeo)
- Auto-start on stream begin
- Auto-stop on stream end

#### Post-Processing
- Recording URL extraction
- S3 upload support
- Archival based on retention policy

#### Archival
- Configurable retention days
- Archive timestamp tracking
- Archive location metadata

## API Usage Flow

### Creating and Streaming an Event

1. **Create Event**
   ```
   POST /api/v1/live-events/
   ```

2. **Generate Stream Key** (optional, done automatically)
   ```
   POST /api/v1/live-events/{event_id}/stream/generate-key
   ```

3. **Configure Broadcasting Software**
   - Use RTMP URL and stream key from step 2
   - Set up OBS, Streamlabs, or similar

4. **Start Stream**
   ```
   POST /api/v1/live-events/{event_id}/stream/start
   ```

5. **Monitor Analytics**
   ```
   GET /api/v1/live-events/{event_id}/analytics
   ```

6. **End Stream**
   ```
   POST /api/v1/live-events/{event_id}/stream/end
   ```

7. **Access Recording**
   - Recording URL available in event details
   - Archive when needed

### Viewing an Event

1. **Check Access**
   ```
   GET /api/v1/live-events/{event_id}/access-check
   ```

2. **Purchase Ticket** (if required)
   ```
   POST /api/v1/live-events/{event_id}/tickets
   ```

3. **Join Event**
   ```
   POST /api/v1/live-events/{event_id}/viewers
   ```

4. **Connect to WebSocket**
   ```
   WS /api/v1/live-events/ws/{event_id}?token=<auth_token>
   ```

5. **Send Chat Messages**
   ```json
   {"type": "chat_message", "message": "Hello!"}
   ```

6. **Update Watch Duration**
   ```
   PUT /api/v1/live-events/{event_id}/viewers/{viewer_id}
   ```

7. **Leave Event**
   ```
   PUT /api/v1/live-events/{event_id}/viewers/{viewer_id}
   {"is_currently_watching": false}
   ```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# YouTube Live API
YOUTUBE_API_KEY=your_youtube_api_key

# Vimeo Live API
VIMEO_ACCESS_TOKEN=your_vimeo_access_token
```

### YouTube Setup

1. Enable YouTube Data API v3 in Google Cloud Console
2. Create API credentials (API Key or OAuth 2.0)
3. Set quota limits appropriately
4. Test with a trial broadcast

### Vimeo Setup

1. Create Vimeo account with Live plan
2. Generate API access token with scopes:
   - `video_files`
   - `create`
   - `edit`
   - `delete`
3. Test stream creation

## Security Considerations

### Authentication
- All endpoints require authentication via JWT
- WebSocket connections require token parameter

### Authorization
- Institution-based access control
- Event creator permissions
- Moderator role checks
- Ticket ownership validation

### Data Protection
- Stream keys encrypted in database
- Payment information handled securely
- PII in viewer data (IP, location) optional

### Rate Limiting
- API endpoints rate limited
- WebSocket message throttling
- Chat spam prevention

## Performance Optimization

### Database Indexes
- Composite indexes on frequently queried fields
- Covering indexes for analytics queries
- Partial indexes for active viewers

### Caching
- Redis caching for:
  - Current viewer counts
  - Chat messages (recent N messages)
  - Event status
  - Access permissions

### Background Tasks
- Stream platform setup (async)
- Recording processing (async)
- Analytics aggregation (periodic)

### WebSocket Optimization
- Connection pooling
- Message batching
- Automatic reconnection
- Ping/pong keepalive

## Testing

### Unit Tests
```python
# Test event creation
def test_create_live_event():
    response = client.post("/api/v1/live-events/", json={...})
    assert response.status_code == 201

# Test access control
def test_event_access_control():
    response = client.get(f"/api/v1/live-events/{event_id}/access-check")
    assert response.json()["has_access"] == True
```

### Integration Tests
- YouTube API integration
- Vimeo API integration
- Payment gateway integration
- WebSocket connections

### Load Tests
- Concurrent viewers
- Chat message throughput
- Database query performance
- WebSocket scalability

## Monitoring

### Metrics to Track
- Active streams count
- Total viewers per event
- Peak concurrent viewers
- Chat message rate
- API response times
- WebSocket connection count
- Error rates

### Alerting
- Stream failures
- High error rates
- Low viewer count (unexpected)
- Chat moderation queue buildup
- Payment failures

## Future Enhancements

1. **Multi-camera Support**
   - Switch between camera angles
   - Picture-in-picture

2. **Interactive Polling**
   - Live polls during events
   - Q&A sessions

3. **Reactions**
   - Emoji reactions
   - Applause animations

4. **Screen Sharing**
   - Share presentations
   - Show student work

5. **Simulcast**
   - Stream to multiple platforms simultaneously
   - Reach wider audience

6. **DVR Functionality**
   - Pause/rewind live stream
   - Jump to specific moments

7. **Breakout Rooms**
   - Separate discussion groups
   - Parent-teacher meetings

8. **Enhanced Analytics**
   - Heatmaps of viewer attention
   - Engagement scoring
   - Predictive analytics

9. **AI Moderation**
   - ML-based content filtering
   - Sentiment analysis
   - Auto-highlight generation

10. **Accessibility**
    - Live captioning
    - Sign language interpretation
    - Audio descriptions

## Troubleshooting

### Common Issues

**Stream not starting:**
- Check stream key validity
- Verify platform API credentials
- Confirm RTMP server status

**Chat messages not appearing:**
- Check WebSocket connection
- Verify moderation rules
- Check for blocked words

**Access denied errors:**
- Verify user permissions
- Check ticket status
- Validate grade/section membership

**Recording not available:**
- Confirm auto_record enabled
- Check platform recording status
- Verify retention period

## Support

For issues or questions:
1. Check API documentation
2. Review error logs
3. Test with sample events
4. Contact platform support (YouTube/Vimeo)
