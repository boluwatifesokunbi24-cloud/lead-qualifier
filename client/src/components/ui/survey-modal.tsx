import { useState } from "react";
import { UntitledButton } from "@/components/ui/untitled-button";
import { UntitledCard, UntitledCardContent, UntitledCardHeader, UntitledCardTitle } from "@/components/ui/untitled-card";
import { UntitledTextarea } from "@/components/ui/untitled-textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X, Download01 } from "@untitledui/icons";

export interface SurveyData {
  timeSaved: string;
  willingToPay: string;
  priceRange: string;
  email: string;
}

export interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (surveyData: SurveyData) => void;
  exportButtonText?: string;
}

export function SurveyModal({ 
  isOpen, 
  onClose, 
  onExport, 
  exportButtonText = "Export now" 
}: SurveyModalProps) {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    timeSaved: "",
    willingToPay: "",
    priceRange: "",
    email: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simple validation
    if (!surveyData.timeSaved || !surveyData.willingToPay) {
      setIsSubmitting(false);
      return;
    }

    // If user said yes to willing to pay, require price range
    if (surveyData.willingToPay === "yes" && !surveyData.priceRange) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onExport(surveyData);
      
      // Reset form
      setSurveyData({
        timeSaved: "",
        willingToPay: "",
        priceRange: "",
        email: ""
      });
      
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showPriceRange = surveyData.willingToPay === "yes";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-white">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            data-testid="button-close-survey"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          <UntitledCard className="border-0 shadow-none">
            <UntitledCardHeader className="pb-4">
              <UntitledCardTitle className="text-xl font-semibold text-charcoal-600 pr-8">
                Quick feedback before your export (30 seconds)
              </UntitledCardTitle>
            </UntitledCardHeader>

            <UntitledCardContent className="space-y-6">
              {/* Question 1: Time Saved */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal-600">
                  How much time did this tool save you compared to manual lead qualification?
                </Label>
                <Select 
                  value={surveyData.timeSaved} 
                  onValueChange={(value) => setSurveyData(prev => ({ ...prev, timeSaved: value }))}
                >
                  <SelectTrigger 
                    className="w-full focus:ring-navy-500 focus:border-navy-500"
                    data-testid="select-time-saved"
                  >
                    <SelectValue placeholder="Select hours saved..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 hours</SelectItem>
                    <SelectItem value="6-10">6-10 hours</SelectItem>
                    <SelectItem value="11-20">11-20 hours</SelectItem>
                    <SelectItem value="20+">20+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 2: Willing to Pay */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-charcoal-600">
                  Would you be willing to pay for this service?
                </Label>
                <Select 
                  value={surveyData.willingToPay} 
                  onValueChange={(value) => setSurveyData(prev => ({ 
                    ...prev, 
                    willingToPay: value,
                    // Reset price range if user changes to No
                    priceRange: value === "no" ? "" : prev.priceRange
                  }))}
                >
                  <SelectTrigger 
                    className="w-full focus:ring-navy-500 focus:border-navy-500"
                    data-testid="select-willing-to-pay"
                  >
                    <SelectValue placeholder="Select yes or no..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 3: Price Range (Conditional) */}
              {showPriceRange && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-charcoal-600">
                    What price range would you consider reasonable per 100 leads?
                  </Label>
                  <Select 
                    value={surveyData.priceRange} 
                    onValueChange={(value) => setSurveyData(prev => ({ ...prev, priceRange: value }))}
                  >
                    <SelectTrigger 
                      className="w-full focus:ring-navy-500 focus:border-navy-500"
                      data-testid="select-price-range"
                    >
                      <SelectValue placeholder="Select price range..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">$1-2 per 100 leads</SelectItem>
                      <SelectItem value="3-5">$3-5 per 100 leads</SelectItem>
                      <SelectItem value="6-10">$6-10 per 100 leads</SelectItem>
                      <SelectItem value="10+">$10+ per 100 leads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Question 4: Email */}
              <div className="space-y-3">
                <Label htmlFor="survey-email" className="text-sm font-medium text-charcoal-600">
                  Email for updates (optional)
                </Label>
                <UntitledTextarea
                  id="survey-email"
                  placeholder="your@email.com"
                  className="min-h-[44px] max-h-[44px] resize-none focus:ring-navy-500 focus:border-navy-500"
                  value={surveyData.email}
                  onChange={(e) => setSurveyData(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-survey-email"
                />
              </div>

              {/* Export Button */}
              <div className="pt-4">
                <UntitledButton
                  onClick={handleSubmit}
                  disabled={
                    !surveyData.timeSaved || 
                    !surveyData.willingToPay || 
                    (surveyData.willingToPay === "yes" && !surveyData.priceRange) ||
                    isSubmitting
                  }
                  variant="primary"
                  size="lg"
                  className="w-full bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200"
                  data-testid="button-export-with-survey"
                  iconLeading={<Download01 className="w-4 h-4" />}
                  isLoading={isSubmitting}
                  showTextWhileLoading={true}
                >
                  {isSubmitting ? "Preparing export..." : exportButtonText}
                </UntitledButton>
              </div>

              {/* Skip option */}
              <div className="text-center">
                <button
                  onClick={() => {
                    // Export without survey data
                    onExport({
                      timeSaved: "",
                      willingToPay: "",
                      priceRange: "",
                      email: ""
                    });
                    onClose();
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                  data-testid="button-skip-survey"
                >
                  Skip survey and export
                </button>
              </div>
            </UntitledCardContent>
          </UntitledCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}