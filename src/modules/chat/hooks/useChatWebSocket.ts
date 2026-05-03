export type WsStatus = "connecting" | "connected" | "disconnected";

export type ChatWsMessage = {
  type: string;
  room_id?: string;
  message_id?: string;
  content?: string;
  sender_user_id?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
};

type UseChatWsParams = {
  getToken: () => string;
  getTenantID: () => string;
  getRoomID: () => string;
  apiBaseUrl: string;
  onMessage: (payload: ChatWsMessage) => void;
  onStatus: (status: WsStatus) => void;
  onError: (message: string) => void;
  onDebug: (line: string) => void;
};

export function useChatWebSocket(params: UseChatWsParams) {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isIntentionalClose = false;

  function wsUrl(roomID: string, token: string, tenantID: string): string {
    const base = params.apiBaseUrl.replace(/\/+$/, "");
    const wsBase = base.startsWith("https://")
      ? base.replace("https://", "wss://")
      : base.replace("http://", "ws://");
    const q = new URLSearchParams({ tenant_id: tenantID });
    if (token) q.set("token", token);
    return `${wsBase}/ws/chat/room/${roomID}?${q.toString()}`;
  }

  function debug(line: string) {
    params.onDebug(`[${new Date().toLocaleTimeString()}] ${line}`);
  }

  function sanitizeUrl(url: string): string {
    return url.replace(/token=[^&]+/, "token=***");
  }

  function connect(roomID: string) {
    close();
    const token = params.getToken();
    const tenantID = params.getTenantID();

    if (!tenantID || !roomID) {
      params.onStatus("disconnected");
      params.onError("Missing tenant / room");
      debug(`connect blocked token=${!!token} tenant=${!!tenantID} room=${!!roomID}`);
      return;
    }

    isIntentionalClose = false;
    params.onStatus("connecting");
    const url = wsUrl(roomID, token, tenantID);
    debug(`connecting ${sanitizeUrl(url)}`);
    socket = new WebSocket(url);

    socket.onopen = () => {
      params.onStatus("connected");
      debug("connected");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatWsMessage;
        debug(`recv type=${payload.type}`);
        params.onMessage(payload);
      } catch {
        debug("recv invalid json");
      }
    };

    socket.onerror = () => {
      params.onError("WebSocket connection error");
      debug("socket error");
    };

    socket.onclose = (event) => {
      params.onStatus("disconnected");
      debug(`closed code=${event.code} reason=${event.reason || "-"}`);
      if (!isIntentionalClose && event.code !== 1000) {
        params.onError(`WebSocket closed (code: ${event.code})`);
      }
      if (!isIntentionalClose) {
        reconnectTimer = setTimeout(() => connect(params.getRoomID()), 2000);
        debug("scheduled reconnect in 2s");
      }
    };
  }

  function send(payload: ChatWsMessage) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      debug(`send dropped type=${payload.type} (socket not open)`);
      return;
    }
    socket.send(JSON.stringify(payload));
    debug(`sent type=${payload.type}`);
  }

  function close() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      isIntentionalClose = true;
      socket.close();
      socket = null;
      debug("closed intentionally");
    }
  }

  return { connect, send, close };
}
