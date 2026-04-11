import { useState, useEffect, useCallback } from 'react';
import styles from './Contact.module.css';

export default function Contact() {
  const [form,     setForm]     = useState({ first_name: '', last_name: '', phone: '' });
  const [errors,   setErrors]   = useState({});
  const [status,   setStatus]   = useState('idle'); // idle | loading | success | error | missing
  const [contacts, setContacts] = useState([]);
  const [page,     setPage]     = useState(0);

  const ROWS = 7;

  const loadContacts = useCallback(() => {
    fetch('/api/contacts')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setContacts(data); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim())  e.last_name  = 'Required';
    if (!form.phone.trim())      e.phone      = 'Required';
    else if (!/^[\d\s\+\-\(\)]{6,}$/.test(form.phone)) e.phone = 'Invalid format';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setStatus('missing'); return; }
    setErrors({});
    setStatus('loading');
    try {
      const res  = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setForm({ first_name: '', last_name: '', phone: '' });
        setPage(0);
        loadContacts();
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus(data.error === 'missing_fields' ? 'missing' : 'error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const deleteContact = (id) => {
    fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      .then(() => loadContacts())
      .catch(() => {});
  };

  const clearAll = () => {
    if (!confirm('DELETE ALL CONTACTS — ARE YOU SURE?')) return;
    fetch('/api/contacts', { method: 'DELETE' })
      .then(() => { setPage(0); loadContacts(); })
      .catch(() => {});
  };

  const onChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(err => ({ ...err, [field]: '' }));
  };

  const totalPages = Math.max(1, Math.ceil(contacts.length / ROWS));
  const safePage   = Math.min(page, totalPages - 1);
  const slice      = contacts.slice(safePage * ROWS, safePage * ROWS + ROWS);

  return (
    <div className={styles.contact}>
      <div className={styles.header}>
        <div className={styles.tag}>// MODULE_02</div>
        <h2 className={styles.title}>
          CONTACT<span className={styles.accent}>_DB</span>
        </h2>
        <p className={styles.sub}>Insert a new record into the contacts database.</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelBar}>
          <span className={styles.panelTag}>INPUT_FORM.EXE</span>
          <span className={`${styles.panelTag} ${status === 'loading' ? styles.loading : ''}`}>
            {status === 'loading' ? '[ WRITING... ]' : '[ READY ]'}
          </span>
        </div>

        <div className={styles.form}>
          <div className={styles.row}>
            <Field label="F01 / FIRST_NAME" id="first_name" value={form.first_name}
              onChange={onChange('first_name')} error={errors.first_name} placeholder="JOHN" />
            <Field label="F02 / LAST_NAME" id="last_name" value={form.last_name}
              onChange={onChange('last_name')} error={errors.last_name} placeholder="DOE" />
          </div>
          <Field label="F03 / PHONE_NUMBER" id="phone" value={form.phone}
            onChange={onChange('phone')} error={errors.phone} placeholder="+30 210 000 0000" type="tel" />

          <button className={styles.submit} onClick={submit} disabled={status === 'loading'}>
            {status === 'loading'
              ? <><span>WRITING</span><span className={styles.dots}><span>.</span><span>.</span><span>.</span></span></>
              : 'WRITE_RECORD →'
            }
          </button>
        </div>

        {status === 'success' && (
          <div className={`${styles.msg} ${styles.msgSuccess}`}>
            <span>◉</span> RECORD COMMITTED — DB WRITE OK
          </div>
        )}
        {status === 'error' && (
          <div className={`${styles.msg} ${styles.msgError}`}>
            <span>✗</span> DATABASE ERROR — CHECK SERVER LOGS
          </div>
        )}
        {status === 'missing' && !Object.keys(errors).length && (
          <div className={`${styles.msg} ${styles.msgWarn}`}>
            <span>▸</span> VALIDATION FAILED — ALL FIELDS REQUIRED
          </div>
        )}
      </div>

      <div className={styles.schema}>
        <div className={styles.schemaTitle}>TABLE: contacts_db.contacts</div>
        {[
          ['id',         'INT AUTO_INCREMENT PK'],
          ['first_name', 'VARCHAR(100) NOT NULL'],
          ['last_name',  'VARCHAR(100) NOT NULL'],
          ['phone',      'VARCHAR(50)  NOT NULL'],
          ['created_at', 'TIMESTAMP DEFAULT NOW()'],
        ].map(([col, type]) => (
          <div key={col} className={styles.schemaRow}>
            <span className={styles.schemaCol}>{col}</span>
            <span className={styles.schemaType}>{type}</span>
          </div>
        ))}
      </div>

      {/* ── Contacts Table ── */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTag}>// STORED_RECORDS</span>
          <div className={styles.tableHeaderRight}>
            {contacts.length > 0 && (
              <span className={styles.recordCount}>{contacts.length} RECORD{contacts.length !== 1 ? 'S' : ''}</span>
            )}
            {contacts.length > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>CLEAR_ALL</button>
            )}
          </div>
        </div>
        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>#</th>
                <th className={styles.th}>FIRST_NAME</th>
                <th className={styles.th}>LAST_NAME</th>
                <th className={styles.th}>PHONE</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr><td colSpan={5} className={styles.tdEmpty}>NO RECORDS FOUND</td></tr>
              ) : slice.map((c, i) => (
                <tr key={c.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdMuted}`}>{safePage * ROWS + i + 1}</td>
                  <td className={styles.td}>{c.first_name}</td>
                  <td className={styles.td}>{c.last_name}</td>
                  <td className={styles.td}>{c.phone}</td>
                  <td className={styles.td}>
                    <button className={styles.delBtn} onClick={() => deleteContact(c.id)} title="Delete">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.pgInfo}>PAGE {safePage + 1} / {totalPages}</span>
              <div className={styles.pgBtns}>
                <button className={styles.pgBtn} onClick={() => setPage(p => p - 1)} disabled={safePage === 0}>← PREV</button>
                <button className={styles.pgBtn} onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages - 1}>NEXT →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <div className={`${styles.field} ${error ? styles.fieldErr : ''}`}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={onChange}
        className={styles.input} placeholder={placeholder} spellCheck={false} />
      {error && <div className={styles.error}>▸ {error}</div>}
    </div>
  );
}
