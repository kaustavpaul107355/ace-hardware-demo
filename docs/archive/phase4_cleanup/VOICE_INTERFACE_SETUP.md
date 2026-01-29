# Voice Interface Setup Guide

**Status:** Code deployed, configuration required  
**Feature:** AI-powered natural language queries with voice input/output

---

## ⚠️ IMPORTANT: Environment Configuration Required

The voice interface has been deployed, but it requires Genie API credentials to function. You must configure these environment variables in your Databricks App settings.

---

## Required Environment Variables

### 1. DATABRICKS_HOST
**Value:** `e2-demo-field-eng.cloud.databricks.com`  
**Description:** Your Databricks workspace hostname (already configured)

### 2. DATABRICKS_TOKEN_FOR_GENIE
**Value:** `<YOUR_GENIE_API_TOKEN>`  
**Description:** Personal Access Token with Genie API permissions  
**How to get it:**
1. Go to Databricks workspace → User Settings → Access Tokens
2. Generate new token with "Genie" permissions
3. Copy the token value

### 3. GENIE_SPACE_ID
**Value:** `01f0f360347a173aa5bef9cc70a7f0f5`  
**Description:** Your Genie Space ID (from the URL you provided)  
**Already configured:** Yes ✅

---

## How to Configure in Databricks App

### Option 1: Via Databricks CLI (Recommended)
```bash
# Set environment variables for the app
databricks apps set-environment-variable ace-supply-chain-app \
  --key DATABRICKS_HOST \
  --value "e2-demo-field-eng.cloud.databricks.com" \
  --profile e2-demo-field

databricks apps set-environment-variable ace-supply-chain-app \
  --key DATABRICKS_TOKEN_FOR_GENIE \
  --value "<YOUR_TOKEN_HERE>" \
  --profile e2-demo-field

databricks apps set-environment-variable ace-supply-chain-app \
  --key GENIE_SPACE_ID \
  --value "01f0f360347a173aa5bef9cc70a7f0f5" \
  --profile e2-demo-field

# Restart the app to apply changes
databricks apps restart ace-supply-chain-app --profile e2-demo-field
```

### Option 2: Via Databricks UI
1. Navigate to: https://e2-demo-field-eng.cloud.databricks.com/apps
2. Find "ace-supply-chain-app"
3. Click "Settings" or "Configure"
4. Add environment variables:
   - `DATABRICKS_HOST` = `e2-demo-field-eng.cloud.databricks.com`
   - `DATABRICKS_TOKEN_FOR_GENIE` = `<your_token>`
   - `GENIE_SPACE_ID` = `01f0f360347a173aa5bef9cc70a7f0f5`
5. Restart the app

### Option 3: Via App Configuration File (app.yaml)
Add to your `app.yaml` (but **do NOT commit tokens to git**):
```yaml
env:
  - name: DATABRICKS_HOST
    value: "e2-demo-field-eng.cloud.databricks.com"
  - name: DATABRICKS_TOKEN_FOR_GENIE
    value: "<YOUR_TOKEN_HERE>"  # DO NOT COMMIT
  - name: GENIE_SPACE_ID
    value: "01f0f360347a173aa5bef9cc70a7f0f5"
```

---

## Features Included

### 🎤 Voice Input (Speech-to-Text)
- Click microphone button to start
- Speak your question naturally
- Automatically stops after 2 seconds of silence
- Edit transcript before sending

**Example queries:**
- "What stores have the highest risk scores?"
- "Show me delivery performance for the last 24 hours"
- "Which distribution centers have the most delays?"
- "How many trucks are currently in transit?"

### 🗣️ Voice Output (Text-to-Speech)
- Click speaker button to read response aloud
- Natural voice selection (Samantha, Alex, Google voices)
- Click again to stop reading
- Works in background

### 💬 Text Input
- Type questions directly
- Full markdown support in responses
- Data tables displayed in results
- Copy/paste functionality

---

## Browser Compatibility

### ✅ Full Support (Voice + Text)
- **Chrome** (recommended) - Best voice quality
- **Edge** - Excellent voice quality
- **Brave** - Good support

### ⚠️ Partial Support (Text only, limited voice)
- **Safari** - Basic voice, may have limitations
- **Firefox** - Experimental voice support

### ❌ Not Supported
- Internet Explorer (not supported by Databricks Apps)

**Note:** Voice features require **HTTPS** in production. Databricks Apps automatically provides HTTPS.

---

## Testing the Voice Interface

### 1. Text-Only Test (Works Immediately)
- Open app: https://ace-supply-chain-app-1444828305810485.aws.databricksapps.com
- Type a question in the text box
- Press Enter or click Send
- Should see "Genie API is not configured" error (expected until you add tokens)

### 2. With Genie Configured
- Configure environment variables (see above)
- Restart app
- Type: "How many stores are at risk?"
- Should receive AI-generated response with data

### 3. Voice Test (Chrome/Edge)
- Click microphone button
- Say: "What is the average delivery delay?"
- Wait for transcription to appear
- Click Send or wait for auto-submit
- Response should appear
- Click speaker button to hear it read aloud

---

## Sample Queries for Testing

### Logistics Queries
```
- "What stores have critical risk scores?"
- "Show me fleet performance metrics"
- "Which regions have the most delays?"
- "How many active trucks are in the network?"
- "What's the average delay time?"
```

### Data Analysis Queries
```
- "Compare delivery performance by region"
- "Show top 10 stores by revenue at risk"
- "What are the primary delay causes?"
- "List all distribution centers"
- "Count trucks with delays over 2 hours"
```

### Real-Time Queries
```
- "What's happening right now in the fleet?"
- "Show current network throughput"
- "Which stores need attention today?"
- "Are there any critical alerts?"
```

---

## Troubleshooting

### Error: "Genie API is not configured"
**Cause:** Missing environment variables  
**Solution:** Add DATABRICKS_TOKEN_FOR_GENIE and restart app

### Error: "Voice input isn't supported"
**Cause:** Using unsupported browser  
**Solution:** Switch to Chrome or Edge

### Error: "Failed to start conversation"
**Cause:** Invalid Genie token or Space ID  
**Solution:** Verify token has Genie permissions, check Space ID

### Voice Not Working
**Cause:** Browser permissions or HTTPS required  
**Solution:** 
- Allow microphone access when prompted
- Ensure using HTTPS (Databricks Apps URL)
- Try Chrome/Edge if using Safari/Firefox

### AI Response is Generic
**Cause:** Genie may not understand the question  
**Solution:** 
- Be more specific
- Use logistics/supply chain terminology
- Refer to specific metrics or tables

---

## Security Notes

### ⚠️ Token Security
- **Never commit tokens to git**
- Use environment variables only
- Rotate tokens regularly
- Limit token scope to Genie API only

### ✅ Safe to Commit
- `GENIE_SPACE_ID` - Not sensitive
- `DATABRICKS_HOST` - Public hostname
- Code and configuration structure

### 🔒 Keep Secret
- `DATABRICKS_TOKEN_FOR_GENIE` - Highly sensitive
- User access tokens
- SQL Warehouse credentials

---

## What's Next

### Phase 2 Complete ✅
- [x] Voice input with speech recognition
- [x] Text input for queries
- [x] Genie API integration
- [x] Natural language processing
- [x] Text-to-speech responses
- [x] Professional UI
- [x] Deployed to production

### Future Enhancements (Optional)
1. **Query History** - Save and recall previous questions
2. **Suggested Questions** - Quick-click common queries
3. **Multi-turn Conversations** - Follow-up questions with context
4. **Export Results** - Download query results as CSV
5. **Custom Voice Settings** - Adjust speech rate, pitch, volume
6. **Offline Mode** - Cache common queries

---

## Support

### Need Help?
1. Check backend logs: `https://e2-demo-field-eng.cloud.databricks.com/apps/ace-supply-chain-app/logs`
2. Verify environment variables are set
3. Test with simple text query first
4. Check browser console for errors (F12)

### Known Limitations
- Voice recognition accuracy varies by accent/background noise
- Genie responses take 4-8 seconds to process
- Maximum 40 polling attempts (80 seconds timeout)
- Some queries may not work if data schema doesn't match

---

**Ready to test!** Configure your Genie token and restart the app.
