import { SnapshotActionModal, type SnapshotActionModalProps } from './SnapshotActionModal';

export function DeleteSnapshotModal(props: SnapshotActionModalProps) {
  return <SnapshotActionModal {...props} action="delete" />;
}
