import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { parseCsvFile } from "@/lib/csv-utils";
import { processLeads, exportToCSV } from "@/lib/lead-processor";
import type { BusinessSetup, Lead, ProcessedLead, ProcessingStats } from "@shared/schema";
import { 
  ChartBarIcon, 
  UsersIcon, 
  CheckCircleIcon, 
  ArrowTrendingUpIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

type Step = 1 | 2 | 3 | 4;

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
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
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  
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
        (progress: number) => setProcessingProgress(progress)
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
    setScoreFilter("all");
  }, []);

  const getFilteredLeads = useCallback(() => {
    return processedLeads.filter(lead => {
      // Status filter
      if (statusFilter === "qualified" && !lead.qualified) return false;
      if (statusFilter === "not-qualified" && lead.qualified) return false;
      
      // Score filter
      if (scoreFilter !== "all") {
        const [min, max] = scoreFilter.split("-").map(Number);
        if (lead.score < min || lead.score > max) return false;
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

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-navy-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-charcoal-600">Lead Qualifier AI</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Intelligent Lead Qualification for Growing Businesses</p>
              </div>
            </div>
            <div className="flex items-center">
              <Badge variant="secondary" className="flex items-center bg-green-50 text-green-800 text-xs sm:text-sm">
                <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                No Data Stored
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8">
          <ProgressIndicator currentStep={currentStep} />
        </div>

        {/* Step 1: Business Setup */}
        {currentStep === 1 && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white">
              <CardTitle className="text-2xl font-semibold text-charcoal-600">Tell Us About Your Business</CardTitle>
              <p className="mt-2 text-gray-600">
                Help our AI understand your business and qualification criteria to provide the most accurate lead scoring.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="business-description" className="text-sm font-medium text-charcoal-600">
                    Business Description
                  </Label>
                  <Textarea
                    id="business-description"
                    placeholder="Describe your business, products/services, target market, and ideal customer profile. The more detail you provide, the better our AI can qualify your leads."
                    className="mt-2 min-h-[120px] resize-none focus:ring-navy-600 focus:border-navy-600"
                    value={businessSetup.businessDescription}
                    onChange={(e) => setBusinessSetup(prev => ({ ...prev, businessDescription: e.target.value }))}
                    data-testid="input-business-description"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Be specific about your industry, company size, and what makes a good customer for you.
                  </p>
                </div>

                <div>
                  <Label htmlFor="campaign-goals" className="text-sm font-medium text-charcoal-600">
                    Campaign Goals & Qualification Criteria
                  </Label>
                  <Textarea
                    id="campaign-goals"
                    placeholder="What are your goals for this lead qualification? What characteristics define a qualified lead for your business? Include budget ranges, company sizes, industries, or any specific requirements."
                    className="mt-2 min-h-[120px] resize-none focus:ring-navy-600 focus:border-navy-600"
                    value={businessSetup.campaignGoals}
                    onChange={(e) => setBusinessSetup(prev => ({ ...prev, campaignGoals: e.target.value }))}
                    data-testid="input-campaign-goals"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This helps our AI understand what makes a lead qualified vs. not qualified for your specific needs.
                  </p>
                </div>

                <div className="flex justify-center sm:justify-end pt-4">
                  <Button 
                    onClick={proceedToStep2}
                    className="bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200 px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto"
                    data-testid="button-continue-to-upload"
                  >
                    Continue to Upload
                    <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: File Upload */}
        {currentStep === 2 && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white">
              <CardTitle className="text-2xl font-semibold text-charcoal-600">Upload Your Lead Data</CardTitle>
              <p className="mt-2 text-gray-600">
                Upload your CSV file containing lead information. Our AI will analyze each lead based on your qualification criteria.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">

              <div className="mb-6">
                <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-3" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">File Requirements</p>
                    <p className="text-blue-700">CSV format only • Maximum 10MB • Include headers for lead information</p>
                  </div>
                </div>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                uploadedFile={uploadedFile}
                leadCount={rawLeads.length}
              />

              <div className="flex flex-col sm:flex-row justify-between pt-6 space-y-3 sm:space-y-0">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
                  data-testid="button-back-to-step1"
                >
                  <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={startProcessing}
                  disabled={!uploadedFile || rawLeads.length === 0}
                  className="bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200 px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto"
                  data-testid="button-start-processing"
                >
                  Start AI Analysis
                  <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Processing */}
        {currentStep === 3 && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white">
              <CardTitle className="text-2xl font-semibold text-charcoal-600">AI Processing Your Leads</CardTitle>
              <p className="mt-2 text-gray-600">
                Our AI is analyzing each lead against your qualification criteria. This usually takes 30-60 seconds.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">

              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <SparklesIcon className="w-8 h-8 text-navy-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-charcoal-600 mb-2">Analyzing Leads...</h3>
                <p className="text-gray-600 mb-6">AI is evaluating each lead based on your business criteria</p>
                
                <div className="max-w-md mx-auto">
                  <Progress value={processingProgress} className="h-2 mb-4" />
                  <p className="text-sm text-gray-600">
                    Processing {Math.floor((processingProgress / 100) * rawLeads.length)} of {rawLeads.length} leads
                  </p>
                </div>

                {processingStats && (
                  <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Qualified</p>
                      <p className="text-2xl font-bold text-forest-600" data-testid="text-qualified-count">
                        {processingStats.qualifiedLeads}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Not Qualified</p>
                      <p className="text-2xl font-bold text-gray-600" data-testid="text-not-qualified-count">
                        {processingStats.notQualifiedLeads}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="text-2xl font-bold text-amber-500" data-testid="text-remaining-count">
                        {processingStats.totalLeads - processingStats.processedLeads}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && processingStats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-navy-600" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Leads</p>
                      <p className="text-xl sm:text-2xl font-bold text-charcoal-600" data-testid="text-total-leads">
                        {processingStats.totalLeads.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-forest-600" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Qualified Leads</p>
                      <p className="text-xl sm:text-2xl font-bold text-forest-600" data-testid="text-qualified-leads">
                        {processingStats.qualifiedLeads.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ArrowTrendingUpIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Qualification Rate</p>
                      <p className="text-xl sm:text-2xl font-bold text-amber-500" data-testid="text-qualification-rate">
                        {processingStats.qualificationRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-navy-600" />
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Score</p>
                      <p className="text-xl sm:text-2xl font-bold text-navy-600" data-testid="text-average-score">
                        {processingStats.averageScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Dashboard */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold text-charcoal-600">Lead Qualification Results</CardTitle>
                    <p className="mt-1 text-gray-600">AI-powered analysis of your leads with detailed reasoning</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      onClick={() => exportResults(false)}
                      className="bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200 w-full sm:w-auto text-sm"
                      data-testid="button-export-all"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Export All Results</span>
                      <span className="sm:hidden">Export All</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportResults(true)}
                      className="w-full sm:w-auto text-sm"
                      data-testid="button-export-filtered"
                    >
                      <FunnelIcon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Export Filtered ({filteredLeads.length})</span>
                      <span className="sm:hidden">Filtered ({filteredLeads.length})</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Filters */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
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
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Label className="text-sm font-medium text-charcoal-600 whitespace-nowrap">Score:</Label>
                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-score-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="80-100">80-100 (Excellent)</SelectItem>
                        <SelectItem value="60-79">60-79 (Good)</SelectItem>
                        <SelectItem value="40-59">40-59 (Fair)</SelectItem>
                        <SelectItem value="0-39">0-39 (Poor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStatusFilter("all");
                      setScoreFilter("all");
                    }}
                    className="text-navy-600 hover:text-navy-700 w-full sm:w-auto text-sm"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
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
                        <TableCell className="py-3 sm:py-4 px-4 sm:px-6">
                          <div>
                            <div className="text-sm font-medium text-charcoal-600 truncate">{lead.companyName}</div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">{lead.email}</div>
                            {(lead.industry || lead.companySize) && (
                              <div className="text-xs text-gray-500 hidden sm:block">
                                {[lead.industry, lead.companySize].filter(Boolean).join(" • ")}
                              </div>
                            )}
                            {/* Show AI reasoning on mobile */}
                            <div className="text-xs text-gray-500 mt-1 lg:hidden line-clamp-2">
                              {lead.reasoning}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <div className="flex flex-col sm:flex-row sm:items-center">
                            <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2 mb-1 sm:mb-0 sm:mr-3">
                              <div 
                                className={`h-1.5 sm:h-2 rounded-full ${
                                  lead.score >= 80 ? 'bg-forest-600' :
                                  lead.score >= 60 ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-charcoal-600" data-testid={`text-score-${lead.id}`}>
                              {lead.score}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                          <Badge 
                            variant={lead.qualified ? "default" : "destructive"}
                            className={`text-xs ${
                              lead.qualified ? 
                              "bg-green-100 text-green-800 hover:bg-green-100" : 
                              "bg-red-100 text-red-800 hover:bg-red-100"
                            }`}
                            data-testid={`badge-status-${lead.id}`}
                          >
                            <span className="hidden sm:inline">{lead.qualified ? "Qualified" : "Not Qualified"}</span>
                            <span className="sm:hidden">{lead.qualified ? "✓" : "✗"}</span>
                          </Badge>
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
              <div className="bg-white px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                  <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    Showing 1 to {Math.min(20, filteredLeads.length)} of {filteredLeads.length} {statusFilter === "qualified" ? "qualified" : statusFilter === "not-qualified" ? "not qualified" : ""} leads
                  </div>
                  {filteredLeads.length > 20 && (
                    <div className="flex space-x-2">
                      <Button variant="outline" disabled size="sm" className="text-xs px-3">
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs px-3">
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* New Analysis Button */}
            <div className="text-center pt-6">
              <Button
                variant="outline"
                onClick={startNewAnalysis}
                className="border-2 border-navy-600 text-navy-600 hover:bg-navy-50 focus:ring-4 focus:ring-navy-200 px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto"
                data-testid="button-start-new-analysis"
              >
                <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start New Analysis
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
