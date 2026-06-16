import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadModal from '@/components/UploadModal';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UploadModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    customerSlug: 'test-customer',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<UploadModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the form elements when isOpen is true', () => {
    render(<UploadModal {...defaultProps} />);
    
    expect(screen.getByText('Upload HTML Document')).toBeInTheDocument();
    expect(screen.getByLabelText(/document title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/url slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select html file/i)).toBeInTheDocument();
    const uploadBtn = screen.getByRole('button', { name: /upload/i });
    expect(uploadBtn).toBeInTheDocument();
    expect(uploadBtn).toHaveClass('bg-zinc-900');
  });

  it('validates required fields on submit', async () => {
    render(<UploadModal {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/document title/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByLabelText(/url slug/i), { target: { value: 'test-slug' } });
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));
    
    expect(await screen.findByText('Please select a file to upload.')).toBeInTheDocument();
  });

  it('validates file extension', async () => {
    render(<UploadModal {...defaultProps} />);
    
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/select html file/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));
    
    expect(await screen.findByText('Only HTML files are allowed.')).toBeInTheDocument();
  });

  it('successfully uploads file and invokes callbacks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<UploadModal {...defaultProps} />);
    
    const file = new File(['<h1>hello</h1>'], 'test.html', { type: 'text/html' });
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/document title/i), { target: { value: 'My Document' } });
    fireEvent.change(screen.getByLabelText(/url slug/i), { target: { value: 'my-doc' } });
    fireEvent.change(screen.getByLabelText(/tags/i), { target: { value: 'test, doc' } });
    fireEvent.change(screen.getByLabelText(/select html file/i), { target: { files: [file] } });
    
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/workspace/test-customer/files',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Verify request body contains file contents
    const lastFetchCallArgs = mockFetch.mock.calls[0];
    const formData = lastFetchCallArgs[1].body as FormData;
    expect(formData.get('title')).toBe('My Document');
    expect(formData.get('slug')).toBe('my-doc');
    expect(formData.get('tags')).toBe('test, doc');
    const fileObj = formData.get('file') as File;
    expect(fileObj).toBeInstanceOf(File);
    expect(fileObj.name).toBe('test.html');

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('displays API error message on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'A file with this slug already exists for this customer' }),
    });

    render(<UploadModal {...defaultProps} />);
    
    const file = new File(['<h1>hello</h1>'], 'test.html', { type: 'text/html' });
    
    fireEvent.change(screen.getByLabelText(/document title/i), { target: { value: 'My Document' } });
    fireEvent.change(screen.getByLabelText(/url slug/i), { target: { value: 'my-doc' } });
    fireEvent.change(screen.getByLabelText(/select html file/i), { target: { files: [file] } });
    
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(await screen.findByText('A file with this slug already exists for this customer')).toBeInTheDocument();
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });
});
