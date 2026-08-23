"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { Alert, AlertPriority, alertQueue } from "@/utils/alerts/alert";

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

      if (queuedAlert) {
        queuedAlerts.push(queuedAlert);
      }
    }

    if (queuedAlerts.length) {
      queuedAlerts.forEach((alert) => alert.play());
      setAlerts((currentAlerts) =>
        [...currentAlerts, ...queuedAlerts]
          .sort((left, right) => right.priority - left.priority)
          .slice(0, 20),
      );
    }
  });

  useEffect(() => {
    drainAlertQueue();
    const interval = window.setInterval(drainAlertQueue, 50);

    return () => window.clearInterval(interval);
  }, []);

  const createTestAlert = (label: string, priority: AlertPriority) => {
    new Alert(`TEST ${label}`, "Created from CAS test controls", priority);
    drainAlertQueue();
  };

  const dismissAlert = (index: number) => {
    alerts[index]?.stop();
    setAlerts((currentAlerts) => currentAlerts.filter((_, alertIndex) => alertIndex !== index));
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

      <div className="mt-3 flex gap-2 border-t border-base-300 pt-3">
        <strong>CAS test buttons:</strong>
        <button
          className="border border-base-400 px-2 py-1 text-xs font-semibold text-base-700 dark:text-highlight"
          type="button"
          onClick={() => createTestAlert("INFO", AlertPriority.INFO)}
        >
          Test info
        </button>
        <button
          className="border border-orange-500 px-2 py-1 text-xs font-semibold text-orange-800 dark:text-orange-200"
          type="button"
          onClick={() => createTestAlert("CAUTION", AlertPriority.CAUTION)}
        >
          Test caution
        </button>
        <button
          className="border border-accent-red px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300"
          type="button"
          onClick={() => createTestAlert("WARNING", AlertPriority.WARNING)}
        >
          Test warning
        </button>
      </div>
    </section>
  );
}