import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeRequestService, fileService, departmentService, productionLineService, machineService, changeSubTypeService, operatorService, skillService, operatorSkillMapService, machineSkillRequirementService, trainingProgramService, typeRequirementService, typeActionTemplateService, riskLevelService, businessRoleService } from '../services/api';
import { showError, showSuccess } from '../utils/helpers';
import FormInput from '../components/FormInput';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FOUR_M_TYPES, getSubCategoriesByType } from '../utils/changeCategories';

const IMPACT_LEVELS = ['Low', 'Medium', 'High'];

const STEP_GUIDE = [
  {
    title: 'Basic Information',
    description: 'Request number, department, production line, machine, and change type.',
  },
  {
    title: 'Change Details',
    description: 'Title, description, reason, and risk level.',
  },
  {
    title: 'Skill/Training or Governance',
    description: 'Man flow uses skill analysis; other flows show governance requirements.',
  },
  {
    title: 'Old vs New',
    description: 'Define the current value and proposed value.',
  },
  {
    title: 'Impact Analysis',
    description: 'Capture quality, cost, delivery, and safety impact.',
  },
  {
    title: 'Attachments',
    description: 'Upload supporting files like SOPs, photos, or reports.',
  },
  {
    title: 'Preview & Submit',
    description: 'Review every field before final submission.',
  },
];


const CreateChange = () => {
  const generatedRequestNo = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `CR-${y}${m}${d}-${h}${min}`;
  }, []);

  const [formData, setFormData] = useState({
    request_no: generatedRequestNo,
    request_date: new Date().toISOString().slice(0, 10),
    production_line: '',
    machine: '',
    type: 'Man',
    sub_type: getSubCategoriesByType('Man')[0] || '',
    current_operator: '',
    proposed_operator: '',
    required_skills: '',
    proposed_operator_skill_status: '',
    training_required: false,
    training_status: 'Not Required',
    training_notes: '',
    compliance_requirements: '',
    action_plan_required: false,
    action_plan_notes: '',
    title: '',
    description: '',
    old_value: '',
    new_value: '',
    reason: '',
    quality_impact: 'Low',
    cost_impact: 'Low',
    delivery_impact: 'Low',
    safety_impact: 'Low',
    risk_level: 'Low',
    department: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState(['Production', 'Quality', 'Maintenance']);
  const [productionLineOptions, setProductionLineOptions] = useState([]);
  const [machineOptions, setMachineOptions] = useState(['MCH-1001', 'MCH-1002']);
  const [riskOptions, setRiskOptions] = useState([]);
  const [subtypeOptions, setSubtypeOptions] = useState({});
  const [operatorOptions, setOperatorOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [operatorSkillMap, setOperatorSkillMap] = useState({});
  const [machineSkillMatrix, setMachineSkillMatrix] = useState({});
  const [trainingPrograms, setTrainingPrograms] = useState({});
  const [typeRequirementsMap, setTypeRequirementsMap] = useState({});
  const [typeActionTemplateMap, setTypeActionTemplateMap] = useState({});
  const [businessRolesByType, setBusinessRolesByType] = useState({});
  const [manAssessment, setManAssessment] = useState({
    requiredSkills: [],
    operatorSkills: [],
    missingSkills: [],
    recommendedTrainings: [],
  });
  const [typeGovernance, setTypeGovernance] = useState({ requirements: [], actionTemplates: [] });
  const navigate = useNavigate();

  const businessRoleOptions = useMemo(() => {
    const moduleRoles = businessRolesByType[formData.type] || [];
    const names = moduleRoles.map((item) => item.role_name).filter(Boolean);
    if (names.length > 0) return names;
    return formData.type === 'Man' ? operatorOptions : [];
  }, [businessRolesByType, formData.type, operatorOptions]);


  // Load masters and risk levels
  const loadMasters = useCallback(async () => {
    try {
      const [departmentsRes, productionLinesRes, machinesRes, subtypesRes, operatorsRes, skillsRes, operatorSkillMapsRes, machineSkillRequirementsRes, trainingProgramsRes, typeRequirementsRes, typeActionTemplatesRes, riskLevelsRes, businessRolesRes] = await Promise.all([
        departmentService.getAll(),
        productionLineService.getAll(),
        machineService.getAll(),
        changeSubTypeService.getAll(),
        operatorService.getAll(),
        skillService.getAll(),
        operatorSkillMapService.getAll(),
        machineSkillRequirementService.getAll(),
        trainingProgramService.getAll(),
        typeRequirementService.getAll(),
        typeActionTemplateService.getAll(),
        riskLevelService.getAll(),
        businessRoleService.getAll({ status: 'Active' }),
      ]);
      const departments = (departmentsRes.data.data || []).map((r) => r.name);
      const productionLines = (productionLinesRes.data.data || []).map((r) => r.name);
      const machines = (machinesRes.data.data || []).map((r) => r.name);
      const subtypes = subtypesRes.data.data || [];
      const operators = (operatorsRes.data.data || []).map((r) => r.name);
      const skills = (skillsRes.data.data || []).map((r) => r.name);
      const operatorSkillRows = operatorSkillMapsRes.data.data || [];
      const machineSkillRows = machineSkillRequirementsRes.data.data || [];
      const trainingRows = trainingProgramsRes.data.data || [];
      const typeRequirementRows = typeRequirementsRes.data.data || [];
      const typeActionRows = typeActionTemplatesRes.data.data || [];
      const riskLevels = (riskLevelsRes.data.data || []).filter(l => l.status === 'Active').map(l => l.name);
      const businessRoleRows = businessRolesRes.data.data || [];

      const grouped = subtypes.reduce((acc, item) => {
        const key = item.type || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.name);
        return acc;
      }, {});

      const groupedOperatorSkills = operatorSkillRows.reduce((acc, item) => {
        const key = item.operator || 'Unknown Operator';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.skill);
        return acc;
      }, {});

      const groupedMachineSkills = machineSkillRows.reduce((acc, item) => {
        const key = item.machine || 'Unknown Machine';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.skill);
        return acc;
      }, {});

      const groupedTraining = trainingRows.reduce((acc, item) => {
        const key = item.skill || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.name);
        return acc;
      }, {});

      const groupedTypeRequirements = typeRequirementRows.reduce((acc, item) => {
        const key = item.type || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.name);
        return acc;
      }, {});

      const groupedTypeActions = typeActionRows.reduce((acc, item) => {
        const key = item.type || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.name);
        return acc;
      }, {});

      const groupedBusinessRoles = businessRoleRows.reduce((acc, item) => {
        const key = item.m_module || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      if (departments.length > 0) setDepartmentOptions(departments);
      if (productionLines.length > 0) setProductionLineOptions(productionLines);
      if (machines.length > 0) setMachineOptions(machines);
      if (Object.keys(grouped).length > 0) setSubtypeOptions(grouped);
      if (operators.length > 0) setOperatorOptions(operators);
      if (skills.length > 0) setSkillOptions(skills);
      setOperatorSkillMap(groupedOperatorSkills);
      setMachineSkillMatrix(groupedMachineSkills);
      setTrainingPrograms(groupedTraining);
      setTypeRequirementsMap(groupedTypeRequirements);
      setTypeActionTemplateMap(groupedTypeActions);
      setBusinessRolesByType(groupedBusinessRoles);
      if (riskLevels.length > 0) setRiskOptions(riskLevels);
    } catch (error) {
      // Keep fallback options when master API is unavailable.
    }
  }, []);

  useEffect(() => {
    const savedDraft = localStorage.getItem('change_request_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          request_no: parsed.request_no || prev.request_no,
        }));
        showSuccess('Draft restored successfully');
      } catch (error) {
        localStorage.removeItem('change_request_draft');
      }
    }
    loadMasters();
    // Listen for masters:updated event to refresh options
    const handler = () => loadMasters();
    window.addEventListener('masters:updated', handler);
    return () => window.removeEventListener('masters:updated', handler);
  }, [loadMasters]);
  // Manual refresh button for master data
  const [refreshing, setRefreshing] = useState(false);
  const handleRefreshMasters = async () => {
    setRefreshing(true);
    await loadMasters();
    setRefreshing(false);
    showSuccess('Master data refreshed');
  };

  const computeAssessments = (nextData) => {
    const requirements = typeRequirementsMap[nextData.type] || [];
    const actionTemplates = typeActionTemplateMap[nextData.type] || [];

    let updated = {
      ...nextData,
      compliance_requirements: requirements.join(', '),
      action_plan_required: actionTemplates.length > 0,
      action_plan_notes: actionTemplates.length > 0 ? `Recommended action plan: ${actionTemplates.join(', ')}` : '',
    };

    setTypeGovernance({ requirements, actionTemplates });

    if (nextData.type !== 'Man') {
      setManAssessment({ requiredSkills: [], operatorSkills: [], missingSkills: [], recommendedTrainings: [] });
      return {
        ...updated,
        required_skills: '',
        proposed_operator_skill_status: '',
        training_required: false,
        training_status: 'Not Required',
        training_notes: '',
      };
    }

    const requiredSkills = machineSkillMatrix[nextData.machine] || [];
    const operatorSkills = operatorSkillMap[nextData.proposed_operator] || [];
    const missingSkills = requiredSkills.filter((skill) => !operatorSkills.includes(skill));
    const recommendedTrainings = missingSkills.flatMap((skill) => trainingPrograms[skill] || []);

    updated = {
      ...updated,
      required_skills: requiredSkills.join(', '),
      proposed_operator_skill_status: requiredSkills.length === 0 ? '' : missingSkills.length > 0 ? 'Gap' : 'Matched',
      training_required: missingSkills.length > 0,
      training_status: missingSkills.length > 0 ? 'Pending' : 'Not Required',
      training_notes:
        missingSkills.length > 0
          ? `Training required for missing skills: ${missingSkills.join(', ')}`
          : '',
    };

    setManAssessment({ requiredSkills, operatorSkills, missingSkills, recommendedTrainings });
    return updated;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      const nextSubTypes = subtypeOptions[value] || getSubCategoriesByType(value);
      const nextData = {
        ...formData,
        type: value,
        sub_type: nextSubTypes[0] || '',
      };
      setFormData(computeAssessments(nextData));
      return;
    }

    const nextData = { ...formData, [name]: value };
    setFormData(computeAssessments(nextData));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const saveDraft = () => {
    localStorage.setItem('change_request_draft', JSON.stringify(formData));
    showSuccess('Draft saved successfully');
  };

  const clearDraft = () => {
    localStorage.removeItem('change_request_draft');
    showSuccess('Draft cleared');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.old_value.trim() === formData.new_value.trim()) {
      showError('Old Value and New Value should be different');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (formData.request_date > today) {
      showError('Request date cannot be in the future');
      return;
    }

    setLoading(true);

    try {
      // Remove proposed_operator_skill_status if empty string
      const payload = {
        ...formData,
        description: formData.sub_type
          ? `[${formData.type} - ${formData.sub_type}] ${formData.description}`
          : formData.description,
        current_state: formData.old_value,
        proposed_change: formData.new_value,
        impact_analysis: [
          `Quality Impact: ${formData.quality_impact}`,
          `Cost Impact: ${formData.cost_impact}`,
          `Delivery Impact: ${formData.delivery_impact}`,
          `Safety Impact: ${formData.safety_impact}`,
        ].join('\n'),
      };
      if (payload.proposed_operator_skill_status === '') {
        delete payload.proposed_operator_skill_status;
      }

      const response = await changeRequestService.createChangeRequest(payload);
      const requestId = response.data.data.id;

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          await fileService.uploadFile(requestId, file);
        }
      }

      localStorage.removeItem('change_request_draft');
      showSuccess('Change request submitted successfully! Status: Pending Review');
      navigate('/changes');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create change request');
    } finally {
      setLoading(false);
    }
  };

  // Multi-step form logic
  const steps = [
    'Basic Information',
    'Change Details',
    'Skill/Training or Governance',
    'Old vs New',
    'Impact Analysis',
    'Attachments',
    'Preview & Submit',
  ];
  const [step, setStep] = useState(0);
  const currentStepMeta = STEP_GUIDE[step] || STEP_GUIDE[0];
  const isLastStep = step === steps.length - 1;
  const isFirstStep = step === 0;
  const canGoBack = !isFirstStep && !loading;
  const primaryActionLabel = isLastStep ? (loading ? 'Submitting...' : 'Submit Request') : 'Next Section';

  // Section renderers
  const renderSection = () => {
    switch (step) {
      case 0:
        return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Section 1 - Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Change Request No" name="request_no" value={formData.request_no} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="request_date"
                  value={formData.request_date}
                  onChange={handleChange}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department <span className="text-red-500">*</span></label>
                <select name="department" value={formData.department} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600" required>
                  <option value="">Select department</option>
                  {departmentOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Production Line <span className="text-red-500">*</span></label>
                <select
                  name="production_line"
                  value={formData.production_line}
                  onChange={handleChange}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                  required
                >
                  <option value="">Select production line</option>
                  {productionLineOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Machine ID <span className="text-red-500">*</span></label>
                <select name="machine" value={formData.machine} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600" required>
                  <option value="">Select machine</option>
                  {machineOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Change Type <span className="text-red-500">*</span></label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                  required
                >
                  {FOUR_M_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sub Category <span className="text-red-500">*</span></label>
                <select
                  name="sub_type"
                  value={formData.sub_type}
                  onChange={handleChange}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                  required
                >
                  {(subtypeOptions[formData.type] || getSubCategoriesByType(formData.type)).map((subType) => (
                    <option key={subType} value={subType}>{subType}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Section 2 - Change Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Change Description <span className="text-red-500">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                  rows="4"
                  required
                ></textarea>
              </div>
              <FormInput label="Reason for Change" name="reason" value={formData.reason} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Level <span className="text-red-500">*</span></label>
                <select
                  name="risk_level"
                  value={formData.risk_level}
                  onChange={handleChange}
                  className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                  required
                >
                  {riskOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <>
            {formData.type === 'Man' ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Section 2A - Operator Skill & Training Check</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Operator / Role</label>
                    <select name="current_operator" value={formData.current_operator} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                      <option value="">Select current operator or role</option>
                      {businessRoleOptions.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proposed Operator / Role</label>
                    <select name="proposed_operator" value={formData.proposed_operator} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                      <option value="">Select proposed operator or role</option>
                      {businessRoleOptions.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded dark:border-gray-700">
                    <p className="font-semibold mb-1">Machine Required Skills</p>
                    <p>{manAssessment.requiredSkills.length ? manAssessment.requiredSkills.join(', ') : 'No machine skill requirement mapped'}</p>
                  </div>
                  <div className="p-3 border rounded dark:border-gray-700">
                    <p className="font-semibold mb-1">Proposed Operator Skills</p>
                    <p>{manAssessment.operatorSkills.length ? manAssessment.operatorSkills.join(', ') : 'No operator skills mapped'}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <p className="text-sm font-semibold">
                    Skill Match Status:{' '}
                    <span className={formData.proposed_operator_skill_status === 'Gap' ? 'text-red-600' : 'text-green-600'}>
                      {formData.proposed_operator_skill_status || 'Not evaluated'}
                    </span>
                  </p>
                  {manAssessment.missingSkills.length > 0 && (
                    <p className="text-sm text-red-600 mt-1">Missing skills: {manAssessment.missingSkills.join(', ')}</p>
                  )}
                  {manAssessment.recommendedTrainings.length > 0 && (
                    <p className="text-sm text-amber-700 mt-1">Recommended training: {manAssessment.recommendedTrainings.join(', ')}</p>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Training Notes</label>
                  <textarea
                    name="training_notes"
                    value={formData.training_notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                    placeholder="If skill gap exists, training recommendation will appear automatically"
                  />
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Section 2A - Type Governance Guidance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Role (Optional)</label>
                    <select name="current_operator" value={formData.current_operator} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                      <option value="">Select current role</option>
                      {businessRoleOptions.map((roleName) => (
                        <option key={roleName} value={roleName}>{roleName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proposed Role (Optional)</label>
                    <select name="proposed_operator" value={formData.proposed_operator} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                      <option value="">Select proposed role</option>
                      {businessRoleOptions.map((roleName) => (
                        <option key={roleName} value={roleName}>{roleName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded dark:border-gray-700">
                    <p className="font-semibold mb-1">Mandatory Requirements</p>
                    <p>{typeGovernance.requirements.length ? typeGovernance.requirements.join(', ') : 'No requirements mapped for this type'}</p>
                  </div>
                  <div className="p-3 border rounded dark:border-gray-700">
                    <p className="font-semibold mb-1">Recommended Action Plan</p>
                    <p>{typeGovernance.actionTemplates.length ? typeGovernance.actionTemplates.join(', ') : 'No action templates mapped for this type'}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Plan Notes</label>
                  <textarea
                    name="action_plan_notes"
                    value={formData.action_plan_notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                    placeholder="Recommended action plan will appear automatically"
                  />
                </div>
              </div>
            )}
          </>
        );
      case 3:
        return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Section 3 - Current State vs Proposed State</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Use this section to record the existing condition or value on the left and the expected future condition or value on the right.
              This makes the change impact easy to review during approval.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Current State / Old Value"
                name="old_value"
                value={formData.old_value}
                onChange={handleChange}
                required
              />
              <FormInput
                label="Proposed State / New Value"
                name="new_value"
                value={formData.new_value}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Section 4 - Impact Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'quality_impact', label: 'Quality Impact' },
                { key: 'cost_impact', label: 'Cost Impact' },
                { key: 'delivery_impact', label: 'Delivery Impact' },
                { key: 'safety_impact', label: 'Safety Impact' },
              ].map((impact) => (
                <div key={impact.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{impact.label} <span className="text-red-500">*</span></label>
                  <select
                    name={impact.key}
                    value={formData[impact.key]}
                    onChange={handleChange}
                    className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                    required
                  >
                    {IMPACT_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Section 5 - Attachments</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Files (SOP, Machine Diagram, Trial Result, Material Certificate, Photos)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              />
              {files.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {files.map((file, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>
                      ✓ {file.name}
                      {file.type && file.type.startsWith('image/') && (
                        <div style={{ marginTop: '4px' }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      case 6:
        // Preview step
        return (
          <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-4">Preview & Submit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> <span>{String(value)}</span>
                </div>
              ))}
            </div>
            {files.length > 0 && (
              <div className="mt-4">
                <span className="font-semibold">Files:</span>
                <ul className="text-sm text-gray-600 dark:text-gray-400">
                  {files.map((file, idx) => (
                    <li key={idx}>✓ {file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="mb-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/70 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">Create Change Request</h1>
              <p className="text-gray-600 dark:text-gray-400">Structured 4M-style request form with step navigation, draft saving, and preview before submit.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-secondary" onClick={handleRefreshMasters} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh Masters'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/changes')}>
                Back to Requests
              </button>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-12 gap-4">
          <aside className="xl:col-span-3">
            <div className="xl:sticky xl:top-4 space-y-4">
              <div className="card border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Request Snapshot</h2>
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/70 px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Request No</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 break-all">{formData.request_no}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/70 px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Change Type</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{formData.type}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/70 px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Risk Level</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{formData.risk_level}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">Current Step</p>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">{currentStepMeta.title}</p>
                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">{currentStepMeta.description}</p>
                  </div>
                </div>
              </div>

              <div className="card border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Progress</h2>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Step {step + 1} of {steps.length}</span>
                  <span className="badge badge-info">{Math.round(((step + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                </div>
                <div className="space-y-2">
                  {steps.map((label, idx) => {
                    const isActive = idx === step;
                    const isDone = idx < step;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setStep(idx)}
                        className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-200'
                            : isDone
                            ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/10 dark:text-green-200'
                            : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{idx + 1}. {label}</span>
                          <span className="text-[10px] uppercase tracking-wide">{isActive ? 'Active' : isDone ? 'Done' : 'Pending'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <section className="xl:col-span-9">
            <form onSubmit={isLastStep ? handleSubmit : e => { e.preventDefault(); setStep(step + 1); }} className="card space-y-6 border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{currentStepMeta.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{currentStepMeta.description}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={saveDraft} className="btn-secondary disabled:opacity-50" disabled={loading}>
                    Save Draft
                  </button>
                  <button type="button" onClick={clearDraft} className="btn-secondary disabled:opacity-50" disabled={loading}>
                    Clear Draft
                  </button>
                </div>
              </div>

              {renderSection()}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary flex-1 min-w-[140px]"
                  disabled={!canGoBack}
                >
                  Previous
                </button>

                {!isLastStep ? (
                  <button type="submit" className="btn-primary flex-1 min-w-[160px]" disabled={loading}>
                    Next Section
                  </button>
                ) : (
                  <button type="submit" className="btn-primary flex-1 min-w-[160px]" disabled={loading}>
                    {primaryActionLabel}
                  </button>
                )}

                <button type="button" onClick={() => navigate('/changes')} className="btn-secondary flex-1 min-w-[140px]">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CreateChange;
