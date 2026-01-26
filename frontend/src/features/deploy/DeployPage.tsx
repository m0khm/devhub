import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient, getAuthToken, getDeployTerminalWsUrl } from '../../api/client';

interface DeployServer {
  id: string;
  project_id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth_type: 'password' | 'key';
  created_at: string;
  updated_at: string;
}

export const DeployPage: React.FC = () => {
  const { projectId } = useParams();
  const [servers, setServers] = useState<DeployServer[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    auth_type: 'password' as 'password' | 'key',
    password: '',
    private_key: '',
  });

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId) ?? null,
    [servers, selectedServerId]
  );

  useEffect(() => {
    if (!projectId) return;
    apiClient
      .get<DeployServer[]>(`/projects/${projectId}/deploy/servers`)
      .then((response) => setServers(Array.isArray(response.data) ? response.data : []))
      .catch(() => toast.error('Failed to load servers'));
  }, [projectId]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleCreateServer = async () => {
    if (!projectId) return;
    try {
      const payload = {
        name: formState.name,
        host: formState.host,
        port: Number(formState.port),
        username: formState.username,
        auth_type: formState.auth_type,
        password: formState.auth_type === 'password' ? formState.password : undefined,
        private_key: formState.auth_type === 'key' ? formState.private_key : undefined,
      };

      const response = await apiClient.post<DeployServer>(
        `/projects/${projectId}/deploy/servers`,
        payload
      );
      setServers((prev) => [response.data, ...prev]);
      setFormState({
        name: '',
        host: '',
        port: 22,
        username: '',
        auth_type: 'password',
        password: '',
        private_key: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create server');
    }
  };

  const handleConnect = () => {
    if (!projectId || !selectedServerId) return;
    wsRef.current?.close();
    setIsConnecting(true);
    const url = getDeployTerminalWsUrl(projectId, selectedServerId, getAuthToken() || undefined);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnecting(false);
      setTerminalOutput((prev) => prev + `\n# Connected to ${selectedServer?.name}\n`);
    };
    ws.onmessage = (event) => {
      setTerminalOutput((prev) => prev + event.data);
    };
    ws.onerror = () => {
      setIsConnecting(false);
      toast.error('Terminal connection error');
    };
    ws.onclose = () => {
      setIsConnecting(false);
      setTerminalOutput((prev) => prev + '\n# Disconnected\n');
    };
  };

  const handleSendCommand = () => {
    if (!terminalInput.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Terminal not connected');
      return;
    }
    wsRef.current.send(`${terminalInput}\n`);
    setTerminalInput('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/90 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Project</p>
            <h1 className="text-2xl font-semibold">Deploy · {projectId}</h1>
            <p className="text-sm text-slate-400">Register servers and open SSH terminals.</p>
          </div>
          <button
            type="button"
            onClick={handleConnect}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-800"
            disabled={!selectedServerId || isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect terminal'}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-slate-200">Add server</h2>
            <div className="mt-3 space-y-2">
              <input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Server name"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <input
                value={formState.host}
                onChange={(event) => setFormState((prev) => ({ ...prev, host: event.target.value }))}
                placeholder="Host"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={formState.port}
                  type="number"
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, port: Number(event.target.value) }))
                  }
                  placeholder="Port"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  value={formState.username}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="Username"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <select
                value={formState.auth_type}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    auth_type: event.target.value as 'password' | 'key',
                  }))
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="password">Password</option>
                <option value="key">SSH key</option>
              </select>
              {formState.auth_type === 'password' ? (
                <input
                  value={formState.password}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, password: event.target.value }))
                  }
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              ) : (
                <textarea
                  value={formState.private_key}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, private_key: event.target.value }))
                  }
                  rows={4}
                  placeholder="Private key"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              )}
              <button
                type="button"
                onClick={handleCreateServer}
                className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Save server
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">
              Servers
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {servers.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-400">No servers yet.</div>
              ) : (
                servers.map((server) => (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => setSelectedServerId(server.id)}
                    className={`w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-800/60 ${
                      server.id === selectedServerId ? 'bg-slate-800/70' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-100">{server.name}</p>
                    <p className="text-xs text-slate-400">
                      {server.username}@{server.host}:{server.port}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">Auth: {server.auth_type}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
              Terminal {selectedServer ? `· ${selectedServer.name}` : ''}
            </div>
            <div className="h-[420px] overflow-y-auto bg-black px-4 py-3 font-mono text-sm text-emerald-200">
              {terminalOutput || 'Select a server and connect to start.'}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-800 px-4 py-3">
              <input
                value={terminalInput}
                onChange={(event) => setTerminalInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSendCommand();
                  }
                }}
                placeholder="Type a command and press Enter"
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendCommand}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-emerald-500"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
