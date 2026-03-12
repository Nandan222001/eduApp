# AI Chatbot Assistant - Quick Start Guide

## For Users

### Opening the Chatbot
1. Look for the blue floating button with a robot icon in the bottom-right corner
2. Click the button to open the chat interface

### Sending Messages
1. Type your question in the input field at the bottom
2. Press Enter or click the send button (arrow icon)
3. Wait for the bot's response (you'll see typing dots)

### Using Quick Replies
- Click any of the quick reply chips above the input field
- Common queries: Homework Help, Exam Schedule, Today's Classes, My Grades, Study Tips

### Voice Input
1. Click the microphone icon next to the input field
2. Allow microphone access when prompted
3. Speak your question
4. Click the stop button (red square) when done
5. The text will appear in the input field
6. Click send to submit

### Image Upload for Homework Help
**Method 1: Click to Upload**
1. Click the paperclip icon
2. Select an image file from your device
3. The image name will appear above the input
4. Add any additional context in the text field
5. Click send

**Method 2: Drag and Drop**
1. Drag an image file from your computer
2. Drop it in the chat window
3. The image will be attached
4. Click send

### Changing Language
1. Click the language dropdown (above the input field)
2. Select your preferred language
3. The bot will respond in that language

### Viewing Conversation History
1. Click the "History" tab at the top of the chat window
2. Browse your past conversations
3. Click on a conversation to view/restore it
4. Click the trash icon to delete a conversation

### Using Contextual Suggestions
- Notice the blue suggestion box at the top of the chat
- These suggestions change based on what page you're on
- Click any suggestion to quickly ask that question

### Minimizing the Chat
1. Click the minimize icon (—) in the chat header
2. The chat will collapse but stay visible
3. Click the FAB button to restore it

### Closing the Chat
- Click the X icon in the chat header
- The FAB button will reappear in the bottom-right corner

## For Developers

### Quick Setup

1. **Frontend is ready** - The chatbot is already integrated in `App.tsx`
2. **Backend is ready** - API endpoints are configured in `src/api/v1/chatbot.py`
3. **No additional setup required** - Works out of the box

### File Locations

**Frontend Components:**
```
frontend/src/components/chatbot/
├── ChatbotWidget.tsx          # Main component
├── ChatMessage.tsx             # Message display
├── TypingIndicator.tsx         # Loading animation
├── QuickReplies.tsx            # Quick buttons
├── VoiceRecorder.tsx           # Voice input
├── ImageUploader.tsx           # Image upload
├── LanguageSelector.tsx        # Language switcher
├── ConversationHistoryList.tsx # History view
└── ContextualHelp.tsx          # Page suggestions
```

**API Integration:**
```
frontend/src/api/chatbot.ts     # API calls
frontend/src/types/chatbot.ts   # TypeScript types
frontend/src/hooks/useChatbot.ts # React hook
```

**Backend API:**
```
src/api/v1/chatbot.py           # API endpoints
```

### Adding Custom Responses

Edit `src/api/v1/chatbot.py`:

```python
@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(request: ChatMessageRequest, ...):
    message = request.message.lower()
    
    # Add your custom logic
    if "your keyword" in message:
        response_message = "Your custom response"
        suggestions = ["Suggestion 1", "Suggestion 2"]
```

### Adding Page-specific Suggestions

Edit `src/api/v1/chatbot.py`:

```python
suggestions_map = {
    "/your/page/path": [
        "Custom suggestion 1",
        "Custom suggestion 2",
        "Custom suggestion 3",
    ],
}
```

### Customizing Quick Replies

Edit `frontend/src/components/chatbot/QuickReplies.tsx`:

```typescript
const quickReplies: QuickReply[] = [
  { 
    id: 'unique-id', 
    label: 'Button Text', 
    value: 'Message to send', 
    category: 'homework' 
  },
];
```

### Styling

The chatbot uses Material-UI theme. To customize:

**Colors:**
```typescript
// frontend/src/theme.ts
palette: {
  primary: { main: '#your-color' },
  secondary: { main: '#your-color' },
}
```

**Sizing:**
```typescript
// ChatbotWidget.tsx
width: { xs: '90vw', sm: 400 },  // Change width
height: { xs: '80vh', sm: 600 }, // Change height
```

**Position:**
```typescript
// ChatbotWidget.tsx
sx={{
  position: 'fixed',
  bottom: 24,    // Change these
  right: 24,     // Change these
}}
```

## API Endpoints

### Send Message
```
POST /api/v1/chatbot/message
Body: { "message": "your question", "context": {...} }
```

### Upload Image
```
POST /api/v1/chatbot/upload-image
Body: FormData with image file
```

### Voice to Text
```
POST /api/v1/chatbot/voice-to-text
Body: FormData with audio blob
```

### Get History
```
GET /api/v1/chatbot/history
```

### Get Suggestions
```
GET /api/v1/chatbot/suggestions?page=/student/dashboard
```

### Clear History
```
DELETE /api/v1/chatbot/history
```

## Common Customizations

### Change FAB Position
```typescript
<Fab
  sx={{
    bottom: 16,  // Change vertical position
    right: 16,   // Change horizontal position
    left: 16,    // Or position on left
  }}
/>
```

### Change Chat Window Size
```typescript
<Paper
  sx={{
    width: { xs: '95vw', sm: 500 },    // Wider
    height: { xs: '85vh', sm: 700 },   // Taller
  }}
/>
```

### Add More Languages
```typescript
// LanguageSelector.tsx
const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  // Add more...
];
```

### Disable Features
```typescript
// ChatbotWidget.tsx
// Comment out/remove unwanted features:
<VoiceRecorder />        // Remove voice input
<ImageUploader />        // Remove image upload
<QuickReplies />         // Remove quick replies
<LanguageSelector />     // Remove language selector
```

## Testing

### Local Development
```bash
# Frontend
cd frontend
npm run dev

# Backend
poetry run uvicorn src.main:app --reload

# Access chatbot at http://localhost:5173
```

### Test Scenarios
1. ✓ Send text message
2. ✓ Use quick reply
3. ✓ Record voice message
4. ✓ Upload image
5. ✓ Switch language
6. ✓ View history
7. ✓ Use contextual suggestions
8. ✓ Minimize/maximize
9. ✓ Navigate pages (suggestions update)

## Troubleshooting

### Chatbot not appearing
- Check browser console for errors
- Verify `ChatbotWidget` is in `App.tsx`
- Check if user is authenticated

### Voice recording not working
- Check browser microphone permissions
- Try in HTTPS environment (required for some browsers)
- Check browser console for errors

### Image upload failing
- Check file size (may need backend limit)
- Verify file type is image
- Check network tab for API errors

### Contextual suggestions not updating
- Check if page path matches `suggestions_map` in backend
- Verify API endpoint is accessible
- Check browser console for errors

## Support

For issues or questions:
1. Check the full documentation: `AI_CHATBOT_IMPLEMENTATION.md`
2. Review the code comments in components
3. Test in browser developer tools
4. Check API responses in network tab

## Next Steps

1. **Integrate AI**: Replace rule-based responses with OpenAI/GPT
2. **Add Persistence**: Store conversations in database
3. **Enhance OCR**: Integrate better text extraction
4. **Add Analytics**: Track usage and improve responses
5. **Implement Feedback**: Let users rate responses

---

The chatbot is ready to use! Start exploring and customize as needed.
