import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';
import { StatusPanel } from '../components/StatusPanel';

describe('StatusPanel', () => {
  it('renders a successful response only when backed by API data', () => {
    render(<StatusPanel health={{ service: 'restaurantos-api', status: 'ok', version: 'v1' }} isPending={false} isError={false} isFetching={false} onRetry={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent(/connectée/i);
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('shows connection errors and invokes retry', () => {
    const retry = vi.fn();
    render(<StatusPanel isPending={false} isError={true} isFetching={false} onRetry={retry} />);
    expect(screen.getByRole('status')).toHaveTextContent(/indisponible/i);
    expect(screen.queryByText('v1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('disables retry while fetching and announces checking', () => {
    render(<StatusPanel isPending={true} isError={false} isFetching={true} onRetry={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent(/vérification/i);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
