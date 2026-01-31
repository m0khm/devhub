type WSMessageHandler = (data: any) => void;

interface WSHandlers {
  onNewMessage?: WSMessageHandler;
  onMessageUpdated?: WSMessageHandler;
  onMessageDeleted?: WSMessageHandler;
  onTyping?: WSMessageHandler;
  onReactionUpdated?: WSMessageHandler;
  onNotificationCreated?: WSMessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: WSHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private topicId: string | null = null;
  private token: string | null = null;

  connect(topicId: string, token: string, handlers: WSHandlers = {}) {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      this.ws.close();
      this.ws = null;
    }
    this.topicId = topicId;
    this.token = token;
    this.handlers = handlers ?? {};

    // Берём API базу (например: https://dvhub.tech/api)
    // Если env нет — используем текущий origin + /api
    const apiBase =
      (import.meta as any).env?.VITE_API_URL || `${window.location.origin}/api`;

    // Собираем абсолютный WS URL корректно (даже если VITE_API_URL относительный)
    const apiUrl = new URL(String(apiBase), window.location.origin);
    apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";

    const basePath = apiUrl.pathname.replace(/\/+$/, "");
    apiUrl.pathname = `${basePath}/topics/${topicId}/ws`;
    apiUrl.searchParams.set("token", token);

    const wsUrl = apiUrl.toString();
    console.log("[WS] connecting:", wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
        this.handlers.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.handlers.onError?.(error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.handlers.onDisconnect?.();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.attemptReconnect();
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case "new_message":
        this.handlers.onNewMessage?.(data.payload);
        break;
      case "message_updated":
        this.handlers.onMessageUpdated?.(data.payload);
        break;
      case "message_deleted":
        this.handlers.onMessageDeleted?.(data.payload);
        break;
      case "typing":
        this.handlers.onTyping?.(data.payload);
        break;
      case "reaction_updated":
        this.handlers.onReactionUpdated?.(data.payload);
        break;
      case "notification_created":
        this.handlers.onNotificationCreated?.(data.payload);
        break;
      case "pong":
        break;
      default:
        console.log("Unknown WebSocket message type:", data.type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      if (this.topicId && this.token) {
        this.connect(this.topicId, this.token, this.handlers);
      }
    }, delay);
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  sendTyping(isTyping: boolean) {
    this.send("typing", { is_typing: isTyping });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.topicId = null;
    this.token = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
