"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { Alert, AlertPriority, alertQueue, alertState } from "@/utils/alerts/alert";

const alertClasses: Record<AlertPriority, string> = {
  [AlertPriority.INFO]: "border-base-400 bg-transparent text-base-700",
  [AlertPriority.CAUTION]:
    "border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-200",
  [AlertPriority.WARNING]:
    "border-accent-red bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
};

const priorityTextClasses: Record<AlertPriority, string> = {
  [AlertPriority.INFO]: "text-base-500",
  [AlertPriority.CAUTION]: "text-orange-600 dark:text-orange-300",
  [AlertPriority.WARNING]: "text-accent-red",
};

export function CasPane() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const drainAlertQueue = useEffectEvent(() => {
    const queuedAlerts: Alert[] = [];

    while (!alertQueue.isEmpty()) {
      const queuedAlert = alertQueue.dequeue();

      if (queuedAlert?.isActive) {
        queuedAlerts.push(queuedAlert);
      }
    }

    if (queuedAlerts.length) {
      queuedAlerts.forEach((alert) => alert.play());
      setAlerts((currentAlerts) =>
        [...queuedAlerts, ...currentAlerts]
          .sort((left, right) => right.priority - left.priority)
          .slice(0, 20),
      );
    }
  });

  useEffect(() => {
    const interval = window.setInterval(drainAlertQueue, 50);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() =>
    alertState.subscribeToClear(() => {
      setAlerts((currentAlerts) => {
        currentAlerts.forEach((alert) => alert.stop());
        return [];
      });
    }),
  []);

  useEffect(() =>
    alertState.subscribeToDismiss((alertId) => {
      setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== alertId));
    }),
  []);

  const dismissAlert = (index: number) => {
    const alert = alerts[index];

    if (!alert) {
      return;
    }

    alert.stop();
    setAlerts((currentAlerts) => currentAlerts.filter((currentAlert) => currentAlert.id !== alert.id));
  };
  const hasPendingWarning = alerts.some((alert) => alert.priority === AlertPriority.WARNING);

  return (
    <section
      className={`flex h-full flex-col border p-4 transition-[border-color,box-shadow] duration-100 ${
        hasPendingWarning
          ? "border-orange-500 bg-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.7)] dark:bg-orange-950/70"
          : "border-base-300 bg-base-100 shadow-lg"
      }`}
      aria-label="Caution and warning system"
    >
      <div className="flex items-baseline justify-between border-b border-base-300 pb-3">
        <h2 className="text-lg font-bold">System Messages</h2>
        <span
          className={`text-xs font-semibold ${
            alerts.length ? priorityTextClasses[alerts[0].priority] : "text-emerald-500"
          }`}
        >
          {alerts.length ? `${alerts.length} System Message(s)` : "No Active Alerts"}
        </span>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {alerts.length ? (
          alerts.map((alert, index) => (
            <div
              key={`${alert.topLine}-${index}`}
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${alertClasses[alert.priority]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span>{alert.topLine}</span>
                  {alert.bottomLine && <span className="block font-normal">{alert.bottomLine}</span>}
                </div>
                <button
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-xs leading-none transition-colors duration-300 hover:bg-black/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current dark:hover:bg-white/20"
                  type="button"
                  aria-label={`Dismiss ${alert.topLine}`}
                  title="Dismiss alert"
                  onClick={() => dismissAlert(index)}
                >
                  X
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-base-500">No active cautions or warnings.</p>
        )}
      </div>

    </section>
  );
}