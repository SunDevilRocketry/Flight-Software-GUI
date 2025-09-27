export const SensorReadingWidget = ({ sensorData }) => {
    const {
        accelerationX,
        accelerationY,
        accelerationZ,
        gyroscopeX,
        gyroscopeY,
        gyroscopeZ,
        pitch,
        pitchRate,
        roll,
        rollRate,
        pressure,
        velocity,
        altitude,
        chipTemperature,
        latitude,
        longitude
    } = sensorData;

    return (
        <div className="w-1/2 mb-6 p-5 bg-base-100 rounded-lg">
            <h1 className="text-2xl font-bold">Sensor Readings</h1>
            <div className="grid grid-cols-2 grid-rows-3 gap-x-24">
                <DataGroup title="Acceleration" data={[
                    { label: 'X', value: accelerationX },
                    { label: 'Y', value: accelerationY },
                    { label: 'Z', value: accelerationZ }
                ]} />

                <DataGroup title="Barometer" data={[
                    { label: 'Pressure', value: pressure },
                    { label: 'Velocity', value: velocity },
                    { label: 'Altitude', value: altitude }
                ]} />

                <DataGroup title="Gyroscope" data={[
                    { label: 'X', value: gyroscopeX },
                    { label: 'Y', value: gyroscopeY },
                    { label: 'Z', value: gyroscopeZ }
                ]} />

                <div>
                    <p className="text-lg font-bold">Chip Temperature: </p>
                    <p>{chipTemperature}</p>
                </div>

                <DataGroup title="Orientation" data={[
                    { label: 'Pitch', value: pitch },
                    { label: 'Pitch Rate', value: pitchRate },
                    { label: 'Roll', value: roll },
                    { label: 'Roll Rate', value: rollRate }
                ]} />

                <DataGroup title="Location" data={[
                    { label: 'latitude', value: latitude },
                    { label: 'longitude', value: longitude }
                ]} />
            </div>
        </div>
    );
};

const DataGroup = ({ title, data }) => (
    <div>
        <p className="text-lg font-bold">{title}</p>
        <div className="text-sm">
            {data.map(({ label, value }) => (
                <p key={label}>{label}: {value}</p>
            ))}
        </div>
    </div>
);
