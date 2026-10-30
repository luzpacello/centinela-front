import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateSnapshotModal } from '@/components/features/instances/components/snapshots/CreateSnapshotModal';
import { AuditDetailModal } from '@/components/features/audit/AuditDetailModal';
import { snapshotService } from '@/components/features/instances/services/snapshotService';

function SnapshotHarness({ onCloseSpy }: { onCloseSpy: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir snapshots</button>
      <button>fuera</button>
      <CreateSnapshotModal
        instanceRef={101}
        isOpen={open}
        onClose={() => { onCloseSpy(); setOpen(false); }}
        onSnapshotCreated={() => { onCloseSpy(); setOpen(false); }}
      />
    </>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('probe: CreateSnapshotModal keyboard contract', () => {
  it('P1 opens with focus on the first interactive element and wraps Tab in DOM order', async () => {
    const user = userEvent.setup();
    render(<SnapshotHarness onCloseSpy={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'abrir snapshots' }));
    const dialog = screen.getByRole('dialog');
    const name = within(dialog).getByRole('textbox', { name: /nombre del snapshot/i });
    expect(name).toHaveFocus();
    await user.type(name, 'Pre_Test');
    const desc = within(dialog).getByRole('textbox', { name: /descripción del snapshot/i });
    const cancel = within(dialog).getByRole('button', { name: /cancelar/i });
    const save = within(dialog).getByRole('button', { name: /guardar snapshot/i });
    await user.tab();
    expect(desc).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(save).toHaveFocus();
    await user.tab();
    expect(name).toHaveFocus();
  });

  it('P2 Shift+Tab from the first element wraps to the last enabled element', async () => {
    const user = userEvent.setup();
    render(<SnapshotHarness onCloseSpy={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'abrir snapshots' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: /nombre del snapshot/i }), 'Pre_Test');
    await user.tab({ shift: true });
    expect(within(dialog).getByRole('button', { name: /guardar snapshot/i })).toHaveFocus();
  });

  it('P3 Escape closes once and returns focus to the exact trigger', async () => {
    const onCloseSpy = vi.fn();
    const user = userEvent.setup();
    render(<SnapshotHarness onCloseSpy={onCloseSpy} />);
    const trigger = screen.getByRole('button', { name: 'abrir snapshots' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it('P4 leaves no document keydown listener after closing (no ghost Escape closure)', async () => {
    const onCloseSpy = vi.fn();
    const user = userEvent.setup();
    render(<SnapshotHarness onCloseSpy={onCloseSpy} />);
    const trigger = screen.getByRole('button', { name: 'abrir snapshots' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(onCloseSpy).toHaveBeenCalledTimes(2);
    await user.keyboard('{Escape}');
    expect(onCloseSpy).toHaveBeenCalledTimes(2);
  });

  it('P5 Escape is swallowed while the request is in flight (modal not closable)', async () => {
    const onCloseSpy = vi.fn();
    let resolveCreate: (value: never) => void = () => {};
    vi.spyOn(snapshotService, 'createSnapshot').mockImplementation(() => new Promise((resolve) => {
      resolveCreate = resolve as (value: never) => void;
    }));
    const user = userEvent.setup();
    render(<SnapshotHarness onCloseSpy={onCloseSpy} />);
    const trigger = screen.getByRole('button', { name: 'abrir snapshots' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: /nombre del snapshot/i }), 'Pre_Test');
    await user.click(within(dialog).getByRole('button', { name: /guardar snapshot/i }));
    expect(within(dialog).getByRole('status')).toHaveTextContent('Enviando solicitud, esperá un momento.');
    expect(dialog.querySelector('[data-slot="modal"]')).not.toBeNull();
    expect(dialog.querySelector('form')).toHaveAttribute('aria-busy', 'true');
    expect(dialog.querySelector('form')).not.toContainElement(within(dialog).getByRole('status'));
    await user.tab();
    expect(dialog).toHaveFocus();
    await user.tab({ shift: true });
    expect(dialog).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onCloseSpy).not.toHaveBeenCalled();
    resolveCreate(undefined as never);
  });
});

describe('probe: AuditDetailModal keyboard contract', () => {
  it('P6 traps focus on its single action, closes on Escape and restores focus; no listener after unmount', async () => {
    const onCloseSpy = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>ver detalle</button>
          {open && <AuditDetailModal action="Login" details={{}} onClose={() => { onCloseSpy(); setOpen(false); }} />}
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'ver detalle' });
    await user.click(trigger);
    const close = screen.getByRole('button', { name: 'Cerrar detalle' });
    expect(close).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('P7 keeps Escape working when focus sits outside the dialog (global listener)', async () => {
    const onCloseSpy = vi.fn();
    const user = userEvent.setup();
    render(<AuditDetailModal action="Login" details={{}} onClose={onCloseSpy} />);
    (document.activeElement as HTMLElement | null)?.blur?.();
    await user.keyboard('{Escape}');
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });
});

describe('probe: submit path and overlay', () => {
  it('P14 closes on successful submit, restores focus to the trigger and sends a trimmed payload', async () => {
    const create = vi.spyOn(snapshotService, 'createSnapshot').mockResolvedValue({
      tareaId: 't-1',
      snapname: 'Pre_Test',
    } as never);
    const onCloseSpy = vi.fn();
    const user = userEvent.setup();
    render(<SnapshotHarness onCloseSpy={onCloseSpy} />);
    const trigger = screen.getByRole('button', { name: 'abrir snapshots' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: /nombre del snapshot/i }), '  Pre_Test  ');
    await user.type(within(dialog).getByRole('textbox', { name: /descripción del snapshot/i }), '  detalle  ');
    await user.click(within(dialog).getByRole('button', { name: /guardar snapshot/i }));
    expect(create).toHaveBeenCalledWith(101, { snapname: 'Pre_Test', description: 'detalle' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('P15 audit overlay click closes and restores focus; click inside keeps it open', async () => {
    const onCloseSpy = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>ver detalle</button>
          {open && <AuditDetailModal action="Login" details={{}} onClose={() => { onCloseSpy(); setOpen(false); }} />}
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'ver detalle' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(onCloseSpy).not.toHaveBeenCalled();
    await user.click(dialog.parentElement as HTMLElement);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it('P16 skips the disabled submit button in the tab cycle', async () => {
    const user = userEvent.setup();
    render(<SnapshotHarness onCloseSpy={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'abrir snapshots' }));
    const dialog = screen.getByRole('dialog');
    const name = within(dialog).getByRole('textbox', { name: /nombre del snapshot/i });
    const cancel = within(dialog).getByRole('button', { name: /cancelar/i });
    expect(within(dialog).getByRole('button', { name: /guardar snapshot/i })).toBeDisabled();
    await user.tab();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(name).toHaveFocus();
  });
});
