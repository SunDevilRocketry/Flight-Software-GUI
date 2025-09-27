export const BoardStatusWidget = ({
    boards,
    boardInfo,
    connected,
    onConnect,
    onDisconnect
}) => {
    const COMBoard = (name, index) => (
        <div key={index} className="flex w-full justify-between bg-base p-4 rounded-lg">
            <p className="font-bold h-full text-xl">{name}</p>
            <button
                onClick={() => onConnect(name)}
                className="font-medium bg-red-600 p-2 rounded-lg hover:opacity-80 transition hover:scale-110"
            >
                Connect
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
            <h1 className="text-2xl font-bold">Board Status</h1>
            <div className="space-y-4">
                {!connected ? (
                    boards.length === 0 ? (
                        <p className="text-2xl font-bold">No connected boards</p>
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
