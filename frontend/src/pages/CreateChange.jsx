import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeRequestService, fileService, masterService, riskLevelService } from '../services/api';
import { showError, showSuccess } from '../utils/helpers';
import FormInput from '../components/FormInput';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FOUR_M_TYPES, getSubCategoriesByType } from '../utils/changeCategories';

const IMPACT_LEVELS = ['Low', 'Medium', 'High'];


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
  const [manAssessment, setManAssessment] = useState({
    requiredSkills: [],
    operatorSkills: [],
    missingSkills: [],
    recommendedTrainings: [],
  });
  const [typeGovernance, setTypeGovernance] = useState({ requirements: [], actionTemplates: [] });
  const navigate = useNavigate();


  // Load masters and risk levels
  const loadMasters = useCallback(async () => {
    try {
      const response = await masterService.getMasters({ status: 'Active' });
      const rows = response.data.data || [];

      const departments = rows.filter((r) => r.category === 'department').map((r) => r.name);
      const productionLines = rows.filter((r) => r.category === 'production_line').map((r) => r.name);
      const machines = rows.filter((r) => r.category === 'machine').map((r) => r.name);
      const subtypes = rows.filter((r) => r.category === 'change_subtype');
      const operators = rows.filter((r) => r.category === 'operator').map((r) => r.name);
      const skills = rows.filter((r) => r.category === 'skill').map((r) => r.name);
      const operatorSkillRows = rows.filter((r) => r.category === 'operator_skill_map');
      const machineSkillRows = rows.filter((r) => r.category === 'machine_skill_requirement');
      const trainingRows = rows.filter((r) => r.category === 'training_program');
      const typeRequirementRows = rows.filter((r) => r.category === 'type_requirement');
      const typeActionRows = rows.filter((r) => r.category === 'type_action_template');

      const grouped = subtypes.reduce((acc, item) => {
        const key = item.type || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.name);
        return acc;
      }, {});

      const groupedOperatorSkills = operatorSkillRows.reduce((acc, item) => {
        const key = item.type || 'Unknown Operator';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.name);
        return acc;
      }, {});

      const groupedMachineSkills = machineSkillRows.reduce((acc, item) => {
        const key = item.type || 'Unknown Machine';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.name);
        return acc;
      }, {});

      const groupedTraining = trainingRows.reduce((acc, item) => {
        const key = item.type || 'General';
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
    } catch (error) {
      // Keep fallback options when master API is unavailable.
    }
    // Fetch risk levels from backend
    try {
      const res = await riskLevelService.getAll();
      const levels = (res.data?.data || []).filter(l => l.status === 'Active').map(l => l.name);
      if (levels.length > 0) setRiskOptions(levels);
    } catch (e) {
      // fallback: do nothing
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Operator</label>
                    <select name="current_operator" value={formData.current_operator} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                      <option value="">Select current operator</option>
                      {operatorOptions.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proposed Operator</label>
                    <select name="proposed_operator" value={formData.proposed_operator} onChange={handleChange} className="input-field dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                      <option value="">Select proposed operator</option>
                      {operatorOptions.map((op) => (
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
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Section 3 - Old vs New</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Old Value" name="old_value" value={formData.old_value} onChange={handleChange} required />
              <FormInput label="New Value" name="new_value" value={formData.new_value} onChange={handleChange} required />
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
                    <li key={idx}>✓ {file.name}</li>
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

  // Navigation controls
  const isLastStep = step === steps.length - 1;
  const isFirstStep = step === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-4">
            Create Change Request
            <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={handleRefreshMasters} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh Masters'}
            </button>
          </h1>
          {/* Progress indicator */}
          <div className="flex items-center mb-6">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${step === idx ? 'bg-blue-600' : 'bg-gray-400'}`}>{idx + 1}</div>
                {idx < steps.length - 1 && <div className={`h-1 w-8 ${step > idx ? 'bg-blue-600' : 'bg-gray-300'}`}></div>}
              </div>
            ))}
          </div>
          <form onSubmit={isLastStep ? handleSubmit : e => { e.preventDefault(); setStep(step + 1); }} className="card space-y-6">
            {renderSection()}
            <div className="flex gap-4 pt-6">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Previous
                </button>
              )}
              <button
                type="button"
                onClick={saveDraft}
                className="btn-secondary flex-1 disabled:opacity-50"
                disabled={loading}
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="btn-secondary flex-1 disabled:opacity-50"
                disabled={loading}
              >
                Clear Draft
              </button>
              {!isLastStep && (
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  Next
                </button>
              )}
              {isLastStep && (
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/changes')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateChange;
