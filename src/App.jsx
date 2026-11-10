import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EntryForm from './components/EntryForm';
import MonthlyStats from './components/MonthlyStats';
import EntryList from './components/EntryList';
import SettingsModal from './components/SettingsModal';
import ReportModal from './components/ReportModal';
import EditEntryModal from './components/EditEntryModal';

import { 
  getStoredEntries, 
  saveStoredEntries, 
  getStoredSettings, 
  saveStoredSettings,
  getStoredCompanies,
  saveStoredCompanies,
  exportToCSV,
  exportToJSON
} from './utils/storage';

import { 
  calculateShiftHours, 
  getCurrentMonthKey 
} from './utils/hoursCalculator';

export default function App() {
  const [entries, setEntries] = useState([]);
  const [companies, setCompanies] = useState(getStoredCompanies());
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [settings, setSettings] = useState(getStoredSettings());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [editingEntry, setEditingEntry] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Initial load
  useEffect(() => {
    const loadedEntries = getStoredEntries();
    setEntries(loadedEntries);
    const loadedCompanies = getStoredCompanies();
    setCompanies(loadedCompanies);
  }, []);

  // Save entries on change
  const updateEntriesState = (newEntries) => {
    setEntries(newEntries);
    saveStoredEntries(newEntries);
  };

  // Add new company
  const handleAddCompany = (companyName) => {
    const trimmed = companyName.trim();
    if (!trimmed) return;
    if (!companies.includes(trimmed)) {
      const updated = [...companies, trimmed];
      setCompanies(updated);
      saveStoredCompanies(updated);
    }
  };

  // Delete company
  const handleDeleteCompany = (companyName) => {
    if (companies.length <= 1) {
      alert('Ainakin yksi yritys pitää olla tallennettuna.');
      return;
    }
    const updated = companies.filter(c => c !== companyName);
    setCompanies(updated);
    saveStoredCompanies(updated);
    if (selectedCompany === companyName) {
      setSelectedCompany('ALL');
    }
  };

  // Add or update entry
  const handleSaveEntry = (entryData) => {
    // If the entry used a company that isn't saved yet, auto-add it
    if (entryData.company && !companies.includes(entryData.company)) {
      handleAddCompany(entryData.company);
    }

    const exists = entries.some(item => item.id === entryData.id);
    if (exists) {
      // Update existing
      const updated = entries.map(item => item.id === entryData.id ? entryData : item);
      updateEntriesState(updated);
    } else {
      // Add new
      const updated = [entryData, ...entries];
      updateEntriesState(updated);
    }

    setEditingEntry(null);
    setIsEditModalOpen(false);
  };

  // Open edit modal for an entry
  const handleStartEdit = (entry) => {
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  // Toggle billed status directly
  const handleToggleBilled = (id) => {
    const updated = entries.map(item => 
      item.id === id ? { ...item, isBilled: !item.isBilled } : item
    );
    updateEntriesState(updated);
  };

  // Delete entry
  const handleDeleteEntry = (id) => {
    const updated = entries.filter(item => item.id !== id);
    updateEntriesState(updated);
    if (editingEntry && editingEntry.id === id) {
      setEditingEntry(null);
    }
  };

  // Save settings
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Clear all data
  const handleClearAllData = () => {
    updateEntriesState([]);
    setEditingEntry(null);
  };

  // Process all entries with calculated shift hours
  const processedEntries = entries.map(entry => {
    const calc = calculateShiftHours(entry.startTime, entry.endTime, 0);
    return {
      ...entry,
      company: entry.company || 'Yritys 1',
      ...calc
    };
  });

  // All entries for selected month (all companies)
  const allMonthEntries = processedEntries.filter(entry => 
    entry.date && entry.date.startsWith(selectedMonth)
  );

  // Entries filtered by selected company
  const filteredMonthEntries = selectedCompany === 'ALL'
    ? allMonthEntries
    : allMonthEntries.filter(entry => entry.company === selectedCompany);

  return (
    <div className="app-container">
      
      {/* Top Header & Navigation */}
      <Header 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        companies={companies}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCSV={() => exportToCSV(entries, selectedMonth, selectedCompany === 'ALL' ? '' : selectedCompany)}
        onExportJSON={() => exportToJSON(entries)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Main Content Layout */}
      <main>
        {/* Monthly Summary Statistics Cards (shows company hours AND grand total) */}
        <MonthlyStats 
          allMonthEntries={allMonthEntries}
          filteredMonthEntries={filteredMonthEntries}
          selectedCompany={selectedCompany}
          selectedMonth={selectedMonth}
          settings={settings}
          onSelectCompany={setSelectedCompany}
        />

        {/* 2-Column Desktop Grid: Form Left, List Right */}
        <div className="grid-main">
          <div>
            <EntryForm 
              onSaveEntry={handleSaveEntry}
              editingEntry={editingEntry}
              onCancelEdit={() => setEditingEntry(null)}
              settings={settings}
              companies={companies}
              onAddCompany={handleAddCompany}
              onDeleteCompany={handleDeleteCompany}
            />
          </div>

          <div>
            <EntryList 
              entriesForMonth={allMonthEntries}
              selectedCompany={selectedCompany}
              onSelectCompany={setSelectedCompany}
              companies={companies}
              onEditEntry={handleStartEdit}
              onDeleteEntry={handleDeleteEntry}
              onToggleBilled={handleToggleBilled}
              settings={settings}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print" style={{
        marginTop: '0.75rem',
        paddingTop: '0.4rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.725rem'
      }}>
        <p>
          Kevyt Työtuntien Seuranta • Alkavan puolitunnin pyöristys (30 min) • Yrityskohtainen erittely & kokonaistunnit
        </p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        companies={companies}
        onAddCompany={handleAddCompany}
        onDeleteCompany={handleDeleteCompany}
        onSaveSettings={handleSaveSettings}
        onClearAllData={handleClearAllData}
      />

      {/* Printable Report Modal */}
      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        allMonthEntries={allMonthEntries}
        selectedMonth={selectedMonth}
        settings={settings}
        companies={companies}
        initialCompany={selectedCompany}
        onExportCSV={(comp) => exportToCSV(entries, selectedMonth, comp === 'ALL' ? '' : comp)}
      />

      {/* Edit Entry Modal */}
      <EditEntryModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        onSave={handleSaveEntry}
        companies={companies}
        settings={settings}
      />

    </div>
  );
}
