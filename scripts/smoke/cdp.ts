export interface ConsoleEntry {
  level: string;
  text: string;
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
}

export class Session {
  private socket: WebSocket;
  private nextId = 0;
  private pending = new Map<number, (result: unknown) => void>();
  readonly entries: ConsoleEntry[] = [];

  private constructor(socket: WebSocket) {
    this.socket = socket;
    this.socket.onmessage = (event) => this.receive(String(event.data));
  }

  static async attach(port: number): Promise<Session> {
    const targets = (await (
      await fetch(`http://127.0.0.1:${port}/json/list`)
    ).json()) as { type: string; webSocketDebuggerUrl: string }[];

    const page = targets.find((t) => t.type === "page");

    if (!page) throw new Error("no page target on the debugging port");

    const socket = new WebSocket(page.webSocketDebuggerUrl);

    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error("could not open a CDP socket"));
    });

    const session = new Session(socket);
    await session.send("Runtime.enable");
    await session.send("Log.enable");
    await session.send("Page.enable");
    return session;
  }

  private receive(raw: string): void {
    const message = JSON.parse(raw) as CdpMessage;

    if (message.id != null) {
      this.pending.get(message.id)?.(message.result);
      this.pending.delete(message.id);
      return;
    }

    const params = message.params ?? {};

    if (message.method === "Runtime.consoleAPICalled") {
      const args = (params.args ?? []) as {
        value?: unknown;
        description?: string;
      }[];

      this.entries.push({
        level: String(params.type),
        text: args.map((a) => a.value ?? a.description ?? "").join(" "),
      });
    }

    if (message.method === "Runtime.exceptionThrown") {
      const details = params.exceptionDetails as
        | { exception?: { description?: string }; text?: string }
        | undefined;

      this.entries.push({
        level: "exception",
        text: details?.exception?.description ?? details?.text ?? "unknown",
      });
    }

    if (message.method === "Log.entryAdded") {
      const entry = params.entry as { level: string; text: string };
      this.entries.push({ level: entry.level, text: entry.text });
    }
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = ++this.nextId;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => this.pending.set(id, resolve));
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = (await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })) as { result: { value: T } };

    return result.result.value;
  }

  async visit(url: string, settleMs: number): Promise<void> {
    this.entries.length = 0;
    await this.send("Page.navigate", { url });
    await new Promise((r) => setTimeout(r, settleMs));
  }

  close(): void {
    this.socket.close();
  }
}
