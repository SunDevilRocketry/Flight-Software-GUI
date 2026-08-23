import { Queue } from '@datastructures-js/queue';

export enum AlertPriority {
    INFO,
    CAUTION,
    WARNING
}

export const alertQueue = new Queue<Alert>();
let nextAlertId = 0;

export class Alert {
    public readonly id: number;
    public topLine: string;
    public bottomLine: string | null = null;
    public priority: AlertPriority;

    constructor(
        primaryMsg: string,
        secondaryMsg: string | null = null,
        priority: AlertPriority = AlertPriority.INFO,
    ) {
        this.id = nextAlertId++;
        this.topLine = primaryMsg;
        this.bottomLine = secondaryMsg;
        this.priority = priority;

        alertQueue.push(this);
    }

    public play() {
        auralPlayer.play(this.id, this.priority);
    }

    public stop() {
        auralPlayer.stop(this.id);
    }
}

class AuralPlayer {
    private ctx: AudioContext | null = null;
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
                this.playCautionBell();
                return;

            case AlertPriority.WARNING:
                this.warningAlertIds.add(alertId);
                this.startWarningTone();
                return;
        }
    }

    public stop(alertId: number): void {
        this.warningAlertIds.delete(alertId);

        if (!this.warningAlertIds.size && this.warningOscillator) {
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

    private playCautionBell(): void {
        const ctx = this.getContext();
        const oscillator = new OscillatorNode(ctx, { type: 'sine', frequency: 880 });
        const gain = new GainNode(ctx, { gain: 0.001 });
        const stopTime = ctx.currentTime + 0.7;

        oscillator.connect(gain).connect(ctx.destination);
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
}

const auralPlayer = new AuralPlayer();