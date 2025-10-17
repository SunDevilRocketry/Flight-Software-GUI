
export const BoardStatusWidget = ({
    boards,
    boardInfo,
    connected,
    onConnect,
    mockConnected,
    onMockConnected,
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
    const mockBoard = () => (
        <div key="0" className=" w-full justify-between rounded-xl">
            <button
                onClick={() => onMockConnected()}
                className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80  hover:bg-base-200 transition hover:scale-105"
            >
                <p className="font-semibold h-full text-xl">MOCK FLIGHT</p>
            

                <div className="size-4 ml-auto self-center rounded-full bg-accent-red"></div>

            </button>
        </div>
        
    );

    const BoardInformation = () => (
       <div className=" w-full justify-between rounded-xl">
            <button
                className="flex flex-row w-full font-medium px-4 py-6 rounded-3xl hover:opacity-80  hover:bg-base-200 transition hover:scale-105"
            >
                <p className="font-semibold h-full text-xl">MOCK</p>
            

                <div className="size-4 ml-auto self-center rounded-full bg-accent-green"></div>

            </button>
        </div>
    );

    return (
        <div className="w-1/2 mb-6 p-5 bg-base-100 rounded-lg space-y-4">
            <h1 className="text-2xl font-bold">Boards</h1>
            <div className="space-y-4 flex">
                {
                !(connected || mockConnected) ? 
                    ( 
                        boards.length === 0 ? 
                            ( 
                            mockBoard() 
                            ) 
                            : 
                            ( 
                            mockBoard(), 
                            boards.map((port, index) => COMBoard(port, index)) 
                            ) 
                    ) 
                    : 
                    (
                        <BoardInformation />
                    )
                }
            </div>
        </div>
    );
};
