import { SSEMessage } from "./sseCommon";
import { SDEC_BASE_URL } from "@/utils/api"
import type { RawSensorPacket } from "../useSensorData";
import type { WirelessBoardInfo } from "@/components/widgets/BoardStatusWidget";
import { altitudeHandler } from "@/utils/units/units";

/**
 * Constants for supported endpoint versions. 
 */
const expectedOrigin = "SDEC-API";
const expectedVersion = "1.0";

/**
 * Structure to house an API stream and callbacks to access the data.
 */
export interface FlightSseListener {
    onDashboardData?: (packet: RawSensorPacket) => void;
    onVehicleId?: (boardInfo: WirelessBoardInfo) => void;
}

/** 
 * Structure housing preset calibration data 
 */
interface CalibData {
    imu_offset: [number, number, number, number, number, number];
    baro_preset: [number, number];
    qfe_reference: number;
    servo_preset: [number, number, number, number];
}

const listeners = new Set<FlightSseListener>();
let eventSource: EventSource | null = null;

/**
 * Determine if the value passed in is of type Record<>
 * 
 * @param value The object to type-check.
 * @returns TRUE if the value is a json-style record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Open the SSE stream
 */
function startConnection(): void {
    if (eventSource || typeof window === "undefined") return;

    eventSource = new EventSource(`${SDEC_BASE_URL}/stream`);

    eventSource.onmessage = (event: MessageEvent) => {
        try {
            const data: SSEMessage = JSON.parse(event.data);
            // Uncomment for verbose diagnostics
            //console.log("New message:", data.messageType);

            if (data.origin !== expectedOrigin) {
                console.error("SDEC SSE origin does not match expected.");
                return;
            }

            if (data.version !== expectedVersion) {
                console.error("SDEC SSE stream version mismatch.");
                return;
            }

            if (!isRecord(data.payload)) {
                console.error("SDEC SSE payload is not an object -- discarding.");
                return;
            }

            switch (data.messageType) {
                case "DASHBOARD_DATA":
                    listeners.forEach((listener) => listener.onDashboardData?.(data.payload as RawSensorPacket));
                    break;
                case "VEHICLE_ID":
                    listeners.forEach((listener) => listener.onVehicleId?.(data.payload as WirelessBoardInfo));
                    break;
                case "CALIBRATION":
                    updateCalibrationData(data.payload as unknown as CalibData);
                    break;
                default:
                    console.error("Unknown message type received -- discarding.");
                    break;
            }
        } catch (error) {
            console.error("Failed to parse event data:", error);
        }
     };

    eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
    };
}

/**
 * Subscribe to the SSE stream.
 * 
 * @param listener A structure containing callbacks to access data from the stream. 
 */
export function subscribeToFlightSse(listener: FlightSseListener): () => void {
    listeners.add(listener);
    startConnection();

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
        eventSource?.close();
        eventSource = null;
        }
    };
}

/**
 * A helper to use incoming calibration data to set up the rest of the system.
 * @param data The calibration data to use for the update.
 */
function updateCalibrationData(data: CalibData) {
    /* Only one step for now: update QFE reference */
    altitudeHandler.referenceElevation = data.qfe_reference;
}