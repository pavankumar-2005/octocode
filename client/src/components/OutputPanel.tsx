import { Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import type { RunResult } from "../lib/runCode";
import { TerminalIcon } from "./Icons";

type Props = { result: RunResult | null; running: boolean };

export default function OutputPanel({ result, running }: Props) {
  return (
    <Card className="h-full border border-divider shadow-none" radius="lg">
      <CardHeader className="flex h-10 shrink-0 items-center gap-2 border-b border-divider py-0 text-sm font-medium">
        <TerminalIcon size={16} className="text-default-500" />
        Output
        <span className="ml-auto">
          {running && <Spinner size="sm" />}
          {result && !running && (
            <Chip size="sm" variant="flat" color={result.ok ? "success" : "danger"}>
              {result.ok ? "Success" : "Error"}
            </Chip>
          )}
        </span>
      </CardHeader>
      {/* Terminal look: monospace on a slightly darker surface in both themes */}
      <CardBody className="bg-default-50 font-mono text-xs dark:bg-black/30">
        {!result && !running && (
          <p className="text-default-400">
            <span className="text-primary">$</span> press <span className="font-semibold text-foreground">Run</span> to
            execute the code
          </p>
        )}
        {result && (
          <pre className={`whitespace-pre-wrap leading-relaxed ${result.ok ? "" : "text-danger"}`}>
            {result.output || "(no output)"}
          </pre>
        )}
      </CardBody>
    </Card>
  );
}
