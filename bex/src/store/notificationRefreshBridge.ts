/** useNotifications dışından okunmamış bildirim sayacını yenilemek için köprü */
let refreshUnreadHandler: (() => void) | null = null;

export function registerNotificationRefresh(handler: () => void): () => void {
  refreshUnreadHandler = handler;
  return () => {
    if (refreshUnreadHandler === handler) {
      refreshUnreadHandler = null;
    }
  };
}

export function triggerNotificationRefresh(): void {
  refreshUnreadHandler?.();
}
