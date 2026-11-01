import { useState } from "react";
import { addToast, Button, Card, CardBody, CardHeader, Textarea } from "@heroui/react";
import { askAi } from "../lib/api";

type Message = { role: "you" | "ai"; text: string };
type Props = { language: string; getCode: () => string; getSelection: () => string };

export default function AiChat({ language, getCode, getSelection }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(prompt: string, code: string) {
    if (!prompt.trim() || loading) return;
    setMessages((m) => [...m, { role: "you", text: prompt }]);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await askAi(prompt, code, language);
      setMessages((m) => [...m, { role: "ai", text: reply || "(empty reply)" }]);
    } catch (err) {
      addToast({ title: "AI unavailable", description: String((err as Error).message), color: "danger" });
    } finally {
      setLoading(false);
    }
  }

  function explainSelection() {
    const selection = getSelection();
    if (!selection.trim()) {
      addToast({ title: "Select some code first", color: "warning" });
      return;
    }
    send("Explain this code step by step.", selection);
  }

  return (
    <Card className="h-full" radius="sm">
      <CardHeader className="justify-between py-2 text-sm font-medium">
        AI assistant
        <Button size="sm" variant="flat" onPress={explainSelection} isDisabled={loading}>
          Explain selection
        </Button>
      </CardHeader>
      <CardBody className="flex flex-col gap-3 pt-0">
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-default-400">Ask about the code in the editor, e.g. "Why does this fail?"</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "you" ? "self-end bg-primary/20" : "bg-default-100"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            minRows={1}
            maxRows={4}
            placeholder="Ask the AI…"
            value={input}
            onValueChange={setInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input, getCode());
              }
            }}
          />
          <Button color="primary" isLoading={loading} onPress={() => send(input, getCode())}>
            Send
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
