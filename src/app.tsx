import { useState } from 'react';
import { Button } from '@/components/ui/button';

type ModelKind = 'text' | 'image';

const MODELS: Array<{ id: string; label: string; kind: ModelKind }> = [
  // From docs/ABOUT_CHATGPT_5.2_CHAT.md
  { id: 'openai/gpt-5.2-chat', label: 'GPT-5.2 Chat', kind: 'text' },
  // From docs/ABOUT_NANO_BANANA_PRO.md
  {
    id: 'google/gemini-3-pro-image-preview',
    label: 'Nano Banana Pro (Image)',
    kind: 'image',
  },
];

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  images?: string[];
};

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          const maybeText = (part as { text?: unknown }).text;
          if (typeof maybeText === 'string') return maybeText;
        }
        return '';
      })
      .filter(Boolean)
      .join('');
  }
  return '';
}

function messagesToMarkdown(messages: ChatMessage[]): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [`# Chat export`, ``, `Exported: ${timestamp}`, ``];

  for (const message of messages) {
    lines.push(`## ${message.role === 'user' ? 'User' : 'Assistant'}`);
    lines.push('');
    lines.push(message.text || '(no text)');
    lines.push('');
  }

  return lines.join('\n');
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState(MODELS[0]?.id ?? '');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedModel = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  const hasImages = messages.some((m: ChatMessage) => (m.images?.length ?? 0) > 0);

  const downloadMarkdown = () => {
    const markdown = messagesToMarkdown(messages);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `conversation-${new Date().toISOString()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const send = async () => {
    setError(null);
    const trimmed = prompt.trim();
    if (!trimmed || !apiKey || !selectedModel || isSending) return;
    if (!window.electronAPI?.openRouterChat) {
      setError('OpenRouter bridge unavailable. Run via Electron (npm run start).');
      return;
    }

    const userMessage: ChatMessage = { role: 'user', text: trimmed };
    const requestMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.text,
    }));

    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setPrompt('');
    setIsSending(true);
    try {
      const body: Record<string, unknown> = {
        model: selectedModel.id,
        messages: requestMessages,
      };
      if (selectedModel.kind === 'image') {
        body.modalities = ['image', 'text'];
      }

      const result = (await window.electronAPI.openRouterChat(apiKey, body)) as any;
      const message = result?.choices?.[0]?.message;
      const text = contentToText(message?.content);
      const images: string[] | undefined = Array.isArray(message?.images)
        ? message.images
            .map((img: any) => img?.image_url?.url)
            .filter((url: unknown): url is string => typeof url === 'string')
        : undefined;

      setMessages((prev: ChatMessage[]) => [
        ...prev,
        {
          role: 'assistant',
          text: text || (images?.length ? '(image generated)' : ''),
          images: images?.length ? images : undefined,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Simple Chatbot
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter an OpenRouter API key for this session, pick a model, and chat.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
              OpenRouter API Key
              <span
                className="text-muted-foreground"
                title="Saved only for this session (not written to disk)."
              >
                ?
              </span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Model</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              disabled={messages.length === 0 || hasImages}
              onClick={downloadMarkdown}
              title={
                hasImages
                  ? 'Markdown export is available for text-only conversations.'
                  : 'Download conversation as Markdown.'
              }
            >
              Download Markdown
            </Button>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="h-80 overflow-auto rounded-md border bg-background p-3 space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet.
              </p>
            ) : (
              messages.map((m: ChatMessage, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {m.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  {m.text ? (
                    <div className="whitespace-pre-wrap text-sm text-foreground">{m.text}</div>
                  ) : null}
                  {m.images?.length ? (
                    <div className="space-y-3">
                      {m.images.map((url: string, imageIndex: number) => (
                        <div key={imageIndex} className="space-y-2">
                          <img
                            src={url}
                            alt={`Generated image ${imageIndex + 1}`}
                            className="max-w-full rounded-md border"
                          />
                          <Button asChild variant="outline" size="sm">
                            <a href={url} download={`image-${imageIndex + 1}.png`}>
                              Download image
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Message
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  void send();
                }
              }}
              placeholder={
                selectedModel?.kind === 'image'
                  ? 'Describe the image you want...'
                  : 'Type your message...'
              }
              className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to send.
              </p>
              <Button onClick={() => void send()} disabled={!apiKey || !prompt.trim() || isSending}>
                {isSending ? 'Sending…' : selectedModel?.kind === 'image' ? 'Generate' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default App;


