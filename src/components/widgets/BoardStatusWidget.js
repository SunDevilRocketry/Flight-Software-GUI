const COMBoard = ({ name, onConnect, index }) => (
  <div key={index} className="w-full justify-between rounded-xl">
    <button
      onClick={() => onConnect(name)}
      className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80 hover:bg-zinc-300/20 dark:hover:bg-base-200"
    >
      <p className="font-bold h-full text-xl">{name}</p>
      <div className="size-4 ml-auto self-center rounded-full bg-accent-red"></div>
    </button>
  </div>
);

const MockBoard = ({ onMockConnected }) => (
  <div className="w-[100%] justify-between self-center rounded-xl ">
    <button
      onClick={onMockConnected}
      className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:bg-zinc-300/20 dark:hover:bg-base-200 "
    >
      <p className="font-semibold h-full text-lg">MOCK FLIGHT</p>
      <div className="size-4 ml-auto self-center rounded-full bg-accent-red"></div>
    </button>
  </div>
);

const BoardInformation = ({ boardInfo, wirelessBoardInfo, mockConnected, onDisconnect }) => (
  <div className="w-full justify-between rounded-xl ">
    <button
      onClick={onDisconnect}
      className="flex flex-col w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80 hover:bg-zinc-300/20  dark:hover:bg-base-200 "
    >
      <div className="flex flex-col w-full m-0 justify-start items-start">
        <div className="flex flex-row w-full justify-start items-start">
          <div className="flex flex-col justify-start items-start self-start">
            <p className="font-bold h-full text-xl p-0 m-0">
              Serial Connection:
            </p>
            <p className="font-semibold h-full text-lg p-0 m-0">
              {boardInfo.name.indexOf("(") === -1
                ? boardInfo.name
                : boardInfo.name.slice(0, boardInfo.name.indexOf("("))}
            </p>
          </div>
          <span className="relative flex ml-auto self-center size-4">
            <span className="absolute inline-flex h-full w-full size-1 animate-ping rounded-full bg-accent-green opacity-35"></span>
            <span className="relative inline-flex size-4 rounded-full bg-accent-green"></span>
          </span>
        </div>
        <p className="font-thin h-full text-sm p-0 m-0">{boardInfo.firmware}</p>

        <div
          className={`flex flex-row w-full ${
            mockConnected ? " " : "hidden"
          } justify-start items-center`}
        >
          <div
            style={{ width: `${window.timeGOBAL}%` }}
            className={`size-1 mt-3 self-start rounded-full max-w-[80%] bg-accent-green`}
          ></div>
          <p className="font-thin h-full text-xs p-0 mt-1 ml-auto text-center">{`${window.timeGOBAL}s`}</p>
        </div>
      </div>
      <p></p>
      <WirelessBoardInformation
            wirelessBoardInfo={wirelessBoardInfo}
            mockConnected={mockConnected}
        />
    </button>
  </div>
);

const WirelessBoardInformation = ({ wirelessBoardInfo }) => {
  if (!wirelessBoardInfo) return (
    null
  );

  return (
    <div className="flex flex-col w-full mt-4 justify-start items-start">
      <div className="flex flex-row w-full justify-start items-start">
        <div className="flex flex-col justify-start items-start self-start">
          <p className="font-bold h-full text-xl p-0 m-0">
            Wireless Connection:
          </p>
          <p className="font-semibold h-full text-lg p-0 m-0">
            {wirelessBoardInfo.target.indexOf("(") === -1
              ? wirelessBoardInfo.target
              : wirelessBoardInfo.target.slice(0, wirelessBoardInfo.target.indexOf("("))}
          </p>
          <p className="font-thin h-full text-sm p-0 m-0">{wirelessBoardInfo.firmware}</p>
        </div>
        <span className="relative flex ml-auto self-center size-4">
          <span className="absolute inline-flex h-full w-full size-1 animate-ping rounded-full bg-accent-green opacity-35"></span>
          <span className="relative inline-flex size-4 rounded-full bg-accent-green"></span>
        </span>
      </div>
    </div>
  );
};

// --- Parent component ---
export const BoardStatusWidget = ({
  boards,
  boardInfo,
  wirelessBoardInfo,
  connected,
  onConnect,
  mockConnected,
  onMockConnected,
  onDisconnect,
}) => {
  return (
    <div className="w-1/2 mb-6 p-5 rounded-lg space-y-4 bg-base-700 text-base-200 dark:bg-base-100 dark:text-highlight  transition-colors duration-700 shadow-xl
">
      <h1 className="text-2xl font-bold">Boards</h1>
      <div className="space-y-4 flex">
        {
        !(connected || mockConnected) ? 
            (
            boards.length === 0 ? 
                (
                <MockBoard onMockConnected={onMockConnected} />
                ) 
            : 
                (
                <div className="flex flex-col w-full">
                <MockBoard onMockConnected={onMockConnected} />
                {boards.map((port, i) => ( <COMBoard key={i} name={port} onConnect={onConnect} index={i} />))}
                </div>
                )
            ) 
        : 
            (
            <BoardInformation boardInfo={boardInfo} wirelessBoardInfo={wirelessBoardInfo} mockConnected={mockConnected} onDisconnect={onDisconnect} />
            )
        }
      </div>
    </div>
  );
};
