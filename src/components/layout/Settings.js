export function Settings( {toggle} ) {
    console.log(toggle)
    return (
        <div className={`h-screen top-0 left-0 w-screen absolute bg-black ${toggle ? "bg-opacity-40" : "hidden"}`}>
            <div className='h-5/6 w-2/3 top-[10%] left-[16.5%] absolute bg-base-100 p-2 rounded-xl shadow-lg '>
                <div className="h-[10%] bg-red-800"></div>
                <div className="size-full flex">
                    <div className="h-[90%] w-1/3 bg-blue-800"></div>
                    <div className="h-[90%] w-2/3 bg-green-800"></div>
                </div>
                
                
            </div>
        </div>

    );


}

export default Settings;