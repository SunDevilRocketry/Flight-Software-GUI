import { useState, useCallback } from "react";
import type { BoardInfo } from "@/components/widgets/BoardStatusWidget";

export interface UseMockDataResult {
  mockConnected: boolean;
  onMockConnected: () => void;
  onMockDisconnected: () => void;
}

const MOCK_BOARD_INFO: BoardInfo = {
  firmware: "1.0.1",
  name: "MOCK FLIGHT",
};

export const useMockData = (
  setBoardInfo: React.Dispatch<React.SetStateAction<BoardInfo>>,
): UseMockDataResult => {
  const [mockConnected, setMockConnected] = useState<boolean>(false);

  const onMockConnected = useCallback(() => {
    setMockConnected((prev) => !prev);
    setBoardInfo(MOCK_BOARD_INFO);
  }, [setBoardInfo]);

  const onMockDisconnected = useCallback(() => {
    setMockConnected(false);
  }, []);

  return {
    mockConnected,
    onMockConnected,
    onMockDisconnected,
  };
};
