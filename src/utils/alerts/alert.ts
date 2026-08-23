import { Queue } from '@datastructures-js/queue';

export enum AlertPriority {
    INFO,
    CAUTION,
    WARNING
}

export const alertQueue = new Queue<Alert>();
let nextAlertId = 0;

class AlertState {
    private cautionOrWarningAlertIds = new Set<number>();
    private warningAlertIds = new Set<number>();
    private listeners = new Set<() => void>();
    private clearListeners = new Set<() => void>();

    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    public subscribeToClear = (listener: () => void): (() => void) => {
        this.clearListeners.add(listener);
        return () => this.clearListeners.delete(listener);
    };

    public hasCautionOrWarning = (): boolean => this.cautionOrWarningAlertIds.size > 0;
    public hasWarning = (): boolean => this.warningAlertIds.size > 0;

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

    public dismiss(alertId: number): void {
        const removedCautionOrWarning = this.cautionOrWarningAlertIds.delete(alertId);
        const removedWarning = this.warningAlertIds.delete(alertId);

        if (removedCautionOrWarning || removedWarning) {
            this.notify();
        }
    }

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

export const alertState = new AlertState();

export class Alert {
    public readonly id: number;
    public topLine: string;
    public bottomLine: string | null = null;
    public priority: AlertPriority;
    public readonly auralEnabled: boolean;

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

    public play() {
        if (this.auralEnabled) {
            auralPlayer.play(this.id, this.priority);
        }
    }

    public stop() {
        auralPlayer.stop(this.id);
        alertState.dismiss(this.id);
    }
}

class AuralPlayer {
    private ctx: AudioContext | null = null;
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
        } catch (e) {
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
        } catch (e) {
            // Ignore if already stopped
        }
        this.warningOscillator = null;
        this.warningGain = null;
    }
}

const auralPlayer = new AuralPlayer();

export const silenceAlertAurals = (): void => auralPlayer.silenceAll();

export const clearAlerts = (): void => {
    while (!alertQueue.isEmpty()) {
        alertQueue.dequeue();
    }
    alertState.clearAll();
    auralPlayer.silenceAll();
};