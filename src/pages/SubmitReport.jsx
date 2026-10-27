import React from 'react';
import WorkReportForm from '../components/WorkReportForm';

export default function SubmitReport({ onSubmit, isSubmitting }) {
  return (
    <WorkReportForm 
      onSubmit={onSubmit} 
      isSubmitting={isSubmitting} 
    />
  );
}
