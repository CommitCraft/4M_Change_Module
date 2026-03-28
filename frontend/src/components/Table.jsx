import React from 'react';


const Table = ({ columns, data, onEdit, onDelete, onView, selectedId }) => {
  return (
    <div className="overflow-x-auto table-container rounded-lg shadow border bg-white dark:bg-gray-900">
      <table className="table-custom">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {columns.map((col) => (
              <th key={col.key} className="dark:text-gray-200">
                {col.label}
              </th>
            ))}
            <th className="dark:text-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-4 text-gray-500 dark:text-gray-400">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className={
                  `dark:border-gray-700 ${idx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/40' : ''} ` +
                  (selectedId === row.id ? 'ring-2 ring-blue-400 dark:ring-blue-600' : '')
                }
              >
                {columns.map((col) => (
                  <td key={col.key} className="dark:text-gray-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                <td>
                  <div className="flex gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
                      >
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:ring-2 focus:ring-green-400"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
