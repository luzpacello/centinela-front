import { useState } from 'react';
import { toast } from '@/components/ui/toast';
import { ApiRequestError } from '@/services/apiClient';
import {
    buildCreateInstancePayload,
    createInstance,
} from '@/components/features/instances/services/instanceService';
import {
    DEFAULT_RESOURCE_CONFIGURATION,
    INITIAL_INSTANCE_DRAFT,
    INSTANCE_CREATION_STEPS,
} from '@/components/features/instances/data/createInstanceOptions';
import type {
    CreateInstanceDraft,
    InstanceType,
    UpdateCreateInstanceField,
    UpdateInstanceNetworkField,
} from '@/components/features/instances/types/createInstance';

export function useCreateInstanceWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [draft, setDraft] = useState<CreateInstanceDraft>(INITIAL_INSTANCE_DRAFT);
    const [isCreatingInstance, setIsCreatingInstance] = useState(false);

    const updateField: UpdateCreateInstanceField = (field, value) => {
        setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    };

    const updateNetworkField: UpdateInstanceNetworkField = (field, value) => {
        setDraft((currentDraft) => ({
            ...currentDraft,
            red: { ...currentDraft.red, [field]: value },
        }));
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

    function goToStep(step: number) {
        setCurrentStep(Math.min(Math.max(step, 1), INSTANCE_CREATION_STEPS.length));
    }

    async function submitInstanceCreation(): Promise<boolean> {
        if (isCreatingInstance) return false;

        setIsCreatingInstance(true);
        try {
            const payload = buildCreateInstancePayload(draft);
            await createInstance(payload);
            toast.add({
                title: 'Instancia en creación',
                description: 'La solicitud fue aceptada y podés seguir su progreso desde el listado de instancias.',
                type: 'success',
            });
            return true;
        } catch (error) {
            if (!(error instanceof ApiRequestError && [401, 403].includes(error.status))) {
                toast.add({
                    title: 'No se pudo crear la instancia',
                    description: error instanceof Error
                        ? error.message
                        : 'No se pudo completar la solicitud de creación.',
                    type: 'error',
                    priority: 'high',
                });
            }
            return false;
        } finally {
            setIsCreatingInstance(false);
        }
    }

    return {
        currentStep,
        draft,
        isCreatingInstance,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        selectInstanceType,
        submitInstanceCreation,
        updateField,
        updateNetworkField,
    };
}
