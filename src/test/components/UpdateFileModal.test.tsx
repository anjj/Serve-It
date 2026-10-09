import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpdateFileModal from '@/components/UpdateFileModal';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UpdateFileModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    customerSlug: 'test-customer',
    fileRecord: {
      id: 'file-123',
      title: 'Existing Spec',
      slug: 'existing-spec',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false or fileRecord is null', () => {
    const { container: container1 } = render(<UpdateFileModal {...defaultProps} isOpen={false} />);
    expect(container1).toBeEmptyDOMElement();

    const { container: container2 } = render(<UpdateFileModal {...defaultProps} fileRecord={null} />);
    expect(container2).toBeEmptyDOMElement();
  });

  it('renders modal with target file information when isOpen is true', () => {
    render(<UpdateFileModal {...defaultProps} />);

    expect(screen.getByText('Update HTML Document')).toBeInTheDocument();
    expect(screen.getByText(/Document: Existing Spec/i)).toBeInTheDocument();
    expect(screen.getByText(/URL Path: \/s\/test-customer\/existing-spec/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select new html file/i)).toBeInTheDocument();
  });

  it('validates file selection on submit', async () => {
    render(<UpdateFileModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /update file/i }));

    expect(await screen.findByText('Please select an HTML file to update.')).toBeInTheDocument();
  });

  it('validates file extension', async () => {
    render(<UpdateFileModal {...defaultProps} />);

    const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/select new html file/i);

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /update file/i }));

    expect(await screen.findByText('Only HTML files are allowed.')).toBeInTheDocument();
  });

  it('successfully updates file and invokes callbacks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<UpdateFileModal {...defaultProps} />);

    const file = new File(['<h1>Updated HTML</h1>'], 'updated.html', { type: 'text/html' });
    fireEvent.change(screen.getByLabelText(/select new html file/i), { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /update file/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/workspace/test-customer/files',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    const lastFetchCallArgs = mockFetch.mock.calls[0];
    const formData = lastFetchCallArgs[1].body as FormData;
    expect(formData.get('fileId')).toBe('file-123');
    expect(formData.get('slug')).toBe('existing-spec');
    const uploadedFile = formData.get('file') as File;
    expect(uploadedFile).toBeInstanceOf(File);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
