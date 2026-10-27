/**
 * Validation utilities for Employee Work Details Form
 */

export const SITE_OF_WORK_OPTIONS = [
  'Office',
  'Work From Home',
  'Others'
];

export const VALID_WORK_STATUSES = [
  'Not Started',
  'In Progress',
  'Completed',
  'On Hold'
];

export const WORK_TYPE_PRESETS = [
  'PLC Panel Installation',
  'Electrical Wiring & Testing',
  'Machinery Maintenance & Overhaul',
  'HVAC & Refrigeration Service',
  'Sensor & Instrumentation Calibration',
  'Safety & Compliance Audit',
  'Civil & Structural Maintenance',
  'Piping & Hydraulic Work',
  'Other / Custom'
];

/**
 * Validates a single field value
 * @param {string} fieldName 
 * @param {any} value 
 * @returns {string|null} Error message or null if valid
 */
export function validateField(fieldName, value) {
  const strVal = typeof value === 'string' ? value.trim() : '';

  switch (fieldName) {
    case 'employeeName':
      if (!strVal) return 'Employee Name is required';
      if (strVal.length < 2) return 'Employee Name must be at least 2 characters';
      if (!/^[\p{L}\s.'-]+$/u.test(strVal)) {
        return 'Employee Name can only contain letters, spaces, dots, or hyphens';
      }
      return null;

    case 'employeeId':
      if (!strVal) return 'Employee ID is required';
      if (strVal.length < 2) return 'Employee ID must be at least 2 characters';
      if (!/^[A-Za-z0-9_-]+$/.test(strVal)) {
        return 'Employee ID should contain letters, numbers, hyphens, or underscores (e.g. EMP001)';
      }
      return null;

    case 'dateOfWork':
      if (!strVal) return 'Date of Work is required';
      // Verify valid date format
      const dateObj = new Date(strVal);
      if (isNaN(dateObj.getTime())) return 'Please enter a valid date';
      return null;

    case 'siteOfWork':
      if (!strVal) return 'Site of Work is required';
      return null;

    case 'customSiteLocation':
      if (!strVal) return 'Site Location is required when "Others" is selected';
      if (strVal.length < 2) return 'Site Location must be at least 2 characters';
      return null;

    case 'siteContactPerson':
      if (!strVal) return 'Site Contact Person is required';
      if (strVal.length < 2) return 'Site Contact Person must be at least 2 characters';
      return null;

    case 'siteContactPhone':
    case 'siteContactPersonContactNumber':
      if (!strVal) return 'Site Contact Person Contact Number is required';
      
      // Prevent alphabetic characters explicitly
      if (/[a-zA-Z]/.test(strVal)) {
        return 'Phone number cannot contain alphabetic characters';
      }

      // Check allowed characters: digits, spaces, hyphens, parentheses, optional leading '+'
      if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(strVal)) {
        return 'Please enter a valid phone number (e.g. +91 98765 43210 or 10-digit number)';
      }

      // Extract only digits to check length
      const digitsOnly = strVal.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return 'Please enter a valid mobile number (7 to 15 digits, e.g. +91 98765 43210)';
      }

      // For standard 10-digit or +91 format, ensure proper Indian mobile length if starting with 91 or 10 digits
      if (strVal.startsWith('+91') && digitsOnly.length !== 12) {
        return 'Indian mobile numbers with +91 must have 10 digits (e.g. +91 98765 43210)';
      }
      if (!strVal.startsWith('+') && digitsOnly.length === 10 && !/^[6-9]/.test(digitsOnly)) {
        return '10-digit Indian mobile numbers usually start with 6, 7, 8, or 9';
      }

      return null;

    case 'typeOfWork':
      if (!strVal) return 'Type of Work is required';
      return null;

    case 'workDescription':
      if (!strVal) return 'Work Description is required';
      if (strVal.length < 5) return 'Work Description must be at least 5 characters';
      return null;

    case 'workStatus':
      if (!strVal) return 'Work Status is required';
      if (!VALID_WORK_STATUSES.includes(strVal)) {
        return `Work Status must be one of: ${VALID_WORK_STATUSES.join(', ')}`;
      }
      return null;

    case 'pendingWork':
      // Optional field, no required validation
      return null;

    default:
      return null;
  }
}

/**
 * Validates the entire report form object
 * @param {Object} formData 
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateWorkReportForm(formData) {
  const errors = {};
  const fields = [
    'employeeName',
    'employeeId',
    'dateOfWork',
    'siteOfWork',
    'typeOfWork',
    'workDescription',
    'workStatus'
  ];

  // Site contact person, phone, and site location are only required when "Others" is selected
  if (formData.siteOfWork === 'Others') {
    fields.push('customSiteLocation');
    fields.push('siteContactPerson');
    fields.push('siteContactPhone');
  }

  fields.forEach((field) => {
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
