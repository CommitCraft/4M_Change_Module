import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { guidedSetupService, departmentService, productionLineService, machineService, changeSubTypeService, operatorService, skillService, operatorSkillMapService, machineSkillRequirementService, trainingProgramService, typeRequirementService, typeActionTemplateService } from '../services/api';
import { showError, showSuccess, showInfo, showWarning } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const FOUR_M_TYPES = [
  { id: 'Machine', label: 'Machine', badge: 'MC', color: 'blue', description: 'Equipment & Skills' },
  { id: 'Man', label: 'Man', badge: 'MN', color: 'green', description: 'Operators & Training' },
  { id: 'Method', label: 'Method', badge: 'MD', color: 'amber', description: 'Process & Requirements' },
  { id: 'Material', label: 'Material', badge: 'MT', color: 'rose', description: 'Resources & Actions' },
];

const GUIDED_FLOW_CONFIG = {
  Machine: [
    {
      id: 'machine_add',
      title: 'Add Machine',
      description: 'Register a new machine/equipment',
      category: 'machine',
      icon: '⚙️',
      fields: [{ key: 'name', label: 'Machine Name', placeholder: 'e.g. MCH-2001', type: 'text' }],
    },
    {
      id: 'skill_add',
      title: 'Add Operation Skill',
      description: 'Define required operational skills',
      category: 'skill',
      icon: '🎯',
      fields: [{ key: 'name', label: 'Skill Name', placeholder: 'e.g. CNC Setup', type: 'text' }],
    },
    {
      id: 'machine_skill_map',
      title: 'Link Machine to Skills',
      description: 'Assign required skills to the machine',
      category: 'machine_skill_requirement',
      icon: '🔗',
      fields: [
        { key: 'type', label: 'Machine', type: 'machine-select' },
        { key: 'name', label: 'Required Skills', type: 'skill-select', multi: true },
      ],
    },
    {
      id: 'training_for_skill',
      title: 'Add Training Program',
      description: 'Create training curriculum for skills',
      category: 'training_program',
      icon: '📚',
      fields: [
        { key: 'type', label: 'Skill', type: 'skill-select' },
        { key: 'name', label: 'Training Program', placeholder: 'e.g. CNC Level-1', type: 'text' },
      ],
    },
  ],
  Man: [
    {
      id: 'operator_add',
      title: 'Add Operator',
      description: 'Register a new operator/resource',
      category: 'operator',
      icon: '👤',
      fields: [{ key: 'name', label: 'Operator Name', placeholder: 'e.g. John Doe', type: 'text' }],
    },
    {
      id: 'man_skill_add',
      title: 'Add Skill',
      description: 'Define operator competencies',
      category: 'skill',
      icon: '🎯',
      fields: [{ key: 'name', label: 'Skill Name', placeholder: 'e.g. Visual Inspection', type: 'text' }],
    },
    {
      id: 'operator_skill_map',
      title: 'Assign Skills to Operator',
      description: 'Link operator capabilities',
      category: 'operator_skill_map',
      icon: '🔗',
      fields: [
        { key: 'type', label: 'Operator', type: 'operator-select' },
        { key: 'name', label: 'Skills', type: 'skill-select', multi: true },
      ],
    },
    {
      id: 'man_training',
      title: 'Add Training',
      description: 'Assign training to skills',
      category: 'training_program',
      icon: '📚',
      fields: [
        { key: 'type', label: 'Skill', type: 'skill-select' },
        { key: 'name', label: 'Training Program', placeholder: 'e.g. Inspection Refresher', type: 'text' },
      ],
    },
  ],
  Method: [
    {
      id: 'method_subtype',
      title: 'Add Method Type',
      description: 'Define process categories',
      category: 'change_subtype',
      icon: '📋',
      defaults: { type: 'Method' },
      fields: [{ key: 'name', label: 'Subtype', placeholder: 'e.g. SOP Validation', type: 'text' }],
    },
    {
      id: 'method_requirement',
      title: 'Add Requirements',
      description: 'Specify process requirements',
      category: 'type_requirement',
      icon: '✅',
      defaults: { type: 'Method' },
      fields: [{ key: 'name', label: 'Requirement', placeholder: 'e.g. Manager approval', type: 'text' }],
    },
    {
      id: 'method_action',
      title: 'Add Action Templates',
      description: 'Create task templates',
      category: 'type_action_template',
      icon: '🎬',
      defaults: { type: 'Method' },
      fields: [{ key: 'name', label: 'Action', placeholder: 'e.g. Team training session', type: 'text' }],
    },
  ],
  Material: [
    {
      id: 'material_subtype',
      title: 'Add Material Type',
      description: 'Categorize materials',
      category: 'change_subtype',
      icon: '📦',
      defaults: { type: 'Material' },
      fields: [{ key: 'name', label: 'Subtype', placeholder: 'e.g. New Vendor', type: 'text' }],
    },
    {
      id: 'material_requirement',
      title: 'Add Quality Requirements',
      description: 'Define quality standards',
      category: 'type_requirement',
      icon: '⭐',
      defaults: { type: 'Material' },
      fields: [{ key: 'name', label: 'Requirement', placeholder: 'e.g. QC inspection', type: 'text' }],
    },
    {
      id: 'material_action',
      title: 'Add Action Templates',
      description: 'Create material workflows',
      category: 'type_action_template',
      icon: '🔄',
      defaults: { type: 'Material' },
      fields: [{ key: 'name', label: 'Action', placeholder: 'e.g. Batch monitoring', type: 'text' }],
    },
  ],
};

const GuidedSetupPageV2 = () => {
  const { hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allMasters, setAllMasters] = useState([]);
  
  // Simple state management
  const [flowType, setFlowType] = useState('Machine');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState({});
  const [syncState, setSyncState] = useState('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const canManage = hasPermission('changes.update');
  const steps = useMemo(() => GUIDED_FLOW_CONFIG[flowType] || [], [flowType]);
  const currentStep = steps[currentStepIndex];

  // Load masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [departmentsRes, productionLinesRes, machinesRes, subtypesRes, operatorsRes, skillsRes, operatorSkillMapsRes, machineSkillRequirementsRes, trainingProgramsRes, typeRequirementsRes, typeActionTemplatesRes] = await Promise.all([
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
        ]);
        const allMasters = [
          ...(departmentsRes.data.data || []).map((r) => ({ ...r, category: 'department' })),
          ...(productionLinesRes.data.data || []).map((r) => ({ ...r, category: 'production_line' })),
          ...(machinesRes.data.data || []).map((r) => ({ ...r, category: 'machine' })),
          ...(subtypesRes.data.data || []).map((r) => ({ ...r, category: 'change_subtype' })),
          ...(operatorsRes.data.data || []).map((r) => ({ ...r, category: 'operator' })),
          ...(skillsRes.data.data || []).map((r) => ({ ...r, category: 'skill' })),
          ...(operatorSkillMapsRes.data.data || []).map((r) => ({ ...r, category: 'operator_skill_map' })),
          ...(machineSkillRequirementsRes.data.data || []).map((r) => ({ ...r, category: 'machine_skill_requirement' })),
          ...(trainingProgramsRes.data.data || []).map((r) => ({ ...r, category: 'training_program' })),
          ...(typeRequirementsRes.data.data || []).map((r) => ({ ...r, category: 'type_requirement' })),
          ...(typeActionTemplatesRes.data.data || []).map((r) => ({ ...r, category: 'type_action_template' })),
        ];
        setAllMasters(allMasters);
      } catch (error) {
        showError('Failed to load options');
      }
    };
    loadMasters();
  }, []);

  // Get current form data
  const getCurrentFormData = () => {
    return stepData[currentStep.id] || { name: '', existingNames: [], type: currentStep.defaults?.type || '', status: 'Active' };
  };

  // Handle step completion
  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      showSuccess(`✓ Step completed`);
    } else {
      // Show preview/submit
      showInfo('Review ready - click Final Submit to confirm');
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/70 shadow-sm px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">4M Manufacturing Setup</h1>
              <p className="text-gray-600 dark:text-gray-400">Build your complete changeover framework</p>
            </div>
            <Link to="/masters" className="btn-secondary">Open Masters</Link>
          </div>
        </div>

        {/* Type Selector */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {FOUR_M_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setFlowType(type.id);
                setCurrentStepIndex(0);
                setStepData({});
                setCompletedSteps(new Set());
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                flowType === type.id
                  ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className={`text-2xl mb-2`}>{type.icon || '◆'}</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">{type.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{type.description}</div>
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-6 rounded-lg bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              
              {/* Step Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{currentStep.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{currentStep.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentStep.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                      Step {currentStepIndex + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step Form */}
              <div className="p-6 space-y-4">
                {currentStep.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {field.label}
                    </label>
                    {field.type === 'text' ? (
                      <textarea
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        disabled={!canManage}
                      />
                    ) : (
                      <select
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!canManage}
                      >
                        <option value="">Select {field.label}</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleBack}
                  disabled={currentStepIndex === 0 || !canManage}
                  className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 font-semibold transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canManage}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 font-semibold transition"
                >
                  {currentStepIndex === steps.length - 1 ? 'Review & Submit →' : 'Next →'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">No workflow configured</div>
          )}
        </div>

        {/* Step Summary Sidebar */}
        <div className="mt-6 max-w-2xl mx-auto">
          <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Workflow Summary</h3>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg text-sm ${
                    idx === currentStepIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                      : idx < currentStepIndex
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{idx + 1}.</span>
                    <span className="font-medium">{step.title}</span>
                    {idx < currentStepIndex && <span className="ml-auto text-green-600 dark:text-green-400">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuidedSetupPageV2;
