import { UntitledButton } from "@/components/ui/untitled-button";
import { UntitledCard, UntitledCardHeader, UntitledCardTitle, UntitledCardDescription, UntitledCardContent, UntitledCardFooter } from "@/components/ui/untitled-card";
import { UntitledTextarea } from "@/components/ui/untitled-textarea";
import { UntitledMetric, UntitledMetricsGroup } from "@/components/ui/untitled-metrics";
import { Download01, Users01, BarChart03, CheckCircle, Settings01 } from "@untitledui/icons";

export function UntitledShowcase() {
  const sampleMetrics = [
    {
      title: "Total Leads",
      value: "2,847",
      change: "+12.5%",
      changeType: "increase" as const,
      period: "vs last month",
      icon: <Users01 className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Qualified Leads", 
      value: "1,421",
      change: "+8.2%",
      changeType: "increase" as const,
      period: "vs last month",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />
    },
    {
      title: "Conversion Rate",
      value: "49.9%",
      change: "-2.1%", 
      changeType: "decrease" as const,
      period: "vs last month",
      icon: <BarChart03 className="w-5 h-5 text-amber-600" />
    }
  ];

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Untitled UI Components Showcase</h2>
        
        {/* Enhanced Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Enhanced Buttons</h3>
          <div className="flex flex-wrap gap-3">
            <UntitledButton variant="primary" size="md">
              Primary Button
            </UntitledButton>
            
            <UntitledButton 
              variant="secondary" 
              size="md" 
              iconLeading={<Download01 className="w-4 h-4" />}
            >
              Export Data
            </UntitledButton>
            
            <UntitledButton 
              variant="primary" 
              size="lg" 
              isLoading={true}
              showTextWhileLoading={true}
            >
              Processing...
            </UntitledButton>
            
            <UntitledButton 
              variant="tertiary" 
              size="sm"
              iconTrailing={<Settings01 className="w-4 h-4" />}
            >
              Settings
            </UntitledButton>
            
            <UntitledButton variant="primary-destructive" size="md">
              Delete Project
            </UntitledButton>
          </div>
        </div>

        {/* Better Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Better Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UntitledCard variant="default">
              <UntitledCardHeader>
                <UntitledCardTitle>Default Card</UntitledCardTitle>
                <UntitledCardDescription>
                  This is a default card with shadow and border styling.
                </UntitledCardDescription>
              </UntitledCardHeader>
              <UntitledCardContent>
                <p className="text-gray-600">Card content goes here with proper spacing and typography.</p>
              </UntitledCardContent>
              <UntitledCardFooter>
                <UntitledButton variant="secondary" size="sm">Cancel</UntitledButton>
                <UntitledButton variant="primary" size="sm">Save Changes</UntitledButton>
              </UntitledCardFooter>
            </UntitledCard>

            <UntitledCard variant="elevated" padding="lg">
              <UntitledCardHeader>
                <UntitledCardTitle>Elevated Card</UntitledCardTitle>
                <UntitledCardDescription>
                  Enhanced shadow and larger padding for important content.
                </UntitledCardDescription>
              </UntitledCardHeader>
              <UntitledCardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900">2 hours ago</span>
                  </div>
                </div>
              </UntitledCardContent>
            </UntitledCard>
          </div>
        </div>

        {/* Better Textarea */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Better Textarea</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UntitledTextarea
              label="Business Description"
              description="Describe your business and target market"
              placeholder="Tell us about your company..."
              showCharacterCount={true}
              maxLength={500}
              size="md"
              hint="This helps our AI understand your lead qualification criteria"
            />
            
            <UntitledTextarea
              label="Campaign Goals" 
              placeholder="What are your campaign objectives?"
              autoResize={true}
              size="lg"
              leftAddon={<BarChart03 className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Better Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Better Metrics</h3>
          <UntitledMetricsGroup 
            metrics={sampleMetrics}
            columns={3}
            gap="md"
          />
          
          {/* Single enhanced metric with action */}
          <UntitledMetric
            title="AI Processing Speed"
            value="0.8s"
            change="+45%"
            changeType="increase"
            period="vs last week"
            variant="with-icon"
            size="lg"
            icon={<BarChart03 className="w-6 h-6 text-blue-600" />}
            action={
              <UntitledButton variant="tertiary" size="sm">
                View Details
              </UntitledButton>
            }
          />
        </div>
      </div>
    </div>
  );
}