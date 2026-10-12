import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  TouchpointRecord,
  FilterState,
  ConnectionStatus,
  DataSourceMode,
  SchemaFieldMapping,
} from './types';
import { DEFAULT_SCHEMA_MAPPING } from './lib/analytics/schemaMapping';
import { calculateKPIs } from './lib/analytics/metrics';
import { calculateChannelAttribution } from './lib/analytics/attribution';
import {
  calculateSequenceVolume,
  calculateTopConversionPaths,
  applyFilters,
} from './lib/analytics/transformations';
import { loadTouchpoints, uploadCsvToFirestore } from './lib/firebase/queries';
import { getFirebaseAuth } from './lib/firebase/client';

import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { DataStatus } from './components/dashboard/DataStatus';
import { DashboardFilters } from './components/dashboard/DashboardFilters';
import { KpiGrid } from './components/dashboard/KpiGrid';
import { RevenueChannelChart } from './components/dashboard/RevenueChannelChart';
import { SequenceVolumeChart } from './components/dashboard/SequenceVolumeChart';
import { TopPathsTable } from './components/dashboard/TopPathsTable';
import { TouchpointTable } from './components/dashboard/TouchpointTable';
import { AIParameterEngine } from './components/ai/AIParameterEngine';
import { SchemaMappingModal } from './components/dashboard/SchemaMappingModal';

export default function App() {
  // Data Source & Connection State
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('demo_data');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('demo_mode');
  const [collectionName, setCollectionName] = useState<string>('p2c_touchpoints');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [schemaMapping, setSchemaMapping] = useState<SchemaFieldMapping>(DEFAULT_SCHEMA_MAPPING);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Raw Loaded Dataset
  const [records, setRecords] = useState<TouchpointRecord[]>([]);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'Last 30 Days',
    channel: 'all',
    conversionStatus: 'all',
    attributionModel: 'linear',
    lookbackTouchpoints: null,
    searchQuery: '',
  });

  // Load Data function
  const fetchData = useCallback(
    async (mode: DataSourceMode, mapping: SchemaFieldMapping) => {
      if (mode === 'live_firestore' && (!authReady || !firebaseUser)) {
        setRecords([]);
        setConnectionStatus('configuration_required');
        setErrorMessage('Sign in with an authorized Google account to access Firestore.');
        return;
      }
      setIsRefreshing(true);
      setConnectionStatus('connecting');

      try {
        const result = await loadTouchpoints(mode, mapping);
        setRecords(result.records);
        setConnectionStatus(result.status);
        setCollectionName(result.collectionName);
        setErrorMessage(result.errorMessage);
        setLastRefreshed(new Date());
      } catch (err: any) {
        setRecords([]);
        setConnectionStatus('error');
        setErrorMessage(err.message || 'Failed to fetch touchpoints.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [authReady, firebaseUser]
  );

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      setAuthError('');
    }, (error) => {
      setAuthError(error.message || 'Could not check Firebase sign-in status.');
      setAuthReady(true);
    });
    return unsubscribe;
  }, [isSchemaModalOpen]);

  // Initial load
  useEffect(() => {
    fetchData(dataSourceMode, schemaMapping);
  }, [fetchData, dataSourceMode, schemaMapping]);

  const handleRefresh = () => {
    fetchData(dataSourceMode, schemaMapping);
  };

  const handleFirebaseSignIn = async () => {
    setAuthError('');
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthError('Set the Firebase Project ID in Schema Mapping → Firestore Connection Credentials first.');
      setIsSchemaModalOpen(true);
      return;
    }
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      setAuthError(error?.message || 'Google sign-in failed.');
    }
  };

  const handleFirebaseSignOut = async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsUploadingCsv(true);
    setUploadProgress(0);
    setUploadMessage('');
    setUploadError('');
    try {
      const count = await uploadCsvToFirestore(file, setUploadProgress);
      if (dataSourceMode === 'live_firestore') {
        await fetchData('live_firestore', schemaMapping);
      } else {
        setDataSourceMode('live_firestore');
      }
      setUploadMessage(`Uploaded ${count.toLocaleString()} rows to Firestore.`);
    } catch (error: any) {
      setUploadError(error?.message || 'CSV upload failed.');
    } finally {
      setIsUploadingCsv(false);
    }
  };

  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'Last 30 Days',
      channel: 'all',
      conversionStatus: 'all',
      attributionModel: 'linear',
      lookbackTouchpoints: null,
      searchQuery: '',
    });
  };

  // Extract all distinct channels present in raw dataset for filter dropdown
  const availableChannels = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.channel) set.add(r.channel);
    });
    return Array.from(set).sort();
  }, [records]);

  // Apply active filters to get filtered dataset
  const filteredRecords = useMemo(() => {
    return applyFilters(records, filters);
  }, [records, filters]);

  // Deterministic KPI calculations
  const kpis = useMemo(() => {
    return calculateKPIs(filteredRecords);
  }, [filteredRecords]);

  // Reconciled Channel Revenue Attribution
  const channelPerformance = useMemo(() => {
    return calculateChannelAttribution(filteredRecords, filters.attributionModel);
  }, [filteredRecords, filters.attributionModel]);

  // Numeric Sequence-Step Volume
  const sequencePerformance = useMemo(() => {
    return calculateSequenceVolume(filteredRecords);
  }, [filteredRecords]);

  // Top Conversion Journey Paths
  const topPaths = useMemo(() => {
    return calculateTopConversionPaths(filteredRecords);
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-[#F6F7F4] text-[#18201E] flex flex-col antialiased selection:bg-[#087F73] selection:text-[#FFFFFF]">
      {/* 1. Header */}
      <DashboardHeader
        status={connectionStatus}
        dataSourceMode={dataSourceMode}
        onToggleDataSource={(mode) => setDataSourceMode(mode)}
        onRefresh={handleRefresh}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        lastRefreshed={lastRefreshed}
        isRefreshing={isRefreshing}
      />

      {/* Main Analytical Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="rounded-xl border border-[#DCE2DE] bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#18201E]">Import touchpoints from CSV</h2>
            <p className="text-xs text-[#56615D] mt-1">Large files are streamed and saved to Firestore in batches. CSV headers should match your schema mapping.</p>
            {isUploadingCsv && <p className="text-xs text-[#087F73] mt-2">{uploadProgress.toLocaleString()} rows sent…</p>}
            {uploadMessage && <p className="text-xs text-[#38764A] mt-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{uploadMessage}</p>}
            {uploadError && <p role="alert" className="text-xs text-[#B54848] mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{uploadError}</p>}
          </div>
          <div>
            {firebaseUser ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#56615D]">Signed in as {firebaseUser.email}</span>
                <button type="button" onClick={handleFirebaseSignOut} className="inline-flex items-center gap-1 rounded-md border border-[#C8D0CB] px-3 py-2 text-xs font-medium hover:bg-[#F0F2EE]"><LogOut className="w-3.5 h-3.5" />Sign out</button>
                <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" />
                <button type="button" onClick={() => csvInputRef.current?.click()} disabled={isUploadingCsv} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#087F73] px-4 py-2 text-sm font-medium text-white hover:bg-[#06695F] disabled:opacity-60">
                  {isUploadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                  {isUploadingCsv ? 'Uploading CSV…' : 'Choose CSV'}
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleFirebaseSignIn} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#087F73] px-4 py-2 text-sm font-medium text-white hover:bg-[#06695F]"><LogIn className="w-4 h-4" />Sign in with Google</button>
            )}
          </div>
          {(authError || (!firebaseUser && dataSourceMode === 'live_firestore' && errorMessage)) && <p role="alert" className="text-xs text-[#B54848]">{authError || errorMessage}</p>}
        </section>
        {/* 2. Data Status Notification (Honest demo/live state) */}
        <DataStatus
          status={connectionStatus}
          dataSourceMode={dataSourceMode}
          collectionName={collectionName}
          errorMessage={errorMessage}
          recordCount={records.length}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
          onSwitchToDemo={() => setDataSourceMode('demo_data')}
        />

        {/* 3. Filter Controls */}
        <DashboardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          availableChannels={availableChannels}
          totalRecordsCount={records.length}
          filteredRecordsCount={filteredRecords.length}
        />

        {/* 4. Deterministic KPI Grid */}
        <KpiGrid kpis={kpis} />

        {/* 5. Core Analytical Visualizations (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Revenue Contribution by Channel */}
          <RevenueChannelChart
            data={channelPerformance}
            totalAttributedRevenue={kpis.totalRevenue}
            attributionModel={filters.attributionModel}
          />

          {/* Chart 2: Touchpoint Volume by Sequence Step */}
          <SequenceVolumeChart
            data={sequencePerformance}
            totalTouchpoints={kpis.totalTouchpoints}
          />
        </div>

        {/* 6. Multi-Touch Conversion Paths */}
        <TopPathsTable paths={topPaths} />

        {/* 7. AI Parameter Engine (Gemini Analytical Control Surface) */}
        <AIParameterEngine
          filters={filters}
          kpis={kpis}
          channelPerformance={channelPerformance}
          sequencePerformance={sequencePerformance}
          topPaths={topPaths}
          sampleSize={filteredRecords.length}
        />

        {/* 8. Underlying Normalized Data Explorer */}
        <TouchpointTable records={filteredRecords} />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCE2DE] bg-[#FFFFFF] py-6 text-xs text-[#56615D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-[#18201E]">P2C Insights</span> — Path-to-Conversion Analytics & Attribution Engine.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#7D8782]">
            <span>Deterministic Math Layer</span>
            <span>•</span>
            <span>Google GenAI SDK</span>
            <span>•</span>
            <span>Next.js App Router Architecture</span>
          </div>
        </div>
      </footer>

      {/* Schema Mapping & Firestore Connection Modal */}
      <SchemaMappingModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        currentMapping={schemaMapping}
        onSaveMapping={(newMap) => setSchemaMapping(newMap)}
        dataSourceMode={dataSourceMode}
        onSetDataSourceMode={(mode) => setDataSourceMode(mode)}
        onReload={handleRefresh}
      />
    </div>
  );
}
