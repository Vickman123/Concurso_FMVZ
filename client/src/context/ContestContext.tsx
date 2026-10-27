import React, { createContext, useContext, useState, useEffect } from 'react';
import { ContestSettings, VoterIdentity, VoteReceipt } from '../types';

interface ContestContextType {
  settings: ContestSettings | null;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;
  voterIdentity: VoterIdentity | null;
  setVoterIdentity: (voter: VoterIdentity | null) => void;
  lastVoteReceipt: VoteReceipt | null;
  setLastVoteReceipt: (receipt: VoteReceipt | null) => void;
  isVotingOpen: boolean;
  isLiveActive: boolean;
}

const ContestContext = createContext<ContestContextType | undefined>(undefined);

export const ContestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ContestSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Persist voter identity in sessionStorage for convenience during browsing session
  const [voterIdentity, setVoterIdentityState] = useState<VoterIdentity | null>(() => {
    const saved = sessionStorage.getItem('fmvz_voter_identity');
    return saved ? JSON.parse(saved) : null;
  });

  const [lastVoteReceipt, setLastVoteReceiptState] = useState<VoteReceipt | null>(() => {
    const saved = sessionStorage.getItem('fmvz_vote_receipt');
    return saved ? JSON.parse(saved) : null;
  });

  const setVoterIdentity = (voter: VoterIdentity | null) => {
    setVoterIdentityState(voter);
    if (voter) {
      sessionStorage.setItem('fmvz_voter_identity', JSON.stringify(voter));
    } else {
      sessionStorage.removeItem('fmvz_voter_identity');
    }
  };

  const setLastVoteReceipt = (receipt: VoteReceipt | null) => {
    setLastVoteReceiptState(receipt);
    if (receipt) {
      sessionStorage.setItem('fmvz_vote_receipt', JSON.stringify(receipt));
    } else {
      sessionStorage.removeItem('fmvz_vote_receipt');
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/contest/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    refreshSettings();
    // Periodically sync contest settings (e.g. when admin opens/closes stage or voting)
    const interval = setInterval(refreshSettings, 10000);
    return () => clearInterval(interval);
  }, []);

  const isVotingOpen = settings?.voting_status === 'open';
  const isLiveActive = Boolean(settings?.is_live_active);

  return (
    <ContestContext.Provider
      value={{
        settings,
        loadingSettings,
        refreshSettings,
        voterIdentity,
        setVoterIdentity,
        lastVoteReceipt,
        setLastVoteReceipt,
        isVotingOpen,
        isLiveActive,
      }}
    >
      {children}
    </ContestContext.Provider>
  );
};

export const useContest = () => {
  const context = useContext(ContestContext);
  if (!context) throw new Error('useContest must be used within a ContestProvider');
  return context;
};
