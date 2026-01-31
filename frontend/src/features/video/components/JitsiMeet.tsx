import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetProps {
  roomName: string;
  userName: string;
  roomUrl?: string;
  domain?: string;
  onClose: () => void;
}

export const JitsiMeet: React.FC<JitsiMeetProps> = ({
  roomName,
  userName,
  roomUrl,
  domain,
  onClose,
}) => {
  const [portalConflict, setPortalConflict] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const portalOwnerRef = useRef(false);

  const resolvedDomain = useMemo(() => {
    if (domain) {
      return domain;
    }
    if (roomUrl) {
      try {
        return new URL(roomUrl).host;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [domain, roomUrl]);

  useEffect(() => {
    const { body } = document;
    if (body.dataset.jitsiActive === 'true') {
      setPortalConflict(true);
      const message = 'Another video call is already open.';
      toast.error(message);
      setLoadError(message);
      setIsLoading(false);
      return;
    }

    body.dataset.jitsiActive = 'true';
    portalOwnerRef.current = true;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      if (!portalOwnerRef.current) return;
      delete body.dataset.jitsiActive;
      body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (portalConflict) return;

    // Load Jitsi script
    const script = document.createElement('script');
    const scriptDomain = resolvedDomain ?? 'meet.jit.si';
    script.src = `https://${scriptDomain}/external_api.js`;
    script.async = true;
    document.body.appendChild(script);
    setIsLoading(true);
    setLoadError(null);

    script.onload = () => {
      if (!containerRef.current) return;
      if (!window.JitsiMeetExternalAPI) {
        const message = 'Video call failed to load. Please try again.';
        toast.error(message);
        setLoadError(message);
        setIsLoading(false);
        return;
      }

      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'download',
            'help',
            'mute-everyone',
          ],
        },
        userInfo: {
          displayName: userName,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(scriptDomain, options);

        const api = apiRef.current;

        // Verbose diagnostics
        const events = [
          "videoConferenceJoined",
          "videoConferenceLeft",
          "participantJoined",
          "participantLeft",
          "conferenceFailed",
          "readyToClose",
          "errorOccurred",
          "audioMuteStatusChanged",
          "videoMuteStatusChanged",
          "endpointTextMessageReceived",
        ];
        events.forEach((ev) => api.addEventListener(ev, (payload: any) => {
          console.log("[jitsi:event]", ev, payload);
        }));

        api.getAvailableDevices?.().then((d:any)=>console.log("[jitsi] devices", d)).catch(()=>{});
        api.getIFrame?.() && console.log("[jitsi] iframe", api.getIFrame());
      
      console.log("[jitsi] created", scriptDomain, options);
      apiRef.current.addListener("videoConferenceJoined", (e:any)=>console.log("[jitsi] joined", e));
      apiRef.current.addListener("conferenceFailed", (e:any)=>console.error("[jitsi] conferenceFailed", e));
      apiRef.current.addListener("errorOccurred", (e:any)=>console.error("[jitsi] errorOccurred", e));
      apiRef.current.addListener("readyToClose", ()=>console.log("[jitsi] readyToClose"));
setIsLoading(false);

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        onClose();
      });
    };

    script.onerror = () => {
      const message =
        'Unable to load the video call script. Please check your connection or try again later.';
      toast.error(message);
      setLoadError(message);
      setIsLoading(false);
    };

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [portalConflict, roomName, userName, onClose, resolvedDomain]);

  if (portalConflict) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Close bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-white/10 shrink-0">
        <span className="text-sm text-white/70 font-medium">DevHub Video Call</span>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
        >
          Завершить звонок
        </button>
      </div>
      <div ref={containerRef} className="flex-1 w-full" />
      {(isLoading || loadError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 text-white">
          {isLoading && (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="text-sm text-white/80">Подключение к звонку...</p>
            </>
          )}
          {loadError && (
            <>
              <p className="text-sm text-white/80">{loadError}</p>
              <button
                onClick={onClose}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Закрыть
              </button>
            </>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
};
