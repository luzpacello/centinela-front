interface NetworkModeOptionProps {
    title: string;
    description: string;
    isSelected: boolean;
    onSelect: () => void;
}

export default function NetworkModeOption({
    title,
    description,
    isSelected,
    onSelect,
}: NetworkModeOptionProps) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`${styles.networkModeOption} ${isSelected ? styles.selectedNetworkModeOption : styles.unselectedNetworkModeOption}`}
            onClick={onSelect}
        >
            <span className={`${styles.radioIndicator} ${isSelected ? styles.selectedRadioIndicator : styles.unselectedRadioIndicator}`}>
                {isSelected && <span className={styles.radioIndicatorDot} />}
            </span>
            <span className={styles.networkModeTextContainer}>
                <h4>{title}</h4>
                <span className="text-destacado">{description}</span>
            </span>
        </button>
    );
}

const styles = {
    networkModeOption: 'flex min-h-24 w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
    selectedNetworkModeOption: 'border-blue-600 bg-blue-50/60',
    unselectedNetworkModeOption: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30',
    radioIndicator: 'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
    selectedRadioIndicator: 'border-blue-600 bg-blue-600',
    unselectedRadioIndicator: 'border-slate-300 bg-white',
    radioIndicatorDot: 'size-2 rounded-full bg-white',
    networkModeTextContainer: 'flex min-w-0 flex-col gap-1',
};
