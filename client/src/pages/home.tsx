import { useState, useCallback } from "react";
import { UntitledCard, UntitledCardContent, UntitledCardHeader, UntitledCardTitle } from "@/components/ui/untitled-card";
import { UntitledButton } from "@/components/ui/untitled-button";
import { Badge } from "@/components/ui/badge";
import { UntitledTextarea } from "@/components/ui/untitled-textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { parseCsvFile } from "@/lib/csv-utils";
import { processLeads, exportToCSV } from "@/lib/lead-processor";
import type { BusinessSetup, Lead, ProcessedLead, ProcessingStats } from "@shared/schema";
import { 
  BarChart03, 
  Users01, 
  CheckCircle, 
  TrendUp01,
  Zap,
  Shield01,
  ArrowRight,
  ArrowLeft,
  Download01,
  FilterLines,
  RefreshCw05,
  Upload01,
  Settings01
} from "@untitledui/icons";

type Step = 1 | 2 | 3 | 4;

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Define stepper steps
  const stepperSteps = [
    {
      id: 1,
      title: "Setup",
      description: "Business details",
      icon: <Settings01 className="w-5 h-5 sm:w-6 sm:h-6" />
    },
    {
      id: 2,
      title: "Upload",
      description: "CSV file",
      icon: <Upload01 className="w-5 h-5 sm:w-6 sm:h-6" />
    },
    {
      id: 3,
      title: "Process",
      description: "AI analysis",
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
    },
    {
      id: 4,
      title: "Results",
      description: "Qualified leads",
      icon: <BarChart03 className="w-5 h-5 sm:w-6 sm:h-6" />
    }
  ];
  const [businessSetup, setBusinessSetup] = useState<BusinessSetup>({
    businessDescription: "",
    campaignGoals: ""
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawLeads, setRawLeads] = useState<Lead[]>([]);
  const [processedLeads, setProcessedLeads] = useState<ProcessedLead[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string[]>([]);
  
  const { toast } = useToast();

  const proceedToStep2 = useCallback(() => {
    if (!businessSetup.businessDescription.trim() || !businessSetup.campaignGoals.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both the business description and campaign goals.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(2);
  }, [businessSetup, toast]);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const leads = await parseCsvFile(file);
      setUploadedFile(file);
      setRawLeads(leads);
      toast({
        title: "File Uploaded Successfully",
        description: `Processed ${leads.length} leads from your CSV file.`
      });
    } catch (error) {
      toast({
        title: "File Upload Error",
        description: error instanceof Error ? error.message : "Failed to process CSV file.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const startProcessing = useCallback(async () => {
    if (!uploadedFile || rawLeads.length === 0) {
      toast({
        title: "No Data to Process",
        description: "Please upload a valid CSV file first.",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep(3);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const results = await processLeads(
        rawLeads, 
        businessSetup, 
(progress) => {
          if (typeof progress === 'number') {
            setProcessingProgress(progress);
          } else {
            setProcessingProgress((progress.processed / progress.total) * 100);
          }
        }
      );
      
      setProcessedLeads(results.leads);
      setProcessingStats(results.stats);
      
      setTimeout(() => {
        setCurrentStep(4);
        setIsProcessing(false);
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Processing Error", 
        description: error instanceof Error ? error.message : "Failed to process leads.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  }, [uploadedFile, rawLeads, businessSetup, toast]);

  const startNewAnalysis = useCallback(() => {
    setCurrentStep(1);
    setBusinessSetup({ businessDescription: "", campaignGoals: "" });
    setUploadedFile(null);
    setRawLeads([]);
    setProcessedLeads([]);
    setProcessingStats(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setStatusFilter("all");
    setScoreFilter([]);
  }, []);

  const getFilteredLeads = useCallback(() => {
    return processedLeads.filter(lead => {
      // Status filter
      if (statusFilter === "qualified" && !lead.qualified) return false;
      if (statusFilter === "not-qualified" && lead.qualified) return false;
      
      // Score filter - check if lead score falls within any of the selected ranges
      if (scoreFilter.length > 0) {
        const isInRange = scoreFilter.some(range => {
          const [min, max] = range.split("-").map(Number);
          return lead.score >= min && lead.score <= max;
        });
        if (!isInRange) return false;
      }
      
      return true;
    });
  }, [processedLeads, statusFilter, scoreFilter]);

  const exportResults = useCallback((filtered: boolean = false) => {
    const leadsToExport = filtered ? getFilteredLeads() : processedLeads;
    exportToCSV(leadsToExport, `lead_qualification_results_${filtered ? 'filtered_' : ''}${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: "Export Complete",
      description: `Exported ${leadsToExport.length} leads to CSV file.`
    });
  }, [processedLeads, getFilteredLeads, toast]);

  const filteredLeads = getFilteredLeads();
  
  // Calculate completed steps
  const getCompletedSteps = () => {
    const completed = [];
    if (businessSetup.businessDescription && businessSetup.campaignGoals) {
      completed.push(1);
    }
    if (uploadedFile && rawLeads.length > 0) {
      completed.push(2);
    }
    if (processedLeads.length > 0) {
      completed.push(3);
    }
    return completed;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-navy-600 rounded-lg flex items-center justify-center">
                <BarChart03 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-charcoal-600">Lead Qualifier AI</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Intelligent Lead Qualification for Growing Businesses</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge variant="secondary" className="flex items-center bg-green-50 text-green-800 text-xs sm:text-sm">
                <Shield01 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                No Data Stored
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* Progress Stepper */}
        <div className="mb-8">
          <ProgressStepper
            steps={stepperSteps}
            currentStep={currentStep}
            completedSteps={getCompletedSteps()}
          />
        </div>

        {/* Step 1: Business Setup */}
        {currentStep === 1 && (
          <UntitledCard className="overflow-hidden">
            <UntitledCardHeader className="border-b border-gray-200 bg-white">
              <UntitledCardTitle className="text-2xl font-semibold text-charcoal-600">Tell Us About Your Business</UntitledCardTitle>
              <p className="mt-2 text-gray-600">
                Help our AI understand your business and qualification criteria to provide the most accurate lead scoring.
              </p>
            </UntitledCardHeader>
            <UntitledCardContent className="p-4 sm:p-6 lg:p-8">
              
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <Label htmlFor="business-description" className="text-sm font-medium text-charcoal-600">
                    Business Description
                  </Label>
                  <UntitledTextarea
                    id="business-description"
                    placeholder="Describe your business, products, and ideal customers..."
                    className="mt-3 min-h-[100px] sm:min-h-[120px] resize-none focus:ring-navy-600 focus:border-navy-600"
                    value={businessSetup.businessDescription}
                    onChange={(e) => setBusinessSetup(prev => ({ ...prev, businessDescription: e.target.value }))}
                    data-testid="input-business-description"
                  />
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">
                    Be specific about your industry and ideal customers.
                  </p>
                </div>

                <div>
                  <Label htmlFor="campaign-goals" className="text-sm font-medium text-charcoal-600">
                    Campaign Goals & Qualification Criteria
                  </Label>
                  <UntitledTextarea
                    id="campaign-goals"
                    placeholder="What makes a lead qualified for your business?"
                    className="mt-3 min-h-[100px] sm:min-h-[120px] resize-none focus:ring-navy-600 focus:border-navy-600"
                    value={businessSetup.campaignGoals}
                    onChange={(e) => setBusinessSetup(prev => ({ ...prev, campaignGoals: e.target.value }))}
                    data-testid="input-campaign-goals"
                  />
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">
                    Include budget ranges, company sizes, or specific requirements.
                  </p>
                </div>

                <div className="flex justify-center sm:justify-end pt-6 sm:pt-4">
                  <UntitledButton 
                    onClick={proceedToStep2}
                    variant="primary"
                    size="lg"
                    className="bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200 w-full sm:w-auto"
                    data-testid="button-continue-to-upload"
                    iconTrailing={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue to Upload
                  </UntitledButton>
                </div>
              </div>
            </UntitledCardContent>
          </UntitledCard>
        )}

        {/* Step 2: File Upload */}
        {currentStep === 2 && (
          <UntitledCard className="overflow-hidden">
            <UntitledCardHeader className="border-b border-gray-200 bg-white">
              <UntitledCardTitle className="text-2xl font-semibold text-charcoal-600">Upload Your Lead Data</UntitledCardTitle>
              <p className="mt-2 text-gray-600">
                Upload your CSV file containing lead information. Our AI will analyze each lead based on your qualification criteria.
              </p>
            </UntitledCardHeader>
            <UntitledCardContent className="p-4 sm:p-6 lg:p-8">

              <div className="mb-6 sm:mb-8">
                <div className="flex items-start sm:items-center bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-4">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium mb-1">File Requirements</p>
                    <p className="text-blue-700 text-xs sm:text-sm">CSV format • Max 10MB • Include headers</p>
                  </div>
                </div>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                uploadedFile={uploadedFile}
                leadCount={rawLeads.length}
              />

              <div className="flex flex-col sm:flex-row justify-between pt-8 sm:pt-6 space-y-4 sm:space-y-0">
                <UntitledButton
                  variant="secondary"
                  onClick={() => setCurrentStep(1)}
                  size="lg"
                  className="w-full sm:w-auto"
                  data-testid="button-back-to-step1"
                  iconLeading={<ArrowLeft className="w-5 h-5" />}
                >
                  Back
                </UntitledButton>
                <UntitledButton
                  onClick={startProcessing}
                  disabled={!uploadedFile || rawLeads.length === 0}
                  variant="primary"
                  size="lg"
                  className="bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200 w-full sm:w-auto"
                  data-testid="button-start-processing"
                  iconTrailing={<Zap className="w-5 h-5" />}
                >
                  Start AI Analysis
                </UntitledButton>
              </div>
            </UntitledCardContent>
          </UntitledCard>
        )}

        {/* Step 3: Processing */}
        {currentStep === 3 && (
          <UntitledCard className="overflow-hidden">
            <UntitledCardHeader className="border-b border-gray-200 bg-white">
              <UntitledCardTitle className="text-2xl font-semibold text-charcoal-600">AI Processing Your Leads</UntitledCardTitle>
              <p className="mt-2 text-gray-600">
                Our AI is analyzing each lead against your qualification criteria. This usually takes 30-60 seconds.
              </p>
            </UntitledCardHeader>
            <UntitledCardContent className="p-4 sm:p-6 lg:p-8">

              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4 sm:mb-6">
                  <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-navy-600 animate-spin" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-charcoal-600 mb-3 sm:mb-2">Analyzing Leads...</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">AI is evaluating each lead based on your criteria</p>
                
                <div className="max-w-md mx-auto px-4">
                  <Progress value={processingProgress} className="h-2 sm:h-3 mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-gray-600">
                    Processing {Math.floor((processingProgress / 100) * rawLeads.length)} of {rawLeads.length} leads
                  </p>
                </div>

                {processingStats && (
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 max-w-lg mx-auto px-4">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Qualified</p>
                      <p className="text-lg sm:text-2xl font-bold text-forest-600" data-testid="text-qualified-count">
                        {processingStats.qualifiedLeads}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Not Qualified</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-600" data-testid="text-not-qualified-count">
                        {processingStats.notQualifiedLeads}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Remaining</p>
                      <p className="text-lg sm:text-2xl font-bold text-amber-500" data-testid="text-remaining-count">
                        {processingStats.totalLeads - processingStats.processedLeads}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </UntitledCardContent>
          </UntitledCard>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && processingStats && (
          <div className="space-y-6 sm:space-y-8">
            {/* KPI UntitledCards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
              <UntitledCard>
                <UntitledCardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users01 className="w-6 h-6 sm:w-8 sm:h-8 text-navy-600" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Leads</p>
                      <p className="text-xl sm:text-2xl font-bold text-charcoal-600" data-testid="text-total-leads">
                        {processingStats.totalLeads.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </UntitledCardContent>
              </UntitledCard>

              <UntitledCard>
                <UntitledCardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-forest-600" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Qualified Leads</p>
                      <p className="text-xl sm:text-2xl font-bold text-forest-600" data-testid="text-qualified-leads">
                        {processingStats.qualifiedLeads.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </UntitledCardContent>
              </UntitledCard>

              <UntitledCard>
                <UntitledCardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendUp01 className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Qualification Rate</p>
                      <p className="text-xl sm:text-2xl font-bold text-amber-500" data-testid="text-qualification-rate">
                        {processingStats.qualificationRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </UntitledCardContent>
              </UntitledCard>

              <UntitledCard>
                <UntitledCardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-navy-600" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Score</p>
                      <p className="text-xl sm:text-2xl font-bold text-navy-600" data-testid="text-average-score">
                        {processingStats.averageScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </UntitledCardContent>
              </UntitledCard>
            </div>

            {/* Results Dashboard */}
            <UntitledCard className="overflow-hidden">
              <UntitledCardHeader className="border-b border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <UntitledCardTitle className="text-2xl font-semibold text-charcoal-600">Lead Qualification Results</UntitledCardTitle>
                    <p className="mt-1 text-gray-600">AI-powered analysis of your leads with detailed reasoning</p>
                  </div>
                  <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <UntitledButton
                      onClick={() => exportResults(false)}
                      variant="primary"
                      size="md"
                      className="bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200 w-full sm:w-auto"
                      data-testid="button-export-all"
                      iconLeading={<Download01 className="w-4 h-4" />}
                    >
                      <span className="hidden sm:inline">Export All Results</span>
                      <span className="sm:hidden">Export All</span>
                    </UntitledButton>
                    <UntitledButton
                      variant="secondary"
                      onClick={() => exportResults(true)}
                      size="md"
                      className="w-full sm:w-auto"
                      data-testid="button-export-filtered"
                      iconLeading={<FilterLines className="w-4 h-4" />}
                    >
                      <span className="hidden sm:inline">Export Filtered ({filteredLeads.length})</span>
                      <span className="sm:hidden">Filtered ({filteredLeads.length})</span>
                    </UntitledButton>
                  </div>
                </div>
              </UntitledCardHeader>

              {/* Filters */}
              <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Label className="text-sm font-medium text-charcoal-600 whitespace-nowrap">Status:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Leads</SelectItem>
                        <SelectItem value="qualified">Qualified Only</SelectItem>
                        <SelectItem value="not-qualified">Not Qualified Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-3 w-full">
                    <Label className="text-sm font-medium text-charcoal-600">Score Ranges:</Label>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { value: "80-100", label: "80-100 (Excellent)", color: "text-green-600" },
                        { value: "60-79", label: "60-79 (Good)", color: "text-blue-600" },
                        { value: "40-59", label: "40-59 (Fair)", color: "text-amber-600" },
                        { value: "0-39", label: "0-39 (Poor)", color: "text-red-600" }
                      ].map((range) => (
                        <label key={range.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-navy-600 bg-gray-100 border-gray-300 rounded focus:ring-navy-500 focus:ring-2"
                            checked={scoreFilter.includes(range.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScoreFilter([...scoreFilter, range.value]);
                              } else {
                                setScoreFilter(scoreFilter.filter(f => f !== range.value));
                              }
                            }}
                            data-testid={`checkbox-score-${range.value}`}
                          />
                          <span className={`text-sm font-medium ${range.color}`}>
                            {range.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {scoreFilter.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-500">Selected:</span>
                        {scoreFilter.map((range) => {
                          const rangeInfo = [
                            { value: "80-100", label: "Excellent" },
                            { value: "60-79", label: "Good" },
                            { value: "40-59", label: "Fair" },
                            { value: "0-39", label: "Poor" }
                          ].find(r => r.value === range);
                          return (
                            <span key={range} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-navy-100 text-navy-800">
                              {range} ({rangeInfo?.label})
                              <button
                                onClick={() => setScoreFilter(scoreFilter.filter(f => f !== range))}
                                className="ml-1 text-navy-600 hover:text-navy-800"
                                data-testid={`remove-score-${range}`}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <UntitledButton
                    variant="tertiary"
                    onClick={() => {
                      setStatusFilter("all");
                      setScoreFilter([]);
                    }}
                    size="sm"
                    className="text-navy-600 hover:text-navy-700 w-full sm:w-auto"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </UntitledButton>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-left px-4 sm:px-6">Lead Information</TableHead>
                      <TableHead className="text-left px-2 sm:px-4">Score</TableHead>
                      <TableHead className="text-left px-2 sm:px-4">Status</TableHead>
                      <TableHead className="text-left px-4 sm:px-6 hidden lg:table-cell">AI Reasoning</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.slice(0, 20).map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-lead-${lead.id}`}>
                        <TableCell className="py-4 sm:py-4 px-4 sm:px-6">
                          <div className="space-y-1 sm:space-y-0.5">
                            <div className="text-sm font-medium text-charcoal-600 truncate">{lead.companyName}</div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">{lead.email}</div>
                            {(lead.industry || lead.companySize) && (
                              <div className="text-xs text-gray-500 hidden sm:block">
                                {[lead.industry, lead.companySize].filter(Boolean).join(" • ")}
                              </div>
                            )}
                            {/* Show AI reasoning on mobile */}
                            <div className="text-xs text-gray-500 mt-2 lg:hidden line-clamp-2 leading-relaxed">
                              {lead.reasoning}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 sm:py-4 px-3 sm:px-4">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
                            <div className="w-16 sm:w-16 bg-gray-200 rounded-full h-2 sm:h-2 sm:mr-3">
                              <div 
                                className={`h-2 sm:h-2 rounded-full ${
                                  lead.score >= 80 ? 'bg-forest-600' :
                                  lead.score >= 60 ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                            <span className="text-sm sm:text-sm font-medium text-charcoal-600" data-testid={`text-score-${lead.id}`}>
                              {lead.score}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 sm:py-4 px-3 sm:px-4">
                          <div className="flex justify-center sm:justify-start">
                            <Badge 
                              variant={lead.qualified ? "default" : "destructive"}
                              className={`text-xs px-3 py-1 ${
                                lead.qualified ? 
                                "bg-green-100 text-green-800 hover:bg-green-100" : 
                                "bg-red-100 text-red-800 hover:bg-red-100"
                              }`}
                              data-testid={`badge-status-${lead.id}`}
                            >
                              <span className="hidden sm:inline">{lead.qualified ? "Qualified" : "Not Qualified"}</span>
                              <span className="sm:hidden">{lead.qualified ? "✓" : "✗"}</span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 px-4 sm:px-6 hidden lg:table-cell">
                          <div className="text-sm text-gray-600 max-w-xs" data-testid={`text-reasoning-${lead.id}`}>
                            {lead.reasoning}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 sm:px-6 lg:px-8 py-5 sm:py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    Showing 1 to {Math.min(20, filteredLeads.length)} of {filteredLeads.length} {statusFilter === "qualified" ? "qualified" : statusFilter === "not-qualified" ? "not qualified" : ""} leads
                  </div>
                  {filteredLeads.length > 20 && (
                    <div className="flex space-x-3 sm:space-x-2">
                      <UntitledButton variant="secondary" disabled size="sm" className="w-20">
                        Previous
                      </UntitledButton>
                      <UntitledButton variant="secondary" size="sm" className="w-20">
                        Next
                      </UntitledButton>
                    </div>
                  )}
                </div>
              </div>
            </UntitledCard>

            {/* New Analysis UntitledButton */}
            <div className="text-center pt-8 sm:pt-6 px-4 sm:px-0">
              <UntitledButton
                variant="secondary"
                onClick={startNewAnalysis}
                size="lg"
                className="border-2 border-navy-600 text-navy-600 hover:bg-navy-50 focus:ring-4 focus:ring-navy-200 w-full sm:w-auto"
                data-testid="button-start-new-analysis"
                iconLeading={<RefreshCw05 className="w-5 h-5" />}
              >
                Start New Analysis
              </UntitledButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
