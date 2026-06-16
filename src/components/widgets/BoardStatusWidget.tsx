import type { FC } from "react";

export interface BoardInfo {
  name: string;
  firmware: string;
}

export interface WirelessBoardInfo {
  target: string;
  firmware: string;
}

export interface BoardSummary {
  port: string;
  device_description?: string;
}

interface COMBoardProps {
  name: string;
  description?: string;
  isConnected: boolean;
  onConnect: (name: string) => void;
}

interface MockBoardProps {
  onMockConnected: () => void;
}

interface WirelessBoardInformationProps {
  wirelessBoardInfo: WirelessBoardInfo | null | undefined;
}

interface BoardInformationProps {
  boardInfo: BoardInfo;
  wirelessBoardInfo: WirelessBoardInfo | null | undefined;
  mockConnected: boolean;
  onDisconnect: () => void;
}

export interface BoardStatusWidgetProps {
  boards: BoardSummary[];
  activeComPort: string | null;
  boardInfo: BoardInfo;
  wirelessBoardInfo: WirelessBoardInfo | null | undefined;
  connected: boolean;
  onConnect: (name: string) => void;
  mockConnected: boolean;
  onMockConnected: () => void;
  onDisconnect: () => void;
  /** Seconds elapsed in the current mock telemetry run (0-100 expected for the progress bar). */
  mockElapsedSeconds?: number;
}

function stripParenSuffix(value: string): string {
  const parenIndex = value.indexOf("(");
  return parenIndex === -1 ? value : value.slice(0, parenIndex);
}

const ConnectionIndicator: FC<{ pulse?: boolean; className: string }> = ({
  pulse = false,
  className,
}) => (
  <span className="relative flex ml-auto self-center size-4">
    {pulse && (
      <span
        className={`absolute inline-flex h-full w-full size-1 animate-ping rounded-full opacity-35 ${className}`}
      />
    )}
    <span className={`relative inline-flex size-4 rounded-full ${className}`} />
  </span>
);

const COMBoard: FC<COMBoardProps> = ({ name, description, isConnected, onConnect }) => (
  <div className="w-full justify-between rounded-xl">
    <button
      type="button"
      onClick={() => onConnect(name)}
      className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80 hover:bg-zinc-300/20 dark:hover:bg-base-200"
    >
      <div className="flex flex-col justify-start items-start">
        <p className="font-bold h-full text-xl">{name}</p>
        {description && (
          <p className="font-thin h-full text-sm p-0 m-0 opacity-80">{description}</p>
        )}
      </div>
      <div
        className={`size-4 ml-auto self-center rounded-full ${
          isConnected ? "bg-yellow-500" : "bg-accent-red"
        }`}
      />
    </button>
  </div>
);

const MockBoard: FC<MockBoardProps> = ({ onMockConnected }) => (
  <div className="w-full justify-between self-center rounded-xl">
    <button
      type="button"
      onClick={onMockConnected}
      className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:bg-zinc-300/20 dark:hover:bg-base-200"
    >
      <div className="flex flex-col items-start text-left">
        <p className="font-bold text-xl">MOCK FC</p>
        <p className="font-thin h-full text-sm p-0 m-0 opacity-80">Simulates telemetry</p>
      </div>
      <div className="size-4 ml-auto self-center rounded-full bg-accent-yellow" />
    </button>
  </div>
);

const WirelessBoardInformation: FC<WirelessBoardInformationProps> = ({ wirelessBoardInfo }) => {
  if (!wirelessBoardInfo) return null;

  return (
    <div className="flex flex-col w-full mt-4 justify-start items-start">
      <div className="flex flex-row w-full justify-start items-start">
        <div className="flex flex-col justify-start items-start self-start">
          <p className="font-bold h-full text-xl p-0 m-0">Wireless Connection:</p>
          <p className="font-semibold h-full text-lg p-0 m-0">
            {stripParenSuffix(wirelessBoardInfo.target)}
          </p>
          <p className="font-thin h-full text-sm p-0 m-0">{wirelessBoardInfo.firmware}</p>
        </div>
        <ConnectionIndicator pulse className="bg-accent-green" />
      </div>
    </div>
  );
};

const BoardInformation: FC<BoardInformationProps & { mockElapsedSeconds: number }> = ({
  boardInfo,
  wirelessBoardInfo,
  mockConnected,
  onDisconnect,
  mockElapsedSeconds,
}) => (
  <div className="w-full justify-between rounded-xl">
    <button
      type="button"
      onClick={onDisconnect}
      className="flex flex-col w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80 hover:bg-zinc-300/20 dark:hover:bg-base-200"
    >
      <div className="flex flex-col w-full m-0 justify-start items-start">
        <div className="flex flex-row w-full justify-start items-start">
          <div className="flex flex-col justify-start items-start self-start">
            <p className="font-bold h-full text-xl p-0 m-0">Serial Connection:</p>
            <p className="font-semibold h-full text-lg p-0 m-0">
              {stripParenSuffix(boardInfo.name)}
            </p>
          </div>
          <ConnectionIndicator pulse className="bg-accent-green" />
        </div>
        <p className="font-thin h-full text-sm p-0 m-0">{boardInfo.firmware}</p>

        {mockConnected && (
          <div className="flex flex-row w-full justify-start items-center">
            <div
              style={{ width: `${mockElapsedSeconds}%` }}
              className="size-1 mt-3 self-start rounded-full max-w-[80%] bg-accent-green"
            />
            <p className="font-thin h-full text-xs p-0 mt-1 ml-auto text-center">
              {`${mockElapsedSeconds}s`}
            </p>
          </div>
        )}
      </div>
      <p />
      <WirelessBoardInformation wirelessBoardInfo={wirelessBoardInfo} />
    </button>
  </div>
);

export const BoardStatusWidget: FC<BoardStatusWidgetProps> = ({
  boards,
  activeComPort,
  boardInfo,
  wirelessBoardInfo,
  connected,
  onConnect,
  mockConnected,
  onMockConnected,
  onDisconnect,
  mockElapsedSeconds = 0,
}) => {
  const isAnyConnected = connected || mockConnected;

  return (
    <div className="w-1/2 mb-6 p-5 rounded-lg space-y-4 bg-base-700 text-base-200 dark:bg-base-100 dark:text-highlight transition-colors duration-700 shadow-xl">
      <h1 className="text-2xl font-bold">Boards</h1>
      <div className="space-y-4 flex">
        {isAnyConnected ? (
          <BoardInformation
            boardInfo={boardInfo}
            wirelessBoardInfo={wirelessBoardInfo}
            mockConnected={mockConnected}
            onDisconnect={onDisconnect}
            mockElapsedSeconds={mockElapsedSeconds}
          />
        ) : boards.length === 0 ? (
          <MockBoard onMockConnected={onMockConnected} />
        ) : (
          <div className="flex flex-col w-full">
            <MockBoard onMockConnected={onMockConnected} />
            {boards.map(({ port, device_description }) => (
              <COMBoard
                key={port}
                name={port}
                description={device_description}
                isConnected={port === activeComPort}
                onConnect={onConnect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
