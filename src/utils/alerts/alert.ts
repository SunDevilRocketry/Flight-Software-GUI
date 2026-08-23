import { Queue } from '@datastructures-js/queue';

enum AuralStyle {
    NO_AURAL,
    INFO,
    WARNING,
    ERROR
}

const alertQueue = new Queue<Alert>();
const auralPlayer = new AuralPlayer();

class Alert {
    public topLine: string;
    public bottomLine: string | null = null;
    public aural: AuralStyle;

    constructor(primaryMsg: string, secondaryMsg: string | null = null, auralStyle: AuralStyle) {
        this.topLine = primaryMsg;
        this.bottomLine = secondaryMsg;
        this.aural = auralStyle;

        alertQueue.push(this);
    }

    public play() {
        auralPlayer.play(this.aural);
    }
}

class AuralPlayer {
    private ctx: AudioContext;
    private osc: OscillatorNode | null = null;

    constructor() {
        this.ctx = new AudioContext();
    }

    public play(style: AuralStyle): void {
        /* Early exit if no audible alert is triggered */
        if(style === AuralStyle.NO_AURAL) {
            return;
        }

        this.stop();
        
        /* Pick the specific aural handler associated with this style */
        switch(style) {
            /* Intended information: No immediate issue, nonthreatening */
            case AuralStyle.INFO:
                this.osc = new OscillatorNode(this.ctx, {
                    type: 'triangle',
                    frequency: 440,
                });
                this.osc.connect(this.ctx.destination);
                this.osc.start();
                this.osc.stop(this.ctx.currentTime + 0.3);
                return;
            
            /* Intended information: Get user's attention to mitigate an issue */
            case AuralStyle.WARNING:
                this.osc = new OscillatorNode(this.ctx, {
                    type: 'sawtooth',
                    frequency: 955,
                });
                this.osc.connect(this.ctx.destination);
                this.osc.start();
                this.osc.stop(this.ctx.currentTime + 0.1);
                this.osc.start(this.ctx.currentTime + 0.2);
                this.osc.stop(this.ctx.currentTime + 0.3);
                return;
            
            /* Intended information: Immediate & critical issue */
            case AuralStyle.ERROR:
                this.osc = new OscillatorNode(this.ctx, {
                    type: 'sawtooth',
                    frequency: 1200,
                });
                this.osc.connect(this.ctx.destination);
                this.osc.start();
                this.osc.stop(this.ctx.currentTime + 0.3);
                this.osc.start(this.ctx.currentTime + 0.6);
                this.osc.stop(this.ctx.currentTime + 0.9);
                this.osc.start(this.ctx.currentTime + 1.2);
                this.osc.stop(this.ctx.currentTime + 1.5);
                this.osc.start(this.ctx.currentTime + 1.8);
                this.osc.stop(this.ctx.currentTime + 2.1);
                return;
        }
    }

    private stop(): void {
        if (this.osc) {
            try {
                this.osc.stop();
                this.osc.disconnect();
            } catch (e) {
                // Ignore if already stopped
            }
            this.osc = null;
        }
    }
}