export const BoardStatusWidget = ({
    boards,
    boardInfo,
    connected,
    onConnect,
    onDisconnect
}) => {
    const COMBoard = (name, index) => (
        <div key={index} className=" w-full justify-between rounded-xl">
            <button
                onClick={() => onConnect(name)}
                className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80  hover:bg-base-200 transition hover:scale-105"
            >
                <p className="font-bold h-full text-xl">{name}</p>
            
                <div className="size-4 ml-auto self-center rounded-full bg-accent-red"></div>
            </button>
        </div>
        
    );

    const BoardInformation = () => (
        <>
            <div className="flex-col">
                <p className="text-2xl font-semibold">{boardInfo.name}</p>
                <p className="text-xl">Firmware: {boardInfo.firmware}</p>
                <p className="text-xl">Status: {boardInfo.status}</p>
            </div>
            <button
                onClick={onDisconnect}
                className="flex font-bold text-2xl bg-red-600 p-4 hover:opacity-80 transition hover:scale-105 rounded-lg"
            >
                Disconnect
            </button>
        </>
    );

    return (
        <div className="w-1/2 mb-6 p-5 bg-base-100 rounded-lg space-y-4">
            <h1 className="text-2xl font-bold">Boards</h1>
            <div className="space-y-4 flex">
                {!connected ? (boards.length === 0 ? (
                        <p className="text-2xl self-center font-bold opacity-10">No connected boards</p>
                        
                    ) : (
                        boards.map((port, index) => COMBoard(port, index))
                    )
                ) : (
                    <BoardInformation />
                )}
            </div>
        </div>
    );
};
