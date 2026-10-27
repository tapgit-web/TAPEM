import React, { useState, useMemo } from 'react';
import { 
  User, 
  BadgeCheck, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Phone, 
  Wrench, 
  RotateCcw, 
  Send, 
  Sparkles, 
  AlertCircle, 
  Building2, 
  Home, 
  Check, 
  ClipboardList, 
  Loader2 
} from 'lucide-react';
import { 
  validateWorkReportForm, 
  validateField, 
  VALID_WORK_STATUSES, 
  WORK_TYPE_PRESETS 
} from '../utils/validation';

const INITIAL_FORM_STATE = {
  employeeName: '',
  employeeId: '',
  dateOfWork: '',
  siteOfWork: '',
  customSiteLocation: '',
  siteContactPerson: '',
  siteContactPhone: '',
  typeOfWork: '',
  customTypeOfWork: '',
  workDescription: '',
  workStatus: 'In Progress', // default to In Progress for speed
  pendingWork: ''
};

export default function WorkReportForm({ onSubmit, isSubmitting = false }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showCustomType, setShowCustomType] = useState(false);

  // Calculate live completion progress
  const progress = useMemo(() => {
    const isOther = formData.siteOfWork === 'Others';
    const requiredKeys = [
      'employeeName',
      'employeeId',
      'dateOfWork',
      'siteOfWork',
      ...(isOther ? ['customSiteLocation', 'siteContactPerson', 'siteContactPhone'] : []),
      'typeOfWork',
      'workStatus',
      'workDescription'
    ];

    let filledCount = 0;
    requiredKeys.forEach((key) => {
      const val = formData[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        filledCount++;
      }
    });

    const percent = Math.min(100, Math.round((filledCount / requiredKeys.length) * 100));
    return { percent, filledCount, total: requiredKeys.length };
  }, [formData]);

  // Handle direct site choice card click
  const handleSiteSelect = (siteOption) => {
    if (siteOption === 'Office' || siteOption === 'Work From Home') {
      setFormData((prev) => ({
        ...prev,
        siteOfWork: siteOption,
        customSiteLocation: '',
        siteContactPerson: '',
        siteContactPhone: ''
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.siteOfWork;
        delete next.customSiteLocation;
        delete next.siteContactPerson;
        delete next.siteContactPhone;
        return next;
      });
    } else {
      setFormData((prev) => ({ ...prev, siteOfWork: siteOption }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.siteOfWork;
        return next;
      });
    }
    setTouched((prev) => ({ ...prev, siteOfWork: true }));
  };

  // Handle direct work status chip click
  const handleStatusSelect = (statusOption) => {
    setFormData((prev) => ({ ...prev, workStatus: statusOption }));
    setTouched((prev) => ({ ...prev, workStatus: true }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.workStatus;
      return next;
    });
  };

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'siteOfWork') {
      handleSiteSelect(value);
      return;
    }

    if (name === 'typeOfWork') {
      if (value === 'Other / Custom') {
        setShowCustomType(true);
        setFormData((prev) => ({ ...prev, typeOfWork: value }));
      } else {
        setShowCustomType(false);
        setFormData((prev) => ({ ...prev, typeOfWork: value, customTypeOfWork: '' }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Real-time validation if already touched
    if (touched[name]) {
      const errorMsg = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: errorMsg
      }));
    }
  };

  // Blur handler to trigger validation on exit
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // For contact & custom site fields, only validate if siteOfWork is "Others"
    if ((name === 'siteContactPerson' || name === 'siteContactPhone' || name === 'customSiteLocation') && formData.siteOfWork !== 'Others') {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      return;
    }

    const errorMsg = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg
    }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(INITIAL_FORM_STATE).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate form inputs
    const validationResult = validateWorkReportForm(formData);
    
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      // Scroll to the first error
      const firstErrorField = document.querySelector('.has-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Resolve final siteOfWork and contact fields
    let finalSiteOfWork = formData.siteOfWork;
    let finalContactPerson = formData.siteContactPerson;
    let finalContactPhone = formData.siteContactPhone;

    if (formData.siteOfWork === 'Office' || formData.siteOfWork === 'Work From Home') {
      finalContactPerson = 'N/A';
      finalContactPhone = 'N/A';
    } else if (formData.siteOfWork === 'Others') {
      const loc = formData.customSiteLocation ? formData.customSiteLocation.trim() : '';
      finalSiteOfWork = loc ? (loc.toLowerCase().startsWith('other') ? loc : `Others - ${loc}`) : 'Others';
    }

    // Resolve final typeOfWork
    const finalTypeOfWork = showCustomType && formData.customTypeOfWork.trim() 
      ? formData.customTypeOfWork.trim() 
      : formData.typeOfWork;

    const submissionPayload = {
      ...formData,
      siteOfWork: finalSiteOfWork,
      siteContactPerson: finalContactPerson,
      siteContactPhone: finalContactPhone,
      siteContactPersonContactNumber: finalContactPhone,
      typeOfWork: finalTypeOfWork
    };

    // Submit payload to parent
    const success = await onSubmit(submissionPayload);
    if (success) {
      handleReset(false);
    }
  };

  // Reset form handler
  const handleReset = (askConfirm = true) => {
    if (askConfirm && Object.values(formData).some((v) => v !== '' && v !== 'In Progress')) {
      const confirmed = window.confirm('Are you sure you want to clear the form? Any unsaved changes will be lost.');
      if (!confirmed) return;
    }
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setTouched({});
    setShowCustomType(false);
  };

  // Load example placeholders helper for quick manual review
  const handleLoadExample = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      employeeName: 'Ravi Kumar',
      employeeId: 'EMP001',
      dateOfWork: today,
      siteOfWork: 'Others',
      customSiteLocation: 'ABC Manufacturing Plant, Sector 4',
      siteContactPerson: 'Maintenance Supervisor',
      siteContactPhone: '+91 98765 43210',
      typeOfWork: 'PLC Panel Installation',
      customTypeOfWork: '',
      workDescription: 'Panel wiring and I/O checking across line 3 automation cabinets. Inspected terminations and tested signal continuity.',
      workStatus: 'In Progress',
      pendingWork: 'Complete testing tomorrow morning with lead commissioning engineer.'
    });
    setErrors({});
    setShowCustomType(false);
  };

  return (
    <div className="form-page-wrapper">
      <div className="form-card">
        {/* Card Header with Progress Bar */}
        <div className="form-card-header">
          <div className="form-card-header-badge">
            <Sparkles size={13} />
            <span>Operational Log Entry</span>
          </div>

          <h2 className="form-card-title">
            <ClipboardList size={26} style={{ color: '#38bdf8' }} />
            <span>Employee Daily Work Report</span>
          </h2>

          <p className="form-card-subtitle">
            Log site activity, installation progress, and maintenance notes. All verified entries automatically synchronize with your Google Spreadsheet.
          </p>

          <div className="form-header-meta">
            <div className="form-header-controls">
              <div className="sync-status-indicator online">
                <span className="status-indicator-dot"></span>
                <span>Live Google Sheets Sync Active</span>
              </div>

              <button
                type="button"
                className="load-example-btn"
                onClick={handleLoadExample}
                title="Populate test placeholder values for verification"
              >
                <Sparkles size={13} />
                <span>Auto-Fill Demo Example</span>
              </button>
            </div>

            {/* Dynamic Completion Progress Tracker */}
            <div className="form-progress-wrap">
              <div className="form-progress-text">
                <span>Form Completion Progress</span>
                <span>{progress.percent}% ({progress.filledCount} of {progress.total} fields)</span>
              </div>
              <div className="form-progress-track">
                <div 
                  className="form-progress-fill" 
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="form-card-body">
          <form onSubmit={handleSubmit} noValidate>

            {/* =========================================================================
                SECTION 1: Employee & Schedule
                ========================================================================= */}
            <div className="form-section-card">
              <div className="form-section-header">
                <div className="section-title-wrap">
                  <div className="section-icon-badge">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Employee & Schedule</h3>
                    <div className="section-subtitle">Identify the technician and scheduled log date</div>
                  </div>
                </div>
                <span className="section-step-num">Step 1 of 3</span>
              </div>

              <div className="form-grid form-grid-3">
                {/* 1. Employee Name */}
                <div className={`form-group ${errors.employeeName && touched.employeeName ? 'has-error' : ''}`}>
                  <label htmlFor="employeeName" className="form-label">
                    <span>Employee Name <span className="required-mark">*</span></span>
                    <span className="field-hint">Full Name</span>
                  </label>
                  <div className="input-wrapper has-icon">
                    <span className="input-icon">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      id="employeeName"
                      name="employeeName"
                      className="form-input"
                      placeholder="e.g. Ravi Kumar"
                      value={formData.employeeName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="name"
                      aria-invalid={!!(errors.employeeName && touched.employeeName)}
                      aria-describedby={errors.employeeName ? 'employeeName-error' : undefined}
                    />
                  </div>
                  {errors.employeeName && touched.employeeName && (
                    <div id="employeeName-error" className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.employeeName}</span>
                    </div>
                  )}
                </div>

                {/* 2. Employee ID */}
                <div className={`form-group ${errors.employeeId && touched.employeeId ? 'has-error' : ''}`}>
                  <label htmlFor="employeeId" className="form-label">
                    <span>Employee ID <span className="required-mark">*</span></span>
                    <span className="field-hint">Alphanumeric</span>
                  </label>
                  <div className="input-wrapper has-icon">
                    <span className="input-icon">
                      <BadgeCheck size={18} />
                    </span>
                    <input
                      type="text"
                      id="employeeId"
                      name="employeeId"
                      className="form-input font-mono"
                      placeholder="e.g. EMP001"
                      value={formData.employeeId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-invalid={!!(errors.employeeId && touched.employeeId)}
                      aria-describedby={errors.employeeId ? 'employeeId-error' : undefined}
                    />
                  </div>
                  {errors.employeeId && touched.employeeId && (
                    <div id="employeeId-error" className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.employeeId}</span>
                    </div>
                  )}
                </div>

                {/* 3. Date of Work */}
                <div className={`form-group ${errors.dateOfWork && touched.dateOfWork ? 'has-error' : ''}`}>
                  <label htmlFor="dateOfWork" className="form-label">
                    <span>Date of Work <span className="required-mark">*</span></span>
                    <span className="field-hint">Inspection / Log Date</span>
                  </label>
                  <div className="input-wrapper has-icon">
                    <span className="input-icon">
                      <Calendar size={18} />
                    </span>
                    <input
                      type="date"
                      id="dateOfWork"
                      name="dateOfWork"
                      className="form-input"
                      value={formData.dateOfWork}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-invalid={!!(errors.dateOfWork && touched.dateOfWork)}
                      aria-describedby={errors.dateOfWork ? 'dateOfWork-error' : undefined}
                    />
                  </div>
                  {errors.dateOfWork && touched.dateOfWork && (
                    <div id="dateOfWork-error" className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.dateOfWork}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =========================================================================
                SECTION 2: Work Location & Contacts
                ========================================================================= */}
            <div className="form-section-card" style={{ marginTop: '1.5rem' }}>
              <div className="form-section-header">
                <div className="section-title-wrap">
                  <div className="section-icon-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Work Location & Environment</h3>
                    <div className="section-subtitle">Select where work was conducted</div>
                  </div>
                </div>
                <span className="section-step-num">Step 2 of 3</span>
              </div>

              {/* Interactive Choice Cards for Site of Work */}
              <div className={`form-group ${errors.siteOfWork && touched.siteOfWork ? 'has-error' : ''}`}>
                <label className="form-label">
                  <span>Site of Work <span className="required-mark">*</span></span>
                  <span className="field-hint">Choose your operating environment</span>
                </label>

                <div className="site-choice-cards" role="radiogroup" aria-label="Site of Work Selection">
                  {/* Card 1: Office */}
                  <div 
                    className={`site-card ${formData.siteOfWork === 'Office' ? 'active' : ''}`}
                    onClick={() => handleSiteSelect('Office')}
                    role="radio"
                    aria-checked={formData.siteOfWork === 'Office'}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleSiteSelect('Office'); }}
                  >
                    <div className="site-card-top">
                      <div className="site-card-icon">
                        <Building2 size={18} />
                      </div>
                      <div className="site-card-radio">
                        {formData.siteOfWork === 'Office' && <div className="site-card-radio-inner" />}
                      </div>
                    </div>
                    <div className="site-card-title">Office</div>
                    <div className="site-card-desc">Company facility or headquarters premises</div>
                  </div>

                  {/* Card 2: Work From Home */}
                  <div 
                    className={`site-card ${formData.siteOfWork === 'Work From Home' ? 'active' : ''}`}
                    onClick={() => handleSiteSelect('Work From Home')}
                    role="radio"
                    aria-checked={formData.siteOfWork === 'Work From Home'}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleSiteSelect('Work From Home'); }}
                  >
                    <div className="site-card-top">
                      <div className="site-card-icon">
                        <Home size={18} />
                      </div>
                      <div className="site-card-radio">
                        {formData.siteOfWork === 'Work From Home' && <div className="site-card-radio-inner" />}
                      </div>
                    </div>
                    <div className="site-card-title">Work From Home</div>
                    <div className="site-card-desc">Remote desktop or administrative work</div>
                  </div>

                  {/* Card 3: Others */}
                  <div 
                    className={`site-card ${formData.siteOfWork === 'Others' ? 'active' : ''}`}
                    onClick={() => handleSiteSelect('Others')}
                    role="radio"
                    aria-checked={formData.siteOfWork === 'Others'}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleSiteSelect('Others'); }}
                  >
                    <div className="site-card-top">
                      <div className="site-card-icon">
                        <MapPin size={18} />
                      </div>
                      <div className="site-card-radio">
                        {formData.siteOfWork === 'Others' && <div className="site-card-radio-inner" />}
                      </div>
                    </div>
                    <div className="site-card-title">Others / Field Site</div>
                    <div className="site-card-desc">Client facility, plant, or factory project</div>
                  </div>
                </div>

                {errors.siteOfWork && touched.siteOfWork && (
                  <div id="siteOfWork-error" className="error-message">
                    <AlertCircle size={14} />
                    <span>{errors.siteOfWork}</span>
                  </div>
                )}
              </div>

              {/* Banner when Office or Work From Home is selected */}
              {(formData.siteOfWork === 'Office' || formData.siteOfWork === 'Work From Home') && (
                <div className="site-internal-banner">
                  <BadgeCheck size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span>
                    <strong>{formData.siteOfWork}</strong> mode active: External site supervisor contact person & mobile number are not required.
                  </span>
                </div>
              )}

              {/* Nested Container: When "Others" is selected */}
              {formData.siteOfWork === 'Others' && (
                <div className="nested-site-details">
                  <div className="nested-site-details-title">
                    <MapPin size={15} />
                    <span>External Site Location & Contact Details</span>
                  </div>

                  <div className="form-grid form-grid-3">
                    {/* Site Location */}
                    <div className={`form-group ${errors.customSiteLocation && touched.customSiteLocation ? 'has-error' : ''}`}>
                      <label htmlFor="customSiteLocation" className="form-label">
                        <span>Site Location / Facility Name <span className="required-mark">*</span></span>
                        <span className="field-hint">e.g. ABC Manufacturing Plant, Sector 4</span>
                      </label>
                      <div className="input-wrapper has-icon">
                        <span className="input-icon">
                          <MapPin size={18} />
                        </span>
                        <input
                          type="text"
                          id="customSiteLocation"
                          name="customSiteLocation"
                          className="form-input"
                          placeholder="Enter specific site location / client facility"
                          value={formData.customSiteLocation}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          aria-invalid={!!(errors.customSiteLocation && touched.customSiteLocation)}
                          aria-describedby={errors.customSiteLocation ? 'customSiteLocation-error' : undefined}
                        />
                      </div>
                      {errors.customSiteLocation && touched.customSiteLocation && (
                        <div id="customSiteLocation-error" className="error-message">
                          <AlertCircle size={14} />
                          <span>{errors.customSiteLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Site Contact Person */}
                    <div className={`form-group ${errors.siteContactPerson && touched.siteContactPerson ? 'has-error' : ''}`}>
                      <label htmlFor="siteContactPerson" className="form-label">
                        <span>Site Contact Person <span className="required-mark">*</span></span>
                        <span className="field-hint">Supervisor / Lead</span>
                      </label>
                      <div className="input-wrapper has-icon">
                        <span className="input-icon">
                          <UserCheck size={18} />
                        </span>
                        <input
                          type="text"
                          id="siteContactPerson"
                          name="siteContactPerson"
                          className="form-input"
                          placeholder="e.g. Maintenance Supervisor"
                          value={formData.siteContactPerson}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          aria-invalid={!!(errors.siteContactPerson && touched.siteContactPerson)}
                          aria-describedby={errors.siteContactPerson ? 'siteContactPerson-error' : undefined}
                        />
                      </div>
                      {errors.siteContactPerson && touched.siteContactPerson && (
                        <div id="siteContactPerson-error" className="error-message">
                          <AlertCircle size={14} />
                          <span>{errors.siteContactPerson}</span>
                        </div>
                      )}
                    </div>

                    {/* Site Contact Person Contact Number */}
                    <div className={`form-group ${errors.siteContactPhone && touched.siteContactPhone ? 'has-error' : ''}`}>
                      <label htmlFor="siteContactPhone" className="form-label">
                        <span>Site Contact Person Contact Number <span className="required-mark">*</span></span>
                        <span className="field-hint">7 to 15 digits</span>
                      </label>
                      <div className="input-wrapper has-icon">
                        <span className="input-icon">
                          <Phone size={18} />
                        </span>
                        <input
                          type="tel"
                          id="siteContactPhone"
                          name="siteContactPhone"
                          className="form-input font-mono"
                          placeholder="e.g. +91 98765 43210"
                          value={formData.siteContactPhone}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(/[a-zA-Z]/g, '');
                            handleChange({ target: { name: 'siteContactPhone', value: sanitized } });
                          }}
                          onBlur={handleBlur}
                          required
                          aria-invalid={!!(errors.siteContactPhone && touched.siteContactPhone)}
                          aria-describedby={errors.siteContactPhone ? 'siteContactPhone-error' : undefined}
                        />
                      </div>
                      {errors.siteContactPhone && touched.siteContactPhone && (
                        <div id="siteContactPhone-error" className="error-message">
                          <AlertCircle size={14} />
                          <span>{errors.siteContactPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================================
                SECTION 3: Work Execution & Task Details
                ========================================================================= */}
            <div className="form-section-card" style={{ marginTop: '1.5rem' }}>
              <div className="form-section-header">
                <div className="section-title-wrap">
                  <div className="section-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Wrench size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Work Execution & Task Details</h3>
                    <div className="section-subtitle">Specify activities, current status, and handover notes</div>
                  </div>
                </div>
                <span className="section-step-num">Step 3 of 3</span>
              </div>

              <div className="form-grid">
                {/* Type of Work */}
                <div className={`form-group ${errors.typeOfWork && touched.typeOfWork ? 'has-error' : ''}`}>
                  <label htmlFor="typeOfWork" className="form-label">
                    <span>Type of Work <span className="required-mark">*</span></span>
                    <span className="field-hint">Classification Preset</span>
                  </label>
                  <div className="input-wrapper has-icon">
                    <span className="input-icon">
                      <Wrench size={18} />
                    </span>
                    <select
                      id="typeOfWork"
                      name="typeOfWork"
                      className="form-select"
                      value={formData.typeOfWork}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-invalid={!!(errors.typeOfWork && touched.typeOfWork)}
                      aria-describedby={errors.typeOfWork ? 'typeOfWork-error' : undefined}
                    >
                      <option value="" disabled>-- Select Type of Work --</option>
                      {WORK_TYPE_PRESETS.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showCustomType && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <input
                        type="text"
                        name="customTypeOfWork"
                        className="form-input"
                        placeholder="Specify custom work category..."
                        value={formData.customTypeOfWork}
                        onChange={handleChange}
                        autoFocus
                      />
                    </div>
                  )}

                  {errors.typeOfWork && touched.typeOfWork && (
                    <div id="typeOfWork-error" className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.typeOfWork}</span>
                    </div>
                  )}
                </div>

                {/* Work Status (Interactive Status Chips) */}
                <div className={`form-group ${errors.workStatus && touched.workStatus ? 'has-error' : ''}`}>
                  <label className="form-label">
                    <span>Work Status <span className="required-mark">*</span></span>
                    <span className="field-hint">Click current operational state</span>
                  </label>
                  <div className="status-choice-group" role="radiogroup" aria-label="Work Status Selection">
                    {VALID_WORK_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`status-chip ${formData.workStatus === status ? 'active' : ''}`}
                        data-status={status}
                        onClick={() => handleStatusSelect(status)}
                        role="radio"
                        aria-checked={formData.workStatus === status}
                      >
                        <span className="status-chip-dot" />
                        <span>{status}</span>
                        {formData.workStatus === status && <Check size={14} style={{ marginLeft: 'auto' }} />}
                      </button>
                    ))}
                  </div>
                  {errors.workStatus && touched.workStatus && (
                    <div id="workStatus-error" className="error-message">
                      <AlertCircle size={14} />
                      <span>{errors.workStatus}</span>
                    </div>
                  )}
                </div>

                {/* Work Description */}
                <div className={`form-group ${errors.workDescription && touched.workDescription ? 'has-error' : ''}`}>
                  <label htmlFor="workDescription" className="form-label">
                    <span>Work Description <span className="required-mark">*</span></span>
                    <span className="field-hint">Summary of actions taken & findings</span>
                  </label>
                  <textarea
                    id="workDescription"
                    name="workDescription"
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe specific tasks completed, parts installed, tests conducted, or issues encountered..."
                    value={formData.workDescription}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-invalid={!!(errors.workDescription && touched.workDescription)}
                    aria-describedby={errors.workDescription ? 'workDescription-error' : undefined}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {errors.workDescription && touched.workDescription ? (
                      <div id="workDescription-error" className="error-message">
                        <AlertCircle size={14} />
                        <span>{errors.workDescription}</span>
                      </div>
                    ) : <span />}
                    <span className="char-counter">{formData.workDescription.length} characters</span>
                  </div>
                </div>

                {/* Pending Work / Next Steps */}
                <div className="form-group">
                  <label htmlFor="pendingWork" className="form-label">
                    <span>Pending Work / Next Steps</span>
                    <span className="field-hint">Optional follow-up instructions</span>
                  </label>
                  <textarea
                    id="pendingWork"
                    name="pendingWork"
                    className="form-textarea"
                    rows={4}
                    placeholder="List pending checks, parts on order, or instructions for the next shift..."
                    value={formData.pendingWork}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="form-actions">
              <div className="form-actions-left">
                <span className="status-indicator-dot" />
                <span>Synchronized with <strong>Employee Work Reports</strong> Sheet</span>
              </div>

              <div className="form-actions-right">
                <button
                  type="button"
                  className="btn btn-outline btn-reset"
                  onClick={() => handleReset(true)}
                  disabled={isSubmitting}
                >
                  <RotateCcw size={16} />
                  <span>Clear Form</span>
                </button>

                <button
                  type="submit"
                  className="btn-submit-premium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Submitting to Google Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Submit Work Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
