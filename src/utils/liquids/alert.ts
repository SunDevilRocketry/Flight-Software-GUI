import { Queue } from '@datastructures-js/queue';

/** Severity levels used by the caution and warning system. */
export enum AlertPriority {
    INFO,
    CAUTION,
    WARNING
}

/** Queue of newly created alerts awaiting presentation by the CAS. */
export const alertQueue = new Queue<Alert>();
let nextAlertId = 0;

/** Tracks active alert IDs and notifies subscribers about lifecycle changes. */
class AlertState {
    private cautionOrWarningAlertIds = new Set<number>();
    private warningAlertIds = new Set<number>();
    private listeners = new Set<() => void>();
    private clearListeners = new Set<() => void>();
    private dismissListeners = new Set<(alertId: number) => void>();

    /** Subscribes to changes in the active alert state. */
    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    /** Subscribes to requests that clear all displayed alerts. */
    public subscribeToClear = (listener: () => void): (() => void) => {
        this.clearListeners.add(listener);
        return () => this.clearListeners.delete(listener);
    };

    /** Subscribes to dismissal of an individual alert. */
    public subscribeToDismiss = (listener: (alertId: number) => void): (() => void) => {
        this.dismissListeners.add(listener);
        return () => this.dismissListeners.delete(listener);
    };

    /** Returns whether any caution or warning alert is active. */
    public hasCautionOrWarning = (): boolean => this.cautionOrWarningAlertIds.size > 0;
    /** Returns whether any warning alert is active. */
    public hasWarning = (): boolean => this.warningAlertIds.size > 0;

    /** Registers an alert when its priority should be visible to the CAS. */
    public activate(alert: Alert): void {
        if (alert.priority < AlertPriority.CAUTION) {
            return;
        }

        this.cautionOrWarningAlertIds.add(alert.id);
        if (alert.priority === AlertPriority.WARNING) {
            this.warningAlertIds.add(alert.id);
        }
        this.notify();
    }

    /** Removes an alert from active tracking and notifies dismiss listeners. */
    public dismiss(alertId: number): void {
        const removedCautionOrWarning = this.cautionOrWarningAlertIds.delete(alertId);
        const removedWarning = this.warningAlertIds.delete(alertId);

        this.dismissListeners.forEach((listener) => listener(alertId));

        if (removedCautionOrWarning || removedWarning) {
            this.notify();
        }
    }

    /** Removes all active alert IDs and notifies clear listeners. */
    public clearAll(): void {
        const hadActiveAlerts =
            this.cautionOrWarningAlertIds.size > 0 || this.warningAlertIds.size > 0;
        this.cautionOrWarningAlertIds.clear();
        this.warningAlertIds.clear();

        if (hadActiveAlerts) {
            this.notify();
        }
        this.clearListeners.forEach((listener) => listener());
    }

    private notify(): void {
        this.listeners.forEach((listener) => listener());
    }
}

/** Shared lifecycle state for active caution and warning alerts. */
export const alertState = new AlertState();

/** Represents a lifecycle-managed alert and its optional audible notification. */
export class Alert {
    public readonly id: number;
    public topLine: string;
    public bottomLine: string | null = null;
    public priority: AlertPriority;
    public readonly auralEnabled: boolean;
    public isActive = true;

    /**
     * @param primaryMsg Primary alert text.
     * @param secondaryMsg Optional secondary alert text.
     * @param priority Alert severity.
     * @param auralEnabled Whether this alert may play audio.
     */
    constructor(
        primaryMsg: string,
        secondaryMsg: string | null = null,
        priority: AlertPriority = AlertPriority.INFO,
        auralEnabled = true,
    ) {
        this.id = nextAlertId++;
        this.topLine = primaryMsg;
        this.bottomLine = secondaryMsg;
        this.priority = priority;
        this.auralEnabled = auralEnabled;

        alertQueue.push(this);
        alertState.activate(this);
    }

    /** Starts the alert sound when the alert is active and audible. */
    public play() {
        if (this.isActive && this.auralEnabled) {
            auralPlayer.play(this.id, this.priority);
        }
    }

    /** Stops the alert sound and removes the alert from active state. */
    public stop() {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        auralPlayer.stop(this.id);
        alertState.dismiss(this.id);
    }
}

/** Manages browser audio notifications for caution and warning alerts. */
class AuralPlayer {
    private ctx: AudioContext | null = null;
    private muted = false;
    private cautionAurals = new Map<number, { oscillator: OscillatorNode; gain: GainNode }>();
    private warningOscillator: OscillatorNode | null = null;
    private warningGain: GainNode | null = null;
    private warningAlertIds = new Set<number>();

    private getContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new AudioContext();
        }
        return this.ctx;
    }

    public play(alertId: number, priority: AlertPriority): void {
        if (this.muted) {
            return;
        }

        switch (priority) {
            case AlertPriority.INFO:
                return;

            case AlertPriority.CAUTION:
                this.playCautionBell(alertId);
                return;

            case AlertPriority.WARNING:
                this.warningAlertIds.add(alertId);
                this.startWarningTone();
                return;
        }
    }

    public stop(alertId: number): void {
        this.stopCautionBell(alertId);
        this.warningAlertIds.delete(alertId);

        if (!this.warningAlertIds.size && this.warningOscillator) {
            this.stopWarningTone();
        }
    }

    public silenceAll(): void {
        [...this.cautionAurals.keys()].forEach((alertId) => this.stopCautionBell(alertId));
        this.warningAlertIds.clear();
        this.stopWarningTone();
    }

    public setMuted(muted: boolean): void {
        this.muted = muted;
        if (muted) {
            this.silenceAll();
        }
    }

    public isMuted(): boolean {
        return this.muted;
    }

    private playCautionBell(alertId: number): void {
        const ctx = this.getContext();
        const oscillator = new OscillatorNode(ctx, { type: 'sine', frequency: 880 });
        const gain = new GainNode(ctx, { gain: 0.001 });
        const stopTime = ctx.currentTime + 0.7;

        oscillator.connect(gain).connect(ctx.destination);
        this.cautionAurals.set(alertId, { oscillator, gain });
        oscillator.onended = () => {
            this.cautionAurals.delete(alertId);
            oscillator.disconnect();
            gain.disconnect();
        };
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.001, stopTime);
        oscillator.start();
        oscillator.stop(stopTime);
    }

    private startWarningTone(): void {
        if (this.warningOscillator) {
            return;
        }

        const ctx = this.getContext();
        this.warningOscillator = new OscillatorNode(ctx, { type: 'sine', frequency: 950 });
        this.warningGain = new GainNode(ctx, { gain: 0.12 });
        this.warningOscillator.connect(this.warningGain).connect(ctx.destination);
        this.warningOscillator.start();
    }

    private stopCautionBell(alertId: number): void {
        const aural = this.cautionAurals.get(alertId);

        if (!aural) {
            return;
        }

        aural.oscillator.onended = null;
        try {
            aural.oscillator.stop();
            aural.oscillator.disconnect();
            aural.gain.disconnect();
        } catch {
            // Ignore if already stopped
        }
        this.cautionAurals.delete(alertId);
    }

    private stopWarningTone(): void {
        if (!this.warningOscillator) {
            return;
        }

        try {
            this.warningOscillator.stop();
            this.warningOscillator.disconnect();
            this.warningGain?.disconnect();
        } catch {
            // Ignore if already stopped
        }
        this.warningOscillator = null;
        this.warningGain = null;
    }
}

const auralPlayer = new AuralPlayer();

/** Stops every currently playing alert sound. */
export const silenceAlertAurals = (): void => auralPlayer.silenceAll();
/** Enables or disables alert sounds for future and active alerts. */
export const setAlertAuralsMuted = (muted: boolean): void => auralPlayer.setMuted(muted);
/** Returns whether alert sounds are currently muted. */
export const areAlertAuralsMuted = (): boolean => auralPlayer.isMuted();

/** Removes queued and active alerts and silences their sounds. */
export const clearAlerts = (): void => {
    while (!alertQueue.isEmpty()) {
        alertQueue.dequeue();
    }
    alertState.clearAll();
    auralPlayer.silenceAll();
};