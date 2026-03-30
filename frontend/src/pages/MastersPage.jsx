import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { riskLevelService } from '../services/api';
// Custom MultiSelectDropdown component for skills
const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="input-field dark:bg-gray-800 dark:text-gray-200 w-full text-left flex justify-between items-center"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {selected.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selected.join(', ')
          )}
        </span>
        <span className="ml-2">▼</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-2 text-gray-500 text-sm">No skills found</div>
          ) : (
            options.map((opt) => (
              <label key={opt} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => {
                    if (selected.includes(opt)) {
                      onChange(selected.filter((s) => s !== opt));
                    } else {
                      onChange([...selected, opt]);
                    }
                  }}
                  className="mr-2"
                />
                {opt}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  departmentService,
  productionLineService,
  machineService,
  changeSubTypeService,
  operatorService,
  skillService,
  operatorSkillMapService,
  machineSkillRequirementService,
  trainingProgramService,
  typeRequirementService,
  typeActionTemplateService,
} from '../services/api';
import Modal from '../components/Modal';
import { showError, showSuccess } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const FOUR_M_TYPES = ['Man', 'Machine', 'Method', 'Material'];
const STATUS_OPTIONS = ['Active', 'Inactive'];
const MASTERS_UPDATED_EVENT = 'masters:updated';

const parseBulkNames = (rawValue) => {
  const seen = new Set();
  return String(rawValue || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const MASTER_TABS = [
  { key: 'Departments', category: 'department', needsType: false, placeholder: 'Department name' },
  { key: 'Production Lines', category: 'production_line', needsType: false, placeholder: 'Production line name/ID' },
  { key: 'Machines', category: 'machine', needsType: false, placeholder: 'Machine ID / Name' },
  { key: 'Change Subtypes', category: 'change_subtype', needsType: true, typeLabel: '4M Type', placeholder: 'Subtype name' },
  { key: 'Risk Levels', category: 'risk_level', needsType: false, placeholder: 'Risk level' },
  { key: 'Operators', category: 'operator', needsType: false, placeholder: 'Operator name' },
  { key: 'Skills', category: 'skill', needsType: false, placeholder: 'Skill name' },
  {
    key: 'Operator Skills',
    category: 'operator_skill_map',
    needsType: true,
    typeLabel: 'Operator',
    placeholder: 'Skill assigned to operator',
  },
  {
    key: 'Machine Skill Matrix',
    category: 'machine_skill_requirement',
    needsType: true,
    typeLabel: 'Machine',
    placeholder: 'Required skill for machine',
  },
  {
    key: 'Method Skill Matrix',
    category: 'method_skill_map',
    needsType: true,
    typeLabel: 'Method Subtype',
    placeholder: 'Required skill for method subtype',
  },
  {
    key: 'Material Skill Matrix',
    category: 'material_skill_map',
    needsType: true,
    typeLabel: 'Material Subtype',
    placeholder: 'Required skill for material subtype',
  },
  {
    key: 'Training Programs',
    category: 'training_program',
    needsType: true,
    typeLabel: 'Skill',
    placeholder: 'Training program name',
  },
  {
    key: 'Type Requirements',
    category: 'type_requirement',
    needsType: true,
    typeLabel: '4M Type',
    placeholder: 'Requirement/checkpoint',
  },
  {
    key: 'Type Action Templates',
    category: 'type_action_template',
    needsType: true,
    typeLabel: '4M Type',
    placeholder: 'Recommended action plan item',
  },
];

const TAB_HINTS = {
  machine: 'Machine list with mapped required skills.',
  operator: 'Operator list with mapped assigned skills.',
  change_subtype: 'Manage 4M subtypes. Method/Material subtype rows also show mapped skills.',
  operator_skill_map: 'Map each operator to one or more skills.',
  machine_skill_requirement: 'Define required skills for each machine.',
  method_skill_map: 'Define required skills for each method subtype.',
  material_skill_map: 'Define required skills for each material subtype.',
};

const MastersPage = () => {
  const { hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Departments');
  const [allMasters, setAllMasters] = useState([]);
  const [operatorSkillMaps, setOperatorSkillMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [quickSubtypeName, setQuickSubtypeName] = useState('');
  const [forms, setForms] = useState(() =>
    MASTER_TABS.reduce((acc, tab) => {
      acc[tab.key] = { name: '', type: tab.category === 'change_subtype' ? 'Man' : '', status: 'Active' };
      return acc;
    }, {})
  );


  // Section-wise CRUD permission mapping for each tab
  const tabPermissionMap = {
    department: {
      read: 'masters.department.read',
      create: 'masters.department.create',
      update: 'masters.department.update',
      delete: 'masters.department.delete',
    },
    production_line: {
      read: 'masters.productionline.read',
      create: 'masters.productionline.create',
      update: 'masters.productionline.update',
      delete: 'masters.productionline.delete',
    },
    machine: {
      read: 'masters.machine.read',
      create: 'masters.machine.create',
      update: 'masters.machine.update',
      delete: 'masters.machine.delete',
    },
    change_subtype: {
      read: 'masters.change_subtype.read',
      create: 'masters.change_subtype.create',
      update: 'masters.change_subtype.update',
      delete: 'masters.change_subtype.delete',
    },
    risk_level: {
      read: 'masters.risk_level.read',
      create: 'masters.risk_level.create',
      update: 'masters.risk_level.update',
      delete: 'masters.risk_level.delete',
    },
    operator: {
      read: 'masters.operator.read',
      create: 'masters.operator.create',
      update: 'masters.operator.update',
      delete: 'masters.operator.delete',
    },
    skill: {
      read: 'masters.skill.read',
      create: 'masters.skill.create',
      update: 'masters.skill.update',
      delete: 'masters.skill.delete',
    },
    operator_skill_map: {
      read: 'masters.operator_skill_map.read',
      create: 'masters.operator_skill_map.create',
      update: 'masters.operator_skill_map.update',
      delete: 'masters.operator_skill_map.delete',
    },
    machine_skill_requirement: {
      read: 'masters.machine_skill_requirement.read',
      create: 'masters.machine_skill_requirement.create',
      update: 'masters.machine_skill_requirement.update',
      delete: 'masters.machine_skill_requirement.delete',
    },
    method_skill_map: {
      read: 'masters.method_skill_map.read',
      create: 'masters.method_skill_map.create',
      update: 'masters.method_skill_map.update',
      delete: 'masters.method_skill_map.delete',
    },
    material_skill_map: {
      read: 'masters.material_skill_map.read',
      create: 'masters.material_skill_map.create',
      update: 'masters.material_skill_map.update',
      delete: 'masters.material_skill_map.delete',
    },
    training_program: {
      read: 'masters.training_program.read',
      create: 'masters.training_program.create',
      update: 'masters.training_program.update',
      delete: 'masters.training_program.delete',
    },
    type_requirement: {
      read: 'masters.type_requirement.read',
      create: 'masters.type_requirement.create',
      update: 'masters.type_requirement.update',
      delete: 'masters.type_requirement.delete',
    },
    type_action_template: {
      read: 'masters.type_action_template.read',
      create: 'masters.type_action_template.create',
      update: 'masters.type_action_template.update',
      delete: 'masters.type_action_template.delete',
    },
  };

  // Initialize activeConfig before using it
  const activeConfig = useMemo(
    () => MASTER_TABS.find((tab) => tab.key === activeTab) || MASTER_TABS[0],
    [activeTab]
  );

  // Get current tab's category
  const currentCategory = activeConfig.category;
  const currentPerms = tabPermissionMap[currentCategory] || {};

  const canRead = currentPerms.read ? hasPermission(currentPerms.read) : true;
  const canCreate = currentPerms.create ? hasPermission(currentPerms.create) : false;
  const canUpdate = currentPerms.update ? hasPermission(currentPerms.update) : false;
  const canDelete = currentPerms.delete ? hasPermission(currentPerms.delete) : false;

  const operators = useMemo(() => allMasters.filter((r) => r.category === 'operator').map((r) => r.name), [allMasters]);
  const machines = useMemo(() => allMasters.filter((r) => r.category === 'machine').map((r) => r.name), [allMasters]);
  const skills = useMemo(() => allMasters.filter((r) => r.category === 'skill').map((r) => r.name), [allMasters]);
  const methodSubtypes = useMemo(
    () => allMasters.filter((r) => r.category === 'change_subtype' && r.type === 'Method').map((r) => r.name),
    [allMasters]
  );
  const materialSubtypes = useMemo(
    () => allMasters.filter((r) => r.category === 'change_subtype' && r.type === 'Material').map((r) => r.name),
    [allMasters]
  );

  // Fetch all master data from normalized tables and merge into a single array for UI compatibility
  const fetchMasters = useCallback(async () => {
    setLoading(true);
    try {
      const [departments, productionLines, machines, changeSubTypes, operators, skills, machineSkillRequirements, trainingPrograms, typeRequirements, typeActionTemplates, riskLevels, operatorSkillMapsRes] = await Promise.all([
        departmentService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'department' })) ),
        productionLineService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'production_line' })) ),
        machineService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'machine' })) ),
        changeSubTypeService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'change_subtype' })) ),
        operatorService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'operator' })) ),
        skillService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'skill' })) ),
        machineSkillRequirementService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'machine_skill_requirement' })) ),
        trainingProgramService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'training_program' })) ),
        typeRequirementService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'type_requirement' })) ),
        typeActionTemplateService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'type_action_template' })) ),
        riskLevelService.getAll().then(res => (res.data.data || []).map(row => ({ ...row, category: 'risk_level', type: '', status: row.status || 'Active' })) ),
        operatorSkillMapService.getAll().then(res => res.data.data || []),
      ]);
      setAllMasters([
        ...departments,
        ...productionLines,
        ...machines,
        ...changeSubTypes,
        ...operators,
        ...skills,
        ...machineSkillRequirements,
        ...trainingPrograms,
        ...typeRequirements,
        ...typeActionTemplates,
        ...riskLevels,
      ]);
      setOperatorSkillMaps(operatorSkillMapsRes);
    } catch (error) {
      showError('Failed to fetch masters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasters();

    const handleMastersUpdated = () => {
      fetchMasters();
    };

    window.addEventListener(MASTERS_UPDATED_EVENT, handleMastersUpdated);
    return () => {
      window.removeEventListener(MASTERS_UPDATED_EVENT, handleMastersUpdated);
    };
  }, [fetchMasters]);

  const getTypeOptions = (tabConfig) => {
    if (!tabConfig.needsType) return [];
    if (tabConfig.category === 'change_subtype') return FOUR_M_TYPES;
    if (tabConfig.category === 'operator_skill_map') return operators;
    if (tabConfig.category === 'machine_skill_requirement') return machines;
    if (tabConfig.category === 'method_skill_map') return methodSubtypes;
    if (tabConfig.category === 'material_skill_map') return materialSubtypes;
    if (tabConfig.category === 'training_program') return skills;
    if (tabConfig.category === 'type_requirement') return FOUR_M_TYPES;
    if (tabConfig.category === 'type_action_template') return FOUR_M_TYPES;
    return [];
  };


  const mappedSkillsIndex = useMemo(() => {
    const categories = [
      'machine_skill_requirement',
      'operator_skill_map',
      'method_skill_map',
      'material_skill_map',
    ];
    const index = {};
    categories.forEach((category) => {
      index[category] = {};
      // You can add logic here to populate index if needed
    });
    return index;
  }, [allMasters]);

  // Permission fallback UI (moved out of useMemo)
  if (!canRead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-200">You do not have permission to view this section. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const shouldShowMappedSkills =
    activeConfig.category === 'machine' ||
    activeConfig.category === 'operator' ||
    activeConfig.category === 'change_subtype';

  const getMappedSkillsForItem = useCallback(
    (item) => {
      if (activeConfig.category === 'machine') {
        return mappedSkillsIndex.machine_skill_requirement[item.name] || [];
      }
      if (activeConfig.category === 'operator') {
        return mappedSkillsIndex.operator_skill_map[item.name] || [];
      }
      if (activeConfig.category === 'change_subtype' && item.type === 'Method') {
        return mappedSkillsIndex.method_skill_map[item.name] || [];
      }
      if (activeConfig.category === 'change_subtype' && item.type === 'Material') {
        return mappedSkillsIndex.material_skill_map[item.name] || [];
      }
      return [];
    },
    [activeConfig.category, mappedSkillsIndex]
  );

  const currentRows = useMemo(() => {
    if (activeConfig.category === 'operator_skill_map') {
      // Use operatorSkillMaps directly for this tab
      return operatorSkillMaps
        .filter((row) => (statusFilter === 'All' ? true : row.status === statusFilter))
        .filter((row) => (typeFilter === 'All' ? true : (row.operator || '') === typeFilter))
        .filter((row) => {
          if (!searchTerm.trim()) return true;
          const query = searchTerm.toLowerCase();
          return (row.skill || '').toLowerCase().includes(query) || (row.operator || '').toLowerCase().includes(query);
        });
    }
    return allMasters
      .filter((row) => row.category === activeConfig.category)
      .filter((row) => (statusFilter === 'All' ? true : row.status === statusFilter))
      .filter((row) => (typeFilter === 'All' ? true : (row.type || '') === typeFilter))
      .filter((row) => {
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        return row.name.toLowerCase().includes(query) || (row.type || '').toLowerCase().includes(query);
      });
  }, [allMasters, operatorSkillMaps, activeConfig, statusFilter, typeFilter, searchTerm]);

  const availableTypeFilters = useMemo(() => {
    if (!activeConfig.needsType) return [];
    const unique = Array.from(
      new Set(
        allMasters
          .filter((row) => row.category === activeConfig.category)
          .map((row) => row.type)
          .filter(Boolean)
      )
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [allMasters, activeConfig]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    setTypeFilter('All');
  }, [activeTab]);

  useEffect(() => {
    setQuickSubtypeName('');
  }, [activeTab]);

  const categorySummary = useMemo(() => {
    const rows = allMasters.filter((row) => row.category === activeConfig.category);
    return {
      total: rows.length,
      active: rows.filter((row) => row.status === 'Active').length,
      inactive: rows.filter((row) => row.status === 'Inactive').length,
    };
  }, [allMasters, activeConfig]);

  const selectedSummary = useMemo(() => {
    const selectedRows = allMasters.filter((row) => selectedIds.includes(row.id));
    return {
      total: selectedRows.length,
      active: selectedRows.filter((row) => row.status === 'Active').length,
      inactive: selectedRows.filter((row) => row.status === 'Inactive').length,
    };
  }, [allMasters, selectedIds]);

  const createMaster = async (payload) => {
    if (!canManageMasters) {
      showError('You do not have permission to update master data');
      return;
    }

    const names = parseBulkNames(payload.name);
    if (names.length === 0) {
      showError('Name is required');
      return;
    }
    if (activeConfig.needsType && !payload.type) {
      showError(`${activeConfig.typeLabel || 'Type'} is required`);
      return;
    }


    try {
      setSaving(true);
      const results = await Promise.allSettled(
        names.map((name) =>
          (() => {
            switch (activeConfig.category) {
              case 'department':
                return departmentService.create({ name, status: payload.status || 'Active' });
              case 'production_line':
                return productionLineService.create({ name, status: payload.status || 'Active' });
              case 'machine':
                return machineService.create({ name, status: payload.status || 'Active' });
              case 'change_subtype':
                return changeSubTypeService.create({ type: payload.type, name, status: payload.status || 'Active' });
              case 'operator':
                return operatorService.create({ name, status: payload.status || 'Active' });
              case 'skill':
                return skillService.create({ name, status: payload.status || 'Active' });
              case 'operator_skill_map':
                return operatorSkillMapService.create({ operator: payload.type, skill: name, status: payload.status || 'Active' });
              case 'machine_skill_requirement':
                return machineSkillRequirementService.create({ machine: payload.type, skill: name, status: payload.status || 'Active' });
              case 'training_program':
                return trainingProgramService.create({ skill: payload.type, name, status: payload.status || 'Active' });
              case 'type_requirement':
                return typeRequirementService.create({ type: payload.type, name, status: payload.status || 'Active' });
              case 'type_action_template':
                return typeActionTemplateService.create({ type: payload.type, name, status: payload.status || 'Active' });
              default:
                return Promise.reject(new Error('Unknown master type'));
            }
          })()
        )
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results
        .map((result, idx) => {
          if (result.status === 'rejected') {
            let msg = 'Unknown error';
            if (result.reason?.response?.data?.message) {
              msg = result.reason.response.data.message;
            } else if (result.reason?.message) {
              msg = result.reason.message;
            }
            return { name: names[idx], error: msg };
          }
          return null;
        })
        .filter(Boolean);

      if (successCount > 0) {
        showSuccess(`${successCount} entr${successCount > 1 ? 'ies' : 'y'} added${failed.length > 0 ? `, ${failed.length} skipped` : ''}`);
        if (failed.length > 0) {
          showError(
            failed.map(f => `${f.name}: ${f.error}`).join('\n')
          );
        }
        window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT));
      } else {
        showError(
          failed.length > 0
            ? failed.map(f => `${f.name}: ${f.error}`).join('\n')
            : 'All entries failed (maybe already exists)'
        );
      }

      setForms((prev) => ({
        ...prev,
        [activeConfig.key]: {
          name: '',
          type: activeConfig.category === 'change_subtype' ? 'Man' : '',
          status: 'Active',
        },
      }));
      if (successCount > 0) {
        fetchMasters();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const updateMaster = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      showError('Name is required');
      return;
    }
    if (activeConfig.needsType && !editing.type) {
      showError(`${activeConfig.typeLabel || 'Type'} is required`);
      return;
    }

    try {
      setSaving(true);
      // Use correct service for each master type
      switch (activeConfig.category) {
        case 'department':
          await departmentService.update(editing.id, { name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'production_line':
          await productionLineService.update(editing.id, { name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'machine':
          await machineService.update(editing.id, { name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'change_subtype':
          await changeSubTypeService.update(editing.id, { type: editing.type, name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'operator':
          await operatorService.update(editing.id, { name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'skill':
          await skillService.update(editing.id, { name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'operator_skill_map':
          await operatorSkillMapService.update(editing.id, { operator: editing.type, skill: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'machine_skill_requirement':
          await machineSkillRequirementService.update(editing.id, { machine: editing.type, skill: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'training_program':
          await trainingProgramService.update(editing.id, { skill: editing.type, name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'type_requirement':
          await typeRequirementService.update(editing.id, { type: editing.type, name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        case 'type_action_template':
          await typeActionTemplateService.update(editing.id, { type: editing.type, name: editing.name.trim(), status: editing.status || 'Active' });
          break;
        default:
          throw new Error('Unknown master type');
      }
      showSuccess('Master entry updated');
      window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT));
      setEditing(null);
      fetchMasters();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update entry');
    } finally {
      setSaving(false);
    }
  };

  const removeMaster = async (id) => {
    if (!canManageMasters) {
      showError('You do not have permission to delete master data');
      return;
    }

    try {
      setSaving(true);
      // Use correct service for each master type
      switch (activeConfig.category) {
        case 'department':
          await departmentService.delete(id);
          break;
        case 'production_line':
          await productionLineService.delete(id);
          break;
        case 'machine':
          await machineService.delete(id);
          break;
        case 'change_subtype':
          await changeSubTypeService.delete(id);
          break;
        case 'operator':
          await operatorService.delete(id);
          break;
        case 'skill':
          await skillService.delete(id);
          break;
        case 'operator_skill_map':
          await operatorSkillMapService.delete(id);
          break;
        case 'machine_skill_requirement':
          await machineSkillRequirementService.delete(id);
          break;
        case 'training_program':
          await trainingProgramService.delete(id);
          break;
        case 'type_requirement':
          await typeRequirementService.delete(id);
          break;
        case 'type_action_template':
          await typeActionTemplateService.delete(id);
          break;
        default:
          throw new Error('Unknown master type');
      }
      showSuccess('Master entry deleted');
      window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT));
      fetchMasters();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete entry');
    } finally {
      setSaving(false);
    }
  };

  const toggleMasterStatus = async (item) => {
    if (!canManageMasters) {
      showError('You do not have permission to update master data');
      return;
    }

    try {
      setSaving(true);
      const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      // Use correct service for each master type
      switch (activeConfig.category) {
        case 'department':
          await departmentService.update(item.id, { name: item.name, status: nextStatus });
          break;
        case 'production_line':
          await productionLineService.update(item.id, { name: item.name, status: nextStatus });
          break;
        case 'machine':
          await machineService.update(item.id, { name: item.name, status: nextStatus });
          break;
        case 'change_subtype':
          await changeSubTypeService.update(item.id, { type: item.type, name: item.name, status: nextStatus });
          break;
        case 'operator':
          await operatorService.update(item.id, { name: item.name, status: nextStatus });
          break;
        case 'skill':
          await skillService.update(item.id, { name: item.name, status: nextStatus });
          break;
        case 'operator_skill_map':
          await operatorSkillMapService.update(item.id, { operator: item.type, skill: item.name, status: nextStatus });
          break;
        case 'machine_skill_requirement':
          await machineSkillRequirementService.update(item.id, { machine: item.type, skill: item.name, status: nextStatus });
          break;
        case 'training_program':
          await trainingProgramService.update(item.id, { skill: item.type, name: item.name, status: nextStatus });
          break;
        case 'type_requirement':
          await typeRequirementService.update(item.id, { type: item.type, name: item.name, status: nextStatus });
          break;
        case 'type_action_template':
          await typeActionTemplateService.update(item.id, { type: item.type, name: item.name, status: nextStatus });
          break;
        default:
          throw new Error('Unknown master type');
      }
      showSuccess(`Entry marked as ${nextStatus}`);
      window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT));
      fetchMasters();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const toggleSelectAllVisible = () => {
    if (currentRows.length === 0) return;
    const visibleIds = currentRows.map((row) => row.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const selectVisibleByStatus = (status) => {
    const targetIds = currentRows.filter((row) => row.status === status).map((row) => row.id);
    if (targetIds.length === 0) {
      showError(`No ${status} entries in current view`);
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...targetIds])));
  };

  const bulkUpdateStatus = async (targetStatus) => {
    if (!canManageMasters) {
      showError('You do not have permission to update master data');
      return;
    }
    if (selectedIds.length === 0) {
      showError('Please select at least one entry');
      return;
    }

    const selectedRows = allMasters.filter((row) => selectedIds.includes(row.id));
    const rowsToUpdate = selectedRows.filter((row) => row.status !== targetStatus);
    if (rowsToUpdate.length === 0) {
      showError(`All selected entries are already ${targetStatus}`);
      return;
    }

    try {
      setSaving(true);
      // Bulk update using correct service for each master type
      await Promise.all(
        rowsToUpdate.map((row) => {
          switch (row.category) {
            case 'department':
              return departmentService.update(row.id, { name: row.name, status: targetStatus });
            case 'production_line':
              return productionLineService.update(row.id, { name: row.name, status: targetStatus });
            case 'machine':
              return machineService.update(row.id, { name: row.name, status: targetStatus });
            case 'change_subtype':
              return changeSubTypeService.update(row.id, { type: row.type, name: row.name, status: targetStatus });
            case 'operator':
              return operatorService.update(row.id, { name: row.name, status: targetStatus });
            case 'skill':
              return skillService.update(row.id, { name: row.name, status: targetStatus });
            case 'operator_skill_map':
              return operatorSkillMapService.update(row.id, { operator: row.type, skill: row.name, status: targetStatus });
            case 'machine_skill_requirement':
              return machineSkillRequirementService.update(row.id, { machine: row.type, skill: row.name, status: targetStatus });
            case 'training_program':
              return trainingProgramService.update(row.id, { skill: row.type, name: row.name, status: targetStatus });
            case 'type_requirement':
              return typeRequirementService.update(row.id, { type: row.type, name: row.name, status: targetStatus });
            case 'type_action_template':
              return typeActionTemplateService.update(row.id, { type: row.type, name: row.name, status: targetStatus });
            default:
              return Promise.resolve();
          }
        })
      );
      showSuccess(`${rowsToUpdate.length} entries marked as ${targetStatus}`);
      window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT));
      setSelectedIds([]);
      fetchMasters();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to bulk update status');
    } finally {
      setSaving(false);
    }
  };

  const getMappingParentType = useCallback((category) => {
    if (category === 'method_skill_map') return 'Method';
    if (category === 'material_skill_map') return 'Material';
    return null;
  }, []);

  const addSubtypeForMapping = async () => {
    if (!canManageMasters) {
      showError('You do not have permission to update master data');
      return;
    }

    const parentType = getMappingParentType(activeConfig.category);
    if (!parentType) return;

    const names = parseBulkNames(quickSubtypeName);
    if (names.length === 0) {
      showError('Subtype name is required');
      return;
    }

    try {
      setSaving(true);
      const results = await Promise.allSettled(
        names.map((name) =>
          changeSubTypeService.create({ type: parentType, name, status: 'Active' })
        )
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      if (successCount === 0) {
        showError('Subtype already exists or could not be created');
        return;
      }

      const createdSubtype = names[names.length - 1];
      setForms((prev) => ({
        ...prev,
        [activeConfig.key]: {
          ...(prev[activeConfig.key] || {}),
          type: createdSubtype,
        },
      }));
      setQuickSubtypeName('');
      window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT));
      await fetchMasters();

      showSuccess(
        `${successCount} subtype${successCount > 1 ? 's' : ''} added for ${parentType}${
          failedCount > 0 ? `, ${failedCount} skipped` : ''
        }`
      );
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to add subtype');
    } finally {
      setSaving(false);
    }
  };

  const allVisibleSelected = currentRows.length > 0 && currentRows.every((row) => selectedIds.includes(row.id));

  const tabForm = forms[activeConfig.key] || { name: '', type: '' };
  const typeOptions = getTypeOptions(activeConfig);
  const isMethodOrMaterialSkillTab =
    activeConfig.category === 'method_skill_map' || activeConfig.category === 'material_skill_map';
  const quickSubtypeLabel = activeConfig.category === 'method_skill_map' ? 'Method Subtype' : 'Material Subtype';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">Masters Page</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Manage all master catalogs with full CRUD, search, and Active/Inactive lifecycle control.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{categorySummary.total}</p>
          </div>
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-900/20 p-4">
            <p className="text-xs uppercase tracking-wide text-green-700 dark:text-green-300">Active</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{categorySummary.active}</p>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Inactive</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{categorySummary.inactive}</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">4M Guided Setup</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Step-by-step guided flow is now available on a dedicated page.</p>
            </div>
            <Link to="/guided-setup" className="btn-primary">
              Open Guided Setup
            </Link>
          </div>
        </div>

              <div className="card">
                {/* Info box for Skill & Mapping Masters guidance */}
                {[
                  'Operator Skills',
                  'Machine Skill Matrix',
                  'Method Skill Matrix',
                  'Material Skill Matrix',
                  'Training Programs',
                ].includes(activeConfig.key) && (
                  <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                    <strong>How to use:</strong> <br />
                    <ul className="list-disc pl-5 mt-1">
                      <li>
                        <span className="font-medium">Add new skills only in <span className="underline">Core Masters &rarr; Skills</span>.</span>
                      </li>
                      <li>
                        <span className="font-medium">Here, you can <span className="underline">assign or map</span> existing skills to operators, machines, methods, materials, or training programs.</span>
                      </li>
                      <li>
                        <span className="font-medium">If a skill is missing from the list, add it first in <span className="underline">Skills</span> and then return here to map it.</span>
                      </li>
                    </ul>
                  </div>
                )}
          {!(canCreate && canUpdate && canDelete) && (
            <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              {canRead && !(canCreate || canUpdate || canDelete)
                ? 'You have read-only access to master data.'
                : `Your permissions: ${[
                    canCreate ? 'Create' : null,
                    canUpdate ? 'Update' : null,
                    canDelete ? 'Delete' : null,
                  ].filter(Boolean).join(', ') || 'None'}`}
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-4">
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Master Navigator</h3>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 mb-1">Core Masters</div>
                  {MASTER_TABS.filter(tab => [
                    'Departments', 'Production Lines', 'Machines', 'Operators', 'Skills', 'Risk Levels', 'Change Subtypes'
                  ].includes(tab.key)).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.key}
                    </button>
                  ))}

                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-4 mb-1">Skill & Mapping Masters</div>
                  {MASTER_TABS.filter(tab => [
                    'Operator Skills', 'Machine Skill Matrix', 'Method Skill Matrix', 'Material Skill Matrix', 'Training Programs'
                  ].includes(tab.key)).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm pl-6 ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.key}
                    </button>
                  ))}

                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-4 mb-1">Governance Masters</div>
                  {MASTER_TABS.filter(tab => [
                    'Type Requirements', 'Type Action Templates'
                  ].includes(tab.key)).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm pl-6 ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.key}
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                  <p>Total: {categorySummary.total}</p>
                  <p>Active: {categorySummary.active}</p>
                  <p>Inactive: {categorySummary.inactive}</p>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-9">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">{activeConfig.key}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {TAB_HINTS[activeConfig.category] || 'Manage entries for this master category.'}
                </p>
                
                <Modal isOpen={addModalOpen} title={`Add Entry - ${activeConfig.key}`} onClose={() => setAddModalOpen(false)}>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      createMaster(tabForm);
                      setAddModalOpen(false);
                    }}
                    className="space-y-4"
                  >
                    {activeConfig.needsType && (
                      <select
                        value={tabForm.type}
                        onChange={(e) => setForms((prev) => ({ ...prev, [activeConfig.key]: { ...tabForm, type: e.target.value } }))}
                        className="input-field dark:bg-gray-800 dark:text-gray-200"
                        required
                      >
                        <option value="">Select {activeConfig.typeLabel || 'Type'}</option>
                        {typeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    {/* Use MultiSelectDropdown for skills in mapping masters, except Method/Material Skill Matrix which use textarea */}
                    {[
                      'Operator Skills',
                      'Machine Skill Matrix',
                      'Training Programs',
                    ].includes(activeConfig.key) ? (
                      <MultiSelectDropdown
                        options={skills}
                        selected={tabForm.name ? tabForm.name.split(',').map(s => s.trim()).filter(Boolean) : []}
                        onChange={arr => setForms((prev) => ({ ...prev, [activeConfig.key]: { ...tabForm, name: arr.join(', ') } }))}
                        placeholder="Select skill(s)"
                      />
                    ) : (
                      <textarea
                        value={tabForm.name}
                        onChange={(e) => setForms((prev) => ({ ...prev, [activeConfig.key]: { ...tabForm, name: e.target.value } }))}
                        className="input-field dark:bg-gray-800 dark:text-gray-200"
                        placeholder={activeConfig.placeholder}
                        rows={2}
                        required
                      />
                    )}
                    <select
                      value={tabForm.status || 'Active'}
                      onChange={(e) => setForms((prev) => ({ ...prev, [activeConfig.key]: { ...tabForm, status: e.target.value } }))}
                      className="input-field dark:bg-gray-800 dark:text-gray-200"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button type="button" className="btn-secondary" onClick={() => setAddModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" disabled={saving}>
                        Add
                      </button>
                    </div>
                  </form>
                </Modal>

                {isMethodOrMaterialSkillTab && (
                  <div className="mt-3 grid md:grid-cols-4 gap-2">
                    <input
                      value={quickSubtypeName}
                      onChange={(e) => setQuickSubtypeName(e.target.value)}
                      className="input-field dark:bg-gray-800 dark:text-gray-200 md:col-span-3"
                      placeholder={`Quick add ${quickSubtypeLabel} (comma/new line supported)`}
                    />
                    <button
                      type="button"
                      className="btn-secondary disabled:opacity-60"
                      onClick={addSubtypeForMapping}
                      disabled={!canManageMasters || saving}
                    >
                      Add {quickSubtypeLabel}
                    </button>
                  </div>
                )}
                
              </div>

              <div className="mb-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 min-w-0 max-w-[180px] flex-shrink"
                  placeholder="Search by name or type"
                  style={{ width: '160px' }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 min-w-0 max-w-[130px] flex-shrink"
                  style={{ width: '120px' }}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {activeConfig.needsType && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="input-field dark:bg-gray-800 dark:text-gray-200 min-w-0 max-w-[150px] flex-shrink"
                    style={{ width: '130px' }}
                  >
                    <option value="All">All {activeConfig.typeLabel || 'Types'}</option>
                    {availableTypeFilters.map((typeValue) => (
                      <option key={typeValue} value={typeValue}>
                        {typeValue}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  className="btn-secondary flex-shrink-0"
                  style={{ minWidth: '100px' }}
                  onClick={() => { setSearchTerm(''); setStatusFilter('All'); setTypeFilter('All'); }}
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  className="btn-primary disabled:opacity-60 flex-shrink-0"
                  style={{ minWidth: '100px' }}
                  onClick={() => setAddModalOpen(true)}
                  disabled={!canCreate}
                >
                  Add Entry
                </button>
              </div>

              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Showing {currentRows.length} of {categorySummary.total} entries
                {statusFilter !== 'All' ? ` | Status: ${statusFilter}` : ''}
                {typeFilter !== 'All' ? ` | Type: ${typeFilter}` : ''}
              </p>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary disabled:opacity-60"
                  onClick={toggleSelectAllVisible}
                  disabled={currentRows.length === 0}
                >
                  {allVisibleSelected ? 'Unselect Visible' : 'Select Visible'}
                </button>
                <button
                  type="button"
                  className="btn-secondary disabled:opacity-60"
                  onClick={() => selectVisibleByStatus('Active')}
                  disabled={currentRows.length === 0}
                >
                  Select Active
                </button>
                <button
                  type="button"
                  className="btn-secondary disabled:opacity-60"
                  onClick={() => selectVisibleByStatus('Inactive')}
                  disabled={currentRows.length === 0}
                >
                  Select Inactive
                </button>
                <button
                  type="button"
                  className="btn-primary disabled:opacity-60"
                  onClick={() => bulkUpdateStatus('Active')}
                  disabled={!canUpdate || saving || selectedIds.length === 0}
                >
                  Activate Selected
                </button>
                <button
                  type="button"
                  className="btn-danger disabled:opacity-60"
                  onClick={() => bulkUpdateStatus('Inactive')}
                  disabled={!canUpdate || saving || selectedIds.length === 0}
                >
                  Deactivate Selected
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedSummary.total} | Active: {selectedSummary.active} | Inactive: {selectedSummary.inactive}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : currentRows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No entries found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            disabled={currentRows.length === 0}
                          />
                        </th>
                        {activeConfig.needsType && <th>{activeConfig.typeLabel || 'Type'}</th>}
                        <th>Name</th>
                        {shouldShowMappedSkills && <th>Mapped Skills</th>}
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* For Skill & Mapping Masters, group by (type, category) and join names */}
                      {activeConfig.category === 'operator_skill_map' ? (
                        // Group operatorSkillMaps by operator, then join skills
                        Object.entries(
                          currentRows.reduce((acc, row) => {
                            const key = row.operator || '';
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(row);
                            return acc;
                          }, {})
                        ).map(([operator, rows]) => {
                          const status = rows[0].status;
                          const id = rows.map(r => r.id).join('-');
                          return (
                            <tr key={id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={rows.every(r => selectedIds.includes(r.id))}
                                  onChange={() => rows.forEach(r => toggleSelectRow(r.id))}
                                />
                              </td>
                              <td>{operator || '-'}</td>
                              <td className="break-words max-w-[280px]">{rows.map(r => r.skill).join(', ')}</td>
                              <td className="max-w-[320px]">
                                <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                              </td>
                              <td>
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    status === 'Active'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  }`}
                                >
                                  {status || 'Active'}
                                </span>
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
                                  <button
                                    type="button"
                                    className="btn-secondary disabled:opacity-60"
                                    disabled={!canUpdate}
                                    onClick={() => setEditing({
                                      ...rows[0],
                                      name: rows.map(r => r.skill).join(', '),
                                      // For operator_skill_map: type = operator, for machine_skill_requirement: type = machine
                                      type: rows[0].operator || rows[0].machine || rows[0].type || ''
                                    })}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-danger disabled:opacity-60"
                                    disabled={!canDelete || saving}
                                    onClick={() => removeMaster(rows[0].id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : activeConfig.category === 'machine_skill_requirement' ? (
                        // Group machineSkillRequirements by machine, then join skills (show all regardless of typeFilter)
                        Object.entries(
                          allMasters
                            .filter(row => row.category === 'machine_skill_requirement')
                            .reduce((acc, row) => {
                              const key = row.type || row.machine || '';
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(row);
                              return acc;
                            }, {})
                        ).map(([machine, rows]) => {
                          const status = rows[0].status;
                          const id = rows.map(r => r.id).join('-');
                          return (
                            <tr key={id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={rows.every(r => selectedIds.includes(r.id))}
                                  onChange={() => rows.forEach(r => toggleSelectRow(r.id))}
                                />
                              </td>
                              <td>{machine || '-'}</td>
                              <td className="break-words max-w-[280px]">{rows.map(r => r.skill).join(', ')}</td>
                              <td className="max-w-[320px]">
                                <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                              </td>
                              <td>
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    status === 'Active'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  }`}
                                >
                                  {status || 'Active'}
                                </span>
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
                                  <button
                                    type="button"
                                    className="btn-secondary disabled:opacity-60"
                                    disabled={!canUpdate}
                                    onClick={() => setEditing({ ...rows[0] })}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-danger disabled:opacity-60"
                                    disabled={!canDelete || saving}
                                    onClick={() => removeMaster(rows[0].id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        currentRows.map((item) => {
                          const mappedSkills = getMappedSkillsForItem(item);
                          return (
                            <tr key={item.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(item.id)}
                                  onChange={() => toggleSelectRow(item.id)}
                                />
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
                                        <span
                                          key={`${item.id}-${skill}`}
                                          className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              )}
                              <td>
                                <span
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    item.status === 'Active'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  }`}
                                >
                                  {item.status || 'Active'}
                                </span>
                              </td>
                              <td>
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    className="btn-secondary disabled:opacity-60"
                                    disabled={!canUpdate || saving}
                                    onClick={() => toggleMasterStatus(item)}
                                  >
                                    {item.status === 'Active' ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary disabled:opacity-60"
                                    disabled={!canUpdate}
                                    onClick={() => setEditing({ ...item })}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-danger disabled:opacity-60"
                                    disabled={!canDelete || saving}
                                    onClick={() => removeMaster(item.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <Modal isOpen={!!editing} title={`Edit Entry - ${activeConfig.key}`} onClose={() => setEditing(null)}>
                {editing && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      updateMaster();
                    }}
                    className="space-y-4"
                  >
                    {activeConfig.needsType && (
                      <select
                        value={editing.type || ''}
                        onChange={(e) => setEditing((prev) => ({ ...prev, type: e.target.value }))}
                        className="input-field dark:bg-gray-800 dark:text-gray-200"
                        required
                      >
                        <option value="">Select {activeConfig.typeLabel || 'Type'}</option>
                        {typeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    {/* Use MultiSelectDropdown for skills in mapping masters, except Method/Material Skill Matrix which use input */}
                    {[
                      'Operator Skills',
                      'Machine Skill Matrix',
                      'Training Programs',
                    ].includes(activeConfig.key) ? (
                      <MultiSelectDropdown
                        options={skills}
                        selected={editing.name ? editing.name.split(',').map(s => s.trim()).filter(Boolean) : []}
                        onChange={arr => setEditing((prev) => ({ ...prev, name: arr.join(', ') }))}
                        placeholder="Select skill(s)"
                      />
                    ) : (
                      <input
                        value={editing.name}
                        onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
                        className="input-field dark:bg-gray-800 dark:text-gray-200"
                        required
                      />
                    )}
                    <select
                      value={editing.status || 'Active'}
                      onChange={(e) => setEditing((prev) => ({ ...prev, status: e.target.value }))}
                      className="input-field dark:bg-gray-800 dark:text-gray-200"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" disabled={!canManageMasters || saving}>
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </Modal>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MastersPage;
