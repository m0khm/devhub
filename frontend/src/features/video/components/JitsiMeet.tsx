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
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const [portalConflict, setPortalConflict] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const portalOwnerRef = useRef(false);
  const portalCreatedRef = useRef(false);

  const portalId = 'jitsi-meet-portal-root';

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
    const existingRoot = document.getElementById(portalId) as HTMLDivElement | null;

    if (existingRoot?.dataset.active === 'true') {
      setPortalConflict(true);
      const message = 'Another video call is already open.';
      toast.error(message);
      setLoadError(message);
      setIsLoading(false);
      return;
    }

    const root = existingRoot ?? document.createElement('div');
    if (!existingRoot) {
      root.id = portalId;
      document.body.appendChild(root);
      portalCreatedRef.current = true;
    }
    root.dataset.active = 'true';
    portalOwnerRef.current = true;
    setPortalRoot(root);

    return () => {
      if (!portalOwnerRef.current) return;
      delete root.dataset.active;
      if (portalCreatedRef.current && root.parentNode) {
        document.body.removeChild(root);
      }
    };
  }, [portalId]);

  useEffect(() => {
    if (!portalRoot || portalConflict) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [portalConflict, portalRoot]);

  useEffect(() => {
    if (!portalRoot || portalConflict) return;

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
      setIsLoading(false);

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        onClose();
      });
    };

    script.onerror = () => {
      const message = 'Unable to load video call. Please check your connection.';
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
  }, [portalConflict, portalRoot, roomName, userName, onClose, resolvedDomain]);

  if (!portalRoot || portalConflict) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black relative">
      <div ref={containerRef} className="w-full h-full" />
      {(isLoading || loadError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 text-white">
          {isLoading && (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="text-sm text-white/80">Loading video call…</p>
            </>
          )}
          {loadError && (
            <>
              <p className="text-sm text-white/80">{loadError}</p>
              <button
                onClick={onClose}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Close
              </button>
            </>
          )}
        </div>
      )}
    </div>,
    portalRoot,
  );
};
