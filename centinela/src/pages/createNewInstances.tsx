import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';

const steps = ['General', 'Sistema', 'Disco', 'Red', 'SO', 'Resumen'];
const stepDescriptions = ['Tipo y nombre', 'Recursos', 'Almacenamiento', 'Conectividad', 'Sistema operativo', 'Revisar y crear'];

export default function CreateNewInstances() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);

    function goBack() {
        navigate(-1);
    }

    function goToNextStep() {
        setCurrentStep((step) => Math.min(step + 1, steps.length));
    }
        
    function goToBackStep() {
        setCurrentStep((step) => Math.max(step - 1, 1));
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
                    <Button type="button" variant="outline" onClick={goToBackStep}>
                        <ArrowLeft className={styles.smallIcon} aria-hidden="true" />
                        Anterior
                    </Button>
                    <Button type="button" onClick={goToNextStep}>
                        Siguiente
                        <ArrowRight className={styles.smallIcon} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            <Card className={styles.stepperCard}>
                <div className={styles.stepperContainer}>
                    <Stepper
                        steps={steps}
                        descriptions={stepDescriptions}
                        currentStep={currentStep}
                        tone="success"
                    />
                </div>
            </Card>
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
};
