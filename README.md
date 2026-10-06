# SABI — find wetin you sabi

A conversational AI skill-discovery coach for young Nigerians. SABI helps
people explore learning paths based on their natural strengths and interests,
while taking practical constraints like time, devices, data, electricity, and
budget into account. Its voice is warm, youthful, and locally grounded, with
English, Nigerian Pidgin, Yorùbá, and Igbo supported without forced slang. SABI
favours low-cost experiments and never promises a job or income.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
Copy-Item .env.example .env.local
```

Create an [OpenRouter API key](https://openrouter.ai/keys), then add it to
`.env.local` as `OPENROUTER_API_KEY`. The key is used on the server only. Do
not use a `NEXT_PUBLIC_` variable or commit `.env.local`.

The app currently uses OpenRouter's free NVIDIA Nemotron model. Free models
have rate limits and may be temporarily unavailable; OpenRouter's documented
free-model API limit is 50 requests per day without purchased credits. Free
model availability can change. Prompts are sent through OpenRouter to the
selected upstream model provider, so do not enter sensitive personal
information.

Start the development server and open [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

For a public preview, deploy the app and set `OPENROUTER_API_KEY` in the
deployment environment.

## Chat implementation

- [Chat experience](app/chat-interface.tsx): streaming messages, stop control,
  mobile composer, and scroll-aware jump-to-latest.
- [Streaming route](app/api/chat/route.ts): validates the conversation and
  streams OpenRouter responses with the AI SDK.
- [Coach configuration and system prompt](lib/ai-config.ts): sets the free
  model, concise SABI voice, output limit, and guidance for strengths-first,
  Nigeria-aware advice. The coach uses the learner's replies to identify
  strengths and explore realistic, low-cost ways to test earning with a
  suitable skill. There is no fixed conversation or question limit.

The coach has no live job listings, course prices, or earnings data. It should
not invent those details or promise outcomes; it encourages learners to verify
local opportunities and try low-cost projects before paying for training.

## Checks

```bash
npm run lint
npm run build
```
