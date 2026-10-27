import React from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CircleDot 
} from 'lucide-react';

export default function SummaryCards({ reports = [], activeStatusFilter = '', onStatusSelect }) {
  // Compute counts
  const totalCount = reports.length;
  const completedCount = reports.filter(r => r.workStatus === 'Completed').length;
  const inProgressCount = reports.filter(r => r.workStatus === 'In Progress').length;
  const onHoldCount = reports.filter(r => r.workStatus === 'On Hold').length;
  const notStartedCount = reports.filter(r => r.workStatus === 'Not Started').length;

  const cards = [
    {
      id: 'total',
      title: 'Total Reports',
      value: totalCount,
      icon: <FileSpreadsheet size={20} />,
      className: 'metric-total',
      statusFilter: '',
      subtitle: 'All submissions'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      value: inProgressCount,
      icon: <Clock size={20} />,
      className: 'metric-inprogress',
      statusFilter: 'In Progress',
      subtitle: `${totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0}% of active workload`
    },
    {
      id: 'completed',
      title: 'Completed',
      value: completedCount,
      icon: <CheckCircle2 size={20} />,
      className: 'metric-completed',
      statusFilter: 'Completed',
      subtitle: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% closed tasks`
    },
    {
      id: 'on-hold',
      title: 'On Hold',
      value: onHoldCount,
      icon: <AlertCircle size={20} />,
      className: 'metric-onhold',
      statusFilter: 'On Hold',
      subtitle: 'Requires follow-up'
    },
    {
      id: 'not-started',
      title: 'Not Started',
      value: notStartedCount,
      icon: <CircleDot size={20} />,
      className: 'metric-notstarted',
      statusFilter: 'Not Started',
      subtitle: 'Pending assignment'
    }
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map((card) => {
        const isSelected = activeStatusFilter === card.statusFilter;
        return (
          <div
            key={card.id}
            className={`metric-card ${card.className} ${isSelected ? 'active-filter' : ''}`}
            onClick={() => onStatusSelect(isSelected ? '' : card.statusFilter)}
            role="button"
            tabIndex={0}
            title={`Click to filter by ${card.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStatusSelect(isSelected ? '' : card.statusFilter);
              }
            }}
          >
            <div className="metric-card-top">
              <span className="metric-card-title">{card.title}</span>
              <div className="metric-icon-box">
                {card.icon}
              </div>
            </div>
            <div className="metric-card-value">{card.value}</div>
            <div className="metric-card-subtitle">{card.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}
