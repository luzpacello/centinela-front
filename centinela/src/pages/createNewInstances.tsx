import { ArrowLeft, ArrowRight, ChevronRight, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import SelectTypeOfInstances from '@/components/features/instances/components/wizard/selectTypeOfInstances';
import ConfigureInstanceResources from '@/components/features/instances/components/wizard/configureInstanceResources';
import InstanceCreationSummary from '@/components/features/instances/components/InstanceCreationSummary';
import ConfigureInstanceNetwork from '@/components/features/instances/components/wizard/configureInstanceNetwork';
import SelectInstanceOperatingSystem from '@/components/features/instances/components/wizard/selectInstanceOperatingSystem';
import ReviewInstanceConfiguration from '@/components/features/instances/components/wizard/reviewInstanceConfiguration';
import { INSTANCE_CREATION_STEPS } from '@/components/features/instances/data/createInstanceOptions';
import { useCreateInstanceWizard } from '@/components/features/instances/hooks/useCreateInstanceWizard';

export default function CreateNewInstances() {
    const navigate = useNavigate();
    const {
        currentStep,
        draft,
        isCreatingInstance,
        canCreateInstance,
        currentStepError,
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
    } = useCreateInstanceWizard();

    function goBack() {
        navigate(-1);
    }

    async function createNewInstance() {
        const wasCreated = await submitInstanceCreation();
        if (wasCreated) navigate('/instances', { replace: true });
    }

    const isReviewStep = currentStep === INSTANCE_CREATION_STEPS.length;

    return (
        <section className={styles.page}>
            <header className={styles.pageHeader}>
                <div className={styles.headingContainer}>
                    <nav className={styles.breadcrumb} aria-label="Navegación secundaria">
                        <span>Instancias</span>
                        <ChevronRight className={styles.breadcrumbIcon} aria-hidden="true" />
                        <span className={styles.currentPageName}>Crear instancia</span>
                    </nav>
                    <h1>Crear nueva instancia</h1>
                    <p className="text-secundario">
                        {isReviewStep
                            ? 'Revisa la configuración antes de crear la instancia.'
                            : 'Configura los parámetros de la nueva máquina virtual o contenedor.'}
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <Button type="button" variant="outline" onClick={goBack}>
                        Cancelar
                    </Button>                    
                    <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={currentStep === 1}>
                        <ArrowLeft className={styles.smallIcon} aria-hidden="true" />
                        Anterior
                    </Button>
                    {isReviewStep ? (
                        <Button type="button" onClick={createNewInstance} disabled={!canCreateInstance}>
                            {isCreatingInstance
                                ? <Loader2 className={styles.loadingIcon} aria-hidden="true" />
                                : <Play className={styles.smallIcon} aria-hidden="true" />}
                            {isCreatingInstance ? 'Creando instancia...' : 'Crear Instancia'}
                        </Button>
                    ) : (
                        <Button type="button" onClick={goToNextStep} disabled={Boolean(currentStepError)}>
                            Siguiente
                            <ArrowRight className={styles.smallIcon} aria-hidden="true" />
                        </Button>
                    )}
                </div>
            </header>

            <Card className={styles.stepperCard}>
                <div className={styles.stepperContainer}>
                    <Stepper
                        steps={INSTANCE_CREATION_STEPS.map((step) => step.title)}
                        descriptions={INSTANCE_CREATION_STEPS.map((step) => step.description)}
                        currentStep={currentStep}
                    />
                </div>
            </Card>

            <div className={styles.creationContentGrid}>
                <main>
                    {currentStep === 1 && (
                        <SelectTypeOfInstances
                            draft={draft}
                            onFieldChange={updateField}
                            onTypeChange={selectInstanceType}
                        />
                    )}
                    {currentStep === 2 && (
                        <ConfigureInstanceResources
                            draft={draft}
                            storages={storages}
                            isLoadingCatalog={isLoadingCatalog}
                            catalogError={catalogError}
                            nodeStatus={nodeStatus}
                            nodeStatusError={nodeStatusError}
                            isLoadingNodeStatus={isLoadingNodeStatus}
                            onFieldChange={updateField}
                        />
                    )}
                    {currentStep === 3 && (
                        <ConfigureInstanceNetwork
                            draft={draft}
                            onNetworkFieldChange={updateNetworkField}
                        />
                    )}
                    {currentStep === 4 && (
                        <SelectInstanceOperatingSystem
                            draft={draft}
                            templates={templates}
                            isLoadingCatalog={isLoadingCatalog}
                            catalogError={catalogError}
                            onTemplateChange={(templateValue) => updateField('templateOso', templateValue)}
                        />
                    )}
                    {currentStep === 5 && (
                        <ReviewInstanceConfiguration
                            draft={draft}
                            storages={storages}
                            templates={templates}
                            isCreating={isCreatingInstance}
                            canCreateInstance={canCreateInstance}
                            hasConfirmedConfiguration={hasConfirmedConfiguration}
                            onConfirmationChange={setHasConfirmedConfiguration}
                            onEditStep={goToStep}
                            onCreateInstance={createNewInstance}
                        />
                    )}
                </main>
                <aside className={styles.summaryContainer}>
                    <InstanceCreationSummary draft={draft} templates={templates} />
                </aside>
            </div>
        </section>
    );
}

const styles = {
    page: 'flex min-w-0 flex-col gap-5 text-slate-900',
    pageHeader: 'flex flex-col items-start justify-between gap-5 lg:flex-row',
    headingContainer: 'min-w-0',
    breadcrumb: 'mb-3 flex items-center gap-1.5 text-xs text-slate-500',
    breadcrumbIcon: 'size-3.5',
    currentPageName: 'font-semibold text-slate-900',
    headerActions: 'flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end',
    smallIcon: 'size-4!',
    loadingIcon: 'size-4! animate-spin',
    stepperCard: 'overflow-x-auto rounded-xl border-slate-100 px-5 py-4 shadow-sm ring-0',
    stepperContainer: 'min-w-[48rem]',
    creationContentGrid: 'grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]',
    summaryContainer: 'min-w-0',
};
