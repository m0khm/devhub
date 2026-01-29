import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient, getAuthToken, getDeployTerminalWsUrl } from '../../api/client';
import { Button } from '../new-ui/components/ui/Button';
import { Panel, PanelBody, PanelDescription, PanelHeader, PanelTitle } from '../new-ui/components/ui/Panel';

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

interface DeploySettings {
  strategy: string;
  build_command: string;
}

interface DeployEnvVar {
  id: string;
  key: string;
  value: string;
}

interface EnvVarDraft {
  id: string;
  key: string;
  value: string;
}

export const DeployPage: React.FC = () => {
  const { projectId } = useParams();
  const [servers, setServers] = useState<DeployServer[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activePanel, setActivePanel] = useState<'deploy' | 'env' | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [settings, setSettings] = useState<DeploySettings>({
    strategy: '',
    build_command: '',
  });
  const [settingsStatus, setSettingsStatus] = useState({
    loading: false,
    saving: false,
    error: '',
    success: '',
  });
  const [settingsErrors, setSettingsErrors] = useState<{ strategy?: string; build_command?: string }>(
    {}
  );
  const [envVars, setEnvVars] = useState<EnvVarDraft[]>([]);
  const [envStatus, setEnvStatus] = useState({
    loading: false,
    saving: false,
    error: '',
    success: '',
  });
  const [envErrors, setEnvErrors] = useState<Record<string, { key?: string; value?: string }>>({});

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

  const createEnvRow = () => ({
    id: Math.random().toString(36).slice(2),
    key: '',
    value: '',
  });

  useEffect(() => {
    if (!projectId) return;
    apiClient
      .get<DeployServer[]>(`/projects/${projectId}/deploy/servers`)
      .then((response) => setServers(Array.isArray(response.data) ? response.data : []))
      .catch(() => toast.error('Failed to load servers'));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    setSettingsStatus((prev) => ({ ...prev, loading: true, error: '', success: '' }));
    apiClient
      .get<DeploySettings>(`/projects/${projectId}/deploy/settings`)
      .then((response) =>
        setSettings({
          strategy: response.data?.strategy ?? '',
          build_command: response.data?.build_command ?? '',
        })
      )
      .catch(() => setSettingsStatus((prev) => ({ ...prev, error: 'Failed to load settings' })))
      .finally(() => setSettingsStatus((prev) => ({ ...prev, loading: false })));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    setEnvStatus((prev) => ({ ...prev, loading: true, error: '', success: '' }));
    apiClient
      .get<DeployEnvVar[]>(`/projects/${projectId}/deploy/env`)
      .then((response) => {
        const vars = Array.isArray(response.data) ? response.data : [];
        setEnvVars(
          vars.map((envVar) => ({
            id: envVar.id,
            key: envVar.key,
            value: envVar.value,
          }))
        );
      })
      .catch(() => setEnvStatus((prev) => ({ ...prev, error: 'Failed to load env variables' })))
      .finally(() => setEnvStatus((prev) => ({ ...prev, loading: false })));
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
      const message =
        typeof event.data === 'string' ? event.data.replace(/\r\n/g, '\n') : event.data;
      setTerminalOutput((prev) => prev + message);
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

  const validateSettings = () => {
    const nextErrors: { strategy?: string; build_command?: string } = {};
    if (!settings.strategy.trim()) {
      nextErrors.strategy = 'Strategy is required';
    }
    if (!settings.build_command.trim()) {
      nextErrors.build_command = 'Build command is required';
    }
    setSettingsErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!projectId) return;
    if (!validateSettings()) {
      setSettingsStatus((prev) => ({ ...prev, error: 'Please fix validation errors.' }));
      return;
    }
    setSettingsStatus({ loading: false, saving: true, error: '', success: '' });
    try {
      const response = await apiClient.put<DeploySettings>(
        `/projects/${projectId}/deploy/settings`,
        {
          strategy: settings.strategy.trim(),
          build_command: settings.build_command.trim(),
        }
      );
      setSettings({
        strategy: response.data?.strategy ?? '',
        build_command: response.data?.build_command ?? '',
      });
      setSettingsStatus({
        loading: false,
        saving: false,
        error: '',
        success: 'Settings saved.',
      });
      toast.success('Deployment settings updated');
    } catch (error: any) {
      setSettingsStatus({
        loading: false,
        saving: false,
        error: error.response?.data?.error || 'Failed to save settings',
        success: '',
      });
      toast.error(error.response?.data?.error || 'Failed to save settings');
    }
  };

  const handleEnvChange = (id: string, field: 'key' | 'value', value: string) => {
    setEnvVars((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleEnvRemove = (id: string) => {
    setEnvVars((prev) => prev.filter((item) => item.id !== id));
    setEnvErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validateEnvVars = () => {
    const nextErrors: Record<string, { key?: string; value?: string }> = {};
    const keys = new Map<string, string>();
    envVars.forEach((envVar) => {
      const trimmedKey = envVar.key.trim();
      const trimmedValue = envVar.value.trim();
      if (!trimmedKey && !trimmedValue) {
        return;
      }
      if (!trimmedKey) {
        nextErrors[envVar.id] = { ...nextErrors[envVar.id], key: 'Key is required' };
      }
      if (!trimmedValue) {
        nextErrors[envVar.id] = { ...nextErrors[envVar.id], value: 'Value is required' };
      }
      if (trimmedKey) {
        const duplicateId = keys.get(trimmedKey);
        if (duplicateId && duplicateId !== envVar.id) {
          nextErrors[envVar.id] = { ...nextErrors[envVar.id], key: 'Key must be unique' };
          nextErrors[duplicateId] = { ...nextErrors[duplicateId], key: 'Key must be unique' };
        }
        keys.set(trimmedKey, envVar.id);
      }
    });
    setEnvErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveEnvVars = async () => {
    if (!projectId) return;
    if (!validateEnvVars()) {
      setEnvStatus((prev) => ({ ...prev, error: 'Please fix validation errors.' }));
      return;
    }
    const payload = envVars
      .map((envVar) => ({
        key: envVar.key.trim(),
        value: envVar.value.trim(),
        id: envVar.id,
      }))
      .filter((envVar) => envVar.key !== '' || envVar.value !== '');

    setEnvStatus({ loading: false, saving: true, error: '', success: '' });
    try {
      const response = await apiClient.put<DeployEnvVar[]>(`/projects/${projectId}/deploy/env`, {
        vars: payload.map(({ key, value }) => ({ key, value })),
      });
      const vars = Array.isArray(response.data) ? response.data : [];
      setEnvVars(
        vars.map((envVar) => ({
          id: envVar.id,
          key: envVar.key,
          value: envVar.value,
        }))
      );
      setEnvStatus({ loading: false, saving: false, error: '', success: 'Variables saved.' });
      toast.success('Environment variables updated');
    } catch (error: any) {
      setEnvStatus({
        loading: false,
        saving: false,
        error: error.response?.data?.error || 'Failed to save env variables',
        success: '',
      });
      toast.error(error.response?.data?.error || 'Failed to save env variables');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100">
      <div className="border-b border-white/10 bg-slate-950/70 backdrop-blur px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Project</p>
            <h1 className="text-2xl font-semibold">Deploy · {projectId ?? 'workspace'}</h1>
            <p className="text-sm text-slate-400">Register servers and open SSH terminals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActivePanel((prev) => (prev === 'deploy' ? null : 'deploy'))}
            >
              Deploy options
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActivePanel((prev) => (prev === 'env' ? null : 'env'))}
            >
              Env variables
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConnect}
              disabled={!selectedServerId || isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect terminal'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <Panel className="border-white/10 bg-slate-900/60">
            <PanelHeader>
              <PanelTitle>Add server</PanelTitle>
            </PanelHeader>
            <PanelBody className="pt-3 space-y-2">
              <input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Server name"
                className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
              />
              <input
                value={formState.host}
                onChange={(event) => setFormState((prev) => ({ ...prev, host: event.target.value }))}
                placeholder="Host"
                className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={formState.port}
                  type="number"
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, port: Number(event.target.value) }))
                  }
                  placeholder="Port"
                  className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
                />
                <input
                  value={formState.username}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="Username"
                  className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
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
                className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
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
                  className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
                />
              ) : (
                <textarea
                  value={formState.private_key}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, private_key: event.target.value }))
                  }
                  rows={4}
                  placeholder="Private key"
                  className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
                />
              )}
              <Button type="button" variant="primary" fullWidth onClick={handleCreateServer}>
                Save server
              </Button>
            </PanelBody>
          </Panel>

          <Panel className="border-white/10 bg-slate-900/60">
            <PanelHeader className="pb-3">
              <PanelTitle>Servers</PanelTitle>
            </PanelHeader>
            <PanelBody className="pt-0">
              <div className="max-h-[420px] overflow-y-auto">
                {servers.length === 0 ? (
                  <div className="px-1 py-6 text-sm text-slate-400">No servers yet.</div>
                ) : (
                  servers.map((server) => (
                    <button
                      key={server.id}
                      type="button"
                      onClick={() => setSelectedServerId(server.id)}
                      className={`w-full border-b border-white/5 px-2 py-3 text-left transition hover:bg-slate-800/60 ${
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
            </PanelBody>
          </Panel>
        </aside>

        <section className="space-y-4">
          {activePanel && (
            <Panel className="border-white/10 bg-slate-900/60">
              <PanelHeader>
                <div>
                  <PanelTitle>
                    {activePanel === 'deploy' ? 'Deployment options' : 'Environment variables'}
                  </PanelTitle>
                  <PanelDescription>
                    {activePanel === 'deploy'
                      ? 'Configure runtime, build, and rollout preferences.'
                      : 'Store secrets and configuration for deploy steps.'}
                  </PanelDescription>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setActivePanel(null)}>
                  Close
                </Button>
              </PanelHeader>
              <PanelBody className="space-y-3 pt-2 text-sm text-slate-300">
                {activePanel === 'deploy' ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                        Deploy strategy
                      </label>
                      <input
                        value={settings.strategy}
                        onChange={(event) =>
                          setSettings((prev) => ({ ...prev, strategy: event.target.value }))
                        }
                        placeholder="Rolling / Blue-green / Canary"
                        className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                      />
                      {settingsErrors.strategy && (
                        <p className="mt-1 text-xs text-rose-300">{settingsErrors.strategy}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                        Build command
                      </label>
                      <input
                        value={settings.build_command}
                        onChange={(event) =>
                          setSettings((prev) => ({ ...prev, build_command: event.target.value }))
                        }
                        placeholder="npm run build"
                        className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                      />
                      {settingsErrors.build_command && (
                        <p className="mt-1 text-xs text-rose-300">
                          {settingsErrors.build_command}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleSaveSettings}
                        disabled={settingsStatus.loading || settingsStatus.saving}
                      >
                        {settingsStatus.saving ? 'Saving...' : 'Save settings'}
                      </Button>
                      {settingsStatus.loading && (
                        <span className="text-xs text-slate-400">Loading settings...</span>
                      )}
                      {settingsStatus.success && (
                        <span className="text-xs text-emerald-300">{settingsStatus.success}</span>
                      )}
                      {settingsStatus.error && (
                        <span className="text-xs text-rose-300">{settingsStatus.error}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      {envVars.length === 0 && !envStatus.loading ? (
                        <p className="text-xs text-slate-400">No environment variables yet.</p>
                      ) : null}
                      {envVars.map((envVar) => (
                        <div key={envVar.id} className="space-y-2 rounded-lg border border-white/5 p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                                Key
                              </label>
                              <input
                                value={envVar.key}
                                onChange={(event) =>
                                  handleEnvChange(envVar.id, 'key', event.target.value)
                                }
                                placeholder="DATABASE_URL"
                                className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                              />
                              {envErrors[envVar.id]?.key && (
                                <p className="mt-1 text-xs text-rose-300">
                                  {envErrors[envVar.id]?.key}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnvRemove(envVar.id)}
                            >
                              Remove
                            </Button>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">
                              Value
                            </label>
                            <input
                              value={envVar.value}
                              onChange={(event) =>
                                handleEnvChange(envVar.id, 'value', event.target.value)
                              }
                              placeholder="••••••••"
                              className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                            />
                            {envErrors[envVar.id]?.value && (
                              <p className="mt-1 text-xs text-rose-300">
                                {envErrors[envVar.id]?.value}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEnvVars((prev) => [...prev, createEnvRow()])}
                        >
                          Add variable
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleSaveEnvVars}
                          disabled={envStatus.loading || envStatus.saving}
                        >
                          {envStatus.saving ? 'Saving...' : 'Save variables'}
                        </Button>
                        {envStatus.loading && (
                          <span className="text-xs text-slate-400">Loading variables...</span>
                        )}
                        {envStatus.success && (
                          <span className="text-xs text-emerald-300">{envStatus.success}</span>
                        )}
                        {envStatus.error && (
                          <span className="text-xs text-rose-300">{envStatus.error}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </PanelBody>
            </Panel>
          )}
          <Panel className="border-white/10 bg-slate-900/60">
            <PanelHeader className="pb-3">
              <PanelTitle>
                Terminal {selectedServer ? `· ${selectedServer.name}` : ''}
              </PanelTitle>
            </PanelHeader>
            <PanelBody className="pt-0">
              <pre className="h-[420px] overflow-y-auto bg-black/80 px-4 py-3 font-mono text-sm text-emerald-200 whitespace-pre-wrap rounded-xl border border-white/5">
                {terminalOutput || 'Select a server and connect to start.'}
              </pre>
              <div className="mt-3 flex items-center gap-2">
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
                  className="flex-1 rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
                />
                <Button type="button" variant="outline" onClick={handleSendCommand}>
                  Send
                </Button>
              </div>
            </PanelBody>
          </Panel>
        </section>
      </div>
    </div>
  );
};
