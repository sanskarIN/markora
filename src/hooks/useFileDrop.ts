import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { useEffect, useState } from 'react';

import { useI18n } from '../i18n';
import { isDesktopRuntime, isTauriRuntime } from '../lib/platform';

interface FileDropOptions {
  onDesktopPaths: (paths: string[]) => void | Promise<void>;
  onBrowserFiles: (files: File[]) => void | Promise<void>;
  onError: (message: string) => void;
}

export function useFileDrop({ onDesktopPaths, onBrowserFiles, onError }: FileDropOptions) {
  const { t } = useI18n();
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;
    const handled = new Set<string>();

    const openUniquePaths = (paths: string[]) => {
      if (disposed || paths.length === 0) return;
      const unique = paths.filter((path) => {
        if (!path || handled.has(path)) return false;
        handled.add(path);
        return true;
      });
      if (unique.length === 0) return;

      void Promise.resolve(onDesktopPaths(unique)).catch(() => {
        onError(t('dropOpenFailed'));
      });
    };

    void listen<string[]>('opened-files', (event) => openUniquePaths(event.payload))
      .then((cleanup) => {
        if (disposed) cleanup();
        else unlisten = cleanup;
      })
      .catch(() => onError(t('dropInitFailed')));

    void invoke<string[]>('take_opened_urls')
      .then(openUniquePaths)
      .catch(() => onError(t('dropOpenFailed')));

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [onDesktopPaths, onError, t]);

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
