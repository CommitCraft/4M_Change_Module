import { GuidedSetupProgress } from '../models/index.js';
import { sendError, sendResponse } from '../utils/response.js';

const FLOW_TYPES = ['Man', 'Machine', 'Method', 'Material'];

const validateFlowType = (flowType) => FLOW_TYPES.includes(flowType);
const sanitizeDraftForms = (draftForms) => {
  if (!draftForms || typeof draftForms !== 'object' || Array.isArray(draftForms)) return {};
  return draftForms;
};

export const getGuidedSetupProgress = async (req, res) => {
  try {
    const { flow_type: flowType } = req.params;

    if (!validateFlowType(flowType)) {
      return sendError(res, 400, 'Invalid flow type');
    }

    const [progress] = await GuidedSetupProgress.findOrCreate({
      where: { user_id: req.user.id, flow_type: flowType },
      defaults: {
        user_id: req.user.id,
        flow_type: flowType,
        completed_steps: [],
        current_step_index: 0,
        draft_forms: {},
      },
    });

    return sendResponse(res, 200, 'Guided setup progress fetched', progress);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch guided setup progress', error.message);
  }
};

export const saveGuidedSetupProgress = async (req, res) => {
  try {
    const { flow_type: flowType } = req.params;
    const { completed_steps: completedSteps, current_step_index: currentStepIndex, draft_forms: draftForms } = req.body;

    if (!validateFlowType(flowType)) {
      return sendError(res, 400, 'Invalid flow type');
    }

    const [progress] = await GuidedSetupProgress.findOrCreate({
      where: { user_id: req.user.id, flow_type: flowType },
      defaults: {
        user_id: req.user.id,
        flow_type: flowType,
        completed_steps: [],
        current_step_index: 0,
        draft_forms: {},
      },
    });

    progress.completed_steps = Array.isArray(completedSteps) ? completedSteps : [];
    progress.current_step_index = Number.isInteger(currentStepIndex) && currentStepIndex >= 0 ? currentStepIndex : 0;
    progress.draft_forms = sanitizeDraftForms(draftForms);
    await progress.save();

    return sendResponse(res, 200, 'Guided setup progress saved', progress);
  } catch (error) {
    return sendError(res, 500, 'Failed to save guided setup progress', error.message);
  }
};

export const resetGuidedSetupProgress = async (req, res) => {
  try {
    const { flow_type: flowType } = req.params;

    if (!validateFlowType(flowType)) {
      return sendError(res, 400, 'Invalid flow type');
    }

    const [progress] = await GuidedSetupProgress.findOrCreate({
      where: { user_id: req.user.id, flow_type: flowType },
      defaults: {
        user_id: req.user.id,
        flow_type: flowType,
        completed_steps: [],
        current_step_index: 0,
        draft_forms: {},
      },
    });

    progress.completed_steps = [];
    progress.current_step_index = 0;
    progress.draft_forms = {};
    await progress.save();

    return sendResponse(res, 200, 'Guided setup progress reset', progress);
  } catch (error) {
    return sendError(res, 500, 'Failed to reset guided setup progress', error.message);
  }
};
