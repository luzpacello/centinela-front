import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AuditDetailModal } from '@/components/features/audit/AuditDetailModal';
import LoginForm from '@/components/features/auth/components/LoginForm';
import { createMemoryRouter, RouterProvider } from 'react-router';

describe('modal accessibility', () => {
  it('focuses the audit dialog, traps keyboard focus and restores it on Escape', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open details</button><button>Outside</button>{open && <AuditDetailModal action="Login" details={{}} onClose={() => setOpen(false)} />}</>;
    }
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open details' });
    await user.click(trigger);
    const close = screen.getByRole('button', { name: 'Cerrar detalle' });
    expect(close).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('restores focus when the audit dialog is closed by its backdrop', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open details</button>{open && <AuditDetailModal action="Login" details={{}} onClose={() => setOpen(false)} />}</>;
    }
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open details' });
    await user.click(trigger);
    const backdrop = screen.getByRole('dialog').parentElement;
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

it('keeps a visible focus indicator on the login submit button', () => {
  const router = createMemoryRouter([{ path: '/', element: <LoginForm /> }]);
  render(<RouterProvider router={router} />);
  expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toHaveClass('focus-visible:ring-4');
});
