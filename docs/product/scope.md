# MeetFlow AI — Product Scope & Feature Boundaries

## 1. Vision & Assignment Context
MeetFlow AI is a high-density, AI-first meeting intelligence application inspired by Fathom. The objective for the 8x Product Engineer assignment is to deliver a fast, reliable, beautifully executed product experience with realistic seeded datasets and verified AI development transparency.

---

## 2. Scope Matrix

### Must-Have for Assignment Submission
These capabilities form the core product experience and are prioritized for implementation:
1. **Realistic Seeded Meeting Data**: Multi-speaker conversations with realistic dialogue, realistic timestamps, action items, executive summaries, and key takeaways.
2. **Meeting Library & Search**: Fast filtering by date, speaker, title, and full-text keyword matching across transcripts.
3. **Meeting Detail Workspace**: Polished 3-column / split-view workspace layout accommodating video/audio playback, synchronized transcript, and intelligence panels.
4. **Playback & Transcript Synchronization**: Interactive scrubbing where clicking a transcript segment jumps to the playback timestamp, and active spoken words highlight synchronously.
5. **AI Summaries & Action Items**: Executive summaries, bulleted takeaways, categorized action items with assignee tags and status toggles.
6. **Highlights & Annotations**: Bookmark critical moments with quotes and notes.
7. **Shareable Meeting or Clip Links**: Publicly viewable, read-only link for non-authenticated guests to watch a meeting or clip.
8. **Publicly Accessible Deployed Application**: Working production deployment on Vercel/Render/Railway with live database.

### Nice-to-Have (Secondary Priority)
These capabilities will be added if time permits without risking submission quality:
1. **Google Calendar Integration**: Simulated or real OAuth calendar feed showing upcoming meetings and previous calls.
2. **Real Audio Transcription**: Optional audio file upload processed via Whisper / Deepgram.
3. **Ask AI Meeting Assistant**: In-context LLM chat drawer answering questions directly from the current meeting transcript.
4. **Summary Templates**: Switch between Executive, Sales Discovery, Engineering 1:1, and Customer Success summary lenses.
5. **Advanced Sharing**: Expiring public links and passcode protection.

### Intentionally Deferred
To ensure focused velocity and avoid scope creep, these features are explicitly out of scope for this assignment:
1. **Live Recording Bot**: The assignment brief explicitly permits stubbing the bot integration. Building custom Zoom/Teams/Meet headless bots introduces unnecessary fragility.
2. **Stripe Billing / Paywalls**: No payment processing, subscription tiers, or checkout workflows.
3. **Complex Organization Management**: No multi-tenant enterprise org hierarchies or RBAC matrix.
4. **Enterprise Permissions & Audit Logs**: Single-workspace / team model is sufficient.
5. **Extensive Third-Party CRM Integrations**: No complex bidirectional Salesforce or HubSpot sync engines.
