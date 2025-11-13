const COMBoard = ({ name, onConnect, index }) => (
  <div key={index} className="w-full justify-between rounded-xl">
    <button
      onClick={() => onConnect(name)}
      className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80 hover:bg-base-200"
    >
      <p className="font-bold h-full text-xl">{name}</p>
      <div className="size-4 ml-auto self-center rounded-full bg-accent-red"></div>
    </button>
  </div>
);

const MockBoard = ({ onMockConnected }) => (
  <div className="w-[100%] justify-between self-center rounded-xl">
    <button
      onClick={onMockConnected}
      className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80 hover:bg-base-200 "
    >
      <p className="font-semibold h-full text-xl">MOCK FLIGHT</p>
      <div className="size-4 ml-auto self-center rounded-full bg-accent-red"></div>
    </button>
  </div>
);

const BoardInformation = ({ boardInfo, onDisconnect }) => (
  <div className="w-full justify-between rounded-xl">
    <button
      onClick={onDisconnect}
      className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl  hover:bg-base-200 hover:opacity-80 "
    >
      <div className="flex flex-col w-full m-0 justify-start items-start">
        <div className="flex flex-row w-full justify-start items-start">
            <div className="flex flex-col justify-start items-start self-start">
              <p className="font-semibold h-full text-lg p-0 m-0">{boardInfo.name.indexOf("(") == -1 ? boardInfo.name : boardInfo.name.slice(0,boardInfo.name.indexOf("("))}</p>
              <p className="font-thin h-full text-sm p-0 m-0">{boardInfo.firmware} v2.6.0</p>
            </div>
            <div className="size-4 ml-auto self-center rounded-full bg-accent-green"></div>
        </div>
      </div>
    </button>
  </div>
);

// --- Parent component ---
export const BoardStatusWidget = ({
  boards,
  boardInfo,
  connected,
  onConnect,
  mockConnected,
  onMockConnected,
  onDisconnect
}) => {
  return (
    <div className="w-1/2 mb-6 p-5 bg-base-100 rounded-lg space-y-4">
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
            <BoardInformation boardInfo={boardInfo} onDisconnect={onDisconnect} />
            )
        }
      </div>
    </div>
  );
};
