import React from 'react';

const MasterNavigator = ({ visibleTabs, activeTab, onSelectTab, categorySummary }) => {
  const coreTabs = ['Departments', 'Production Lines', 'Machines', 'Operators', 'Skills', 'Risk Levels', 'Change Subtypes'];
  const mappingTabs = ['Operator Skills', 'Machine Skill Matrix', 'Method Skill Matrix', 'Material Skill Matrix', 'Training Programs'];
  const governanceTabs = ['Monitoring Periods', 'Type Requirements', 'Type Action Templates'];

  const renderGroup = (title, tabs, indent = false) => (
    <>
      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-4 mb-1">{title}</div>
      {visibleTabs.filter((tab) => tabs.includes(tab.key)).map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${indent ? 'pl-6' : ''} ${
            activeTab === tab.key
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
          }`}
          onClick={() => onSelectTab(tab.key)}
        >
          {tab.key}
        </button>
      ))}
    </>
  );

  return (
    <aside className="lg:col-span-3">
      <div className="lg:sticky lg:top-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Master Navigator</h3>
        <div className="space-y-1">
          {renderGroup('Core Masters', coreTabs)}
          {renderGroup('Skill & Mapping Masters', mappingTabs, true)}
          {renderGroup('Governance Masters', governanceTabs, true)}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          <p>Total: {categorySummary.total}</p>
          <p>Active: {categorySummary.active}</p>
          <p>Inactive: {categorySummary.inactive}</p>
        </div>
      </div>
    </aside>
  );
};

export default MasterNavigator;