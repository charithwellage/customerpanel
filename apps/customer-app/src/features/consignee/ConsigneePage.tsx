import React, { useEffect, useState } from 'react';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerOnlineStatus } from '../pwa/useCustomerOnlineStatus.js';
import './consignee.css';

export interface ConsigneeRecord {
  id: string;
  name: string;
  contactPerson?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email?: string;
  taxId?: string;
  isDefault: boolean;
}

export interface NotifyPartyRecord {
  id: string;
  name: string;
  contactPerson?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email?: string;
  isDefault: boolean;
}

export const LOCAL_STORAGE_CONSIGNEES_KEY = 'carchief_customer_consignees';
export const LOCAL_STORAGE_NOTIFY_PARTIES_KEY = 'carchief_customer_notify_parties';

export const INITIAL_CONSIGNEES: ConsigneeRecord[] = [
  {
    id: 'c-1',
    name: 'ZAIB TRADERS LTD',
    contactPerson: 'Mr. Farhan Zaib (Director)',
    address: '#18, Banda Bond #W0474, Opposite Nabisunsa Close, Banda, Jinja Road',
    city: 'Kampala',
    country: 'Uganda',
    phone: '+256-0743 77771',
    email: 'info@zaibtraders.com',
    taxId: 'URA-TIN 1002948192',
    isDefault: true,
  },
  {
    id: 'c-2',
    name: 'CAR CHIEF LOGISTICS AFRICA LTD',
    contactPerson: 'Operations Desk',
    address: 'Plot 42, Port Bell Road, Industrial Area',
    city: 'Kampala',
    country: 'Uganda',
    phone: '+256-7012 34567',
    email: 'logistics@carchief.com',
    taxId: 'URA-TIN 1009823145',
    isDefault: false,
  },
];

export const INITIAL_NOTIFY_PARTIES: NotifyPartyRecord[] = [
  {
    id: 'np-1',
    name: 'ALPHA CUSTOMS CLEARING & FORWARDING AGENTS',
    contactPerson: 'Mr. David Mukasa',
    address: 'Cargo Village Warehouse #4, Entebbe International Airport',
    city: 'Entebbe',
    country: 'Uganda',
    phone: '+256-7821 99880',
    email: 'clearing@alphacargo.ug',
    isDefault: true,
  },
  {
    id: 'np-2',
    name: 'EAST AFRICA FREIGHT LOGISTICS CORP',
    contactPerson: 'Port Operations Mombasa Desk',
    address: 'Kilindini Port Gate 5, Southern Bypass',
    city: 'Mombasa',
    country: 'Kenya',
    phone: '+254-711 987654',
    email: 'ops@eafreight.co.ke',
    isDefault: false,
  },
];

export function loadSavedConsignees(): ConsigneeRecord[] {
  if (typeof window === 'undefined') return INITIAL_CONSIGNEES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONSIGNEES_KEY);
    if (!raw) return INITIAL_CONSIGNEES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONSIGNEES;
  } catch {
    return INITIAL_CONSIGNEES;
  }
}

export function loadSavedNotifyParties(): NotifyPartyRecord[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFY_PARTIES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTIFY_PARTIES_KEY);
    if (!raw) return INITIAL_NOTIFY_PARTIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_NOTIFY_PARTIES;
  } catch {
    return INITIAL_NOTIFY_PARTIES;
  }
}

const emptyConsigneeForm: Omit<ConsigneeRecord, 'id'> = {
  name: '',
  contactPerson: '',
  address: '',
  city: 'Kampala',
  country: 'Uganda',
  phone: '',
  email: '',
  taxId: '',
  isDefault: false,
};

const emptyNotifyPartyForm: Omit<NotifyPartyRecord, 'id'> = {
  name: '',
  contactPerson: '',
  address: '',
  city: 'Kampala',
  country: 'Uganda',
  phone: '',
  email: '',
  isDefault: false,
};

export const ConsigneePage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const online = useCustomerOnlineStatus();

  const [activeTab, setActiveTab] = useState<'consignees' | 'notifyParties'>('consignees');
  const [searchQuery, setSearchQuery] = useState('');
  const [consignees, setConsignees] = useState<ConsigneeRecord[]>(loadSavedConsignees);
  const [notifyParties, setNotifyParties] = useState<NotifyPartyRecord[]>(loadSavedNotifyParties);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [isConsigneeFormOpen, setIsConsigneeFormOpen] = useState(false);
  const [editingConsigneeId, setEditingConsigneeId] = useState<string | null>(null);
  const [consigneeForm, setConsigneeForm] = useState(emptyConsigneeForm);

  const [isNotifyPartyFormOpen, setIsNotifyPartyFormOpen] = useState(false);
  const [editingNotifyPartyId, setEditingNotifyPartyId] = useState<string | null>(null);
  const [notifyPartyForm, setNotifyPartyForm] = useState(emptyNotifyPartyForm);

  useEffect(() => {
    setActiveRoute('/consignee');
  }, [setActiveRoute]);

  const handleCloseConsigneeForm = () => {
    setIsConsigneeFormOpen(false);
    setEditingConsigneeId(null);
    setConsigneeForm(emptyConsigneeForm);
  };

  const handleCloseNotifyPartyForm = () => {
    setIsNotifyPartyFormOpen(false);
    setEditingNotifyPartyId(null);
    setNotifyPartyForm(emptyNotifyPartyForm);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isConsigneeFormOpen) handleCloseConsigneeForm();
        if (isNotifyPartyFormOpen) handleCloseNotifyPartyForm();
      }
    };
    if (isConsigneeFormOpen || isNotifyPartyFormOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isConsigneeFormOpen, isNotifyPartyFormOpen]);

  const defaultConsignee = consignees.find((c) => c.isDefault) || consignees[0];
  const defaultNotifyParty = notifyParties.find((np) => np.isDefault) || notifyParties[0];

  const persistConsignees = (updated: ConsigneeRecord[]) => {
    setConsignees(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CONSIGNEES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const persistNotifyParties = (updated: NotifyPartyRecord[]) => {
    setNotifyParties(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIFY_PARTIES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSetDefaultConsignee = (id: string) => {
    const updated = consignees.map((c) => ({
      ...c,
      isDefault: c.id === id,
    }));
    persistConsignees(updated);
    const target = updated.find((c) => c.id === id);
    setFeedback({
      type: 'success',
      message: `"${target?.name}" is now configured as your Default Consignee for vehicle documentation.`,
    });
  };

  const handleSetDefaultNotifyParty = (id: string) => {
    const updated = notifyParties.map((np) => ({
      ...np,
      isDefault: np.id === id,
    }));
    persistNotifyParties(updated);
    const target = updated.find((np) => np.id === id);
    setFeedback({
      type: 'success',
      message: `"${target?.name}" is now configured as your Default Notify Party for shipping lines.`,
    });
  };

  const handleDeleteConsignee = (id: string) => {
    if (consignees.length <= 1) {
      setFeedback({
        type: 'error',
        message: 'At least one consignee must remain on file for shipping documentation.',
      });
      return;
    }
    const target = consignees.find((c) => c.id === id);
    const remaining = consignees.filter((c) => c.id !== id);
    if (target?.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }
    persistConsignees(remaining);
    setFeedback({
      type: 'success',
      message: `Consignee "${target?.name}" has been removed.`,
    });
  };

  const handleDeleteNotifyParty = (id: string) => {
    if (notifyParties.length <= 1) {
      setFeedback({
        type: 'error',
        message: 'At least one notify party must remain on file for shipping line advisories.',
      });
      return;
    }
    const target = notifyParties.find((np) => np.id === id);
    const remaining = notifyParties.filter((np) => np.id !== id);
    if (target?.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }
    persistNotifyParties(remaining);
    setFeedback({
      type: 'success',
      message: `Notify Party "${target?.name}" has been removed.`,
    });
  };

  const handleOpenAddConsignee = () => {
    setEditingConsigneeId(null);
    setConsigneeForm({
      ...emptyConsigneeForm,
      isDefault: consignees.length === 0,
    });
    setIsConsigneeFormOpen(true);
    setFeedback(null);
  };

  const handleOpenEditConsignee = (record: ConsigneeRecord) => {
    setEditingConsigneeId(record.id);
    setConsigneeForm({
      name: record.name,
      contactPerson: record.contactPerson || '',
      address: record.address,
      city: record.city,
      country: record.country,
      phone: record.phone,
      email: record.email || '',
      taxId: record.taxId || '',
      isDefault: record.isDefault,
    });
    setIsConsigneeFormOpen(true);
    setFeedback(null);
  };

  const handleSaveConsignee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consigneeForm.name.trim() || !consigneeForm.address.trim() || !consigneeForm.city.trim() || !consigneeForm.country.trim() || !consigneeForm.phone.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please complete all mandatory fields (Entity Name, Address, City, Country, Phone).',
      });
      return;
    }

    let updated: ConsigneeRecord[];
    if (editingConsigneeId) {
      updated = consignees.map((c) => {
        if (c.id === editingConsigneeId) {
          return { ...c, ...consigneeForm };
        }
        return consigneeForm.isDefault ? { ...c, isDefault: false } : c;
      });
    } else {
      const newRecord: ConsigneeRecord = {
        id: `c-${Date.now()}`,
        ...consigneeForm,
      };
      if (newRecord.isDefault || consignees.length === 0) {
        newRecord.isDefault = true;
        updated = [...consignees.map((c) => ({ ...c, isDefault: false })), newRecord];
      } else {
        updated = [...consignees, newRecord];
      }
    }

    persistConsignees(updated);
    handleCloseConsigneeForm();
    if (activeTab !== 'consignees') {
      setActiveTab('consignees');
    }
    setFeedback({
      type: 'success',
      message: editingConsigneeId ? 'Consignee details updated successfully.' : 'New consignee added successfully.',
    });
  };

  const handleOpenAddNotifyParty = () => {
    setEditingNotifyPartyId(null);
    setNotifyPartyForm({
      ...emptyNotifyPartyForm,
      isDefault: notifyParties.length === 0,
    });
    setIsNotifyPartyFormOpen(true);
    setFeedback(null);
  };

  const handleOpenEditNotifyParty = (record: NotifyPartyRecord) => {
    setEditingNotifyPartyId(record.id);
    setNotifyPartyForm({
      name: record.name,
      contactPerson: record.contactPerson || '',
      address: record.address,
      city: record.city,
      country: record.country,
      phone: record.phone,
      email: record.email || '',
      isDefault: record.isDefault,
    });
    setIsNotifyPartyFormOpen(true);
    setFeedback(null);
  };

  const handleSaveNotifyParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyPartyForm.name.trim() || !notifyPartyForm.address.trim() || !notifyPartyForm.city.trim() || !notifyPartyForm.country.trim() || !notifyPartyForm.phone.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please complete all mandatory fields (Notify Party Name, Address, City, Country, Phone).',
      });
      return;
    }

    let updated: NotifyPartyRecord[];
    if (editingNotifyPartyId) {
      updated = notifyParties.map((np) => {
        if (np.id === editingNotifyPartyId) {
          return { ...np, ...notifyPartyForm };
        }
        return notifyPartyForm.isDefault ? { ...np, isDefault: false } : np;
      });
    } else {
      const newRecord: NotifyPartyRecord = {
        id: `np-${Date.now()}`,
        ...notifyPartyForm,
      };
      if (newRecord.isDefault || notifyParties.length === 0) {
        newRecord.isDefault = true;
        updated = [...notifyParties.map((np) => ({ ...np, isDefault: false })), newRecord];
      } else {
        updated = [...notifyParties, newRecord];
      }
    }

    persistNotifyParties(updated);
    handleCloseNotifyPartyForm();
    if (activeTab !== 'notifyParties') {
      setActiveTab('notifyParties');
    }
    setFeedback({
      type: 'success',
      message: editingNotifyPartyId ? 'Notify party details updated successfully.' : 'New notify party added successfully.',
    });
  };

  const handleCopyFromDefaultConsignee = () => {
    if (defaultConsignee) {
      setNotifyPartyForm((prev) => ({
        ...prev,
        name: defaultConsignee.name,
        contactPerson: defaultConsignee.contactPerson || '',
        address: defaultConsignee.address,
        city: defaultConsignee.city,
        country: defaultConsignee.country,
        phone: defaultConsignee.phone,
        email: defaultConsignee.email || '',
      }));
      setFeedback({
        type: 'success',
        message: 'Details copied from current default consignee.',
      });
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredConsignees = consignees.filter((c) => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(query)) ||
      c.city.toLowerCase().includes(query) ||
      c.country.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query)
    );
  });

  const filteredNotifyParties = notifyParties.filter((np) => {
    if (!query) return true;
    return (
      np.name.toLowerCase().includes(query) ||
      (np.contactPerson && np.contactPerson.toLowerCase().includes(query)) ||
      np.city.toLowerCase().includes(query) ||
      np.country.toLowerCase().includes(query) ||
      np.phone.toLowerCase().includes(query)
    );
  });

  return (
    <section className="cc-consignee-module" aria-labelledby="consignee-page-title">
      <h1 id="consignee-page-title" className="visually-hidden">Consignee &amp; Notify Party Management</h1>

      {/* Top Hero Banner */}
      <header className="cc-consignee-hero">
        <div className="cc-consignee-hero__top">
          <div className="cc-consignee-hero__main">
            <div className="cc-consignee-hero__icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="cc-consignee-hero__titles">
              <div className="cc-consignee-hero__title-row">
                <h2 className="cc-consignee-page-heading">
                  CONSIGNEE &amp; <span className="cc-consignee-heading-highlight">NOTIFY PARTY</span>
                </h2>
                <div className="cc-consignee-badges">
                  <span className="cc-consignee-badge cc-consignee-badge--doc">SHIPPING &amp; LOGISTICS</span>
                  <span className="cc-consignee-badge cc-consignee-badge--status">B/L READY</span>
                </div>
              </div>
              <p className="cc-consignee-hero__sub">
                Manage registered Bill of Lading (B/L) consignees and clearing agent notify parties for automated vehicle shipment manifests.
              </p>
            </div>
          </div>
        </div>

        {/* 4-Card Quick Metrics Ribbon */}
        <div className="cc-consignee-metrics-ribbon">
          <div 
            className="cc-consignee-metric-card" 
            title={defaultConsignee ? `${defaultConsignee.name} — ${defaultConsignee.city}, ${defaultConsignee.country}` : 'No default consignee selected'}
          >
            <div className="cc-consignee-metric-icon cc-consignee-metric-icon--consignee" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="cc-consignee-metric-info">
              <span className="cc-consignee-metric-label">DEFAULT CONSIGNEE</span>
              <span className="cc-consignee-metric-val">{defaultConsignee ? defaultConsignee.name : 'None Selected'}</span>
              <span className="cc-consignee-metric-tag cc-consignee-metric-tag--success">
                {defaultConsignee ? `${defaultConsignee.city}, ${defaultConsignee.country}` : 'Action Required'}
              </span>
            </div>
          </div>

          <div 
            className="cc-consignee-metric-card"
            title={defaultNotifyParty ? `${defaultNotifyParty.name} — ${defaultNotifyParty.city}, ${defaultNotifyParty.country}` : 'No default notify party selected'}
          >
            <div className="cc-consignee-metric-icon cc-consignee-metric-icon--notify" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="cc-consignee-metric-info">
              <span className="cc-consignee-metric-label">DEFAULT NOTIFY PARTY</span>
              <span className="cc-consignee-metric-val">{defaultNotifyParty ? defaultNotifyParty.name : 'None Selected'}</span>
              <span className="cc-consignee-metric-tag cc-consignee-metric-tag--info">
                {defaultNotifyParty ? `${defaultNotifyParty.city}, ${defaultNotifyParty.country}` : 'Action Required'}
              </span>
            </div>
          </div>

          <div 
            className="cc-consignee-metric-card"
            title={`${consignees.length} Consignees and ${notifyParties.length} Notify Parties stored in Client Vault`}
          >
            <div className="cc-consignee-metric-icon cc-consignee-metric-icon--count" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="cc-consignee-metric-info">
              <span className="cc-consignee-metric-label">SAVED PARTIES</span>
              <span className="cc-consignee-metric-val">{consignees.length} Consignees &bull; {notifyParties.length} Notify</span>
              <span className="cc-consignee-metric-tag cc-consignee-metric-tag--neutral">Client Vault</span>
            </div>
          </div>

          <div 
            className="cc-consignee-metric-card"
            title="Manifest Status: 100% Export Ready — Consignee & Notify party auto-assigned to BL manifests"
          >
            <div className="cc-consignee-metric-icon cc-consignee-metric-icon--compliance" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="cc-consignee-metric-info">
              <span className="cc-consignee-metric-label">MANIFEST STATUS</span>
              <span className="cc-consignee-metric-val">100% Export Ready</span>
              <span className="cc-consignee-metric-tag cc-consignee-metric-tag--success">Auto-Assigned</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="cc-consignee-content-card">
        {feedback && (
          <div className={`cc-consignee-alert ${feedback.type === 'success' ? 'cc-consignee-alert--success' : 'cc-consignee-alert--error'}`} role="status">
            {feedback.message}
          </div>
        )}

        {/* Toolbar: Tabs, Search, and Add Action */}
        <div className="cc-consignee-toolbar">
          <div className="cc-consignee-tabs" role="tablist" aria-label="Consignee and Notify Party Navigation">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'consignees'}
              className={`cc-consignee-tab ${activeTab === 'consignees' ? 'cc-consignee-tab--active' : ''}`}
              onClick={() => {
                setActiveTab('consignees');
                setFeedback(null);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Consignees</span>
              <span className="cc-consignee-count-badge">{consignees.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'notifyParties'}
              className={`cc-consignee-tab ${activeTab === 'notifyParties' ? 'cc-consignee-tab--active' : ''}`}
              onClick={() => {
                setActiveTab('notifyParties');
                setFeedback(null);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Notify Parties</span>
              <span className="cc-consignee-count-badge">{notifyParties.length}</span>
            </button>
          </div>

          <div className="cc-consignee-toolbar-right">
            <div className="cc-consignee-search-wrap">
              <svg className="cc-consignee-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="cc-consignee-search-input"
                placeholder={activeTab === 'consignees' ? 'Search consignees by name, city, phone…' : 'Search notify parties by agent, city…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="cc-consignee-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="cc-consignee-toolbar-actions">
              <button
                type="button"
                className={`cc-consignee-btn ${activeTab === 'consignees' ? 'cc-consignee-btn--primary' : 'cc-consignee-btn--secondary'} cc-consignee-btn--add`}
                onClick={handleOpenAddConsignee}
                title="Add new consignee entity (opens pop-up dialog)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>ADD CONSIGNEE</span>
              </button>

              <button
                type="button"
                className={`cc-consignee-btn ${activeTab === 'notifyParties' ? 'cc-consignee-btn--primary' : 'cc-consignee-btn--secondary'} cc-consignee-btn--add`}
                onClick={handleOpenAddNotifyParty}
                title="Add new notify party clearing agent (opens pop-up dialog)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>ADD NOTIFY PARTY</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: CONSIGNEES */}
        {activeTab === 'consignees' && (
          <div className="cc-consignee-tab-panel" role="tabpanel">
            <div className="cc-consignee-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>
                The <strong>Default Consignee</strong> is printed on the primary Bill of Lading (B/L) and vehicle export certificate. Any vehicle purchased will automatically adopt the selected default consignee.
              </p>
            </div>

            {/* List of Consignees */}
            <div className="cc-consignee-list">
              {filteredConsignees.map((item) => (
                <article
                  key={item.id}
                  className={`cc-consignee-item ${item.isDefault ? 'cc-consignee-item--default' : ''}`}
                >
                  <div className="cc-consignee-item__header">
                    <div className="cc-consignee-item__left">
                      {/* Interactive Radio Button for Default */}
                      <label className="cc-consignee-radio-label" title={item.isDefault ? 'Active Default Consignee' : 'Click to make this the default consignee'}>
                        <input
                          type="radio"
                          name="default-consignee-selection"
                          checked={item.isDefault}
                          onChange={() => handleSetDefaultConsignee(item.id)}
                          className="cc-consignee-radio"
                        />
                        <span className="cc-consignee-item__name">{item.name}</span>
                      </label>

                      {item.isDefault && (
                        <span className="cc-consignee-default-tag">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          DEFAULT CONSIGNEE
                        </span>
                      )}
                    </div>

                    <div className="cc-consignee-item__actions">
                      {!item.isDefault && (
                        <button
                          type="button"
                          className="cc-consignee-action-btn cc-consignee-action-btn--make-default"
                          onClick={() => handleSetDefaultConsignee(item.id)}
                          title="Select as default consignee"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Make Default</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="cc-consignee-action-btn cc-consignee-action-btn--edit"
                        onClick={() => handleOpenEditConsignee(item)}
                        title="Edit details"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="cc-consignee-action-btn cc-consignee-action-btn--delete"
                        onClick={() => handleDeleteConsignee(item.id)}
                        title="Delete consignee"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <div className="cc-consignee-item__body">
                    {item.contactPerson && (
                      <div className="cc-consignee-data-tile">
                        <span className="cc-consignee-data-label">ATTENTION / CONTACT</span>
                        <span className="cc-consignee-data-val">{item.contactPerson}</span>
                      </div>
                    )}
                    <div className="cc-consignee-data-tile">
                      <span className="cc-consignee-data-label">PHONE NUMBER</span>
                      <span className="cc-consignee-data-val">{item.phone}</span>
                    </div>
                    {item.email && (
                      <div className="cc-consignee-data-tile">
                        <span className="cc-consignee-data-label">EMAIL ADDRESS</span>
                        <span className="cc-consignee-data-val">{item.email}</span>
                      </div>
                    )}
                    <div className="cc-consignee-data-tile cc-consignee-data-tile--wide">
                      <span className="cc-consignee-data-label">DESTINATION ADDRESS</span>
                      <span className="cc-consignee-data-val">{item.address}, {item.city}, {item.country}</span>
                    </div>
                    {item.taxId && (
                      <div className="cc-consignee-data-tile">
                        <span className="cc-consignee-data-label">TAX / REG ID</span>
                        <span className="cc-consignee-data-val cc-consignee-data-val--code">{item.taxId}</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {filteredConsignees.length === 0 && (
                <div className="cc-consignee-empty">
                  <p>No consignees found matching &quot;{searchQuery}&quot;.</p>
                  <button type="button" className="cc-consignee-btn cc-consignee-btn--secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: NOTIFY PARTIES */}
        {activeTab === 'notifyParties' && (
          <div className="cc-consignee-tab-panel" role="tabpanel">
            <div className="cc-consignee-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>
                The <strong>Default Notify Party</strong> (clearing agent or logistics firm) is alerted by shipping carriers upon vessel arrival at port. Select which agent should receive delivery advice notes.
              </p>
            </div>

            {/* List of Notify Parties */}
            <div className="cc-consignee-list">
              {filteredNotifyParties.map((item) => (
                <article
                  key={item.id}
                  className={`cc-consignee-item ${item.isDefault ? 'cc-consignee-item--default' : ''}`}
                >
                  <div className="cc-consignee-item__header">
                    <div className="cc-consignee-item__left">
                      {/* Interactive Radio Button for Default */}
                      <label className="cc-consignee-radio-label" title={item.isDefault ? 'Active Default Notify Party' : 'Click to make this the default notify party'}>
                        <input
                          type="radio"
                          name="default-notify-party-selection"
                          checked={item.isDefault}
                          onChange={() => handleSetDefaultNotifyParty(item.id)}
                          className="cc-consignee-radio"
                        />
                        <span className="cc-consignee-item__name">{item.name}</span>
                      </label>

                      {item.isDefault && (
                        <span className="cc-consignee-default-tag">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          DEFAULT NOTIFY PARTY
                        </span>
                      )}
                    </div>

                    <div className="cc-consignee-item__actions">
                      {!item.isDefault && (
                        <button
                          type="button"
                          className="cc-consignee-action-btn cc-consignee-action-btn--make-default"
                          onClick={() => handleSetDefaultNotifyParty(item.id)}
                          title="Select as default notify party"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Make Default</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="cc-consignee-action-btn cc-consignee-action-btn--edit"
                        onClick={() => handleOpenEditNotifyParty(item)}
                        title="Edit details"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="cc-consignee-action-btn cc-consignee-action-btn--delete"
                        onClick={() => handleDeleteNotifyParty(item.id)}
                        title="Delete notify party"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <div className="cc-consignee-item__body">
                    {item.contactPerson && (
                      <div className="cc-consignee-data-tile">
                        <span className="cc-consignee-data-label">PORT AGENT / CONTACT</span>
                        <span className="cc-consignee-data-val">{item.contactPerson}</span>
                      </div>
                    )}
                    <div className="cc-consignee-data-tile">
                      <span className="cc-consignee-data-label">PHONE NUMBER</span>
                      <span className="cc-consignee-data-val">{item.phone}</span>
                    </div>
                    {item.email && (
                      <div className="cc-consignee-data-tile">
                        <span className="cc-consignee-data-label">ADVICE EMAIL</span>
                        <span className="cc-consignee-data-val">{item.email}</span>
                      </div>
                    )}
                    <div className="cc-consignee-data-tile cc-consignee-data-tile--wide">
                      <span className="cc-consignee-data-label">OFFICE / CLEARING ADDRESS</span>
                      <span className="cc-consignee-data-val">{item.address}, {item.city}, {item.country}</span>
                    </div>
                  </div>
                </article>
              ))}

              {filteredNotifyParties.length === 0 && (
                <div className="cc-consignee-empty">
                  <p>No notify parties found matching &quot;{searchQuery}&quot;.</p>
                  <button type="button" className="cc-consignee-btn cc-consignee-btn--secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Pop-Up Modal: Add / Edit Consignee */}
      {isConsigneeFormOpen && (
        <div className="cc-consignee-modal-overlay" onClick={handleCloseConsigneeForm}>
          <div
            className="cc-consignee-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-consignee-title"
          >
            <div className="cc-consignee-modal-header">
              <div className="cc-consignee-modal-header-left">
                <div className="cc-consignee-modal-icon-badge cc-consignee-modal-icon-badge--consignee" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="cc-consignee-modal-title-group">
                  <div className="cc-consignee-modal-badge-row">
                    <span className="cc-consignee-modal-tag cc-consignee-modal-tag--consignee">B/L CONSIGNEE</span>
                  </div>
                  <h3 id="modal-consignee-title" className="cc-consignee-modal-title">
                    {editingConsigneeId ? 'EDIT CONSIGNEE DETAILS' : 'ADD NEW CONSIGNEE'}
                  </h3>
                  <span className="cc-consignee-modal-sub">
                    Fields marked with an asterisk (<span className="cc-consignee-req">*</span>) are required for maritime export manifests.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-consignee-modal-close"
                onClick={handleCloseConsigneeForm}
                aria-label="Close dialog"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="cc-consignee-modal-form" onSubmit={handleSaveConsignee}>
              <div className="cc-consignee-modal-body">
                <div className="cc-consignee-form-grid">
                  <div className="cc-consignee-field cc-consignee-field--full">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-name">
                      CONSIGNEE / COMPANY NAME <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-consignee-name"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. ZAIB TRADERS LTD"
                      value={consigneeForm.name}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-contact">
                      ATTENTION / CONTACT PERSON
                    </label>
                    <input
                      id="modal-consignee-contact"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. Mr. Farhan Zaib (Logistics Director)"
                      value={consigneeForm.contactPerson}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-phone">
                      TELEPHONE / MOBILE <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-consignee-phone"
                      type="tel"
                      className="cc-consignee-input"
                      placeholder="e.g. +256-0743 77771"
                      value={consigneeForm.phone}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field cc-consignee-field--full">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-address">
                      STREET ADDRESS / BONDED WAREHOUSE <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-consignee-address"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. #18, Banda Bond #W0474, Opposite Nabisunsa Close, Banda, Jinja Road"
                      value={consigneeForm.address}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-city">
                      CITY / DISCHARGE DESTINATION <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-consignee-city"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. Kampala"
                      value={consigneeForm.city}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-country">
                      DESTINATION COUNTRY <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-consignee-country"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. Uganda"
                      value={consigneeForm.country}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, country: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-email">
                      NOTIFICATION EMAIL
                    </label>
                    <input
                      id="modal-consignee-email"
                      type="email"
                      className="cc-consignee-input"
                      placeholder="e.g. info@zaibtraders.com"
                      value={consigneeForm.email}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-consignee-tax">
                      TAX ID / TIN / CUSTOMS REG NO.
                    </label>
                    <input
                      id="modal-consignee-tax"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. URA-TIN 1002948192"
                      value={consigneeForm.taxId}
                      onChange={(e) => setConsigneeForm((prev) => ({ ...prev, taxId: e.target.value }))}
                    />
                  </div>

                  <div className="cc-consignee-field--full cc-consignee-default-toggle-box">
                    <label className="cc-consignee-default-toggle-label">
                      <input
                        type="checkbox"
                        checked={consigneeForm.isDefault}
                        onChange={(e) => setConsigneeForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                        className="cc-consignee-checkbox"
                      />
                      <div className="cc-consignee-default-toggle-text">
                        <span className="cc-consignee-default-toggle-title">Set as Default Consignee</span>
                        <span className="cc-consignee-default-toggle-desc">Automatically selected on all new vehicle shipment manifests</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="cc-consignee-modal-footer">
                <button
                  type="button"
                  className="cc-consignee-btn cc-consignee-btn--secondary"
                  onClick={handleCloseConsigneeForm}
                >
                  CANCEL
                </button>
                <button type="submit" className="cc-consignee-btn cc-consignee-btn--primary">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{editingConsigneeId ? 'UPDATE CONSIGNEE' : 'SAVE CONSIGNEE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-Up Modal: Add / Edit Notify Party */}
      {isNotifyPartyFormOpen && (
        <div className="cc-consignee-modal-overlay" onClick={handleCloseNotifyPartyForm}>
          <div
            className="cc-consignee-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-notify-title"
          >
            <div className="cc-consignee-modal-header">
              <div className="cc-consignee-modal-header-left">
                <div className="cc-consignee-modal-icon-badge cc-consignee-modal-icon-badge--notify" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="cc-consignee-modal-title-group">
                  <div className="cc-consignee-modal-badge-row">
                    <span className="cc-consignee-modal-tag cc-consignee-modal-tag--notify">CLEARING AGENT</span>
                    <button
                      type="button"
                      className="cc-consignee-copy-pill"
                      onClick={handleCopyFromDefaultConsignee}
                      title="Populate details using default consignee"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Same as Default Consignee</span>
                    </button>
                  </div>
                  <h3 id="modal-notify-title" className="cc-consignee-modal-title">
                    {editingNotifyPartyId ? 'EDIT NOTIFY PARTY DETAILS' : 'ADD NEW NOTIFY PARTY'}
                  </h3>
                  <span className="cc-consignee-modal-sub">
                    Fields marked with an asterisk (<span className="cc-consignee-req">*</span>) are required for clearing agent manifests.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-consignee-modal-close"
                onClick={handleCloseNotifyPartyForm}
                aria-label="Close dialog"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="cc-consignee-modal-form" onSubmit={handleSaveNotifyParty}>
              <div className="cc-consignee-modal-body">
                <div className="cc-consignee-form-grid">
                  <div className="cc-consignee-field cc-consignee-field--full">
                    <label className="cc-consignee-label" htmlFor="modal-notify-name">
                      NOTIFY PARTY / CLEARING AGENT NAME <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-notify-name"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. ALPHA CUSTOMS CLEARING & FORWARDING AGENTS"
                      value={notifyPartyForm.name}
                      onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-notify-contact">
                      CONTACT PERSON / PORT AGENT
                    </label>
                    <input
                      id="modal-notify-contact"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. Mr. David Mukasa"
                      value={notifyPartyForm.contactPerson}
                      onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-notify-phone">
                      TELEPHONE / MOBILE <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-notify-phone"
                      type="tel"
                      className="cc-consignee-input"
                      placeholder="e.g. +256-7821 99880"
                      value={notifyPartyForm.phone}
                      onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field cc-consignee-field--full">
                    <label className="cc-consignee-label" htmlFor="modal-notify-address">
                      OFFICE / WAREHOUSE ADDRESS <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-notify-address"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. Cargo Village Warehouse #4, Entebbe International Airport"
                      value={notifyPartyForm.address}
                      onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-notify-city">
                      CITY / PORT <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-notify-city"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. Entebbe"
                      value={notifyPartyForm.city}
                      onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field">
                    <label className="cc-consignee-label" htmlFor="modal-notify-country">
                      COUNTRY <span className="cc-consignee-req">*</span>
                    </label>
                    <input
                      id="modal-notify-country"
                      type="text"
                      className="cc-consignee-input"
                      placeholder="e.g. Uganda"
                      value={notifyPartyForm.country}
                      onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, country: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="cc-consignee-field cc-consignee-field--full">
                    <label className="cc-consignee-label" htmlFor="modal-notify-email">
                      DISCHARGE ADVICE EMAIL
                    </label>
                    <input
                      id="modal-notify-email"
                      type="email"
                      className="cc-consignee-input"
                      placeholder="e.g. clearing@alphacargo.ug"
                      value={notifyPartyForm.email}
                      onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="cc-consignee-field--full cc-consignee-default-toggle-box">
                    <label className="cc-consignee-default-toggle-label">
                      <input
                        type="checkbox"
                        checked={notifyPartyForm.isDefault}
                        onChange={(e) => setNotifyPartyForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                        className="cc-consignee-checkbox"
                      />
                      <div className="cc-consignee-default-toggle-text">
                        <span className="cc-consignee-default-toggle-title">Set as Default Notify Party</span>
                        <span className="cc-consignee-default-toggle-desc">Automatically notified by shipping lines upon vessel port arrival</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="cc-consignee-modal-footer">
                <button
                  type="button"
                  className="cc-consignee-btn cc-consignee-btn--secondary"
                  onClick={handleCloseNotifyPartyForm}
                >
                  CANCEL
                </button>
                <button type="submit" className="cc-consignee-btn cc-consignee-btn--primary cc-consignee-btn--notify">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{editingNotifyPartyId ? 'UPDATE NOTIFY PARTY' : 'SAVE NOTIFY PARTY'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
