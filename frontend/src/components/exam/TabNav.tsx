import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onSelect: (id: string) => void;
}

/** Barre de navigation par onglets du simulateur. */
const TabNav: React.FC<Props> = ({ tabs, activeTab, onSelect }) => (
  <div className="tab-navigation">
    <div className="tab-pill">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-link ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

export default TabNav;
