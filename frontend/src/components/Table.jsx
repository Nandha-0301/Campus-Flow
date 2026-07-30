import React from 'react';

const Table = ({ columns, data, keyField = 'id' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg m-4">
        No records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-y border-gray-100">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-6 py-4 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row[keyField]} className="hover:bg-indigo-50/50 transition-colors duration-150">
              {columns.map((col, index) => (
                <td key={index} className="px-6 py-4 text-sm text-gray-700">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
