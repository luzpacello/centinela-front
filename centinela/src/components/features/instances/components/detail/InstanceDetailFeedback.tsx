import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function InstanceDetailFeedback({ title, description, onRetry }: { title: string; description: string; onRetry?: () => void }) {
    return <Card className={styles.feedbackCard}>
        <h1>{title}</h1>
        <p role="alert" className="text-secundario">{description}</p>
        <div className={styles.feedbackActions}>
            {onRetry && <Button type="button" onClick={onRetry}>Reintentar</Button>}
            <Button variant="outline" render={<Link to="/instances" />}>Volver a Instancias</Button>
        </div>
    </Card>;
}

const styles = {
    feedbackCard: 'mx-auto max-w-xl gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm ring-0',
    feedbackActions: 'flex flex-wrap gap-3',
};
