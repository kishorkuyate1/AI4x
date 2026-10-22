'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

const initialForm = {
  environment: 'Web',
  severity: 'S3',
  steps: '',
  logs: '',
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fileLabel = useMemo(() => {
    if (!file) return 'No file selected';
    return `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  }, [file]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError('');

    if (selected && selected.type.startsWith('image/')) {
      const nextUrl = URL.createObjectURL(selected);
      setPreview(nextUrl);
      return;
    }

    setPreview(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError('Please choose a screenshot first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    const payload = new FormData();
    payload.append('file', file);
    payload.append('environment', form.environment);
    payload.append('severity', form.severity);
    payload.append('steps', form.steps);
    payload.append('logs', form.logs);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Request failed');
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Submission failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="container">
        <header className="topbar">
          <div>
            <p className="eyebrow">QA automation</p>
            <h1>Screenshot Bug Reporter</h1>
          </div>
          <span className="pill">Light mode</span>
        </header>

        <section className="panel-grid">
          <form className="panel form-panel" onSubmit={onSubmit}>
            <div className="field-group">
              <label htmlFor="file">Screenshot upload</label>
              <input id="file" type="file" accept="image/*" onChange={onFileChange} />
              <div className="file-meta">{fileLabel}</div>
            </div>

            {preview ? (
              <div className="preview-wrap">
                <img src={preview} alt="Selected screenshot preview" className="preview-image" />
              </div>
            ) : null}

            <div className="grid two">
              <div className="field-group">
                <label htmlFor="environment">Environment</label>
                <select
                  id="environment"
                  value={form.environment}
                  onChange={(event) => setForm({ ...form, environment: event.target.value })}
                >
                  <option value="Web">Web</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Desktop">Desktop</option>
                  <option value="API">API</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="severity">Severity guess</label>
                <select
                  id="severity"
                  value={form.severity}
                  onChange={(event) => setForm({ ...form, severity: event.target.value })}
                >
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                  <option value="S4">S4</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="steps">Steps to reproduce</label>
              <textarea
                id="steps"
                rows={4}
                placeholder="1. Open the dashboard..."
                value={form.steps}
                onChange={(event) => setForm({ ...form, steps: event.target.value })}
              />
            </div>

            <div className="field-group">
              <label htmlFor="logs">Error logs</label>
              <textarea
                id="logs"
                rows={5}
                placeholder="Paste any stack trace or console logs here..."
                value={form.logs}
                onChange={(event) => setForm({ ...form, logs: event.target.value })}
              />
            </div>

            {error ? <div className="message error">{error}</div> : null}

            <button type="submit" className="primary-btn" disabled={loading || !file}>
              {loading ? 'Creating bug report...' : 'Submit to Jira'}
            </button>
          </form>

          <aside className="panel output-panel">
            <div className="status-header">
              <h2>Response</h2>
              <span className="status-dot" />
            </div>

            {result ? (
              <pre>{result}</pre>
            ) : (
              <div className="empty-state">
                <p>No bug report yet.</p>
                <small>Upload a screenshot and submit to generate an issue.</small>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
