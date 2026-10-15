import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import SelectTypeOfInstances from '@/components/features/instances/components/selectTypeOfInstances';
import InstanceCreationSummary from '@/components/features/instances/components/InstanceCreationSummary';
import { INSTANCE_CREATION_STEPS } from '@/components/features/instances/data/createInstanceOptions';
import { useCreateInstanceWizard } from '@/components/features/instances/hooks/useCreateInstanceWizard';

export default function CreateNewInstances() {
    const navigate = useNavigate();
    const {
        currentStep,
        draft,
        goToNextStep,
        goToPreviousStep,
        selectInstanceType,
        updateField,
    } = useCreateInstanceWizard();

    function goBack() {
        navigate(-1);
    }

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
                    <p className="text-secundario">Configura los parámetros de la nueva máquina virtual o contenedor.</p>
                </div>

                <div className={styles.headerActions}>
                    <Button type="button" variant="outline" onClick={goBack}>
                        Cancelar
                    </Button>                    
                    <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={currentStep === 1}>
                        <ArrowLeft className={styles.smallIcon} aria-hidden="true" />
                        Anterior
                    </Button>
                    <Button type="button" onClick={goToNextStep} disabled={currentStep === INSTANCE_CREATION_STEPS.length}>
                        Siguiente
                        <ArrowRight className={styles.smallIcon} aria-hidden="true" />
                    </Button>
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
                <main className={styles.stepContentContainer}>
                    {currentStep === 1 && (
                        <SelectTypeOfInstances
                            draft={draft}
                            onFieldChange={updateField}
                            onTypeChange={selectInstanceType}
                        />
                    )}
                </main>
                <aside className={styles.summaryContainer}>
                    <InstanceCreationSummary draft={draft} />
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
    stepperCard: 'overflow-x-auto rounded-xl border-slate-100 px-5 py-4 shadow-sm ring-0',
    stepperContainer: 'min-w-[48rem]',
    creationContentGrid: 'grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]',
    stepContentContainer: 'min-h-[32rem] min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
    summaryContainer: 'min-w-0',
};
