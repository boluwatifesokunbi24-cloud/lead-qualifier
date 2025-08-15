import type { Lead } from "@shared/schema";

// Helper function to properly parse CSV lines with quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export async function parseCsvFile(file: File, onProgress?: (progress: number) => void): Promise<Lead[]> {
  return new Promise((resolve, reject) => {
    // Enhanced file validation
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('Please select a CSV file (.csv extension required).'));
      return;
    }

    // Increased file size limit for production (50MB)
    if (file.size > 50 * 1024 * 1024) {
      reject(new Error('File size must be less than 50MB. For larger files, please split into smaller chunks.'));
      return;
    }

    // Warn about large files
    if (file.size > 5 * 1024 * 1024) {
      console.warn(`Large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB). Processing may take some time.`);
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row.'));
          return;
        }

        // Validate CSV size
        if (lines.length > 10000) {
          console.warn(`Large CSV detected with ${lines.length} rows. Consider processing in smaller batches for optimal performance.`);
        }

        const headers = parseCSVLine(lines[0]);
        const leads: Lead[] = [];
        let processedRows = 0;

        // Map common header variations to standard fields
        const headerMap: Record<string, string> = {
          'company': 'companyName',
          'company_name': 'companyName',
          'business_name': 'companyName',
          'organization': 'companyName',
          'email': 'email',
          'email_address': 'email',
          'contact_email': 'email',
          'phone': 'phone',
          'phone_number': 'phone',
          'contact_phone': 'phone',
          'industry': 'industry',
          'sector': 'industry',
          'company_size': 'companySize',
          'size': 'companySize',
          'employees': 'companySize',
          'title': 'title',
          'job_title': 'title',
          'position': 'title',
          'contact_name': 'contactName',
          'name': 'contactName',
          'contact': 'contactName',
          'website': 'website',
          'url': 'website',
          'company_website': 'website',
          'revenue': 'revenue',
          'annual_revenue': 'revenue',
          'sales': 'revenue'
        };

        // Process rows with progress updates
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          // Progress update for large files
          if (lines.length > 1000 && i % 100 === 0) {
            onProgress?.((i / lines.length) * 100);
          }
          
          if (values.length !== headers.length) {
            console.warn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}. Skipping.`);
            continue;
          }
          
          processedRows++;

          const lead: Partial<Lead> = {
            id: `lead_${i}`,
            additionalData: {}
          };

          headers.forEach((header: string, index: number) => {
            const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_');
            const standardField = headerMap[normalizedHeader] || normalizedHeader;
            const value = values[index];

            if (value && value !== '') {
              switch (standardField) {
                case 'companyName':
                  lead.companyName = value;
                  break;
                case 'email':
                  lead.email = value;
                  break;
                case 'phone':
                  lead.phone = value;
                  break;
                case 'industry':
                  lead.industry = value;
                  break;
                case 'companySize':
                  lead.companySize = value;
                  break;
                case 'title':
                  lead.title = value;
                  break;
                case 'contactName':
                  lead.contactName = value;
                  break;
                case 'website':
                  lead.website = value;
                  break;
                case 'revenue':
                  lead.revenue = value;
                  break;
                default:
                  if (lead.additionalData) {
                    lead.additionalData[header] = value;
                  }
                  break;
              }
            }
          });

          // More flexible validation - require at least one identifiable field
          const hasMinimumData = lead.companyName || lead.email || lead.contactName || lead.phone || Object.keys(lead.additionalData || {}).length > 0;
          
          if (!hasMinimumData) {
            console.warn(`Row ${i + 1} appears to be empty or missing all key fields. Skipping.`);
            continue;
          }

          // Set reasonable defaults without adding "company" suffix - but keep optional
          if (!lead.companyName && lead.email && lead.email.includes('@')) {
            const domain = lead.email.split('@')[1];
            if (domain && !domain.includes('example.com')) {
              lead.companyName = domain.replace('.com', '').replace('.', ' ');
            }
          }
          if (!lead.companyName && lead.contactName) {
            lead.companyName = lead.contactName;
          }
          // Don't force company name if not available - leave it optional

          leads.push(lead as Lead);
        }

        if (leads.length === 0) {
          reject(new Error('No valid leads found in the CSV file. Please check the format and required fields.'));
          return;
        }

        // Final progress update
        onProgress?.(100);
        
        // Log processing results
        console.log(`CSV processing complete: ${leads.length} leads extracted from ${processedRows} valid rows`);
        
        resolve(leads);
      } catch (error) {
        reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the selected file.'));
    };

    reader.readAsText(file);
  });
}
