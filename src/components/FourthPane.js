import React from 'react';

  export default function FourthPane({ onSingleClick, onRowClick, onColumnClick }) {
  

  return (
    <div className="p-6 space-y-6 bg-red-700 rounded-xl">
      <h1 className="text-2xl font-semibold text-white">Hello SDR</h1>

      {/* Single Button */}
      <button
        onClick={onSingleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Button
      </button>

      {/* Row of Buttons */}
      <div className="flex gap-4">
        {[1, 2, 3].map((n) => (
          <button
            key={`row-${n}`}
            onClick={() => onRowClick(n)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Button {n}
          </button>
        ))}
      </div>

      {/* Column of Buttons */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={`col-${n}`}
            onClick={() => onColumnClick(n)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Button {n}
          </button>
        ))}
      </div>
    </div>
  );
}