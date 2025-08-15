import type { Lead } from "@shared/schema";

export async function parseCsvFile(file: File): Promise<Lead[]> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('Please select a CSV file.'));
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('File size must be less than 10MB.'));
      return;
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

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const leads: Lead[] = [];

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

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length !== headers.length) {
            console.warn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}. Skipping.`);
            continue;
          }

          const lead: Partial<Lead> = {
            id: `lead_${i}`,
            additionalData: {}
          };

          headers.forEach((header, index) => {
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

          // Validate required fields
          if (!lead.companyName && !lead.email) {
            console.warn(`Row ${i + 1} missing both company name and email. Skipping.`);
            continue;
          }

          // Set defaults
          if (!lead.companyName) lead.companyName = lead.email?.split('@')[1] || `Company ${i}`;
          if (!lead.email) lead.email = `contact@${lead.companyName?.toLowerCase().replace(/\s+/g, '')}.com`;

          leads.push(lead as Lead);
        }

        if (leads.length === 0) {
          reject(new Error('No valid leads found in the CSV file. Please check the format and required fields.'));
          return;
        }

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
