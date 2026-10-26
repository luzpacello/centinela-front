import { useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { ApiRequestError } from '@/services/apiClient';
import {
    buildCreateInstancePayload,
    createInstance,
    fetchCreationStorages,
    fetchCreationTemplates,
} from '@/components/features/instances/services/instanceService';
import {
    DEFAULT_RESOURCE_CONFIGURATION,
    INITIAL_INSTANCE_DRAFT,
    INSTANCE_CREATION_STEPS,
} from '@/components/features/instances/data/createInstanceOptions';
import type {
    CreateInstanceDraft,
    InstanceType,
    OperatingSystemTemplateOption,
    StorageOption,
    UpdateCreateInstanceField,
    UpdateInstanceNetworkField,
} from '@/components/features/instances/types/createInstance';
import { assessResourceQuota, getCreateInstanceDraftError, getCreateInstanceStepError } from '@/components/features/instances/validation/createInstanceValidation';
import { useCreationNodeStatus } from '@/components/features/instances/hooks/useCreationNodeStatus';
import { usePendingInstanceCreations } from '@/components/features/instances/context/PendingInstanceCreationsContext';

export function useCreateInstanceWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [draft, setDraft] = useState<CreateInstanceDraft>(INITIAL_INSTANCE_DRAFT);
    const [isCreatingInstance, setIsCreatingInstance] = useState(false);
    const creationInProgress = useRef(false);
    const [hasConfirmedConfiguration, setHasConfirmedConfiguration] = useState(false);
    const [storages, setStorages] = useState<StorageOption[]>([]);
    const [templates, setTemplates] = useState<OperatingSystemTemplateOption[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const { nodeStatus, nodeStatusError, isLoadingNodeStatus } = useCreationNodeStatus(currentStep === 2);
    const { addCreation } = usePendingInstanceCreations();

    useEffect(() => {
        const controller = new AbortController();
        void Promise.all([
            fetchCreationStorages(controller.signal),
            fetchCreationTemplates(controller.signal),
        ]).then(([availableStorages, availableTemplates]) => {
            if (controller.signal.aborted) return;
            setStorages(availableStorages);
            setTemplates(availableTemplates);
            setCatalogError(null);
        }).catch((error: unknown) => {
            if (controller.signal.aborted) return;
            setCatalogError(error instanceof Error ? error.message : 'No se pudieron cargar los recursos disponibles.');
        }).finally(() => {
            if (!controller.signal.aborted) setIsLoadingCatalog(false);
        });
        return () => controller.abort();
    }, []);

    const updateField: UpdateCreateInstanceField = (field, value) => {
        setHasConfirmedConfiguration(false);
        setSubmissionError(null);
        setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    };

    const updateNetworkField: UpdateInstanceNetworkField = (field, value) => {
        setHasConfirmedConfiguration(false);
        setSubmissionError(null);
        setDraft((currentDraft) => ({
            ...currentDraft,
            red: { ...currentDraft.red, [field]: value },
        }));
    };

    function selectInstanceType(type: InstanceType) {
        setHasConfirmedConfiguration(false);
        setSubmissionError(null);
        setDraft((currentDraft) => ({
            ...currentDraft,
            tipo: type,
            templateOso: currentDraft.tipo === type ? currentDraft.templateOso : '',
            storageId: currentDraft.tipo === type ? currentDraft.storageId : '',
        }));
    }

    const catalog = { storages, templates, isLoadingCatalog, catalogError };
    const quotaAssessment = assessResourceQuota(draft, nodeStatus, nodeStatusError, isLoadingNodeStatus);
    const currentStepError = getCreateInstanceStepError(currentStep, draft, catalog)
        ?? (currentStep === 2 ? quotaAssessment.blockingError : null);
    const draftError = getCreateInstanceDraftError(draft, catalog) ?? quotaAssessment.blockingError;
    const canCreateInstance = !draftError && hasConfirmedConfiguration && !isCreatingInstance;

    function goToNextStep() {
        if (currentStepError) return;
        if (currentStep === 1) {
            setDraft((currentDraft) => ({
                ...currentDraft,
                cores: currentDraft.cores ?? DEFAULT_RESOURCE_CONFIGURATION.cores,
                ramMb: currentDraft.ramMb ?? DEFAULT_RESOURCE_CONFIGURATION.ramMb,
                discoGb: currentDraft.discoGb ?? DEFAULT_RESOURCE_CONFIGURATION.discoGb,
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
        if (creationInProgress.current || draftError || !hasConfirmedConfiguration) return false;

        creationInProgress.current = true;
        setIsCreatingInstance(true);
        setSubmissionError(null);
        try {
            const payload = buildCreateInstancePayload(draft);
            const result = await createInstance(payload);
            addCreation(result.vmid, result.tareaId, payload.nombre, payload.tipo);
            toast.add({
                title: 'Instancia en creación',
                description: 'La solicitud fue aceptada y podés seguir su progreso desde el listado de instancias.',
                type: 'info',
            });
            return true;
        } catch (error) {
            if (error instanceof ApiRequestError && error.status === 409 && error.errorCode === 'RESOURCE_QUOTA_EXCEEDED') {
                setSubmissionError(error.message);
                return false;
            }
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
            creationInProgress.current = false;
            setIsCreatingInstance(false);
        }
    }

    return {
        currentStep,
        draft,
        isCreatingInstance,
        canCreateInstance,
        currentStepError,
        submissionError,
        hasConfirmedConfiguration,
        setHasConfirmedConfiguration,
        storages,
        templates,
        isLoadingCatalog,
        catalogError,
        nodeStatus,
        nodeStatusError,
        isLoadingNodeStatus,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        selectInstanceType,
        submitInstanceCreation,
        updateField,
        updateNetworkField,
    };
}
