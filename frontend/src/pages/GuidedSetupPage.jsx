import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { guidedSetupService, masterService } from '../services/api';
import { showError, showSuccess, showInfo, showWarning } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const FOUR_M_TYPES = ['Man', 'Machine', 'Method', 'Material'];

const TYPE_BADGE = {
  Man: 'MN',
  Machine: 'MC',
  Method: 'MD',
  Material: 'MT',
};

const STEP_ACCENT_CLASSES = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-rose-500',
];

const STEP_CATEGORIES_REQUIRING_TYPE = [
  'operator_skill_map',
  'machine_skill_requirement',
  'training_program',
  'change_subtype',
  'type_requirement',
  'type_action_template',
];

// Explicit allow-list for draft carry-forward inside "Select Existing" text steps.
// This prevents accidental cross-category bleed in next-step dropdowns.
const DRAFT_CARRY_FORWARD_CATEGORY_MAP = {
  machine: ['machine'],
  skill: ['skill'],
  operator: ['operator'],
  training_program: ['training_program'],
  change_subtype: ['change_subtype'],
  type_requirement: ['type_requirement'],
  type_action_template: ['type_action_template'],
};

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

const uniqueNames = (values) => {
  const seen = new Set();
  return (values || []).filter((item) => {
    const value = String(item || '').trim();
    if (!value) return false;
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const GUIDED_FLOW_CONFIG = {
  Machine: [
    {
      id: 'machine_skill_map',
      title: 'Step 1: Map Machine -> Required Skill',
      category: 'machine_skill_requirement',
      fields: [
        { key: 'type', label: 'Machine', type: 'machine-select' },
        { key: 'name', label: 'Required Skill', type: 'skill-select', multi: true },
      ],
    },
  ],
  Man: [
    {
      id: 'operator_skill_map',
      title: 'Step 1: Map Operator -> Skill',
      category: 'operator_skill_map',
      fields: [
        { key: 'type', label: 'Operator', type: 'operator-select' },
        { key: 'name', label: 'Skill', type: 'skill-select', multi: true },
      ],
    },
  ],
  Method: [
    {
      id: 'method_requirement_map',
      title: 'Step 1: Map Method Subtype -> Requirement',
      category: 'type_requirement',
      defaults: { type: 'Method' },
      fields: [
        { key: 'type', label: 'Method Subtype', type: 'subtype-select' },
        { key: 'name', label: 'Requirement', type: 'requirement-select', multi: true },
      ],
    },
  ],
  Material: [
    {
      id: 'material_requirement_map',
      title: 'Step 1: Map Material Subtype -> Requirement',
      category: 'type_requirement',
      defaults: { type: 'Material' },
      fields: [
        { key: 'type', label: 'Material Subtype', type: 'subtype-select' },
        { key: 'name', label: 'Requirement', type: 'requirement-select', multi: true },
      ],
    },
  ],
};

const GuidedSetupPage = () => {
  const { hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allMasters, setAllMasters] = useState([]);
  const [guidedType, setGuidedType] = useState('Machine');
  const [guidedForms, setGuidedForms] = useState({});
  const [guidedFieldSearch, setGuidedFieldSearch] = useState({});
  const [guidedSaving, setGuidedSaving] = useState(false);
  const [guidedCurrentStepIndex, setGuidedCurrentStepIndex] = useState(0);
  const [guidedCompletedSteps, setGuidedCompletedSteps] = useState({});
  const [guidedLastSynced, setGuidedLastSynced] = useState({});
  const [guidedSyncState, setGuidedSyncState] = useState('idle');
  const [recentActions, setRecentActions] = useState([]);
  const [pendingLocalMasters, setPendingLocalMasters] = useState([]);
  // Toast notifications are used instead of pageNotice state
  const [showAddNewForm, setShowAddNewForm] = useState({});
  const [newEntryName, setNewEntryName] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);

  const canManageMasters = hasPermission('changes.update');
  const operators = useMemo(
    () => allMasters.filter((r) => r.category === 'operator' && r.status === 'Active').map((r) => r.name),
    [allMasters]
  );
  const machines = useMemo(
    () => allMasters.filter((r) => r.category === 'machine' && r.status === 'Active').map((r) => r.name),
    [allMasters]
  );
  const skills = useMemo(
    () => allMasters.filter((r) => r.category === 'skill' && r.status === 'Active').map((r) => r.name),
    [allMasters]
  );
  const guidedSteps = useMemo(() => GUIDED_FLOW_CONFIG[guidedType] || [], [guidedType]);

  const loadMasters = useCallback(async () => {
    try {
      const response = await masterService.getMasters();
      setAllMasters(response.data.data || []);
    } catch (error) {
      showError('Failed to load master options');
    }
  }, []);

  useEffect(() => {
    loadMasters();

    const handleMastersUpdated = () => {
      loadMasters();
    };

    window.addEventListener(MASTERS_UPDATED_EVENT, handleMastersUpdated);
    return () => {
      window.removeEventListener(MASTERS_UPDATED_EVENT, handleMastersUpdated);
    };
  }, [loadMasters]);

  useEffect(() => {
    setGuidedCurrentStepIndex(0);
    // Toast notifications auto-dismiss
    setShowAddNewForm({});
    setNewEntryName({});
    setOpenDropdown(null);
    setPreviewModalOpen(false);
  }, [guidedType]);

  useEffect(() => {
    const loadGuidedProgress = async () => {
      try {
        setGuidedSyncState('syncing');
        const response = await guidedSetupService.getProgress(guidedType);
        const data = response.data?.data;
        const completedSteps = Array.isArray(data?.completed_steps) ? data.completed_steps : [];
        const currentIndex = Number.isInteger(data?.current_step_index) ? data.current_step_index : 0;

        const nextCompletedMap = {};
        completedSteps.forEach((stepId) => {
          nextCompletedMap[`${guidedType}:${stepId}`] = true;
        });

        setGuidedCompletedSteps((prev) => {
          const next = { ...prev };
          guidedSteps.forEach((step) => {
            delete next[`${guidedType}:${step.id}`];
          });
          return { ...next, ...nextCompletedMap };
        });

        setGuidedCurrentStepIndex(Math.min(currentIndex, Math.max(guidedSteps.length - 1, 0)));
        const savedDraftForms = data?.draft_forms && typeof data.draft_forms === 'object' ? data.draft_forms : {};
        setGuidedForms((prev) => {
          const next = { ...prev };
          guidedSteps.forEach((step) => {
            const savedForm = savedDraftForms[step.id] || {};
            const existing = next[step.id] || {
              name: step.fields.find((field) => field.key === 'name')?.multi ? [] : '',
              existingNames: [],
              type: step.defaults?.type || '',
              status: 'Active',
            };

            next[step.id] = {
              ...existing,
              ...step.defaults,
              ...savedForm,
              existingNames: Array.isArray(savedForm.existingNames)
                ? savedForm.existingNames
                : Array.isArray(existing.existingNames)
                ? existing.existingNames
                : [],
              status: savedForm.status || existing.status || 'Active',
            };
          });
          return next;
        });
        setGuidedLastSynced((prev) => ({
          ...prev,
          [guidedType]: data?.updated_at || null,
        }));
        setGuidedSyncState('synced');
      } catch (error) {
        setGuidedCurrentStepIndex(0);
        setGuidedSyncState('error');
      }
    };

    if (guidedSteps.length > 0) {
      loadGuidedProgress();
    }
  }, [guidedType, guidedSteps]);

  const getGuidedStepForm = (step) => {
    const nameField = step.fields.find((field) => field.key === 'name');
    return guidedForms[step.id] || {
      name: nameField?.multi ? [] : '',
      existingNames: [],
      type: step.defaults?.type || '',
      status: 'Active',
    };
  };

  const setGuidedField = (step, key, value) => {
    const current = getGuidedStepForm(step);
    setGuidedForms((prev) => ({
      ...prev,
      [step.id]: {
        ...current,
        ...step.defaults,
        [key]: value,
      },
    }));
  };

  const getGuidedFieldSearchValue = (step, field) => {
    const searchKey = `${guidedType}:${step.id}:${field.key}`;
    return guidedFieldSearch[searchKey] || '';
  };

  const setGuidedFieldSearchValue = (step, field, value) => {
    const searchKey = `${guidedType}:${step.id}:${field.key}`;
    setGuidedFieldSearch((prev) => ({
      ...prev,
      [searchKey]: value,
    }));
  };

  const getGuidedOptions = (field) => {
    if (field.type === 'operator-select') return operators;
    if (field.type === 'machine-select') return machines;
    if (field.type === 'skill-select') return skills;
    return [];
  };

  const resolveInlineMasterMeta = (step, field) => {
    const form = getGuidedStepForm(step);
    const effectiveType = step.defaults?.type || form.type || null;

    if (field.type === 'machine-select') return { category: 'machine', type: null };
    if (field.type === 'skill-select') return { category: 'skill', type: null };
    if (field.type === 'operator-select') return { category: 'operator', type: null };
    if (field.type === 'subtype-select') return { category: 'change_subtype', type: effectiveType };
    if (field.type === 'requirement-select') return { category: 'type_requirement', type: effectiveType };
    return null;
  };

  const getGuidedOptionsByStep = (step, field) => {
    const form = getGuidedStepForm(step);
    const effectiveType = step.defaults?.type || form.type || null;

    if (field.type === 'operator-select') return operators;
    if (field.type === 'machine-select') return machines;
    if (field.type === 'skill-select') return skills;
    if (field.type === 'subtype-select') {
      return allMasters
        .filter((record) => {
          if (record.category !== 'change_subtype' || record.status !== 'Active') return false;
          if (!effectiveType) return true;
          return String(record.type || '') === String(effectiveType);
        })
        .map((record) => record.name);
    }
    if (field.type === 'requirement-select') {
      return allMasters
        .filter((record) => {
          if (record.category !== 'type_requirement' || record.status !== 'Active') return false;
          if (!effectiveType) return true;
          return String(record.type || '') === String(effectiveType);
        })
        .map((record) => record.name);
    }
    return getGuidedOptions(field);
  };

  const handleAddNewSelectOption = (step, field) => {
    const fieldKey = `${step.id}:${field.key}`;
    const name = (newEntryName[fieldKey] || '').trim();
    if (!name) return;

    const meta = resolveInlineMasterMeta(step, field);
    if (!meta) {
      showError('Cannot add option for this field');
      return;
    }

    const alreadyExists = allMasters.some(
      (record) =>
        record.category === meta.category &&
        String(record.type || '') === String(meta.type || '') &&
        String(record.name || '').toLowerCase() === name.toLowerCase()
    );

    if (!alreadyExists) {
      setAllMasters((prev) => [
        ...prev,
        {
          id: `local-${meta.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          category: meta.category,
          type: meta.type || null,
          name,
          status: 'Active',
          isLocalDraft: true,
        },
      ]);

      setPendingLocalMasters((prev) => {
        const key = `${meta.category}|${meta.type || ''}|${name.toLowerCase()}`;
        const has = prev.some((item) => `${item.category}|${item.type || ''}|${String(item.name || '').toLowerCase()}` === key);
        if (has) return prev;
        return [...prev, { category: meta.category, type: meta.type || null, name, status: 'Active' }];
      });
    }

    if (field.multi) {
      const current = Array.isArray(getGuidedStepForm(step)[field.key]) ? getGuidedStepForm(step)[field.key] : [];
      setGuidedField(step, field.key, uniqueNames([...current, name]));
    } else {
      setGuidedField(step, field.key, name);
    }

    setNewEntryName((prev) => ({ ...prev, [fieldKey]: '' }));
    setShowAddNewForm((prev) => ({ ...prev, [fieldKey]: false }));
    showSuccess(`${field.label} added and selected`);
  };

  const getExistingStepNameOptions = (step) => {
    const form = getGuidedStepForm(step);
    const typeToMatch = step.defaults?.type || form.type || null;
    const currentStepIndex = guidedSteps.findIndex((s) => s.id === step.id);
    const allowedPrevCategories = DRAFT_CARRY_FORWARD_CATEGORY_MAP[step.category] || [];
    
    // Get names from database (allMasters)
    const dbNames = allMasters
      .filter((record) => {
        if (record.category !== step.category) return false;
        if (record.status !== 'Active') return false;
        if (!typeToMatch) return true;
        return String(record.type || '') === String(typeToMatch);
      })
      .map((record) => record.name)
      .filter(Boolean);

    // Get names from previous steps in the same flow (draft data not yet submitted)
    // but only when the previous step maps to the same category/type context.
    const draftNames = [];
    if (currentStepIndex > 0) {
      // Look at previous steps for entries that haven't been saved to DB yet.
      for (let i = 0; i < currentStepIndex; i++) {
        const prevStep = guidedSteps[i];
        const prevForm = getGuidedStepForm(prevStep);
        const prevTypeToMatch = prevStep.defaults?.type || prevForm.type || null;

        // Keep draft carry-forward strict to allow-list matrix.
        if (!allowedPrevCategories.includes(prevStep.category)) {
          continue;
        }

        // If current step depends on a type, it should only consume matching type drafts.
        if (typeToMatch && prevTypeToMatch && String(typeToMatch) !== String(prevTypeToMatch)) {
          continue;
        }
        
        // For steps with 'text' type fields, collect the names entered/selected
        const nameField = prevStep.fields.find((f) => f.key === 'name');
        if (nameField && nameField.type === 'text') {
          // Get newly typed entries
          if (prevForm.name) {
            const typedNames = Array.isArray(prevForm.name)
              ? prevForm.name
              : parseBulkNames(prevForm.name);
            draftNames.push(...typedNames);
          }
          
          // Get selected existing entries
          if (Array.isArray(prevForm.existingNames)) {
            draftNames.push(...prevForm.existingNames);
          }
        }
      }
    }

    // Combine DB names and draft names, remove duplicates, and sort
    const allNames = uniqueNames([...dbNames, ...draftNames]);
    return allNames.sort((a, b) => a.localeCompare(b));
  };

  const toggleExistingName = (step, name) => {
    const current = getGuidedStepForm(step).existingNames || [];
    const updated = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    setGuidedField(step, 'existingNames', updated);
  };

  const handleAddNewEntry = (step) => {
    const key = `${step.id}`;
    const name = (newEntryName[key] || '').trim();
    if (!name) return;
    
    const nameField = step.fields.find((f) => f.key === 'name');
    if (!nameField) return;
    
    const current = getGuidedStepForm(step)[nameField.key] || '';
    const newValue = current ? `${current}\n${name}` : name;
    setGuidedField(step, nameField.key, newValue);
    setNewEntryName({ ...newEntryName, [key]: '' });
    setShowAddNewForm({ ...showAddNewForm, [key]: false });
  };

  const buildDraftFormsPayload = () => {
    const payload = {};
    guidedSteps.forEach((step) => {
      payload[step.id] = getGuidedStepForm(step);
    });
    return payload;
  };

  const resetGuidedDraftState = useCallback(
    (type = guidedType) => {
      const stepsForType = GUIDED_FLOW_CONFIG[type] || [];
      const keysToRemove = stepsForType.map((step) => `${type}:${step.id}`);

      setGuidedCompletedSteps((prev) => {
        const next = { ...prev };
        keysToRemove.forEach((key) => {
          delete next[key];
        });
        return next;
      });

      setGuidedForms((prev) => {
        const next = { ...prev };
        stepsForType.forEach((step) => {
          next[step.id] = {
            name: '',
            existingNames: [],
            type: step.defaults?.type || '',
            status: 'Active',
          };
        });
        return next;
      });

      setGuidedFieldSearch((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key.startsWith(`${type}:`)) {
            delete next[key];
          }
        });
        return next;
      });

      setGuidedCurrentStepIndex(0);
      setShowAddNewForm({});
      setNewEntryName({});
      setPendingLocalMasters([]);
      setOpenDropdown(null);
    },
    [guidedType]
  );

  const getGuidedStepStateKey = (step) => `${guidedType}:${step.id}`;
  const isStepCompleted = (step) => Boolean(guidedCompletedSteps[getGuidedStepStateKey(step)]);

  const prepareStepSubmission = (step) => {
    const form = getGuidedStepForm(step);
    const payload = {
      category: step.category,
      type: step.defaults?.type || form.type || null,
      name: Array.isArray(form.name) ? form.name : (form.name || '').trim(),
      status: form.status || 'Active',
    };

    const nameField = step.fields.find((field) => field.key === 'name');
    const typedNames =
      nameField?.type === 'text'
        ? parseBulkNames(payload.name)
        : Array.isArray(payload.name)
        ? payload.name.map((item) => String(item || '').trim()).filter(Boolean)
        : [payload.name].filter(Boolean);
    const selectedExistingNames = nameField?.type === 'text' ? uniqueNames(form.existingNames || []) : [];
    const selectedNames = nameField?.type === 'text' ? uniqueNames([...selectedExistingNames, ...typedNames]) : uniqueNames(typedNames);
    const namesToCreate = nameField?.type === 'text' ? typedNames : typedNames;

    if (selectedNames.length === 0) {
      return {
        isValid: false,
        payload,
        selectedNames: [],
        namesToCreate: [],
        selectedExistingNames: [],
        error: `${step.title}: Name is required`,
      };
    }

    if (STEP_CATEGORIES_REQUIRING_TYPE.includes(step.category) && !payload.type) {
      return {
        isValid: false,
        payload,
        selectedNames,
        namesToCreate,
        selectedExistingNames,
        error: `${step.title}: Type is required`,
      };
    }

    return {
      isValid: true,
      payload,
      selectedNames,
      namesToCreate,
      selectedExistingNames,
      error: null,
    };
  };

  const getFieldErrorForStep = useCallback(
    (step, fieldKey) => {
      const prepared = prepareStepSubmission(step);
      if (prepared.isValid || !prepared.error) return null;
      if (fieldKey === 'name' && prepared.error.includes('Name is required')) return 'Name is required';
      if (fieldKey === 'type' && prepared.error.includes('Type is required')) return 'Type is required';
      return null;
    },
    [guidedForms, guidedType, guidedSteps]
  );

  const focusStepField = useCallback((step, fieldKey) => {
    const node = document.getElementById(`guided-field-${step.id}-${fieldKey}`);
    if (node && typeof node.focus === 'function') {
      node.focus();
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const stepValidationById = useMemo(() => {
    const validations = {};
    guidedSteps.forEach((step) => {
      validations[step.id] = prepareStepSubmission(step);
    });
    return validations;
  }, [guidedSteps, guidedForms, guidedType]);

  const isStepReady = useCallback(
    (step) => Boolean(isStepCompleted(step) && stepValidationById[step.id]?.isValid),
    [guidedCompletedSteps, guidedType, stepValidationById]
  );

  const guidedProgress = useMemo(() => {
    const total = guidedSteps.length;
    const done = guidedSteps.filter((step) => isStepReady(step)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [guidedSteps, isStepReady]);

  const completedAllSteps = useMemo(
    () => guidedSteps.length > 0 && guidedSteps.every((step) => isStepReady(step)),
    [guidedSteps, isStepReady]
  );

  const getStepUiState = useCallback(
    (step, index) => {
      if (index > guidedCurrentStepIndex) return 'locked';
      if (isStepReady(step)) return 'ready';
      if (isStepCompleted(step) && !stepValidationById[step.id]?.isValid) return 'needs-fix';
      if (index === guidedCurrentStepIndex) return 'active';
      return 'pending';
    },
    [guidedCurrentStepIndex, isStepReady, stepValidationById, guidedCompletedSteps, guidedType]
  );

  const handleStepNext = async (step, stepIndex) => {
    const prepared = prepareStepSubmission(step);
    if (!prepared.isValid) {
      showError(prepared.error);
      if (prepared.error?.includes('Type is required')) {
        focusStepField(step, 'type');
      } else {
        focusStepField(step, 'name');
      }
      return;
    }

    try {
      const isLastStep = stepIndex === guidedSteps.length - 1;
      setGuidedSyncState('syncing');
      const completedStepIds = Array.from(
        new Set([
          ...guidedSteps.filter((s) => isStepCompleted(s)).map((s) => s.id),
          step.id,
        ])
      );
      const nextProgressIndex = Math.min(stepIndex + 1, Math.max(guidedSteps.length - 1, 0));
      await guidedSetupService.saveProgress(guidedType, {
        completed_steps: completedStepIds,
        current_step_index: nextProgressIndex,
        draft_forms: buildDraftFormsPayload(),
      });

      setGuidedCompletedSteps((prev) => {
        const next = { ...prev };
        completedStepIds.forEach((stepId) => {
          next[`${guidedType}:${stepId}`] = true;
        });
        return next;
      });

      setGuidedLastSynced((prev) => ({
        ...prev,
        [guidedType]: new Date().toISOString(),
      }));
      setGuidedCurrentStepIndex(nextProgressIndex);
      setGuidedSyncState('synced');
      if (isLastStep) {
        setPreviewModalOpen(true);
        showInfo('Preview opened. Verify all data, then Final Submit or Edit.');
      } else {
        showSuccess('Step draft saved. The next step is now unlocked.');
      }
    } catch (error) {
      setGuidedSyncState('error');
      const message = error.response?.data?.message || 'Failed to move to next step';
      showError(message);
    }
  };

  const finalPreviewRows = useMemo(
    () =>
      guidedSteps.map((step, index) => {
        const prepared = prepareStepSubmission(step);
        return {
          id: step.id,
          title: step.title,
          stepNo: index + 1,
          payload: prepared.payload,
          names: prepared.selectedNames,
          namesToCreate: prepared.namesToCreate,
          existingNames: prepared.selectedExistingNames,
          isValid: prepared.isValid,
          error: prepared.error,
        };
      }),
    [guidedSteps, guidedForms, guidedType]
  );

  const finalPreviewStats = useMemo(() => {
    const total = finalPreviewRows.length;
    const ready = finalPreviewRows.filter((row) => row.isValid).length;
    const totalSelected = finalPreviewRows.reduce((sum, row) => sum + row.names.length, 0);
    const totalNew = finalPreviewRows.reduce((sum, row) => sum + row.namesToCreate.length, 0);
    const totalExisting = finalPreviewRows.reduce((sum, row) => sum + row.existingNames.length, 0);
    return {
      total,
      ready,
      blocked: Math.max(total - ready, 0),
      totalSelected,
      totalNew,
      totalExisting,
    };
  }, [finalPreviewRows]);

  const firstInvalidPreviewRow = useMemo(
    () => finalPreviewRows.find((row) => !row.isValid) || null,
    [finalPreviewRows]
  );

  const scrollToPreviewRow = useCallback((rowId) => {
    if (!rowId) return;
    const node = document.getElementById(`preview-${rowId}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const submitGuidedFlow = async () => {
    if (!canManageMasters) {
      const message = 'You do not have permission to update master data';
      showError(message);
      return;
    }

    if (!completedAllSteps) {
      showWarning('Please click Next on every step before final submit.');
      return;
    }

    const invalidPreview = finalPreviewRows.find((row) => !row.isValid);
    if (invalidPreview) {
      showError(invalidPreview.error);
      scrollToPreviewRow(invalidPreview.id);
      return;
    }

    try {
      setGuidedSaving(true);
      setGuidedSyncState('syncing');

      if (pendingLocalMasters.length > 0) {
        await Promise.allSettled(
          pendingLocalMasters.map((entry) =>
            masterService.createMaster({
              category: entry.category,
              type: entry.type || null,
              name: entry.name,
              status: entry.status || 'Active',
            })
          )
        );
      }

      let totalCreated = 0;
      let totalFailed = 0;
      let totalPlannedCreate = 0;
      let totalPreviewSelected = 0;
      const nextRecentActions = [];

      for (const row of finalPreviewRows) {
        totalPlannedCreate += row.namesToCreate.length;
        totalPreviewSelected += row.names.length;

        const results = await Promise.allSettled(
          row.namesToCreate.map((name) =>
            masterService.createMaster({
              ...row.payload,
              name,
            })
          )
        );

        const successCount = results.filter((result) => result.status === 'fulfilled').length;
        const failureCount = row.namesToCreate.length - successCount;
        const createdNames = results
          .map((result, index) => ({ result, name: row.namesToCreate[index] }))
          .filter((item) => item.result.status === 'fulfilled')
          .map((item) => item.name);
        const createdIds = results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value?.data?.data?.id)
          .filter(Boolean);

        totalCreated += successCount;
        totalFailed += failureCount;

        if (successCount > 0 || failureCount > 0) {
          nextRecentActions.push({
            key: `${guidedType}:${row.id}:${Date.now()}:${successCount}`,
            stepTitle: row.title,
            type: guidedType,
            count: successCount,
            ids: createdIds,
            names: createdNames,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (totalCreated === 0 && totalPlannedCreate > 0) {
        setGuidedSyncState('error');
        const message = 'No records were created. The entries may already exist.';
        showError(message);
        return;
      }

      await guidedSetupService.saveProgress(guidedType, {
        completed_steps: guidedSteps.map((step) => step.id),
        current_step_index: Math.max(guidedSteps.length - 1, 0),
        draft_forms: buildDraftFormsPayload(),
      });

      const refreshed = await masterService.getMasters();
      setAllMasters(refreshed.data.data || []);
      window.dispatchEvent(new CustomEvent(MASTERS_UPDATED_EVENT));

      setRecentActions((prev) => [...nextRecentActions, ...prev].slice(0, 8));
      setGuidedLastSynced((prev) => ({
        ...prev,
        [guidedType]: new Date().toISOString(),
      }));
      setGuidedSyncState('synced');

      const summaryMessage =
        totalPlannedCreate === 0
          ? `No new records required. ${totalPreviewSelected} existing entries reused from preview.`
          : totalFailed > 0
          ? `${totalCreated} records created, ${totalFailed} skipped/failed. Review Recent Activity.`
          : `${totalCreated} records created successfully.`;

      await guidedSetupService.resetProgress(guidedType);
      resetGuidedDraftState(guidedType);
      setPreviewModalOpen(false);
      setGuidedLastSynced((prev) => ({
        ...prev,
        [guidedType]: new Date().toISOString(),
      }));

      if (totalPlannedCreate === 0 && pendingLocalMasters.length === 0) {
        showInfo(`${summaryMessage} Form reset for next entry.`);
      } else {
        showSuccess(`${summaryMessage} Form reset for next entry.`);
      }
    } catch (error) {
      setGuidedSyncState('error');
      const message = error.response?.data?.message || 'Failed to submit guided flow';
      showError(message);
    } finally {
      setGuidedSaving(false);
    }
  };

  const resetGuidedFlow = async () => {
    try {
      setGuidedSaving(true);
      setGuidedSyncState('syncing');
      await guidedSetupService.resetProgress(guidedType);

      resetGuidedDraftState(guidedType);
      setPreviewModalOpen(false);
      setGuidedLastSynced((prev) => ({
        ...prev,
        [guidedType]: new Date().toISOString(),
      }));
      showInfo(`${guidedType} draft cleared. You can start again from Step 1.`);
      setRecentActions((prev) => [
        {
          key: `${guidedType}:reset:${Date.now()}`,
          stepTitle: 'Flow Reset',
          type: guidedType,
          names: [],
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 8));
      setGuidedSyncState('synced');
      showSuccess(`${guidedType} guided flow reset`);
    } catch (error) {
      setGuidedSyncState('error');
      showError('Failed to reset guided flow');
    } finally {
      setGuidedSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`${sidebarOpen ? 'md:ml-64' : ''} transition-all duration-300 p-6`}>
        <div className="mb-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/70 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">4M Guided Setup</h1>
              <p className="text-gray-600 dark:text-gray-400">Complete Man, Machine, Method, and Material setup with guided draft, preview, and final submit.</p>
            </div>
            <Link to="/masters" className="btn-secondary">
              Open Masters
            </Link>
          </div>
        </div>

        {!canManageMasters && (
          <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            You have read-only access. Next/Final Submit/Reset requires update permission.
          </div>
        )}

        {/* Toast notifications handled by react-hot-toast */}
        <div className="card mb-6 border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Guided Flow Controller</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose a 4M type and complete each step in order.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Type {TYPE_BADGE[guidedType] || '--'}
              </span>
              <select
                value={guidedType}
                onChange={(e) => setGuidedType(e.target.value)}
                className="input-field max-w-xs dark:bg-gray-800 dark:text-gray-200"
              >
                {FOUR_M_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary disabled:opacity-60"
                onClick={resetGuidedFlow}
                disabled={guidedSaving || !canManageMasters}
              >
                Reset Guided Flow
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Progress: {guidedProgress.done}/{guidedProgress.total} steps</span>
              <span className="font-semibold text-blue-700 dark:text-blue-300">{guidedProgress.percent}%</span>
            </div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last synced:{' '}
                {guidedLastSynced[guidedType]
                  ? new Date(guidedLastSynced[guidedType]).toLocaleString()
                  : 'Not synced yet'}
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  guidedSyncState === 'syncing'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : guidedSyncState === 'synced'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : guidedSyncState === 'error'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {guidedSyncState === 'syncing'
                  ? 'Auto-syncing...'
                  : guidedSyncState === 'synced'
                  ? 'Synced'
                  : guidedSyncState === 'error'
                  ? 'Sync Failed'
                  : 'Not Synced'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${guidedProgress.percent}%` }} />
            </div>
          </div>

            {guidedSteps.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {guidedSteps.map((step, index) => {
                  const isActive = index === guidedCurrentStepIndex;
                  const stepState = getStepUiState(step, index);
                  const canJump = index <= guidedCurrentStepIndex;
                  return (
                    <button
                      key={`step-nav-${step.id}`}
                      type="button"
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        stepState === 'active'
                          ? 'border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : stepState === 'ready'
                          ? 'border-green-400 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : stepState === 'needs-fix'
                          ? 'border-red-400 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'border-gray-300 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      } disabled:opacity-60`}
                      disabled={!canJump}
                      onClick={() => setGuidedCurrentStepIndex(index)}
                      title={step.title}
                    >
                      {index + 1}.{' '}
                      {stepState === 'ready'
                        ? 'Done'
                        : stepState === 'needs-fix'
                        ? 'Fix'
                        : stepState === 'active'
                        ? 'Active'
                        : stepState === 'locked'
                        ? 'Locked'
                        : 'Pending'}
                    </button>
                  );
                })}
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
            {guidedSteps.length === 0 ? (
              <div className="text-center py-8 text-gray-500 md:col-span-2">No guided steps configured</div>
            ) : (
              guidedSteps.map((step, stepIndex) => {
                  if (stepIndex !== guidedCurrentStepIndex) {
                    return null;
                  }
                const form = getGuidedStepForm(step);
                const done = isStepReady(step);
                const isLocked = stepIndex > guidedCurrentStepIndex;
                const needsFix = isStepCompleted(step) && !stepValidationById[step.id]?.isValid;
                const stepChecklist = step.fields
                  .map((field) => ({
                    key: field.key,
                    label: field.label || field.key,
                    message: getFieldErrorForStep(step, field.key),
                  }))
                  .filter((item) => Boolean(item.message));
                const accentClass = STEP_ACCENT_CLASSES[stepIndex % STEP_ACCENT_CLASSES.length];
                const cardClass = isLocked
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-60'
                  : done
                  ? 'border-green-300 dark:border-green-700 bg-green-50/40 dark:bg-green-900/10 border-l-4 border-l-green-500'
                  : needsFix
                  ? 'border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-900/10 border-l-4 border-l-red-500'
                  : `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 border-l-4 ${accentClass}`;

                return (
                  <div
                    key={step.id}
                    id={`guided-step-${step.id}`}
                    className={`border rounded-lg p-3 h-full flex flex-col ${cardClass}`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-200 px-2">
                          {stepIndex + 1}
                        </span>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{step.title}</h3>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          done
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : needsFix
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : isLocked
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {done ? 'Completed' : needsFix ? 'Needs Fix' : isLocked ? 'Locked' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      Step {stepIndex + 1} of {guidedSteps.length}
                    </p>

                    {!isLocked && stepChecklist.length > 0 && (
                      <div className="mb-3 rounded-md border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Checklist: fix these before Next</p>
                        <div className="space-y-1">
                          {stepChecklist.map((item) => (
                            <button
                              key={`check-${step.id}-${item.key}`}
                              type="button"
                              className="w-full text-left text-xs text-red-700 dark:text-red-300 hover:underline"
                              onClick={() => focusStepField(step, item.key)}
                            >
                              • {item.label}: {item.message}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1">
                      {step.fields.map((field) => {
                        const labelText = field.label || field.key;
                        const fieldError = getFieldErrorForStep(step, field.key);
                        const controlBaseClass =
                          'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60';

                        if (field.type === 'text') {
                          const existingOptions = getExistingStepNameOptions(step);
                          const selectedExisting = Array.isArray(form.existingNames) ? form.existingNames : [];
                          return (
                            <div key={field.key} className="space-y-2 lg:col-span-2">
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{labelText}</label>
                              
                              <div className="space-y-3">
                                {existingOptions.length > 0 && (
                                  <div className="w-full space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">Select Existing</label>
                                    <div className="flex gap-2">
                                      <div className="flex-1 relative">
                                        <button
                                          onClick={() => setOpenDropdown(openDropdown === step.id ? null : step.id)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          disabled={isLocked}
                                        >
                                          <span className="text-xs">
                                            {selectedExisting.length > 0 ? `${selectedExisting.length} selected` : 'Select...'}
                                          </span>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                          </svg>
                                        </button>
                                        
                                        {openDropdown === step.id && (
                                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg min-w-max">
                                            <div className="max-h-48 overflow-y-auto">
                                              {existingOptions.map((option) => (
                                                <label key={option} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedExisting.includes(option)}
                                                    onChange={() => toggleExistingName(step, option)}
                                                    className="w-4 h-4 accent-blue-500"
                                                    disabled={isLocked}
                                                  />
                                                  <span className="text-sm text-gray-800 dark:text-gray-200">{option}</span>
                                                </label>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <button
                                        onClick={() => {
                                          const key = `${step.id}`;
                                          setShowAddNewForm({ ...showAddNewForm, [key]: !showAddNewForm[key] });
                                        }}
                                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold transition disabled:opacity-60 h-10"
                                        disabled={isLocked}
                                        title="Add new entry"
                                      >
                                        +
                                      </button>
                                    </div>
                                    {selectedExisting.length > 0 && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Selected: {selectedExisting.length}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="w-full space-y-1">
                                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                                    {existingOptions.length > 0 ? 'Add Manually' : labelText}
                                  </label>
                                  <textarea
                                    id={`guided-field-${step.id}-${field.key}`}
                                    value={form[field.key] || ''}
                                    onChange={(e) => setGuidedField(step, field.key, e.target.value)}
                                    className={`${controlBaseClass} ${fieldError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''}`}
                                    placeholder={field.placeholder || field.label}
                                    rows={2}
                                    disabled={isLocked}
                                  />
                                  {fieldError && (
                                    <p className="text-xs text-red-600 dark:text-red-300">{fieldError}</p>
                                  )}
                                </div>
                              </div>

                              {/* Add New Entry Form */}
                              {showAddNewForm[`${step.id}`] && (
                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 space-y-2">
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Add New {labelText}</p>
                                  <div className="flex gap-2">
                                    <input
                                      id={`guided-field-${step.id}-${field.key}`}
                                      type="text"
                                      placeholder={`Enter new ${field.label.toLowerCase()}`}
                                      value={newEntryName[`${step.id}`] || ''}
                                      onChange={(e) => setNewEntryName({ ...newEntryName, [`${step.id}`]: e.target.value })}
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewEntry(step); }}
                                      className={controlBaseClass}
                                      disabled={isLocked}
                                    />
                                    <button
                                      onClick={() => handleAddNewEntry(step)}
                                      className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-semibold transition disabled:opacity-60 whitespace-nowrap"
                                      disabled={isLocked || !((newEntryName[`${step.id}`] || '').trim())}
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        const options = getGuidedOptionsByStep(step, field);
                        const selectedValues = Array.isArray(form[field.key]) ? form[field.key] : [];
                        const selectedSingle = !field.multi ? (form[field.key] || '') : '';
                        const selectedSet = field.multi
                          ? selectedValues
                          : selectedSingle
                          ? [selectedSingle]
                          : [];
                        const searchValue = getGuidedFieldSearchValue(step, field).trim().toLowerCase();
                        const visibleOptions =
                          searchValue
                            ? options.filter((option) => option.toLowerCase().includes(searchValue))
                            : options;

                        return (
                          <div key={field.key} className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{labelText}</label>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 disabled:opacity-60"
                                disabled={isLocked}
                                onClick={() => {
                                  const fieldKey = `${step.id}:${field.key}`;
                                  setShowAddNewForm((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
                                }}
                              >
                                + Add {labelText}
                              </button>
                            </div>
                            <input
                              value={getGuidedFieldSearchValue(step, field)}
                              onChange={(e) => setGuidedFieldSearchValue(step, field, e.target.value)}
                              className={controlBaseClass}
                              placeholder={`Search ${field.label}`}
                              disabled={isLocked}
                            />
                            <div
                              id={`guided-field-${step.id}-${field.key}`}
                              className={`max-h-44 overflow-y-auto rounded-md border px-2 py-2 space-y-1 ${
                                fieldError
                                  ? 'border-red-400 dark:border-red-600'
                                  : 'border-gray-300 dark:border-gray-700'
                              } bg-white dark:bg-gray-800`}
                            >
                              {visibleOptions.length === 0 ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No options found</p>
                              ) : (
                                visibleOptions.map((option) => {
                                  const checked = selectedSet.includes(option);
                                  return (
                                    <label
                                      key={option}
                                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-blue-500"
                                        checked={checked}
                                        disabled={isLocked}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          if (field.multi) {
                                            const next = isChecked
                                              ? uniqueNames([...selectedValues, option])
                                              : selectedValues.filter((item) => item !== option);
                                            setGuidedField(step, field.key, next);
                                            return;
                                          }

                                          setGuidedField(step, field.key, isChecked ? option : '');
                                        }}
                                      />
                                      <span className="text-sm text-gray-800 dark:text-gray-200">{option}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                            {!field.multi && selectedSingle && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">Selected: {selectedSingle}</div>
                            )}
                            {fieldError && (
                              <p className="text-xs text-red-600 dark:text-red-300">{fieldError}</p>
                            )}
                            {showAddNewForm[`${step.id}:${field.key}`] && (
                              <div className="mt-2 p-2 rounded-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Add ${labelText}`}
                                  value={newEntryName[`${step.id}:${field.key}`] || ''}
                                  onChange={(e) =>
                                    setNewEntryName((prev) => ({ ...prev, [`${step.id}:${field.key}`]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddNewSelectOption(step, field);
                                    }
                                  }}
                                  className={controlBaseClass}
                                  disabled={isLocked}
                                />
                                <button
                                  type="button"
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold disabled:opacity-60"
                                  disabled={isLocked || !((newEntryName[`${step.id}:${field.key}`] || '').trim())}
                                  onClick={() => handleAddNewSelectOption(step, field)}
                                >
                                  Add
                                </button>
                              </div>
                            )}
                            {field.multi && (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Showing {visibleOptions.length} of {options.length}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {selectedValues.map((value) => (
                                    <span
                                      key={value}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
                                    >
                                      {value}
                                      <button
                                        type="button"
                                        className="font-bold"
                                        disabled={isLocked}
                                        onClick={() =>
                                          setGuidedField(
                                            step,
                                            field.key,
                                            selectedValues.filter((item) => item !== value)
                                          )
                                        }
                                      >
                                        x
                                      </button>
                                    </span>
                                  ))}
                                </div>
                                {selectedValues.length > 0 && (
                                  <button
                                    type="button"
                                    className="text-xs text-red-600 dark:text-red-400"
                                    disabled={isLocked}
                                    onClick={() => setGuidedField(step, field.key, [])}
                                  >
                                    Clear selected
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="lg:col-span-2 flex justify-between pt-1 gap-2">
                        <button
                          type="button"
                          className="btn-secondary disabled:opacity-60"
                          disabled={guidedSaving || stepIndex === 0}
                          onClick={() => setGuidedCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          className="btn-primary disabled:opacity-60"
                          disabled={!canManageMasters || guidedSaving || isLocked}
                          onClick={() => handleStepNext(step, stepIndex)}
                        >
                          {stepIndex === guidedSteps.length - 1 ? 'Go To Preview' : 'Next'}
                        </button>
                      </div>
                    </div>

                    {step.fields.some((field) => field.key === 'name' && field.type === 'text') && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">For new entries, use comma or a new line. You can also select existing entries using multi-select.</p>
                    )}
                    {step.fields.some((field) => field.key === 'name' && field.multi) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Hold Ctrl/Cmd to select multiple options.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {completedAllSteps && (
            <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">Preview Ready</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click Go To Preview to verify all data in a modal, then Edit or Final Submit.</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary disabled:opacity-60"
                  disabled={guidedSaving}
                  onClick={() => setPreviewModalOpen(true)}
                >
                  Open Preview
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Recent Activity</h4>
            {recentActions.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">No recent step activity yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-2">
                {recentActions.map((item) => (
                  <div key={item.key} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.stepTitle}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.type} - {new Date(item.createdAt).toLocaleTimeString()}</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300">Saved: {item.count || item.names.length}</p>
                    {item.names.length > 0 && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate" title={item.names.join(', ')}>
                        Added: {item.names.join(', ')}
                      </p>
                    )}
                    {Array.isArray(item.ids) && item.ids.length > 0 && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={item.ids.join(', ')}>
                        IDs: {item.ids.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close preview"
            className="absolute inset-0 bg-black/50"
            onClick={() => !guidedSaving && setPreviewModalOpen(false)}
          />

          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Final Preview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verify the complete submission before final save.</p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                disabled={guidedSaving}
                onClick={() => setPreviewModalOpen(false)}
              >
                Edit
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {firstInvalidPreviewRow && (
                <div className="mb-3 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
                  <span>
                    Fix required in Step {firstInvalidPreviewRow.stepNo}: {firstInvalidPreviewRow.title}
                  </span>
                  <button
                    type="button"
                    className="font-semibold underline underline-offset-2"
                    onClick={() => scrollToPreviewRow(firstInvalidPreviewRow.id)}
                  >
                    Jump to issue
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/40">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Steps</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{finalPreviewStats.total}</p>
                </div>
                <div className="rounded-lg border border-green-200 dark:border-green-700 p-2 bg-green-50 dark:bg-green-900/20">
                  <p className="text-[11px] text-green-600 dark:text-green-300">Ready</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{finalPreviewStats.ready}</p>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-700 p-2 bg-red-50 dark:bg-red-900/20">
                  <p className="text-[11px] text-red-600 dark:text-red-300">Blocked</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">{finalPreviewStats.blocked}</p>
                </div>
                <div className="rounded-lg border border-blue-200 dark:border-blue-700 p-2 bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-[11px] text-blue-600 dark:text-blue-300">Selected</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{finalPreviewStats.totalSelected}</p>
                </div>
                <div className="rounded-lg border border-amber-200 dark:border-amber-700 p-2 bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-[11px] text-amber-600 dark:text-amber-300">New</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{finalPreviewStats.totalNew}</p>
                </div>
                <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 p-2 bg-indigo-50 dark:bg-indigo-900/20">
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-300">Existing</p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{finalPreviewStats.totalExisting}</p>
                </div>
              </div>

              <div className="space-y-2">
                {finalPreviewRows.map((row) => (
                  <div
                    key={`preview-${row.id}`}
                    id={`preview-${row.id}`}
                    className={`rounded-lg border p-3 ${
                      row.isValid
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                        : 'border-red-300 dark:border-red-700 bg-red-50/70 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {row.stepNo}. {row.title}
                      </p>
                      {row.isValid ? (
                        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          Fix Required
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">Category:</span> {row.payload.category}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">Type:</span> {row.payload.type || 'N/A'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">New:</span> {row.namesToCreate.length}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">Existing:</span> {row.existingNames.length}
                      </p>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 break-words" title={row.names.join(', ')}>
                      <span className="font-semibold">Selected:</span> {row.names.length > 0 ? row.names.join(', ') : 'No entries'}
                    </p>

                    {!row.isValid && (
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">{row.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70">
              <button
                type="button"
                className="btn-secondary"
                disabled={guidedSaving}
                onClick={() => setPreviewModalOpen(false)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-primary disabled:opacity-60"
                disabled={!canManageMasters || guidedSaving || Boolean(firstInvalidPreviewRow)}
                onClick={submitGuidedFlow}
              >
                {guidedSaving ? 'Submitting...' : 'Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedSetupPage;
