export function Settings( {toggle} ) {
    console.log(toggle)
    return (
        <div className={`h-screen top-0 left-0 w-screen absolute bg-black ${toggle ? "bg-opacity-40" : "hidden"}`}>
                <div className='h-5/6 w-1/2 top-[10%] left-1/4 absolute bg-base-100 p-10 rounded-xl shadow-lg '>

                </div>
        </div>

    );


}

export default Settings;