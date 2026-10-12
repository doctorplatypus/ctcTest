import React, { useState } from 'react';
import { X, Save, Database, RotateCcw, Check } from 'lucide-react';
import { SchemaFieldMapping, DataSourceMode } from '../../types';
import { DEFAULT_SCHEMA_MAPPING } from '../../lib/analytics/schemaMapping';
import {
  getStoredFirebaseConfig,
  saveFirestoreConfig,
  FirebaseConnectionConfig,
} from '../../lib/firebase/client';

interface SchemaMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapping: SchemaFieldMapping;
  onSaveMapping: (newMapping: SchemaFieldMapping) => void;
  dataSourceMode: DataSourceMode;
  onSetDataSourceMode: (mode: DataSourceMode) => void;
  onReload: () => void;
}

export const SchemaMappingModal: React.FC<SchemaMappingModalProps> = ({
  isOpen,
  onClose,
  currentMapping,
  onSaveMapping,
  dataSourceMode,
  onSetDataSourceMode,
  onReload,
}) => {
  const [mapping, setMapping] = useState<SchemaFieldMapping>(currentMapping);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConnectionConfig>(
    getStoredFirebaseConfig()
  );
  const [activeTab, setActiveTab] = useState<'mapping' | 'connection'>('mapping');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveMapping(mapping);
    saveFirestoreConfig(firebaseConfig);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      onReload();
    }, 600);
  };

  const handleResetToDefault = () => {
    setMapping(DEFAULT_SCHEMA_MAPPING);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18201E]/60 backdrop-blur-xs p-4">
      <div className="bg-[#FFFFFF] border border-[#DCE2DE] rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE2DE] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#18201E]">
              Schema Mapping & Firestore Settings
            </h3>
            <p className="text-xs text-[#56615D]">
              Configure Firestore collection keys and document field normalizations
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#56615D] hover:text-[#18201E] hover:bg-[#F0F2EE] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#DCE2DE] bg-[#F0F2EE] px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === 'mapping'
                ? 'border-[#087F73] text-[#087F73]'
                : 'border-transparent text-[#56615D] hover:text-[#18201E]'
            }`}
          >
            Field Mapping Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === 'connection'
                ? 'border-[#087F73] text-[#087F73]'
                : 'border-transparent text-[#56615D] hover:text-[#18201E]'
            }`}
          >
            Firestore Connection Credentials
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'mapping' ? (
            <div className="space-y-4">
              <div className="bg-[#F0F2EE] p-3 rounded-lg border border-[#DCE2DE] text-xs text-[#56615D]">
                Map your raw Firestore document field names to the internal P2C Insights schema. If your database uses custom identifiers (e.g. <code className="bg-[#E8F5F2] px-1 py-0.5 rounded text-[#06695F]">user_id</code> instead of <code className="bg-[#E8F5F2] px-1 py-0.5 rounded text-[#06695F]">customerId</code>), specify them below.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Customer ID Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.customerIdField}
                    onChange={(e) =>
                      setMapping({ ...mapping, customerIdField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. customerId, user_id, cid</span>
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Journey / Session ID Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.journeyIdField}
                    onChange={(e) =>
                      setMapping({ ...mapping, journeyIdField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. journeyId, session_id, path_id</span>
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Channel Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.channelField}
                    onChange={(e) =>
                      setMapping({ ...mapping, channelField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. channel, source, utm_source</span>
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Sequence Step Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.sequenceStepField}
                    onChange={(e) =>
                      setMapping({ ...mapping, sequenceStepField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. sequenceStep, step, position</span>
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Converted (Boolean) Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.convertedField}
                    onChange={(e) =>
                      setMapping({ ...mapping, convertedField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. converted, is_converted, won</span>
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Revenue (Amount) Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.revenueField}
                    onChange={(e) =>
                      setMapping({ ...mapping, revenueField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. revenue, conversion_value, amount</span>
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Timestamp Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.timestampField}
                    onChange={(e) =>
                      setMapping({ ...mapping, timestampField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. timestamp, created_at, date</span>
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Campaign / Type Field:
                  </label>
                  <input
                    type="text"
                    value={mapping.campaignField}
                    onChange={(e) =>
                      setMapping({ ...mapping, campaignField: e.target.value })
                    }
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                  <span className="text-[10px] text-[#7D8782]">e.g. campaign, utm_campaign</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1.5 text-xs text-[#56615D] hover:text-[#18201E] underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to standard schema defaults
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#F0F2EE] p-3 rounded-lg border border-[#DCE2DE] text-xs text-[#56615D]">
                Enter your Firebase Firestore project credentials or collection name. When configured, P2C Insights connects directly to your live Firestore database using the modular Firebase SDK.
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Firestore Collection Name:
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig.collectionName || 'p2c_touchpoints'}
                    onChange={(e) =>
                      setFirebaseConfig({
                        ...firebaseConfig,
                        collectionName: e.target.value,
                      })
                    }
                    placeholder="p2c_touchpoints"
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Firebase Project ID:
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig.projectId || ''}
                    onChange={(e) =>
                      setFirebaseConfig({
                        ...firebaseConfig,
                        projectId: e.target.value,
                      })
                    }
                    placeholder="e.g. my-production-project"
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#18201E] mb-1">
                    Firebase API Key (Optional if public rules):
                  </label>
                  <input
                    type="password"
                    value={firebaseConfig.apiKey || ''}
                    onChange={(e) =>
                      setFirebaseConfig({
                        ...firebaseConfig,
                        apiKey: e.target.value,
                      })
                    }
                    placeholder="AIzaSy..."
                    className="w-full h-8 px-2.5 bg-[#FFFFFF] border border-[#C8D0CB] rounded font-mono text-xs text-[#18201E] outline-none hover:border-[#9BA8A1] focus:border-[#087F73]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSetDataSourceMode('demo_data')}
                    className="text-xs text-[#087F73] font-medium hover:underline cursor-pointer"
                  >
                    Use isolated Demo Dataset instead
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#DCE2DE] bg-[#F0F2EE] flex items-center justify-between">
          <span className="text-xs text-[#56615D]">
            Changes apply to active session
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#C8D0CB] bg-[#FFFFFF] hover:bg-[#F0F2EE] text-xs font-medium text-[#35413D] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#087F73] hover:bg-[#06695F] text-[#FFFFFF] text-xs font-semibold cursor-pointer shadow-xs"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply & Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
