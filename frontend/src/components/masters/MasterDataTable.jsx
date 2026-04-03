import React from 'react';

const statusClassName = (status) =>
  `inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
    status === 'Active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  }`;

const MastersDataTable = ({
  activeConfig,
  currentRows,
  allMasters,
  selectedIds,
  allVisibleSelected,
  shouldShowMappedSkills,
  canUpdate,
  canDelete,
  saving,
  toggleSelectRow,
  toggleSelectAllVisible,
  toggleMasterStatus,
  removeMaster,
  setEditing,
  getMappedSkillsForItem,
}) => {
  const renderGroupedRows = (groupedRows, getGroupKey, getGroupName, getGroupValue) =>
    Object.entries(
      groupedRows.reduce((acc, row) => {
        const key = getGroupKey(row) || '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {})
    ).map(([groupKey, rows]) => {
      const status = rows[0].status;
      const id = rows.map((row) => row.id).join('-');
      const groupName = getGroupName(groupKey, rows);
      const displayValue = getGroupValue(rows);
      return (
        <tr key={id}>
          <td>
            <input type="checkbox" checked={rows.every((row) => selectedIds.includes(row.id))} onChange={() => rows.forEach((row) => toggleSelectRow(row.id))} />
          </td>
          <td>{groupName || '-'}</td>
          <td className="break-words max-w-[280px]">{displayValue}</td>
          <td className="whitespace-nowrap">
            <span className={statusClassName(status)}>{status || 'Active'}</span>
          </td>
          <td>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn-secondary disabled:opacity-60"
                disabled={!canUpdate || saving}
                onClick={() => toggleMasterStatus(rows[0])}
              >
                {status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
              <button type="button" className="btn-secondary disabled:opacity-60" disabled={!canUpdate} onClick={() => setEditing({ ...rows[0], name: displayValue })}>
                Edit
              </button>
              <button type="button" className="btn-danger disabled:opacity-60" disabled={!canDelete || saving} onClick={() => removeMaster(rows[0].id)}>
                Delete
              </button>
            </div>
          </td>
        </tr>
      );
    });

  return (
    <div className="overflow-x-auto">
      <table className="table-custom">
        <thead>
          <tr>
            <th>
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} disabled={currentRows.length === 0} />
            </th>
            {activeConfig.needsType && <th>{activeConfig.typeLabel || 'Type'}</th>}
            <th>Name</th>
            {shouldShowMappedSkills && <th>Mapped Skills</th>}
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeConfig.category === 'operator_skill_map'
            ? renderGroupedRows(
                currentRows,
                (row) => row.operator || '',
                (groupKey) => groupKey,
                (rows) => rows.map((row) => row.skill).join(', ')
              )
            : activeConfig.category === 'machine_skill_requirement'
              ? renderGroupedRows(
                  allMasters.filter((row) => row.category === 'machine_skill_requirement'),
                  (row) => row.type || row.machine || '',
                  (groupKey) => groupKey,
                  (rows) => rows.map((row) => row.skill).join(', ')
                )
              : activeConfig.category === 'method_skill_map' || activeConfig.category === 'material_skill_map'
                ? renderGroupedRows(
                    currentRows,
                    (row) => row.type || '',
                    (groupKey) => groupKey,
                    (rows) => rows.map((row) => row.name).join(', ')
                  )
                : currentRows.map((item) => {
                    const mappedSkills = getMappedSkillsForItem(item);
                    return (
                      <tr key={item.id}>
                        <td>
                          <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelectRow(item.id)} />
                        </td>
                        {activeConfig.needsType && <td>{item.type || '-'}</td>}
                        <td className="break-words max-w-[280px]">{item.name}</td>
                        {shouldShowMappedSkills && (
                          <td className="max-w-[320px]">
                            {mappedSkills.length === 0 ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400">No skill mapped</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {mappedSkills.map((skill) => (
                                  <span key={`${item.id}-${skill}`} className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        )}
                        <td>
                          <span className={statusClassName(item.status)}>{item.status || 'Active'}</span>
                        </td>
                        <td>
                          <div className="flex gap-2 flex-wrap">
                            <button type="button" className="btn-secondary disabled:opacity-60" disabled={!canUpdate || saving} onClick={() => toggleMasterStatus(item)}>
                              {item.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button type="button" className="btn-secondary disabled:opacity-60" disabled={!canUpdate} onClick={() => setEditing({ ...item })}>
                              Edit
                            </button>
                            <button type="button" className="btn-danger disabled:opacity-60" disabled={!canDelete || saving} onClick={() => removeMaster(item.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
        </tbody>
      </table>
    </div>
  );
};

export default MastersDataTable;