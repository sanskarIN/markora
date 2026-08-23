import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useEffect, useState } from 'react';

import { useI18n } from '../i18n';
import { isDesktopRuntime } from '../lib/platform';

interface FileDropOptions {
  onDesktopPaths: (paths: string[]) => void | Promise<void>;
  onBrowserFiles: (files: File[]) => void | Promise<void>;
  onError: (message: string) => void;
}

export function useFileDrop({ onDesktopPaths, onBrowserFiles, onError }: FileDropOptions) {
  const { t } = useI18n();
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isDesktopRuntime()) {
      let disposed = false;
      let unlisten: (() => void) | undefined;

      void getCurrentWebview()
        .onDragDropEvent((event) => {
          if (event.payload.type === 'over') {
            setDragActive(true);
            return;
          }

          setDragActive(false);
          if (event.payload.type === 'drop' && event.payload.paths.length) {
            void Promise.resolve(onDesktopPaths(event.payload.paths)).catch(() => {
              onError(t('dropOpenFailed'));
            });
          }
        })
        .then((cleanup) => {
          if (disposed) cleanup();
          else unlisten = cleanup;
        })
        .catch(() => onError(t('dropInitFailed')));

      return () => {
        disposed = true;
        unlisten?.();
      };
    }

    const handleDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setDragActive(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) setDragActive(false);
    };

    const handleDrop = (event: DragEvent) => {
      if (!event.dataTransfer?.files.length) return;
      event.preventDefault();
      setDragActive(false);
      void Promise.resolve(onBrowserFiles(Array.from(event.dataTransfer.files))).catch(() => {
        onError(t('dropOpenFailed'));
      });
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onBrowserFiles, onDesktopPaths, onError, t]);

  return dragActive;
}
