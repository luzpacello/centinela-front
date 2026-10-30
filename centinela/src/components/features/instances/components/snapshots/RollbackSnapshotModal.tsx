import { SnapshotActionModal, type SnapshotActionModalProps } from './SnapshotActionModal';

export function RollbackSnapshotModal(props: SnapshotActionModalProps) {
  return <SnapshotActionModal {...props} action="rollback" />;
}
