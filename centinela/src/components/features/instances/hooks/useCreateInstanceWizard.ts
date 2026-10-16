import { useState } from 'react';
import {
    DEFAULT_RESOURCE_CONFIGURATION,
    INITIAL_INSTANCE_DRAFT,
    INSTANCE_CREATION_STEPS,
} from '@/components/features/instances/data/createInstanceOptions';
import type {
    CreateInstanceDraft,
    InstanceType,
    UpdateCreateInstanceField,
} from '@/components/features/instances/types/createInstance';

export function useCreateInstanceWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [draft, setDraft] = useState<CreateInstanceDraft>(INITIAL_INSTANCE_DRAFT);

    const updateField: UpdateCreateInstanceField = (field, value) => {
        setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    };

    function selectInstanceType(type: InstanceType) {
        setDraft((currentDraft) => ({
            ...currentDraft,
            tipo: type,
            templateOso: currentDraft.tipo === type ? currentDraft.templateOso : '',
        }));
    }

    function goToNextStep() {
        if (currentStep === 1) {
            setDraft((currentDraft) => ({
                ...currentDraft,
                cores: currentDraft.cores ?? DEFAULT_RESOURCE_CONFIGURATION.cores,
                ramMb: currentDraft.ramMb ?? DEFAULT_RESOURCE_CONFIGURATION.ramMb,
                discoGb: currentDraft.discoGb ?? DEFAULT_RESOURCE_CONFIGURATION.discoGb,
                storageId: currentDraft.storageId || DEFAULT_RESOURCE_CONFIGURATION.storageId,
            }));
        }
        setCurrentStep((step) => Math.min(step + 1, INSTANCE_CREATION_STEPS.length));
    }

    function goToPreviousStep() {
        setCurrentStep((step) => Math.max(step - 1, 1));
    }

    return {
        currentStep,
        draft,
        goToNextStep,
        goToPreviousStep,
        selectInstanceType,
        updateField,
    };
}
