import { execa } from "execa";
import { Socket } from "node:net";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface MpvCommand {
  command: (string | number)[];
}

interface MpvPropertyChange {
  event: "property-change";
  name: string;
  data: any;
}

type MpvEvent = MpvPropertyChange | { event: string; [key: string]: any };

class MpvPlayer {
  private process: ReturnType<typeof execa> | null = null;
  private socket: Socket | null = null;
  ipcPath = path.join(os.tmpdir(), `mpv-${process.pid}.sock`);

  private eventListeners: ((event: MpvEvent) => void)[] = [];

  constructor() {
    // Ensure socket path is clean
    if (fs.existsSync(this.ipcPath)) {
      try {
        fs.unlinkSync(this.ipcPath);
      } catch (err: any) {
        console.warn("Could not unlink old mpv socket:", err);
      }
    }
  }

  public async start(): Promise<void> {
    if (
      this.process &&
      !this.process.killed &&
      this.socket &&
      !this.socket.destroyed
    ) {
      return; // fully ready
    }

    if (this.process && !this.process.killed) {
      // mpv running but IPC broken → reconnect
      await this.connectIpc();
      return;
    }

    // Fresh start
    this.spawnMpv();
    await this.waitForSocket();
    await this.connectIpc();
  }

  private spawnMpv() {
    this.process = execa(
      "mpv",
      ["--idle=yes", "--no-video", `--input-ipc-server=${this.ipcPath}`],
      { stdio: "ignore" }
    );

    this.process.once("exit", () => {
      this.socket?.destroy();
      this.socket = null;
      this.process = null;
    });
  }

  private async waitForSocket(timeoutMs = 5000): Promise<void> {
    const start = Date.now();
    while (true) {
      if (fs.existsSync(this.ipcPath)) return;
      if (Date.now() - start > timeoutMs) {
        throw new Error("Timed out waiting for mpv IPC socket");
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  private async connectIpc(): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectAttempts = 5;
      let attempt = 0;

      const tryConnect = () => {
        attempt++;
        this.socket = new Socket();

        this.socket.on("connect", () => {
          console.log("Connected to MPV IPC socket.");
          this.socket?.on("data", this.handleSocketData.bind(this));
          this.socket?.on("close", () => console.log("MPV IPC socket closed."));
          this.socket?.on("error", (err) =>
            console.error("MPV IPC socket error:", err)
          );
          resolve();
        });

        this.socket.on("error", (err: any) => {
          this.socket?.destroy(); // Ensure socket is closed
          if (attempt < connectAttempts) {
            console.log(
              `Connection to MPV IPC failed (attempt ${attempt}/${connectAttempts}): ${err.message}. Retrying...`
            );
            setTimeout(tryConnect, 1000);
          } else {
            reject(
              new Error(
                `Failed to connect to MPV IPC socket after ${connectAttempts} attempts: ${err.message}`
              )
            );
          }
        });

        this.socket.connect(this.ipcPath);
      };

      tryConnect();
    });
  }

  private handleSocketData(data: Buffer): void {
    const messages = data.toString().split("\n").filter(Boolean);
    for (const msg of messages) {
      try {
        const event: MpvEvent = JSON.parse(msg);
        if (
          event.event === "property-change" &&
          event.name === "eof-reached" &&
          event.data === true
        ) {
          // Emit a custom 'end-file' event when EOF is reached
          this.eventListeners.forEach((listener) =>
            listener({ event: "end-file", reason: "eof" })
          );
        }
        this.eventListeners.forEach((listener) => listener(event));
      } catch (err) {
        console.error("Failed to parse MPV IPC message:", msg, err);
      }
    }
  }

  public on(
    eventType: string,
    listener: (event: MpvEvent) => void
  ): () => void {
    const wrappedListener = (event: MpvEvent) => {
      if (eventType === "*" || event.event === eventType) {
        listener(event);
      }
    };
    this.eventListeners.push(wrappedListener);
    return () => {
      this.eventListeners = this.eventListeners.filter(
        (l) => l !== wrappedListener
      );
    };
  }

  public async command(cmd: (string | number)[]): Promise<any> {
    if (!this.socket || this.socket.destroyed) {
      throw new Error("MPV IPC socket not connected.");
    }

    return new Promise((resolve, reject) => {
      const commandId = Math.floor(Math.random() * 1000000);
      const message: MpvCommand = { command: cmd };
      const jsonMessage =
        JSON.stringify({ ...message, request_id: commandId }) + "\n";

      const responseListener = (event: MpvEvent) => {
        if ("request_id" in event && event.request_id === commandId) {
          this.off(responseListener); // Remove listener after response
          if (event.error && event.error !== "success") {
            reject(new Error(`MPV command failed: ${event.error}`));
          } else {
            resolve(event.data);
          }
        }
      };

      this.on("*", responseListener); // Listen for all events to catch the response

      this.socket?.write(jsonMessage, (err) => {
        if (err) {
          this.off(responseListener);
          reject(err);
        }
      });
    });
  }

  public off(listener: (event: MpvEvent) => void): void {
    this.eventListeners = this.eventListeners.filter((l) => l !== listener);
  }

  public async load(url: string): Promise<void> {
    // 'replace' will stop current playback and load new file
    await this.command([
      "loadfile",
      `https://www.youtube.com/watch?v=${url}`,
      "replace",
    ]);
  }

  public async play(): Promise<void> {
    await this.command(["set_property", "pause", "no"]);
  }

  public async pause(): Promise<void> {
    await this.command(["set_property", "pause", "yes"]);
  }

  public async togglePause(): Promise<void> {
    await this.command(["cycle", "pause"]);
  }

  public async seek(seconds: number): Promise<void> {
    await this.command(["seek", seconds, "relative"]);
  }

  public async observeProperty(propertyName: string): Promise<void> {
    // Observe property with command ['observe_property', id, 'property-name']
    // mpv will then send 'property-change' events
    await this.command(["observe_property", 0, propertyName]);
  }

  public async stop(): Promise<void> {
    await this.command(["stop"]);
  }

  public async quit(): Promise<void> {
    if (this.process) {
      await this.command(["quit"]);
      this.process.kill("SIGTERM"); // Ensure process is terminated
      this.process = null;
    }
  }
}

const mpvPlayer = new MpvPlayer();
export default mpvPlayer;
