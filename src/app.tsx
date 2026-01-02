import { useEffect, useMemo, useRef, useState } from 'react';
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
  createdAt: string;
  text: string;
  images?: string[];
};

function formatTimeHHMM(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isoToFilenameStamp(iso: string): string {
  const date = new Date(iso);
  const normalized = Number.isNaN(date.getTime()) ? iso : date.toISOString();
  return normalized.replace(/:/g, '-');
}

function imageExtensionFromDataUrl(url: string): string {
  if (url.startsWith('data:image/png')) return 'png';
  if (url.startsWith('data:image/jpeg')) return 'jpg';
  if (url.startsWith('data:image/webp')) return 'webp';
  return 'png';
}

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
    if (message.images?.length) {
      lines.push('### Images');
      for (let i = 0; i < message.images.length; i++) {
        const url = message.images[i];
        const ext = imageExtensionFromDataUrl(url);
        const stamp = isoToFilenameStamp(message.createdAt);
        const filename = `image-${stamp}-${i + 1}.${ext}`;
        lines.push(`- [${filename}](${filename})`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function App() {
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState(MODELS[0]?.id ?? '');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  const selectedModel = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  const emptyStateText = useMemo(() => {
    if (selectedModel?.kind === 'image') {
      return 'No messages yet. Describe an image below, then click Generate (or press Ctrl+Enter).';
    }
    return 'No messages yet. Type a message below, then click Send (or press Ctrl+Enter).';
  }, [selectedModel?.kind]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;

    if (isNearBottomRef.current) {
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

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

    const userMessage: ChatMessage = { role: 'user', createdAt: new Date().toISOString(), text: trimmed };
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
          createdAt: new Date().toISOString(),
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
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Simple Chatbot
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter an OpenRouter API key for this session, pick a model, and chat.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-card-foreground">Settings</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsCollapsed((v) => !v)}
              aria-expanded={!isSettingsCollapsed}
            >
              {isSettingsCollapsed ? 'Show' : 'Hide'}
            </Button>
          </div>

          {isSettingsCollapsed ? null : (
            <div className="pt-4 space-y-4">
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

              <div className="border-t pt-4 space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    disabled={messages.length === 0}
                    onClick={downloadMarkdown}
                    title={'Download conversation as Markdown (includes image links).'}
                  >
                    Download Markdown
                  </Button>
                </div>

                {error ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground">
                    <div className="text-xs font-medium text-foreground mb-1">Error</div>
                    <div className="whitespace-pre-wrap break-words max-h-40 overflow-auto">
                      {error}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div
            ref={transcriptRef}
            className="h-64 sm:h-72 md:h-80 min-h-40 max-h-[70vh] resize-y overflow-auto rounded-md border bg-background p-3 space-y-4"
            aria-live="polite"
            onScroll={(e) => {
              const el = e.currentTarget;
              const thresholdPx = 120;
              const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
              isNearBottomRef.current = distanceFromBottom < thresholdPx;
            }}
          >
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyStateText}</p>
            ) : (
              messages.map((m: ChatMessage, idx: number) => (
                <div
                  key={idx}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div className="max-w-[85%] space-y-2">
                    <div className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <div className="text-xs font-medium text-muted-foreground">
                        {m.role === 'user' ? 'You' : 'Assistant'}
                        {m.createdAt ? (
                          <span className="ml-2 font-normal">{formatTimeHHMM(m.createdAt)}</span>
                        ) : null}
                      </div>
                    </div>

                    {(m.text || m.images?.length) ? (
                      <div
                        className={
                          m.role === 'user'
                            ? 'rounded-lg border bg-muted px-3 py-2'
                            : 'rounded-lg border bg-background px-3 py-2'
                        }
                      >
                        {m.text ? (
                          <div className="whitespace-pre-wrap text-sm text-foreground">{m.text}</div>
                        ) : null}

                        {m.images?.length ? (
                          <div className={m.text ? 'pt-3 space-y-3' : 'space-y-3'}>
                            {m.images.map((url: string, imageIndex: number) => (
                              <div key={imageIndex} className="space-y-2">
                                <img
                                  src={url}
                                  alt={`Generated image ${imageIndex + 1}`}
                                  className="max-w-full rounded-md border"
                                />
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={url}
                                    download={`image-${m.createdAt}-${imageIndex + 1}.${imageExtensionFromDataUrl(url)}`}
                                  >
                                    Download image
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 space-y-2 bg-card">
            <label className="text-sm font-medium text-card-foreground">
              Message
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isSending}
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
                Press Ctrl/Cmd+Enter to {selectedModel?.kind === 'image' ? 'generate' : 'send'}.
                {!apiKey ? ' Add your API key in Settings.' : null}
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


