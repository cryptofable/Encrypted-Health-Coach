import { useState } from 'react';

import { Header } from './Header';
import { HealthSubmission } from './HealthSubmission';
import { HealthAnalysis } from './HealthAnalysis';
import '../styles/HealthApp.css';

export function HealthApp() {
  const [activeTab, setActiveTab] = useState<'submit' | 'analyze'>('submit');

  return (
    <div className="health-app">
      <Header />
      <main className="main-content">
        <div className="tab-navigation">
          <nav className="tab-nav">
            <button
              onClick={() => setActiveTab('submit')}
              className={`tab-button ${activeTab === 'submit' ? 'active' : 'inactive'}`}
            >
              Update Metrics
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`tab-button ${activeTab === 'analyze' ? 'active' : 'inactive'}`}
            >
              Analyze Health
            </button>
          </nav>
        </div>

        {activeTab === 'submit' ? <HealthSubmission /> : <HealthAnalysis />}
      </main>
    </div>
  );
}
