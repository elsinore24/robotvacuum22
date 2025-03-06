import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CSVRow, RobotVacuumUpload } from '../types';
import { supabase } from '../lib/supabaseClient';

interface Props {
  affiliateId: string;
}

interface LogEntry { 
  message: string;
  type: 'info' | 'error';
  timestamp: string;
}

export default function AdminUploader({ affiliateId }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<LogEntry[]>([]);
  const [csvStats, setCsvStats] = useState<{
    totalRows: number;
    validRows: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const addLog = (message: string, type: 'info' | 'error' = 'info') => {
    setDebugLogs(prev => [...prev, {
      message,
      type,
      timestamp: new Date().toISOString()
    }]);
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const normalizeHeaders = (headers: string[]): string[] => {
    return headers.map(header => {
      // Remove any quotes and trim whitespace
      header = header.replace(/["']/g, '').trim().toLowerCase();
      
      // Map CSV headers to expected keys
      switch (header) {
        case 'imageurl': return 'imageUrl';
        case 'dealurl': return 'dealUrl';
        default: return header;
      }
    });
  };

  const cleanAmazonUrl = (urlString: string): string => {
    try {
      const url = new URL(urlString);
      if (!url.hostname.includes('amazon.com')) {
        throw new Error('Not an Amazon URL');
      }

      // Remove existing affiliate tags
      url.searchParams.delete('tag');
      
      const pathParts = url.pathname.split('/');
      const dpIndex = pathParts.indexOf('dp');
      let asin = '';

      if (dpIndex !== -1 && pathParts[dpIndex + 1]) {
        asin = pathParts[dpIndex + 1];
      } else {
        for (let i = 0; i < pathParts.length; i++) {
          if (pathParts[i] && pathParts[i].length === 10 && /^[A-Z0-9]{10}$/.test(pathParts[i])) {
            asin = pathParts[i];
            break;
          }
        }
      }

      if (!asin) {
        throw new Error('Could not find valid ASIN in Amazon URL');
      }

      // Always ensure we use the affiliate ID passed to the component
      const cleanUrl = `https://www.amazon.com/dp/${asin}?tag=${affiliateId}`;
      addLog(`Cleaned Amazon URL: ${cleanUrl}`);
      return cleanUrl;
    } catch (err: any) {
      throw new Error(`Invalid Amazon URL: ${err.message}`);
    }
  };

  const validateRow = (csvRow: CSVRow, rowIndex: number): string[] => {
    const errors = [];
    
    // Required fields validation
    const requiredFields = ['title', 'brand', 'model_number', 'price', 'reviews', 'dealUrl'];
    for (const field of requiredFields) {
      if (!csvRow[field as keyof CSVRow]?.trim()) {
        errors.push(`Row ${rowIndex}: ${field} is required`);
      }
    }
    
    // Price validation
    if (csvRow.price) {
      const price = parseFloat(csvRow.price.replace(/[$,]/g, ''));
      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${rowIndex}: Price must be a positive number`);
      }
    }

    // Reviews validation
    if (csvRow.reviews) {
      const reviews = parseFloat(csvRow.reviews);
      if (isNaN(reviews) || reviews < 0 || reviews > 5) {
        errors.push(`Row ${rowIndex}: Reviews must be between 0 and 5`);
      }
    }

    // URL validations
    if (csvRow.dealUrl) {
      try {
        cleanAmazonUrl(csvRow.dealUrl);
      } catch (err: any) {
        errors.push(`Row ${rowIndex}: ${err.message}`);
      }
    }

    if (csvRow.imageUrl && !csvRow.imageUrl.startsWith('http')) {
      errors.push(`Row ${rowIndex}: Image URL must be a valid URL`);
    }

    // Numeric validations
    if (csvRow.suction_power && csvRow.suction_power.trim() !== 'N/A') {
      const power = parseInt(csvRow.suction_power);
      if (isNaN(power) || power < 0) {
        errors.push(`Row ${rowIndex}: Suction power must be a positive number`);
      }
    }

    if (csvRow.battery_minutes && csvRow.battery_minutes.trim() !== 'N/A') {
      const minutes = parseInt(csvRow.battery_minutes);
      if (isNaN(minutes) || minutes < 0) {
        errors.push(`Row ${rowIndex}: Battery minutes must be a positive number`);
      }
    }

    if (csvRow.noise_level && csvRow.noise_level.trim() !== 'N/A') {
      const noise = parseInt(csvRow.noise_level);
      if (isNaN(noise) || noise < 0) {
        errors.push(`Row ${rowIndex}: Noise level must be a positive number`);
      }
    }

    // Score validations
    const scoreFields = [
      'cleaning_score', 'navigation_score', 'smart_score', 'maintenance_score',
      'battery_score', 'pet_family_score', 'review_score', 'cleaniq_score'
    ];

    scoreFields.forEach(field => {
      const value = csvRow[field as keyof CSVRow];
      if (value && value.trim() !== 'N/A') {
        const score = parseFloat(value);
        if (isNaN(score) || score < 0 || score > 10) {
          errors.push(`Row ${rowIndex}: ${field.replace('_', ' ')} must be between 0 and 10`);
        }
      }
    });
    
    return errors;
  };

  const convertToBoolean = (value: string | undefined): boolean => {
    if (!value || value.toLowerCase() === 'n/a') return false;
    return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
  };

  const parseNumber = (value: string | undefined, defaultValue: number | null = null): number | null => {
    if (!value || value.toLowerCase() === 'n/a') return defaultValue;
    const num = parseFloat(value.replace(/[$,]/g, ''));
    return isNaN(num) ? defaultValue : num;
  };

  const checkForDuplicate = async (modelNumber: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('robot_vacuums')
        .select('id')
        .eq('model_number', modelNumber)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      addLog(`Error checking for duplicate: ${err}`, 'error');
      return false;
    }
  };

  const transformCSVToUpload = (csvRow: CSVRow): RobotVacuumUpload => {
    addLog(`Transforming row data: ${JSON.stringify(csvRow)}`);
    
    // Always ensure we use the affiliate ID passed to the component
    const dealUrl = cleanAmazonUrl(csvRow.dealUrl);
    addLog(`Using affiliate ID: ${affiliateId} for URL: ${dealUrl}`);
    
    return {
      brand: csvRow.brand,
      model_number: csvRow.model_number,
      title: csvRow.title,
      description: csvRow.description || '',
      price: parseNumber(csvRow.price, 0) || 0,
      reviews: parseNumber(csvRow.reviews, 0) || 0,
      image_url: csvRow.imageUrl || '',
      deal_url: dealUrl,
      suction_power: parseNumber(csvRow.suction_power),
      battery_minutes: parseNumber(csvRow.battery_minutes),
      navigation_type: csvRow.navigation_type || '',
      noise_level: parseNumber(csvRow.noise_level),
      self_empty: convertToBoolean(csvRow.self_empty),
      mopping: convertToBoolean(csvRow.mopping),
      hepa_filter: convertToBoolean(csvRow.hepa_filter),
      edge_cleaning: convertToBoolean(csvRow.edge_cleaning),
      side_brush: convertToBoolean(csvRow.side_brush),
      dual_brush: convertToBoolean(csvRow.dual_brush),
      tangle_free: convertToBoolean(csvRow.tangle_free),
      wifi: convertToBoolean(csvRow.wifi),
      app_control: convertToBoolean(csvRow.app_control),
      voice_control: convertToBoolean(csvRow.voice_control),
      scheduling: convertToBoolean(csvRow.scheduling),
      zone_cleaning: convertToBoolean(csvRow.zone_cleaning),
      spot_cleaning: convertToBoolean(csvRow.spot_cleaning),
      no_go_zones: convertToBoolean(csvRow.no_go_zones),
      auto_boost: convertToBoolean(csvRow.auto_boost),
      object_recognition: convertToBoolean(csvRow.object_recognition),
      furniture_recognition: convertToBoolean(csvRow.furniture_recognition),
      pet_recognition: convertToBoolean(csvRow.pet_recognition),
      three_d_mapping: convertToBoolean(csvRow.three_d_mapping),
      obstacle_avoidance: convertToBoolean(csvRow.obstacle_avoidance),
      uv_sterilization: convertToBoolean(csvRow.uv_sterilization),
      maintenance_reminder: convertToBoolean(csvRow.maintenance_reminder),
      filter_replacement_indicator: convertToBoolean(csvRow.filter_replacement_indicator),
      brush_cleaning_indicator: convertToBoolean(csvRow.brush_cleaning_indicator),
      large_dustbin: convertToBoolean(csvRow.large_dustbin),
      auto_empty_base: convertToBoolean(csvRow.auto_empty_base),
      washable_dustbin: convertToBoolean(csvRow.washable_dustbin),
      washable_filter: convertToBoolean(csvRow.washable_filter),
      easy_brush_removal: convertToBoolean(csvRow.easy_brush_removal),
      self_cleaning_brushroll: convertToBoolean(csvRow.self_cleaning_brushroll),
      dustbin_full_indicator: convertToBoolean(csvRow.dustbin_full_indicator),
      cleaning_score: parseNumber(csvRow.cleaning_score),
      navigation_score: parseNumber(csvRow.navigation_score),
      smart_score: parseNumber(csvRow.smart_score),
      maintenance_score: parseNumber(csvRow.maintenance_score),
      battery_score: parseNumber(csvRow.battery_score),
      pet_family_score: parseNumber(csvRow.pet_family_score),
      review_score: parseNumber(csvRow.review_score),
      cleaniq_score: parseNumber(csvRow.cleaniq_score)
    };
  };

  const uploadVacuum = async (vacuum: RobotVacuumUpload): Promise<{ success: boolean; skipped?: boolean; error?: string }> => {
    try {
      const isDuplicate = await checkForDuplicate(vacuum.model_number);
      if (isDuplicate) {
        addLog(`Skipping duplicate model: ${vacuum.model_number}`);
        return { success: false, skipped: true };
      }

      addLog(`Uploading vacuum: ${vacuum.model_number}`);
      const { error } = await supabase
        .from('robot_vacuums')
        .insert([vacuum]);
      
      if (error) {
        throw error;
      }
      
      addLog(`Successfully uploaded vacuum: ${vacuum.model_number}`);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      addLog(`Error uploading vacuum ${vacuum.model_number}: ${errorMessage}`, 'error');
      return { success: false, error: errorMessage };
    }
  };

  const processCSV = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setDebugLogs([]);
    setCsvStats(null);

    try {
      const text = await file.text();
      addLog(`CSV file read successfully, length: ${text.length} characters`);
      
      const lines = text.split('\n').filter(line => line.trim());
      addLog(`Found ${lines.length} lines in CSV`);
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain a header row and at least one data row');
      }

      const headerLine = lines[0];
      const headers = normalizeHeaders(parseCSVLine(headerLine));
      addLog(`Headers found: ${headers.join(', ')}`);
      
      const validVacuums: RobotVacuumUpload[] = [];
      const errors: string[] = [];
      const skippedDuplicates: string[] = [];

      // Initialize stats
      const stats = {
        totalRows: lines.length - 1, // Exclude header
        validRows: 0,
        duplicates: 0,
        errors: 0
      };

      for (let i = 1; i < lines.length; i++) {
        try {
          const line = lines[i];
          if (!line.trim()) continue;

          const values = parseCSVLine(line);
          addLog(`Processing row ${i}: Found ${values.length} values`);

          if (values.length !== headers.length) {
            const error = `Row ${i}: Column count mismatch. Expected ${headers.length}, got ${values.length}`;
            errors.push(error);
            addLog(error, 'error');
            stats.errors++;
            continue;
          }

          const csvRow = headers.reduce((obj: any, header, index) => {
            obj[header] = values[index] || '';
            return obj;
          }, {} as CSVRow);

          addLog(`Row ${i} parsed data: ${JSON.stringify(csvRow)}`);

          const rowErrors = validateRow(csvRow, i);
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
            rowErrors.forEach(err => addLog(err, 'error'));
            stats.errors++;
            continue;
          }

          validVacuums.push(transformCSVToUpload(csvRow));
          stats.validRows++;
        } catch (rowError: any) {
          const errorMessage = `Row ${i}: ${rowError.message}`;
          errors.push(errorMessage);
          addLog(errorMessage, 'error');
          stats.errors++;
        }
      }

      if (validVacuums.length === 0) {
        const error = 'No valid robot vacuums found in CSV file';
        addLog(error, 'error');
        throw new Error(error);
      }

      addLog(`Found ${validVacuums.length} valid robot vacuums to upload`);

      let successCount = 0;
      let skipCount = 0;
      let failureCount = 0;

      for (const vacuum of validVacuums) {
        const result = await uploadVacuum(vacuum);
        if (result.success) {
          successCount++;
        } else if (result.skipped) {
          skipCount++;
          stats.duplicates++;
          const skipMessage = `Skipping duplicate model: ${vacuum.model_number}`;
          skippedDuplicates.push(skipMessage);
          addLog(skipMessage, 'info');
        } else {
          failureCount++;
          stats.errors++;
          const error = `Failed to upload "${vacuum.title}": ${result.error}`;
          errors.push(error);
          addLog(error, 'error');
        }
      }

      setCsvStats(stats);

      const successMessage = [
        successCount > 0 ? `Successfully uploaded ${successCount} robot vacuums` : null,
        skipCount > 0 ? `Skipped ${skipCount} duplicates` : null,
        failureCount > 0 ? `Failed to upload ${failureCount} robot vacuums` : null
      ].filter(Boolean).join(', ');

      setSuccess(successMessage);
      
      if (errors.length > 0) {
        setError(errors.join('\n'));
      }

      if (skippedDuplicates.length > 0) {
        addLog('Skipped duplicates:\n' + skippedDuplicates.join('\n'));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      addLog(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [affiliateId]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    processCSV(file);
  }, [processCSV]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }
    
    processCSV(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Upload Robot Vacuums CSV</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Upload a CSV file with the following required columns:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
            <li>title (required)</li>
            <li>brand (required)</li>
            <li>model_number (required, must be unique)</li>
            <li>price (required, positive number)</li>
            <li>reviews (required, between 0-5)</li>
            <li>dealUrl (required, Amazon URL)</li>
            <li>imageUrl (optional)</li>
            <li>description (optional)</li>
            <li>suction_power (optional, in Pa)</li>
            <li>battery_minutes (optional)</li>
            <li>navigation_type (optional)</li>
            <li>noise_level (optional, in dB)</li>
          </ul>
          <p className="text-sm text-gray-500 mt-2">
            Plus additional boolean and score fields (0-10) as defined in the database schema.
          </p>
          <p className="text-sm font-medium text-blue-600 mt-2">
            Using affiliate ID: {affiliateId}
          </p>
        </div>

        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csvUpload"
            disabled={isUploading}
          />
          <label
            htmlFor="csvUpload"
            className={`flex flex-col items-center justify-center cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="h-12 w-12 text-gray-400 mb-3" />
            <span className="text-gray-600">
              {isUploading ? 'Uploading...' : 'Click to upload CSV file'}
            </span>
            <span className="text-sm text-gray-500 mt-1">
              or drag and drop
            </span>
          </label>
        </div>

        {csvStats && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">CSV Processing Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-sm text-gray-500">Total Rows</div>
                <div className="text-xl font-semibold">{csvStats.totalRows}</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-sm text-gray-500">Valid Rows</div>
                <div className="text-xl font-semibold text-green-600">{csvStats.validRows}</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-sm text-gray-500">Duplicates</div>
                <div className="text-xl font-semibold text-yellow-600">{csvStats.duplicates}</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-sm text-gray-500">Errors</div>
                <div className="text-xl font-semibold text-red-600">{csvStats.errors}</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-red-700 whitespace-pre-line">{error}</div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <div className="mt-8 border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Logs</h3>
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
            {debugLogs.map((log, index) => (
              <div 
                key={index} 
                className={`text-sm font-mono mb-1 ${
                  log.type === 'error' ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
