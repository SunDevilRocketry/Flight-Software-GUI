import Papa from 'papaparse';

async function fetchCSV() {
    const response = await fetch('/appa_sensor_data.csv');
    const reader = response.body.getReader();
    const result = await reader.read();
    const decoder = new TextDecoder('utf-8');
    const csv = await decoder.decode(result.value);

    
    return csv;
}

export const MockFlight =
{

    getSensorData: async(row) => {
        const data = Papa.parse(await fetchCSV(), { header: true });
        return data.data[row]
        
    }

}