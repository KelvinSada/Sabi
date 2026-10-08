# Sabi — find your place in tech

A conversational tech-skill discovery coach for young Nigerians. Sabi helps
people connect their natural strengths and interests to beginner-friendly
technology skills, while taking practical constraints like time, devices, data,
electricity, and budget into account. Its voice is warm, youthful, and locally
grounded, with English, Nigerian Pidgin, Yorùbá, and Igbo supported without
forced slang. Sabi favours low-cost experiments and never promises a job or
income.

The interface uses locally grounded examples while avoiding assumptions about
where a learner lives, what devices they own, or how reliable their electricity
and internet access are.

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
  mobile composer, scroll-aware jump-to-latest, and browser-local saved chat
  history. Chats are available in the same browser and on the same device.
- [Streaming route](app/api/chat/route.ts): validates the conversation and
  streams OpenRouter responses with the AI SDK.
- [Coach configuration and system prompt](lib/ai-config.ts): sets the free
  model, concise Sabi voice, output limit, and guidance for matching a learner's
  strengths to practical tech skills. The coach adapts first steps to available
  devices, time, data, and budget. There is no fixed conversation or question
  limit.

The coach has no live Nigerian job listings, course prices, training
availability, or earnings data. It should not invent those details or promise
outcomes; it encourages learners to verify opportunities and try low-cost
projects before paying for training.

Saved chat sessions are stored in the browser's local storage. They do not sync
between devices or browsers and may be removed if local browser data is cleared.

## Checks

```bash
npm run lint
npm run build
```
